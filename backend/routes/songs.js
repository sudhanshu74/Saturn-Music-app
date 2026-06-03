const express = require('express');
const router = express.Router();
const Song = require('../models/Song'); 
const Playlist = require('../models/Playlist');
const User = require('../models/User'); 
const musicService = require('../services/musicService'); 
const { verifyToken } = require('../middleware/authMiddleware');
const redis = require('redis'); // <-- NEW: Redis package

// --- GRACEFUL REDIS INITIALIZATION ---
let redisClient = null;
(async () => {
  if (process.env.REDIS_URL) {
    try {
      redisClient = redis.createClient({ url: process.env.REDIS_URL });
      redisClient.on('error', (err) => console.warn('Redis warning: Cache safely bypassed.'));
      await redisClient.connect();
      console.log('✅ Redis connected successfully.');
    } catch (err) {
      redisClient = null; 
    }
  }
})();

router.get('/search', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const query = req.query.q || `Top Hits ${currentYear}`; 
    const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;

    // 1. Try Cache First (Saves iTunes API calls)
    if (redisClient && redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.status(200).json(JSON.parse(cached));
    }
    
    // 2. Fetch if not cached
    const songs = await musicService.searchSongs(query); 
    
    // 3. Save to cache for 1 hour (3600 seconds)
    if (redisClient && redisClient.isOpen && songs.length > 0) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(songs));
    }

    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch music" });
  }
});

router.get('/', async (req, res) => {
  try {
    const songs = await Song.find();
    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching local songs', error });
  }
});

router.post('/log-play', verifyToken, async (req, res) => {
  try {
    const { artist } = req.body;
    const user = await User.findById(req.user.id);
    if (user && artist) {
      if (!user.recentArtists.includes(artist)) user.recentArtists.push(artist);
      if (user.recentArtists.length > 50) user.recentArtists.shift(); 
      await user.save();
      
      // Invalidate Daily Mix cache since their taste changed!
      if (redisClient && redisClient.isOpen) {
        await redisClient.del(`daily_mix_${req.user.id}`);
      }
    }
    res.status(200).send("Play logged");
  } catch (error) {
    res.status(500).send("Error logging play");
  }
});

router.get('/daily-mix', verifyToken, async (req, res) => {
  try {
    const cacheKey = `daily_mix_${req.user.id}`;

    // 1. Try Cache First (Saves massive DB queries)
    if (redisClient && redisClient.isOpen) {
      const cachedMix = await redisClient.get(cacheKey);
      if (cachedMix) return res.status(200).json(JSON.parse(cachedMix));
    }

    const userPlaylists = await Playlist.find({ user: req.user.id }) || [];
    const user = await User.findById(req.user.id);
    
    let favoriteArtists = [];
    if (user && user.recentArtists) favoriteArtists = [...user.recentArtists];

    userPlaylists.forEach(playlist => {
      if (playlist.songs) {
        playlist.songs.forEach(song => {
          if (song && song.artist && !favoriteArtists.includes(song.artist)) favoriteArtists.push(song.artist);
        });
      }
    });

    let finalMix = [];

    if (favoriteArtists.length === 0) {
      const currentYear = new Date().getFullYear();
      let randomMix = await musicService.searchSongs(`Top Hits ${currentYear}`); 
      if (!Array.isArray(randomMix)) randomMix = [];
      finalMix = randomMix.sort(() => 0.5 - Math.random()).slice(0, 20);
    } else {
      const topArtist = favoriteArtists[favoriteArtists.length - 1]; 
      let personalizedMix = await musicService.searchSongs(topArtist);

      if (!Array.isArray(personalizedMix) || personalizedMix.length === 0) {
        personalizedMix = await musicService.searchSongs('Pop Hits');
        if (!Array.isArray(personalizedMix)) personalizedMix = [];
      }

      const today = new Date().toISOString().split('T')[0];
      let dailyHash = 0;
      for (let i = 0; i < today.length; i++) dailyHash = today.charCodeAt(i) + ((dailyHash << 5) - dailyHash);

      finalMix = personalizedMix.sort((a, b) => {
        const hashA = (String(a.title || '').charCodeAt(0) * dailyHash) % 100;
        const hashB = (String(b.title || '').charCodeAt(0) * dailyHash) % 100;
        return hashA - hashB;
      }).slice(0, 20);
    }

    // 3. Save mix to cache for 24 hours (86400 seconds)
    if (redisClient && redisClient.isOpen && finalMix.length > 0) {
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(finalMix));
    }

    res.status(200).json(finalMix);
  } catch (error) {
    console.error("Daily mix error:", error);
    res.status(500).json({ message: "Failed to generate daily mix" });
  }
});

module.exports = router;
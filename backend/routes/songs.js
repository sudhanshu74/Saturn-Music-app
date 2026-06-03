const express = require('express');
const router = express.Router();
const Song = require('../models/Song'); 
const Playlist = require('../models/Playlist');
const User = require('../models/User'); 
const musicService = require('../services/musicService'); 
const { verifyToken } = require('../middleware/authMiddleware');

// Import the centralized Redis client instead of initializing it here
const redisClient = require('../config/redis'); 

router.get('/search', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const query = req.query.q || `Top Hits ${currentYear}`; 
    const cacheKey = `search_${query.toLowerCase().replace(/\\s+/g, '_')}`;

    // 1. Try Cache First (Saves iTunes API calls)
    if (redisClient && redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.status(200).json(JSON.parse(cached));
    }

    // 2. Fallback to API if not cached
    const tracks = await musicService.searchSongs(query);

    // Cache the fresh results for 1 hour (3600 seconds)
    if (redisClient && redisClient.isOpen && tracks.length > 0) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(tracks));
    }

    res.status(200).json(tracks);
  } catch (error) {
    res.status(500).json({ message: 'Error searching songs', error: error.message });
  }
});

router.get('/daily-mix', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const favoriteArtists = user.recentArtists || [];
    const cacheKey = `dailymix_${user._id}`;

    // 1. Try Cache First
    if (redisClient && redisClient.isOpen) {
      const cachedMix = await redisClient.get(cacheKey);
      if (cachedMix) return res.status(200).json(JSON.parse(cachedMix));
    }

    // 2. Generate Mix
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
    res.status(500).json({ message: 'Error generating daily mix', error: error.message });
  }
});

module.exports = router;
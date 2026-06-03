const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. GET all playlists FOR THE LOGGED-IN USER
router.get('/', verifyToken, async (req, res) => {
  try {
    // Only find playlists where the 'user' matches the JWT token
    const playlists = await Playlist.find({ user: req.user.id });
    res.status(200).json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlists', error });
  }
});

// 2. POST create a new playlist
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if THIS specific user already has a playlist with this name
    const existing = await Playlist.findOne({ name, user: req.user.id });
    if (existing) return res.status(400).json({ message: 'Playlist already exists' });

    const newPlaylist = new Playlist({ 
      name, 
      user: req.user.id, // Attach the user ID from the token
      songs: [] 
    });
    
    const savedPlaylist = await newPlaylist.save();
    res.status(201).json(savedPlaylist);
  } catch (error) {
    res.status(500).json({ message: 'Error creating playlist', error });
  }
});

// 3. POST add a song to a playlist (UPDATED FOR ITUNES API)
router.post('/:id/add-song', verifyToken, async (req, res) => {
  try {
    const { song } = req.body;
    const playlistId = req.params.id;

    // 1. Find the playlist and ensure it belongs to the logged-in user
    const playlist = await Playlist.findOne({ _id: playlistId, user: req.user.id });
    
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // 2. Prevent duplicate songs in the same playlist
    const songExists = playlist.songs.some(s => s._id === song._id);
    if (songExists) {
      return res.status(400).json({ message: "Song already in this playlist" });
    }

    // 3. Push the FULL song data object into the array and save to MongoDB
    playlist.songs.push(song);
    await playlist.save();

    res.status(200).json(playlist);
  } catch (error) {
    console.error("Error adding song:", error);
    res.status(500).json({ message: "Failed to add song" });
  }
});

// 4. DELETE a playlist
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    // SECURITY CHECK: Does this playlist belong to the person trying to delete it?
    if (playlist.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this playlist' });
    }

    await Playlist.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Playlist deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting playlist', error });
  }
});

// 5. DELETE a specific song from a playlist (NEW & SECURED)
router.delete('/:playlistId/remove-song/:songId', verifyToken, async (req, res) => {
  try {
    const { playlistId, songId } = req.params;
    
    // 1. Find the playlist AND ensure it belongs to the logged-in user
    const playlist = await Playlist.findOne({ _id: playlistId, user: req.user.id });
    if (!playlist) return res.status(404).json({ message: "Playlist not found or unauthorized" });

    // 2. Filter out the song that matches the songId
    playlist.songs = playlist.songs.filter(song => song._id.toString() !== songId);
    
    // 3. Save the updated playlist to the database
    await playlist.save();
    
    // 4. Send the updated playlist back to React
    res.status(200).json(playlist);
  } catch (error) {
    res.status(500).json({ message: "Failed to remove song" });
  }
});

module.exports = router;
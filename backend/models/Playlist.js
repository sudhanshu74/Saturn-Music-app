const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, // This guarantees no anonymous playlists can exist
    index: true // <-- NEW: This makes searching for a user's playlists lightning fast
  },
  songs: { 
    type: Array, 
    default: [] 
  }
}, { timestamps: true });

// Alternatively, you can also define it at the schema level like this (both do the exact same thing):
// playlistSchema.index({ user: 1 });

module.exports = mongoose.model('Playlist', playlistSchema);
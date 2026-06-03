// backend/models/Song.js
const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String, required: true },
  audioUrl: { type: String, required: true }, // E.g., Cloudinary URL or local path
  coverUrl: { type: String, required: true },
  duration: { type: Number }
});

module.exports = mongoose.model('Song', songSchema);
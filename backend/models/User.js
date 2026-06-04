const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Email Verification Fields
  isVerified: { type: Boolean, default: false }, 
  verificationToken: { type: String }, 

  // Store the refresh token here for secure JWT sessions
  refreshToken: { type: String, default: null },

  // Store recently searched/played artists for the Recommendation Engine
  recentArtists: [{
    type: String,
    trim: true
  }],

  // Store known IPs to prevent spamming login alerts for normal devices
  knownIps: [{
    type: String
  }],

  // FORGOT PASSWORD FIELDS
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date }
  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
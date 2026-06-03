const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const songRoutes = require('./routes/songs');
const playlistRoutes = require('./routes/playlists');

const app = express();

// --- NEW: REQUIRED FOR RATE LIMITING ON RENDER ---
// This tells Express to look past the Render load balancer to find the user's real IP address
app.set('trust proxy', 1);

// 2. MIDDLEWARE
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser()); 

// 3. API ENDPOINTS
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);

// 4. DATABASE CONNECTION
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to Saturn Database');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
  });
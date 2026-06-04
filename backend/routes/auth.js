const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit'); 
const User = require('../models/User');
const emailService = require('../services/emailService'); // Import Brevo service
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Stateless Verification - creates token, does not touch DB yet
    const signupToken = jwt.sign(
      { username, email, password: hashedPassword },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } 
    );

    const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify/${signupToken}`;

    try {
      // Trigger Brevo email
      await emailService.sendEmail(
        email, 
        "Welcome to Saturn - Verify Your Email",
        `<h2>Welcome to Saturn, ${username}!</h2><p>Please click the link below to verify your email address and activate your account:</p><a href="${verificationLink}" style="padding: 10px 20px; background-color: #31c93b; color: black; text-decoration: none; border-radius: 5px;">Verify My Account</a><p>This link will expire in 15 minutes.</p>`
      );

      res.status(201).json({ message: "Verification email sent! Please check your inbox to complete signup." });
    } catch (emailError) {
      return res.status(500).json({ message: "Could not send verification email. Please try again later." });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const { username, email, password } = decoded;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth`);
    }

    // Email is verified, save to database
    const newUser = new User({
      username,
      email,
      password,
      isVerified: true
    });
    await newUser.save();

    res.redirect(`${process.env.FRONTEND_URL}/auth`);
  } catch (err) {
    console.error("Verification error:", err);
    res.status(400).send("Invalid or expired verification link. Please sign up again.");
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.isVerified) return res.status(403).json({ message: "Please verify email." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    // --- FIX: PERSISTENT DEVICE ALERT SYSTEM ---
    let deviceId = req.cookies.saturn_device;
    let isNewDevice = false;

    if (!user.knownIps) user.knownIps = [];

    // If no device cookie exists on this browser, generate one
    if (!deviceId) {
      isNewDevice = true;
      deviceId = crypto.randomBytes(16).toString('hex');
      
      // Set the new device cookie to last 1 year
      res.cookie('saturn_device', deviceId, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'none', // <--- FIXED FOR CROSS-DOMAIN
        maxAge: 365 * 24 * 60 * 60 * 1000 
      });
    } else if (!user.knownIps.includes(deviceId)) {
      // Cookie exists, but this user account has never seen it before
      isNewDevice = true;
    }

    if (isNewDevice) {
      const currentIp = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || 'an unknown device';

      emailService.sendEmail(
        user.email,
        "Security Alert: New Login to Saturn",
        `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #31c93b;">New Device Detected</h2>
          <p>Hi ${user.username},</p>
          <p>We noticed a login to your Saturn Music account from a new device or browser.</p>
          <p><strong>IP:</strong> ${currentIp}</p>
          <p><strong>Browser:</strong> ${userAgent}</p>
          <p>If this was you, no action is needed. If you did not authorize this login, please reset your password immediately.</p>
        </div>`
      ).catch(err => console.error("Silent email failure:", err));

      // Save the persistent Device ID to MongoDB instead of the volatile IP
      user.knownIps.push(deviceId);
    }
    // --- END SECURITY ALERT ---

    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // UPGRADE: Push to the array for multi-device support
    user.refreshTokens.push(refreshToken);
    
    // Prevent the array from growing infinitely (e.g., max 5 devices)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift(); 
    }
    
    await user.save();

    res.cookie('jwt_refresh', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 // <--- FIXED FOR CROSS-DOMAIN
    });

    res.status(200).json({ message: "Logged in successfully", accessToken, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.jwt_refresh; 
  if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

  try {
    // UPGRADE: Find user where the array contains this specific token
    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Refresh token expired." });
      const newAccessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during refresh" });
  }
});

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.jwt_refresh;
  try {
    // UPGRADE: Use $pull to remove only this device's token from the array
    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshTokens: refreshToken }, 
        { $pull: { refreshTokens: refreshToken } }
      );
    }
    res.clearCookie('jwt_refresh');
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
});

router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "If this email exists, an OTP has been sent." }); 

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      // Trigger Brevo email for OTP
      await emailService.sendEmail(
        email, 
        "Saturn - Password Reset OTP",
        `<h2>Password Reset Request</h2><p>Your One-Time Password (OTP) is: <strong style="font-size: 24px; color: #31c93b; letter-spacing: 2px;">${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`
      );
      res.status(200).json({ message: "OTP sent to your email." });
    } catch (emailError) {
       return res.status(500).json({ error: "Failed to send OTP email. Please try again later." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to process request." });
  }
});

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email, resetPasswordOtp: otp, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP." });

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long, 1 uppercase, 1 number, and 1 special character." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    
    // UPGRADE: Instantly kills old sessions on ALL devices for security
    user.refreshTokens = []; 
    
    await user.save();

    res.status(200).json({ message: "Password reset successfully! You can now log in." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password." });
  }
});

module.exports = router;
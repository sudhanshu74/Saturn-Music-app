const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit'); 
const User = require('../models/User');
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { 
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  }
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

    // NEW LOGIC: Do NOT save to database yet!
    // Instead, package the user data into a temporary JWT token
    const signupToken = jwt.sign(
      { username, email, password: hashedPassword },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // The link will expire in 15 minutes
    );

    const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify/${signupToken}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email, 
        subject: "Welcome to Saturn - Verify Your Email",
        html: `<h2>Welcome to Saturn, ${username}!</h2><p>Please click the link below to verify your email address and activate your account:</p><a href="${verificationLink}" style="padding: 10px 20px; background-color: #31c93b; color: black; text-decoration: none; border-radius: 5px;">Verify My Account</a><p>This link will expire in 15 minutes.</p>`
      });

      res.status(201).json({ message: "Verification email sent! Please check your inbox to complete signup." });
    } catch (emailError) {
      console.error("Nodemailer Error during signup:", emailError);
      return res.status(500).json({ message: "Could not send verification email. Please try again later." });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify/:token', async (req, res) => {
  try {
    // 1. Decode and verify the JWT token from the email link
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const { username, email, password } = decoded;

    // 2. Double-check if the user was already created (in case they clicked the link twice)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth`);
    }

    // 3. NOW we finally save the user to the database!
    const newUser = new User({
      username,
      email,
      password,       // Already hashed during the /signup step
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

    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('jwt_refresh', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 
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
    const user = await User.findOne({ refreshToken: refreshToken });
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
    if (refreshToken) await User.findOneAndUpdate({ refreshToken: refreshToken }, { refreshToken: null });
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
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email, 
        subject: "Saturn - Password Reset OTP",
        html: `<h2>Password Reset Request</h2><p>Your One-Time Password (OTP) is: <strong style="font-size: 24px; color: #31c93b; letter-spacing: 2px;">${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`
      });
      res.status(200).json({ message: "OTP sent to your email." });
    } catch (emailError) {
       console.error("Nodemailer Error during forgot-password:", emailError);
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
    await user.save();

    res.status(200).json({ message: "Password reset successfully! You can now log in." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password." });
  }
});

module.exports = router;
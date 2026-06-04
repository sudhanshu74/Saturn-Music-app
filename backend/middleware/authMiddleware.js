const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified; // This attaches the user ID and role to the request
    next();
  } catch (err) {
    // THIS LINE CHANGED: It is now 401 instead of 400!
    res.status(401).json({ message: "Invalid Token." });
  }
};

module.exports = { verifyToken };
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure dotenv is loaded

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // Attach user payload to request
    next();
  });
};

module.exports = authenticateToken;

// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models'); // Adjust path as needed
const authenticateToken = require('../middleware/authMiddleware'); // Adjust path as needed
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const API_BASE_URL = `http://localhost:${process.env.PORT || 5000}`; // Ensure PORT is correctly sourced

// Register Route
router.post('/register', async (req, res) => {
  console.log('--- Register Request Received ---');
  console.log('req.body (text fields):', req.body);
  console.log('---------------------------------');

  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  try {
    const existingUser = await db.User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    // Create the profile for the new user
    const profile = await db.Profile.create({
      userId: user.id,
      name: username,
      title: 'Aspiring Developer',
      bio: 'This is a default bio. Please update your profile.',
      avatarUrl: null,
      resumeUrl: null,
      location: null,
      interests: [],
      websiteUrl: null,
      primaryColor: '#2563eb', // Default primary color
      secondaryColor: '#9333ea', // Default secondary color
      status: 'draft',
      industry: null,
      yearsOfExperience: 0,
    });

    // Generate token for immediate login after registration
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Fetch the newly created profile with associated social links
    const fetchedProfile = await db.Profile.findByPk(profile.id, {
        include: [
            { model: db.SocialLink, attributes: ['id', 'platform', 'url'] },
        ]
    });

    // Include the full user object with nested profile and colors in the registration success response
    res.status(201).json({
      message: 'User registered successfully!',
      token: token, // Provide token for auto-login
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        Profile: fetchedProfile, // Send the full profile object nested under 'Profile'
      }
    });

  } catch (error) {
    console.error('Error during registration:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Validation error during profile creation', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('--- Login Request Received ---');
  console.log('Attempting login for email:', email);

  if (!email || !password) {
    console.log('Missing email or password.');
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await db.User.findOne({ where: { email: email } });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('User found:', user.username);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('Password matched for user:', user.username);

    // Fetch user's profile with associated social links
    const profile = await db.Profile.findOne({
      where: { userId: user.id },
      include: [
        { model: db.SocialLink, attributes: ['id', 'platform', 'url'] },
      ]
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('JWT generated successfully.');

    res.json({
      message: 'Logged in successfully!',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        Profile: profile // Send the full profile object nested under 'Profile'
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  } finally {
    console.log('--- End Login Request ---');
  }
});

// Get User Details (Protected)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: {
        model: db.Profile,
        attributes: ['primaryColor', 'secondaryColor', 'title', 'bio', 'location', 'interests', 'websiteUrl', 'status', 'industry', 'yearsOfExperience', 'avatarUrl', 'resumeUrl'],
        include: [
          { model: db.SocialLink, attributes: ['id', 'platform', 'url'] },
        ]
      }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      // Pass the entire Profile object nested
      Profile: user.Profile || null
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error fetching user details', error: error.message });
  }
});

// Protected Test Route
router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}! You have access to protected data. Your role: ${req.user.role}` });
});

module.exports = router;

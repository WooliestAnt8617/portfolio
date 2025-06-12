// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const authenticateToken = require('../middleware/authMiddleware'); // Adjust path as needed
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken'); // For token verification in public profile route (if needed)

require('dotenv').config();
const API_BASE_URL = `http://localhost:${process.env.PORT || 5000}`;
const JWT_SECRET = process.env.JWT_SECRET; // Needed for public profile route

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads'); // Relative to routes directory
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'avatar') {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed for avatar!'), false);
    }
  } else if (file.fieldname === 'resume') {
    if (!file.originalname.match(/\.(pdf)$/i)) {
      return cb(new Error('Only PDF files are allowed for resume!'), false);
    }
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit for each file
  fileFilter: fileFilter
});

// GET all profiles (public) - NOW WITH SEARCH AND FILTERS, AND ONLY PUBLISHED PROFILES
router.get('/', async (req, res) => {
  console.log('--- Public Profiles GET Request Received ---');
  console.log('Query Params:', req.query);

  const { search, location, interests, industry, yearsOfExperience } = req.query;
  const whereClause = { status: 'published' }; // Only fetch published profiles for public view

  if (search) {
    const lowerSearchTerm = `%${search.toLowerCase()}%`;
    whereClause[Op.or] = [
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('Profile.name')), {
        [Op.like]: lowerSearchTerm
      }),
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('Profile.title')), {
        [Op.like]: lowerSearchTerm
      })
    ];
  }

  if (location) {
    const lowerLocationTerm = `%${location.toLowerCase()}%`;
    whereClause.location = { [Op.like]: lowerLocationTerm };
  }

  if (interests) {
    const interestKeywords = interests.split(',').map(item => item.trim().toLowerCase()).filter(item => item !== '');
    if (interestKeywords.length > 0) {
      const interestConditions = interestKeywords.map(keyword => ({
        interests: { [Op.like]: `%\"${keyword}\"%` }
      }));
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push({ [Op.or]: interestConditions });
    }
  }

  if (industry) {
    const lowerIndustryTerm = `%${industry.toLowerCase()}%`;
    whereClause.industry = { [Op.like]: lowerIndustryTerm };
  }

  if (yearsOfExperience) {
    const numYears = parseInt(yearsOfExperience, 10);
    if (!isNaN(numYears)) {
      whereClause.yearsOfExperience = { [Op.gte]: numYears };
    }
  }

  try {
    const profiles = await db.Profile.findAll({
      where: whereClause,
      include: [
        { model: db.User, attributes: ['username', 'email'] },
        { model: db.SocialLink },
        {
          model: db.Project,
          where: { status: 'published' },
          required: false,
          include: { model: db.ProjectTechnology, attributes: ['technologyName'] }
        },
        {
          model: db.BlogPost,
          where: { status: 'published' },
          required: false,
          include: { model: db.BlogTag, attributes: ['tagName'] }
        }
      ],
      order: [['name', 'ASC']]
    });
    res.json({ profiles });
  } catch (error) {
    console.error('Error fetching all profiles with filters:', error);
    res.status(500).json({ message: 'Server error fetching profiles', error: error.message });
  }
});

// GET a single profile by userId (public or owner's view)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching profile for userId: ${userId}`);

    let authenticatedUserId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        authenticatedUserId = decoded.id;
      } catch (err) {
        console.warn('Invalid token provided for profile fetch (public/owner view):', err.message);
      }
    }

    const isOwner = (authenticatedUserId && authenticatedUserId === userId);
    console.log(`Is owner (${userId}) viewing their own profile? ${isOwner}`);

    const findOptions = {
      where: { userId: userId },
      include: [
        { model: db.User, attributes: ['username', 'email'] },
        { model: db.SocialLink },
        {
          model: db.Project,
          where: isOwner ? {} : { status: 'published' },
          required: false,
          include: { model: db.ProjectTechnology, attributes: ['technologyName'] }
        },
        {
          model: db.BlogPost,
          where: isOwner ? {} : { status: 'published' },
          required: false,
          include: { model: db.BlogTag, attributes: ['tagName'] }
        }
      ]
    };

    if (!isOwner) {
      findOptions.where.status = 'published';
    }

    const profile = await db.Profile.findOne(findOptions);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found or not published.' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile by userId:', error);
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
});

// UPDATE a profile by userId (protected) - handles file uploads and new fields
router.put('/:userId', authenticateToken, (req, res, next) => {
  upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'resume', maxCount: 1 }])(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error during profile update:', err);
      return res.status(400).json({ message: err.message });
    } else if (err) {
      console.error('Unknown upload error during profile update:', err);
      return res.status(500).json({ message: 'File upload failed: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  console.log('--- Profile Update Request Received ---');
  console.log('req.body (text fields):', req.body);
  console.log('req.files (uploaded files):', req.files);
  console.log('-------------------------------------');

  const { userId } = req.params;
  const {
    name, title, bio, location, interests, websiteUrl,
    avatarUrl: clientAvatarUrl,
    resumeUrl: clientResumeUrl,
    primaryColor,
    secondaryColor,
    status,
    industry,
    yearsOfExperience
  } = req.body;

  const avatarFile = req.files && req.files.avatar ? req.files.avatar[0] : null;
  const resumeFile = req.files && req.files.resume ? req.files.resume[0] : null;

  if (req.user.id !== userId) {
    if (avatarFile) fs.unlinkSync(avatarFile.path);
    if (resumeFile) fs.unlinkSync(resumeFile.path);
    return res.status(403).json({ message: 'Unauthorized: You can only update your own profile.' });
  }

  try {
    const profile = await db.Profile.findOne({ where: { userId: userId } });
    if (!profile) {
      if (avatarFile) fs.unlinkSync(avatarFile.path);
      if (resumeFile) fs.unlinkSync(resumeFile.path);
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (title !== undefined) updateData.title = title;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
    if (status !== undefined) updateData.status = status;
    if (industry !== undefined) updateData.industry = industry;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = parseInt(yearsOfExperience, 10);

    if (interests !== undefined) {
      try {
        updateData.interests = JSON.parse(interests);
        if (!Array.isArray(updateData.interests)) {
          return res.status(400).json({ message: 'Interests must be an array of strings.' });
        }
      } catch (e) {
        if (interests === '') {
          updateData.interests = [];
        } else {
          return res.status(400).json({ message: 'Invalid format for interests. Expected a comma-separated string that can be parsed as JSON array.', error: e.message });
        }
      }
    }

    if (avatarFile) {
      if (profile.avatarUrl && profile.avatarUrl.startsWith(API_BASE_URL + '/uploads/')) {
        const oldAvatarPath = path.join(__dirname, '../uploads', path.basename(profile.avatarUrl));
        if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
      }
      updateData.avatarUrl = API_BASE_URL + `/uploads/${avatarFile.filename}`;
    } else if (clientAvatarUrl === '') {
      if (profile.avatarUrl && profile.avatarUrl.startsWith(API_BASE_URL + '/uploads/')) {
        const oldAvatarPath = path.join(__dirname, '../uploads', path.basename(profile.avatarUrl));
        if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
      }
      updateData.avatarUrl = null;
    }

    if (resumeFile) {
      if (profile.resumeUrl && profile.resumeUrl.startsWith(API_BASE_URL + '/uploads/')) {
        const oldResumePath = path.join(__dirname, '../uploads', path.basename(profile.resumeUrl));
        if (fs.existsSync(oldResumePath)) fs.unlinkSync(oldResumePath);
      }
      updateData.resumeUrl = API_BASE_URL + `/uploads/${resumeFile.filename}`;
    } else if (clientResumeUrl === '') {
      if (profile.resumeUrl && profile.resumeUrl.startsWith(API_BASE_URL + '/uploads/')) {
        const oldResumePath = path.join(__dirname, '../uploads', path.basename(profile.resumeUrl));
        if (fs.existsSync(oldResumePath)) fs.unlinkSync(oldResumePath);
      }
      updateData.resumeUrl = null;
    }

    await profile.update(updateData);

    const updatedProfile = await db.Profile.findOne({
      where: { userId },
      include: ['SocialLinks']
    });

    res.json({ message: 'Profile updated successfully!', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (avatarFile) fs.unlinkSync(avatarFile.path);
    if (resumeFile) fs.unlinkSync(resumeFile.path);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Validation error during profile update', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
});

// DELETE a user's profile and account (protected)
router.delete('/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  let transaction;

  if (req.user.id !== userId) {
    return res.status(403).json({ message: 'Unauthorized: You can only delete your own profile.' });
  }

  try {
    transaction = await db.sequelize.transaction();

    const profile = await db.Profile.findOne({ where: { userId: userId }, transaction });

    if (!profile) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // Delete associated files (avatar, resume) from disk
    if (profile.avatarUrl && profile.avatarUrl.startsWith(API_BASE_URL + '/uploads/')) {
      const avatarFilePath = path.join(__dirname, '../uploads', path.basename(profile.avatarUrl));
      if (fs.existsSync(avatarFilePath)) fs.unlinkSync(avatarFilePath);
    }
    if (profile.resumeUrl && profile.resumeUrl.startsWith(API_BASE_URL + '/uploads/')) {
      const resumeFilePath = path.join(__dirname, '../uploads', path.basename(profile.resumeUrl));
      if (fs.existsSync(resumeFilePath)) fs.unlinkSync(resumeFilePath);
    }

    const deletedRows = await db.User.destroy({ where: { id: userId }, transaction });

    if (deletedRows === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User not found for deletion.' });
    }

    await transaction.commit();
    res.status(200).json({ message: 'Profile and associated data deleted successfully!' });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error deleting profile and associated data:', error);
    res.status(500).json({ message: 'Server error during profile deletion', error: error.message });
  }
});

// ADD Social Link to a profile (protected)
router.post('/:profileId/social-links', authenticateToken, async (req, res) => {
  const { profileId } = req.params;
  const { platform, url } = req.body;

  try {
    const profile = await db.Profile.findByPk(profileId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    if (req.user.id !== profile.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only add social links to your own profile.' });
    }

    const newSocialLink = await db.SocialLink.create({ profileId, platform, url });
    res.status(201).json(newSocialLink);
  } catch (error) {
    console.error('Error adding social link:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Validation error adding social link', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Server error adding social link', error: error.message });
  }
});

// DELETE Social Link from a profile (protected)
router.delete('/:profileId/social-links/:socialLinkId', authenticateToken, async (req, res) => {
  const { profileId, socialLinkId } = req.params;

  try {
    const socialLink = await db.SocialLink.findOne({
      where: { id: socialLinkId, profileId: profileId },
      include: { model: db.Profile, attributes: ['userId'] }
    });

    if (!socialLink) {
      return res.status(404).json({ message: 'Social link not found.' });
    }
    if (req.user.id !== socialLink.Profile.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete social links from your own profile.' });
    }

    await socialLink.destroy();
    res.status(200).json({ message: 'Social link deleted successfully!' });
  } catch (error) {
    console.error('Error deleting social link:', error);
    res.status(500).json({ message: 'Server error deleting social link', error: error.message });
  }
});

module.exports = router;

// routes/blogPostRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models'); // Adjust path as needed
const authenticateToken = require('../middleware/authMiddleware'); // Adjust path as needed
const jwt = require('jsonwebtoken'); // For token verification in public blog post route
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET; // Needed for public blog post route

// GET all blog posts (public, can be filtered by authorId and status)
router.get('/', async (req, res) => {
  console.log('--- Blog Posts GET Request Received ---');
  const { userId } = req.query;

  const whereClause = {};

  let authenticatedUserId = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      authenticatedUserId = decoded.id;
    } catch (err) {
      console.warn('Invalid token for blog post fetch:', err.message);
    }
  }

  if (userId) {
    if (authenticatedUserId && authenticatedUserId === userId) {
      whereClause.userId = userId;
    } else {
      whereClause.userId = userId;
      whereClause.status = 'published';
    }
  } else {
    whereClause.status = 'published';
  }

  try {
    const blogPosts = await db.BlogPost.findAll({
      where: whereClause,
      include: [
        { model: db.User, attributes: ['username'] },
        { model: db.BlogTag, attributes: ['tagName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(blogPosts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Server error fetching blog posts', error: error.message });
  }
});

// GET a single blog post by slug (public view, only published)
router.get('/slug/:slug', async (req, res) => {
  try {
    const blogPost = await db.BlogPost.findOne({
      where: { slug: req.params.slug, status: 'published' },
      include: [
        { model: db.User, attributes: ['username'] },
        { model: db.BlogTag, attributes: ['tagName'] }
      ]
    });
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found or not published.' });
    }
    res.json(blogPost);
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    res.status(500).json({ message: 'Server error fetching blog post', error: error.message });
  }
});

// CREATE a new blog post (protected)
router.post('/', authenticateToken, async (req, res) => {
  const { title, content, slug, imageUrl, status, tags } = req.body;
  const userId = req.user.id;

  try {
    const newBlogPost = await db.BlogPost.create({
      userId, title, content, slug, imageUrl, status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null
    });

    if (tags && tags.length > 0) {
      await Promise.all(tags.map(tag =>
        db.BlogTag.create({ blogPostId: newBlogPost.id, tagName: tag.tagName })
      ));
    }

    const createdBlogPost = await db.BlogPost.findByPk(newBlogPost.id, {
      include: { model: db.BlogTag, attributes: ['tagName'] }
    });

    res.status(201).json(createdBlogPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Validation error creating blog post', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Server error creating blog post', error: error.message });
  }
});

// UPDATE an existing blog post (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, slug, imageUrl, status, tags } = req.body;

  try {
    const blogPost = await db.BlogPost.findByPk(id);
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }
    if (req.user.id !== blogPost.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only update your own blog posts.' });
    }

    const updateData = { title, content, slug, imageUrl, status };
    if (status === 'published' && !blogPost.publishedAt) {
      updateData.publishedAt = new Date();
    } else if (status === 'draft' && blogPost.publishedAt) {
      updateData.publishedAt = null;
    }

    await blogPost.update(updateData);

    if (tags !== undefined) {
      await db.BlogTag.destroy({ where: { blogPostId: blogPost.id } });
      if (tags && tags.length > 0) {
        await Promise.all(tags.map(tag =>
          db.BlogTag.create({ blogPostId: blogPost.id, tagName: tag.tagName })
        ));
      }
    }

    const updatedBlogPost = await db.BlogPost.findByPk(id, {
      include: { model: db.BlogTag, attributes: ['tagName'] }
    });

    res.json({ message: 'Blog post updated successfully!', blogPost: updatedBlogPost });
  } catch (error) {
    console.error('Error updating blog post:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Validation error updating blog post', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Server error updating blog post', error: error.message });
  }
});

// DELETE a blog post (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const blogPost = await db.BlogPost.findByPk(id);
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }
    if (req.user.id !== blogPost.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own blog posts.' });
    }

    await blogPost.destroy();
    res.status(200).json({ message: 'Blog post deleted successfully!' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Server error deleting blog post', error: error.message });
  }
});

module.exports = router;

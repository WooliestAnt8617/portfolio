// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models'); // Adjust path as needed
const authenticateToken = require('../middleware/authMiddleware'); // Adjust path as needed
const jwt = require('jsonwebtoken'); // Import JWT for optional token verification
require('dotenv').config(); // Ensure dotenv is loaded

const JWT_SECRET = process.env.JWT_SECRET; // Needed for public access with owner check

// GET all projects for a specific user (public or owner's view)
router.get('/users/:userId/projects', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching projects for userId: ${userId}`);

    let authenticatedUserId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Attempt to verify token if provided, but don't halt if invalid (for public view)
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        authenticatedUserId = decoded.id;
      } catch (err) {
        console.warn('Invalid token provided for project fetch (public/owner view):', err.message);
        // If token is invalid, we proceed as an unauthenticated user
      }
    }

    // Determine if the request is from the owner of the profile
    const isOwner = (authenticatedUserId && authenticatedUserId === userId);
    console.log(`Is owner (${userId}) viewing their own projects? ${isOwner}`);

    const whereClause = { userId: userId };

    // If not the owner, or if no valid token was provided, only show published projects
    if (!isOwner) {
      whereClause.status = 'published';
    }

    const projects = await db.Project.findAll({
      where: whereClause, // Apply conditional status filter
      include: { model: db.ProjectTechnology, attributes: ['technologyName'] },
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Server error fetching projects', error: error.message });
  }
});

// CREATE a new project (protected)
router.post('/', authenticateToken, async (req, res) => {
  console.log('--- Create Project Request Received ---');
  console.log('req.body:', req.body);
  console.log('-------------------------------------');

  const { title, description, longDescription, imageUrl, liveUrl, repoUrl, status, displayOrder, technologies } = req.body;
  const userId = req.user.id; // Project is associated with the authenticated user

  try {
    const newProject = await db.Project.create({
      userId, title, description, longDescription, imageUrl, liveUrl, repoUrl, status: status || 'draft', displayOrder
    });

    if (technologies && technologies.length > 0) {
      await Promise.all(technologies.map(tech =>
        db.ProjectTechnology.create({ projectId: newProject.id, technologyName: tech.technologyName })
      ));
    }

    // Fetch the project again with technologies to return a complete object
    const createdProject = await db.Project.findByPk(newProject.id, {
      include: { model: db.ProjectTechnology, attributes: ['technologyName'] }
    });

    res.status(201).json(createdProject);
  } catch (error) {
    console.error('Error creating project:', error);
    if (error.name === 'SequelizeValidationError') {
      console.error('Sequelize Validation Errors:', error.errors);
      return res.status(400).json({ message: 'Validation error creating project', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Server error creating project', error: error.message });
  }
});

// UPDATE an existing project (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  console.log('--- Update Project Request Received ---');
  console.log('req.body:', req.body);
  console.log('-------------------------------------');

  const { id } = req.params;
  const { title, description, longDescription, imageUrl, liveUrl, repoUrl, status, displayOrder, technologies } = req.body;

  try {
    const project = await db.Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    if (req.user.id !== project.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only update your own projects.' });
    }

    await project.update({
      title, description, longDescription, imageUrl, liveUrl, repoUrl, status, displayOrder
    });

    // Update technologies: clear existing and add new ones
    if (technologies !== undefined) {
      await db.ProjectTechnology.destroy({ where: { projectId: project.id } });
      if (technologies && technologies.length > 0) {
        await Promise.all(technologies.map(tech =>
          db.ProjectTechnology.create({ projectId: project.id, technologyName: tech.technologyName })
        ));
      }
    }

    const updatedProject = await db.Project.findByPk(id, {
      include: { model: db.ProjectTechnology, attributes: ['technologyName'] }
    });

    res.json({ message: 'Project updated successfully!', project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    if (error.name === 'SequelizeValidationError') {
      console.error('Sequelize Validation Errors:', error.errors);
      return res.status(400).json({ message: 'Validation error updating project', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Server error updating project', error: error.message });
  }
});

// DELETE a project (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const project = await db.Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    if (req.user.id !== project.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own projects.' });
    }

    await project.destroy();
    res.status(200).json({ message: 'Project deleted successfully!' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error deleting project', error: error.message });
  }
});

module.exports = router;

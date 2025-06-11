// -------------------------------------------------------------------
// File: server.js
// Location: portfolio-cms-backend/server.js
// The main Express application file, now with Sequelize, Auth, and file uploads.
// -------------------------------------------------------------------
console.log('--- server.js loaded and executed ---');

const express = require('express');
const cors = require('cors');
const db = require('./models'); // Import Sequelize models
require('dotenv').config();
const path = require('path');
const fs = require('fs'); // Only needed for file cleanup if routes don't handle it fully

// Import modular routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const projectRoutes = require('./routes/projectRoutes');
const blogPostRoutes = require('./routes/blogPostRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const API_BASE_URL = `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Endpoints (Modularized) ---
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/projects', projectRoutes); // Note: /api/users/:userId/projects is also handled by projectRoutes
app.use('/api/blogposts', blogPostRoutes);
app.use('/api/contact', contactRoutes);


// 404 Not Found handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API Endpoint Not Found' });
});

// --- Catch-all to serve frontend's index.html for client-side routing ---
// This should be placed AFTER all API routes, but BEFORE global error handler.
// Assuming your React frontend build output is in a 'build' directory
// one level up from your backend folder (e.g., project-root/frontend/build)
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Sync Sequelize models with the database and start the server
db.sequelize.sync({ alter: true }) // Using { alter: true } to update schema without dropping data
    .then(() => {
        console.log('Database synced successfully!');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error syncing database:', err.message);
        process.exit(1); // Exit if database sync fails
    });

PortfolioHub: Multi-User Portfolio & CMS
Overview
PortfolioHub is a full-stack web application designed to help professionals showcase their work and connect with others. It offers robust features for managing profiles, projects, and blog posts, all within a user-friendly interface.

Features
User Authentication: Secure registration and login for all users.

Personalized Profiles: Create and customize your professional profile, including your bio, contact information, and even theme colors.

Project Showcase: Easily add, edit, and display your projects with descriptions, images, and links.

Integrated Blog: Publish and manage your blog posts to share insights and updates.

Discover Profiles: Explore other users' public profiles using search and filtering options.

Direct Contact: A contact form allows visitors to send messages directly to the site administrator.

Responsive Design: Optimized for seamless experience on all devices.

Always-On Dark Mode: Enjoy a comfortable dark theme throughout the application.

Technologies Used
Backend
Node.js & Express.js: For building the server-side API.

Sequelize: An ORM for database interaction (supports SQLite, PostgreSQL, MySQL).

JWT & bcryptjs: For secure authentication and password hashing.

Multer: For handling file uploads (avatars, resumes).

Nodemailer: For sending emails from the contact form.

Frontend
React: For building the dynamic user interface.

Tailwind CSS: For efficient and responsive styling.

Lucide React: For modern, customizable icons.

Setup & Running Locally
Prerequisites
Node.js (LTS version)

npm or yarn

1. Backend Setup
Navigate to the portfolio-cms-backend directory.

Install dependencies: npm install (or yarn install).

Create a .env file with PORT, JWT_SECRET, CONTACT_EMAIL_USER, CONTACT_EMAIL_PASS, and CONTACT_RECIPIENT_EMAIL (refer to github-readme for details on .env configuration).

Start the backend: npm start (or yarn start).

2. Frontend Setup
Navigate to the frontend directory.

Install dependencies: npm install (or yarn install).

Start the frontend: npm start (or yarn start).

The application should be accessible at http://localhost:3000.

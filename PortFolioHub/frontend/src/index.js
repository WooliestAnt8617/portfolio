import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import your App component from App.js

// If you have a global CSS file (e.g., for Tailwind directives or custom styles), import it here.
// import './index.css'; // Uncomment and create this file if needed for additional global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

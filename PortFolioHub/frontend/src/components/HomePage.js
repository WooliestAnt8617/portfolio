// src/components/HomePage.js
import React, { useContext } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import AuthContext from '../AuthContext';

const HomePage = ({ user, setCurrentPage }) => {
  const { primaryColor, secondaryColor } = useContext(AuthContext);

  return (
    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4 animate-fade-in">Welcome to Your Portfolio Hub!</h1>
      <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 animate-slide-up">Manage your professional profile, projects, and blog posts with ease.</p>
      {!user ? (
        <div className="space-x-4">
          <button onClick={() => setCurrentPage('login')} className="text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out hover:scale-105" style={{backgroundColor: primaryColor, hoverBackgroundColor: secondaryColor}}>
            <LogIn size={20} className="inline-block mr-2" /> Login
          </button>
          <button onClick={() => setCurrentPage('register')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out hover:scale-105 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
            <UserPlus size={20} className="inline-block mr-2" /> Register
          </button>
        </div>
      ) : (
        <p className="text-lg text-gray-800 dark:text-gray-200">Hello, {user.username}! Navigate using the menu above.</p>
      )}
    </div>
  );
};

export default HomePage;

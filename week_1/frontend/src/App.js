// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { Home, LogIn, UserPlus, User, Briefcase, Book, Mail, Menu, X } from 'lucide-react';

import AuthContext from './AuthContext';
import apiService from './apiService';

import { MessageBox } from './components/CommonComponents';
import AuthForm from './components/AuthForm';
import ProfileSection from './components/ProfileSection';
import ProjectsSection from './components/ProjectsSection';
import BlogPostsSection from './components/BlogPostsSection';
import ContactSection from './components/ContactSection';
import { PublicProfilesPage } from './components/PublicProfiles';
import BlogPostDetail from './components/BlogPostDetail';
import HomePage from './components/HomePage';


const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState('home');
  const [currentBlogPostSlug, setCurrentBlogPostSlug] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appMessage, setAppMessage] = useState(null);
  const [appMessageType, setAppMessageType] = useState(null);

  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#9333ea');
  // Always set to dark mode
  const isDarkMode = true;

  // Effect to apply 'dark' class to the HTML element
  useEffect(() => {
    document.documentElement.classList.add('dark');
    // We are forcing dark mode, so no localStorage theme preference is needed
    // localStorage.setItem('theme', 'dark');
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewProfileId = urlParams.get('viewProfileId');
    if (viewProfileId) {
      setCurrentPage('public-profiles');
    }
  }, []);

  useEffect(() => {
    console.log('App: useEffect triggered. Current token:', token);
    const fetchMe = async () => {
      if (token) {
        try {
          console.log('App: Attempting to fetch user data with token:', token);
          const responseData = await apiService.getMe(token);
          console.log('App: apiService.getMe responseData (full):', responseData);
          setUser(responseData);
          if (responseData.primaryColor) setPrimaryColor(responseData.primaryColor);
          if (responseData.secondaryColor) setSecondaryColor(responseData.secondaryColor);

          console.log('App: User and token states updated after successful login.');
          localStorage.setItem('token', token);
        } catch (error) {
          console.error("App: Error fetching user data (likely invalid token):", error);
          setAppMessage(`Session expired or invalid. Please log in again. (${error.message})`);
          setAppMessageType('error');
          handleLogout();
        }
      } else {
        console.log('App: No token found in localStorage, skipping fetchMe.');
      }
    };
    fetchMe();
  }, [token]);

  const handleAuthSuccess = (newToken, userData) => {
    console.log('App: handleAuthSuccess called with newToken:', newToken, 'and userData:', userData);
    setToken(newToken);
    setUser(userData);
    if (userData.primaryColor) setPrimaryColor(userData.primaryColor);
    if (userData.secondaryColor) setSecondaryColor(userData.secondaryColor);

    console.log('App: User and token states updated after successful login.');
    localStorage.setItem('token', newToken);
    setCurrentPage('profile');
    setAppMessage('Login successful!');
    setAppMessageType('success');
  };

  const handleLogout = () => {
    console.log('App: handleLogout called.');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setCurrentPage('home');
    setAppMessage('Logged out successfully.');
    setAppMessageType('success');
  };

  const handleProfileUpdate = async () => {
    if (token) {
      try {
        const userData = await apiService.getMe(token);
        setUser(userData);
        if (userData.primaryColor) setPrimaryColor(userData.primaryColor);
        if (userData.secondaryColor) setSecondaryColor(userData.secondaryColor);
        console.log('App: User data refreshed after profile update:', userData);
      } catch (error) {
        console.error("App: Failed to re-fetch user data after profile update:", error);
        setAppMessage(`Failed to refresh user data after profile update. (${error.message})`);
        setAppMessageType('error');
      }
    }
  };

  const renderPage = () => {
    console.log('App: renderPage - current user state:', user, 'current page:', currentPage);
    switch (currentPage) {
      case 'home':
        return <HomePage user={user} setCurrentPage={setCurrentPage} />;
      case 'login':
        return <AuthForm type="login" onAuthSuccess={handleAuthSuccess} />;
      case 'register':
        return <AuthForm type="register" onAuthSuccess={handleAuthSuccess} />;
      case 'profile':
        return user ? <ProfileSection user={user} token={token} onProfileUpdate={handleProfileUpdate} /> : <p className="text-center text-red-600">Please log in to view your profile.</p>;
      case 'projects':
        return user ? <ProjectsSection user={user} token={token} /> : <p className="text-center text-red-600">Please log in to manage your projects.</p>;
      case 'blog':
        return user ? <BlogPostsSection user={user} token={token} /> : <p className="text-center text-red-600">Please log in to manage your blog posts.</p>;
      case 'contact':
        return <ContactSection />;
      case 'public-profiles':
        const urlParams = new URLSearchParams(window.location.search);
        const initialViewProfileId = urlParams.get('viewProfileId');
        return <PublicProfilesPage setCurrentPage={setCurrentPage} setCurrentBlogPostSlug={setCurrentBlogPostSlug} initialViewProfileId={initialViewProfileId} />;
      case 'blog-detail':
        return <BlogPostDetail slug={currentBlogPostSlug} onBack={() => setCurrentPage('public-profiles')} />;
      default:
        return <p className="text-center py-16">Page not found.</p>;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, handleLogout, handleAuthSuccess, primaryColor, secondaryColor, isDarkMode }}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-inter antialiased" style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor }}>
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-800 shadow-md p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="text-2xl font-bold text-[var(--primary-color)] cursor-pointer" onClick={() => setCurrentPage('home')}>
              PortfolioHub
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-800 dark:text-gray-200 focus:outline-none transition duration-300 ease-in-out hover:scale-110">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
            {/* Desktop Menu */}
            <ul className="hidden md:flex space-x-6 items-center">
              <li>
                <button onClick={() => setCurrentPage('home')} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:scale-105">
                  <Home size={18} className="inline-block mr-1" /> Home
                </button>
              </li>
              {user && (
                <>
                  <li>
                    <button onClick={() => setCurrentPage('profile')} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:scale-105">
                      <User size={18} className="inline-block mr-1" /> Profile
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('projects')} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:scale-105">
                      <Briefcase size={18} className="inline-block mr-1" /> Projects
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('blog')} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:scale-105">
                      <Book size={18} className="inline-block mr-1" /> Blog
                    </button>
                  </li>
                </>
              )}
              <li>
                <button onClick={() => setCurrentPage('public-profiles')} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:scale-105">
                  <UserPlus size={18} className="inline-block mr-1" /> Discover
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('contact')} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:scale-105">
                  <Mail size={18} className="inline-block mr-1" /> Contact
                </button>
              </li>
              {user ? (
                <li>
                  <button onClick={handleLogout} className="border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out hover:scale-105">
                    <LogIn size={18} className="inline-block mr-1" /> Logout ({user.username})
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <button onClick={() => setCurrentPage('login')} className="bg-transparent border-2 border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out hover:scale-105">
                      <LogIn size={18} className="inline-block mr-1" /> Login
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('register')} className="bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out hover:scale-105">
                      <UserPlus size={18} className="inline-block mr-1" /> Register
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed top-0 left-0 w-full h-full bg-white dark:bg-gray-900 z-40 flex flex-col items-center py-8 shadow-lg animate-fade-in-down">
              <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 text-gray-800 dark:text-gray-200 transition duration-300 ease-in-out hover:scale-110">
                <X size={24} />
              </button>
              <ul className="flex flex-col space-y-6 text-center mt-8">
                <li>
                  <button onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-4 py-3 rounded-lg transition duration-300 text-lg hover:scale-105">
                    <Home size={20} className="inline-block mr-2" /> Home
                  </button>
                </li>
                {user && (
                  <>
                    <li>
                      <button onClick={() => { setCurrentPage('profile'); setIsMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-4 py-3 rounded-lg transition duration-300 text-lg hover:scale-105">
                        <User size={20} className="inline-block mr-2" /> Profile
                      </button>
                    </li>
                    <li>
                      <button onClick={() => { setCurrentPage('projects'); setIsMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-4 py-3 rounded-lg transition duration-300 text-lg hover:scale-105">
                        <Briefcase size={20} className="inline-block mr-2" /> Projects
                      </button>
                    </li>
                    <li>
                      <button onClick={() => { setCurrentPage('blog'); setIsMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-4 py-3 rounded-lg transition duration-300 text-lg hover:scale-105">
                        <Book size={20} className="inline-block mr-2" /> Blog
                      </button>
                    </li>
                  </>
                )}
                <li>
                  <button onClick={() => { setCurrentPage('public-profiles'); setIsMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-4 py-3 rounded-lg transition duration-300 text-lg hover:scale-105">
                    <UserPlus size={20} className="inline-block mr-2" /> Discover
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentPage('contact'); setIsMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] flex items-center px-4 py-3 rounded-lg transition duration-300 text-lg hover:scale-105">
                    <Mail size={20} className="inline-block mr-2" /> Contact
                  </button>
                </li>
                {user ? (
                  <li>
                    <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out text-lg w-full hover:scale-105">
                      <LogIn size={20} className="inline-block mr-2" /> Logout ({user.username})
                    </button>
                  </li>
                ) : (
                  <>
                    <li>
                      <button onClick={() => { setCurrentPage('login'); setIsMobileMenuOpen(false); }} className="bg-transparent border-2 border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out text-lg w-full hover:scale-105">
                        <LogIn size={20} className="inline-block mr-2" /> Login
                      </button>
                    </li>
                    <li>
                      <button onClick={() => { setCurrentPage('register'); setIsMobileMenuOpen(false); }} className="bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out text-lg w-full hover:scale-105">
                        <UserPlus size={20} className="inline-block mr-2" /> Register
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </nav>

        {/* App-level Message Box */}
        <div className="container mx-auto px-4 py-4">
          <MessageBox message={appMessage} type={appMessageType} onClose={() => setAppMessage(null)} />
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white text-center p-6 mt-8 rounded-t-lg dark:bg-gray-900 dark:text-gray-200">
          <p>&copy; {new Date().getFullYear()} PortfolioHub. All rights reserved.</p>
          <p className="text-sm mt-2">Built with React and Tailwind CSS</p>
        </footer>

        {/* Tailwind CSS CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
      </div>
    </AuthContext.Provider>
  );
};

export default App;

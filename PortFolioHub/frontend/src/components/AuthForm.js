// src/components/AuthForm.js
import React, { useState } from 'react';
import apiService from '../apiService';
import { MessageBox } from './CommonComponents';

const AuthForm = ({ type, onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      let response;
      if (type === 'register') {
        response = await apiService.register(username, email, password);
      } else {
        response = await apiService.login(email, password);
      }
      setMessage(response.message);
      setMessageType('success');
      if (onAuthSuccess) {
        onAuthSuccess(response.token, response.user);
      }
    } catch (error) {
      console.error('AuthForm: Error during submission:', error);
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg animate-fade-in">
      <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
        {type === 'register' ? 'Register' : 'Login'}
      </h2>
      <MessageBox message={message} type={messageType} onClose={() => setMessage(null)} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'register' && (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="username">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={type === 'login' ? 'current-password' : 'new-password'}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out disabled:opacity-50 hover:scale-105"
          disabled={loading}
        >
          {loading ? 'Processing...' : (type === 'register' ? 'Register' : 'Login')}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;

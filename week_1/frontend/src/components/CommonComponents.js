// src/components/CommonComponents.js
import React from 'react';
import { X } from 'lucide-react';

// Notification / Message Box Component
export const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-300' : 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-300';
  return (
    <div className={`relative px-4 py-3 border rounded-lg ${bgColor} mb-4 animate-fade-in`} role="alert">
      <strong className="font-bold">{type === 'error' ? 'Error!' : 'Success!'}</strong>
      <span className="block sm:inline ml-2">{message}</span>
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={onClose}>
        <X size={18} />
      </span>
    </div>
  );
};

// Reusable Switch Component
export const Switch = ({ label, checked, onChange, disabled = false }) => {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <div className="block bg-gray-600 w-14 h-8 rounded-full transition-transform duration-300"></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${checked ? 'translate-x-full bg-blue-500' : ''}`}></div>
      </div>
      <div className="ml-3 text-gray-700 font-medium dark:text-gray-300">
        {label}
      </div>
    </label>
  );
};

// Reusable Confirmation Dialog Component
export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm mx-auto animate-zoom-in">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{title}</h3>
        <p className="mb-4 text-gray-700 dark:text-gray-300">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition duration-300 ease-in-out hover:scale-105 dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out hover:scale-105"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

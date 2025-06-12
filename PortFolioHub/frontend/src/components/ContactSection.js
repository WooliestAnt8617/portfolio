// src/components/ContactSection.js
import React, { useState, useContext, useEffect } from 'react'; // Import useEffect and useContext
import apiService from '../apiService';
import { MessageBox, Switch } from './CommonComponents'; // Import Switch
import AuthContext from '../AuthContext'; // Import AuthContext

const ContactSection = () => {
  const { user } = useContext(AuthContext); // Access user from AuthContext
  const [formData, setFormData] = useState({
    name: '', email: '', message: ''
  });
  const [useRegisteredEmail, setUseRegisteredEmail] = useState(true); // State for the switch
  const [otherEmail, setOtherEmail] = useState(''); // State for the alternative email input

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set initial email based on user's registered email if logged in
  useEffect(() => {
    if (user && user.email && useRegisteredEmail) {
      setFormData(prev => ({ ...prev, email: user.email }));
    } else if (useRegisteredEmail && !user?.email) {
        // If switch is on but no registered email, revert to blank and allow manual input
        setFormData(prev => ({ ...prev, email: '' }));
        setUseRegisteredEmail(false); // Force switch off if no registered email
    } else if (!useRegisteredEmail) {
        setFormData(prev => ({ ...prev, email: otherEmail }));
    }
  }, [user, useRegisteredEmail, otherEmail]); // Added otherEmail to dependencies

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtherEmailChange = (e) => {
    setOtherEmail(e.target.value);
    setFormData(prev => ({ ...prev, email: e.target.value })); // Update formData.email directly
  };

  const handleToggleEmailSource = (e) => {
    const isChecked = e.target.checked;
    setUseRegisteredEmail(isChecked);
    setMessage(null); // Clear messages when toggling

    // Update form data based on the toggle
    if (isChecked && user && user.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
      setOtherEmail(''); // Clear other email if switching to registered
    } else {
      setFormData(prev => ({ ...prev, email: otherEmail })); // Use otherEmail or keep current if not provided
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const finalEmail = useRegisteredEmail && user && user.email ? user.email : otherEmail;

    if (!finalEmail) {
        setMessage('Please provide an email address.');
        setMessageType('error');
        setLoading(false);
        return;
    }

    try {
      const response = await apiService.sendContactMessage(formData.name, finalEmail, formData.message);
      setMessage(response.message);
      setMessageType('success');
      setFormData({ name: '', email: '', message: '' });
      setOtherEmail(''); // Clear other email input field
      // Reset useRegisteredEmail to true if user is logged in
      if (user && user.email) {
        setUseRegisteredEmail(true);
      }
    } catch (error) {
      setMessage(`Error sending message: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 animate-fade-in">
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Contact Me</h3>
      <MessageBox message={message} type={messageType} onClose={() => setMessage(null)} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="contactName">
            Name
          </label>
          <input
            type="text"
            id="contactName"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600"
            required
          />
        </div>
        {/* Email selection switch */}
        <div className="pt-2">
          <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
            Your Email
          </label>
          <Switch
            label={user && user.email && useRegisteredEmail ? `Use Registered Email (${user.email})` : 'Use Other Email'}
            checked={useRegisteredEmail && !!user?.email} // Only allow checked if registered email exists
            onChange={handleToggleEmailSource}
            disabled={!user?.email} // Disable switch if no registered email
          />
          {(!user?.email || !useRegisteredEmail) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {user && user.email && !useRegisteredEmail
                    ? "You are using an alternative email."
                    : "You are not logged in or do not have a registered email. Please enter your email."}
            </p>
          )}
        </div>

        {/* Other email input, conditionally rendered */}
        {(!useRegisteredEmail || !user?.email) && (
          <div className="mt-4 animate-fade-in">
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="otherContactEmail">
              Alternative Email
            </label>
            <input
              type="email"
              id="otherContactEmail"
              name="otherEmail" // Note: This is bound to otherEmail state
              value={otherEmail}
              onChange={handleOtherEmailChange}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required={!useRegisteredEmail || !user?.email} // Make required if not using registered email
            />
          </div>
        )}

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="contactMessage">
            Message
          </label>
          <textarea
            id="contactMessage"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600"
            rows="5"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out disabled:opacity-50 hover:scale-105"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default ContactSection;

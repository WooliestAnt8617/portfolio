// src/components/ProfileSection.js
import React, { useState, useEffect, useContext } from 'react';
import { Edit, X, PlusCircle, Save, Trash2, ExternalLink, Link as LinkIcon, MapPin, Tag, Globe, Briefcase, Book } from 'lucide-react';
import apiService from '../apiService';
import AuthContext from '../AuthContext';
import { MessageBox, Switch, ConfirmDialog } from './CommonComponents';

const ProfileSection = ({ user, token, onProfileUpdate }) => {
  const { handleLogout, primaryColor, secondaryColor } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '', title: '', bio: '', location: '', interests: '', websiteUrl: '',
    primaryColor: '#2563eb', secondaryColor: '#9333ea', status: 'draft',
    industry: '', yearsOfExperience: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [clearAvatarFlag, setClearAvatarFlag] = useState(false);
  const [clearResumeFlag, setClearResumeFlag] = useState(false);

  const [socialLinks, setSocialLinks] = useState([]);
  const [newSocialLinkPlatform, setNewSocialLinkPlatform] = useState('');
  const [newSocialLinkUrl, setNewSocialLinkUrl] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && user.id) {
        setLoading(true);
        try {
          const fetchedProfile = await apiService.getProfile(user.id, token);
          setProfile(fetchedProfile);
          setFormData({
            name: fetchedProfile.name || '',
            title: fetchedProfile.title || '',
            bio: fetchedProfile.bio || '',
            location: fetchedProfile.location || '',
            interests: Array.isArray(fetchedProfile.interests) ? fetchedProfile.interests.join(', ') : '',
            websiteUrl: fetchedProfile.websiteUrl || '',
            primaryColor: fetchedProfile.primaryColor || '#2563eb',
            secondaryColor: fetchedProfile.secondaryColor || '#9333ea',
            status: fetchedProfile.status || 'draft',
            industry: fetchedProfile.industry || '',
            yearsOfExperience: fetchedProfile.yearsOfExperience || '',
          });
          setSocialLinks(fetchedProfile.SocialLinks || []);
        } catch (error) {
          setMessage(`Error fetching profile: ${error.message}`);
          setMessageType('error');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'status' && type === 'checkbox') {
      const newStatus = checked ? 'published' : 'draft';
      if (newStatus === 'published' && formData.status === 'draft') {
        setPendingStatusChange(newStatus);
        setIsPublishConfirmOpen(true);
      } else {
        setFormData({ ...formData, [name]: newStatus });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleStatusConfirm = () => {
    setFormData({ ...formData, status: pendingStatusChange });
    setIsPublishConfirmOpen(false);
    setPendingStatusChange(null);
  };

  const handleStatusCancel = () => {
    setIsPublishConfirmOpen(false);
    setPendingStatusChange(null);
  };

  const handleSaveProfile = async () => {
    setMessage(null);
    setLoading(true);

    const dataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'interests') {
        const interestsArray = formData[key].split(',').map(item => item.trim()).filter(item => item !== '');
        dataToSend.append(key, JSON.stringify(interestsArray));
      } else {
        dataToSend.append(key, formData[key]);
      }
    });

    if (avatarFile) {
      dataToSend.append('avatar', avatarFile);
      setClearAvatarFlag(false);
    } else if (clearAvatarFlag) {
      dataToSend.append('avatarUrl', '');
    }

    if (resumeFile) {
      dataToSend.append('resume', resumeFile);
      setClearResumeFlag(false);
    } else if (clearResumeFlag) {
      dataToSend.append('resumeUrl', '');
    }

    try {
      const updatedProfile = await apiService.updateProfile(user.id, dataToSend, token);
      setProfile(updatedProfile.profile);
      onProfileUpdate();
      setMessage('Profile updated successfully!');
      setMessageType('success');
      setIsEditing(false);
      setAvatarFile(null);
      setResumeFile(null);
      setClearAvatarFlag(false);
      setClearResumeFlag(false);
    } catch (error) {
      setMessage(`Error updating profile: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSocialLink = async () => {
    setMessage(null);
    if (!newSocialLinkPlatform || !newSocialLinkUrl) {
      setMessage('Both platform and URL are required for social link.');
      setMessageType('error');
      return;
    }
    setLoading(true);
    try {
      const newLink = await apiService.addSocialLink(profile.id, {
        platform: newSocialLinkPlatform,
        url: newSocialLinkUrl,
      }, token);
      setSocialLinks([...socialLinks, newLink]);
      setNewSocialLinkPlatform('');
      setNewSocialLinkUrl('');
      setMessage('Social link added successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error adding social link: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSocialLink = async (socialLinkId) => {
    const confirmed = await new Promise((resolve) => {
      const confirmDialog = document.createElement('div');
      confirmDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
      confirmDialog.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
          <h3 class="text-lg font-semibold mb-4">Confirm Deletion</h3>
          <p class="mb-4">Are you sure you want to delete this social link?</p>
          <div class="flex justify-end gap-3">
            <button id="cancelBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg">Cancel</button>
            <button id="confirmBtn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      document.getElementById('cancelBtn').onclick = () => {
        document.body.removeChild(confirmDialog);
        resolve(false);
      };
      document.getElementById('confirmBtn').onclick = () => {
        document.body.removeChild(confirmDialog);
        resolve(true);
      };
    });

    if (!confirmed) return;

    setMessage(null);
    setLoading(true);
    try {
      await apiService.deleteSocialLink(profile.id, socialLinkId, token);
      setSocialLinks(socialLinks.filter(link => link.id !== socialLinkId));
      setMessage('Social link deleted successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error deleting social link: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = await new Promise((resolve) => {
      const confirmDialog = document.createElement('div');
      confirmDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
      confirmDialog.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
          <h3 class="text-lg font-semibold mb-4 text-red-700">Confirm Account Deletion</h3>
          <p class="mb-4">Are you absolutely sure you want to delete your entire profile and account? This action cannot be undone.</p>
          <div class="flex justify-end gap-3">
            <button id="cancelBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg">Cancel</button>
            <button id="confirmBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">Delete My Account</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      document.getElementById('cancelBtn').onclick = () => {
        document.body.removeChild(confirmDialog);
        resolve(false);
      };
      document.getElementById('confirmBtn').onclick = () => {
        document.body.removeChild(confirmDialog);
        resolve(true);
      };
    });

    if (!confirmed) return;

    setMessage(null);
    setLoading(true);
    try {
      await apiService.deleteProfile(user.id, token);
      setMessage('Profile and account deleted successfully!');
      setMessageType('success');
      handleLogout();
    } catch (error) {
      setMessage(`Error deleting profile: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading profile...</div>;
  if (!profile) return <div className="text-center py-8 text-red-600">No profile found for this user.</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl mb-8 border border-gray-200 dark:border-gray-700 animate-fade-in">
      <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
        Your Profile
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setAvatarFile(null);
            setResumeFile(null);
            setClearAvatarFlag(false);
            setClearResumeFlag(false);
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg text-base font-semibold shadow-md hover:shadow-lg transition duration-300 ease-in-out flex items-center gap-2 hover:scale-105"
        >
          {isEditing ? <X size={20} /> : <Edit size={20} />} {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </h3>
      <MessageBox message={message} type={messageType} onClose={() => setMessage(null)} />

      {isEditing ? (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="e.g., Software Engineer" />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600" rows="4" placeholder="A short description about yourself..."></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="e.g., San Francisco, CA" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Website URL</label>
              <input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="https://yourwebsite.com" />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Professional Interests (comma-separated)</label>
            <input type="text" name="interests" value={formData.interests} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="e.g., AI, Web Development, UI/UX Design" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Industry</label>
              <input type="text" name="industry" value={formData.industry} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="e.g., Tech, Finance" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Years of Experience</label>
              <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="e.g., 5" min="0" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Profile Theme Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Primary Color</label>
                <input
                  type="color"
                  id="primaryColor"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border-2 border-gray-300 cursor-pointer transition duration-200 ease-in-out dark:border-gray-600"
                  title="Choose Primary Color"
                />
              </div>
              <div>
                <label htmlFor="secondaryColor" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Secondary Color</label>
                <input
                  type="color"
                  id="secondaryColor"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border-2 border-gray-300 cursor-pointer transition duration-200 ease-in-out dark:border-gray-600"
                  title="Choose Secondary Color"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">These colors will be used to style your public profile view.</p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Profile Visibility</label>
            <Switch
              label={formData.status === 'published' ? 'Published (Visible publicly)' : 'Draft (Not visible publicly)'}
              checked={formData.status === 'published'}
              onChange={(e) => handleChange({ target: { name: 'status', type: 'checkbox', checked: e.target.checked } })}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Toggle to make your profile visible or hidden in the Discover section.</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                Avatar (Image File - Optional, current: {profile.avatarUrl ? 'Uploaded' : 'None'})
              </label>
              <input
                type="file"
                name="avatarFile"
                accept="image/*"
                onChange={(e) => {
                  setAvatarFile(e.target.files[0]);
                  setClearAvatarFlag(false);
                }}
                className="block w-full text-sm text-gray-700 dark:text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 cursor-pointer transition duration-200 ease-in-out dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
              />
              {avatarFile && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">New file selected: {avatarFile.name}</p>}
              {profile.avatarUrl && !avatarFile && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setProfile({ ...profile, avatarUrl: null });
                    setClearAvatarFlag(true);
                  }}
                  className="text-red-500 hover:text-red-700 text-xs mt-1 block hover:underline transition duration-200 ease-in-out"
                >
                  Clear current avatar
                </button>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                Resume (PDF File - Optional, current: {profile.resumeUrl ? 'Uploaded' : 'None'})
              </label>
              <input
                type="file"
                name="resumeFile"
                accept=".pdf"
                onChange={(e) => {
                  setResumeFile(e.target.files[0]);
                  setClearResumeFlag(false);
                }}
                className="block w-full text-sm text-gray-700 dark:text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 cursor-pointer transition duration-200 ease-in-out dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
              />
              {resumeFile && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">New file selected: {resumeFile.name}</p>}
              {profile.resumeUrl && !resumeFile && (
                <button
                  type="button"
                  onClick={() => {
                    setResumeFile(null);
                    setProfile({ ...profile, resumeUrl: null });
                    setClearResumeFlag(true);
                  }}
                  className="text-red-500 hover:text-red-700 text-xs mt-1 block hover:underline transition duration-200 ease-in-out"
                >
                  Clear current resume
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition duration-300 ease-in-out font-semibold shadow-md hover:shadow-lg disabled:opacity-50 hover:scale-105"
            disabled={loading}
          >
            <Save size={20} /> {loading ? 'Saving Profile...' : 'Save Changes'}
          </button>

          <h4 className="text-xl font-semibold text-gray-800 dark:text-white mt-8 mb-4 border-t pt-6 border-gray-200 dark:border-gray-700">Social Links</h4>
          <div className="space-y-3">
            {socialLinks.length === 0 && <p className="text-gray-500 text-sm dark:text-gray-400">No social links added yet.</p>}
            {socialLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm animate-fade-in-up">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 font-medium transition duration-200 ease-in-out hover:scale-[1.02] dark:text-blue-400">
                  <LinkIcon size={18} className="text-blue-500 dark:text-blue-300" /> {link.platform}: <span className="truncate max-w-[150px] sm:max-w-none dark:text-gray-200">{link.url}</span>
                </a>
                <button
                  onClick={() => handleDeleteSocialLink(link.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition duration-300 ease-in-out hover:scale-110 dark:hover:bg-red-900"
                  disabled={loading}
                  aria-label={`Delete ${link.platform} link`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <input
              type="text"
              placeholder="Platform (e.g., LinkedIn)"
              value={newSocialLinkPlatform}
              onChange={(e) => setNewSocialLinkPlatform(e.target.value)}
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={newSocialLinkUrl}
              onChange={(e) => setNewSocialLinkUrl(e.target.value)}
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow transition duration-200 ease-in-out dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <button
              onClick={handleAddSocialLink}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition duration-300 ease-in-out font-semibold shadow-md hover:shadow-lg disabled:opacity-50 min-w-[100px] hover:scale-105"
              disabled={loading}
            >
              <PlusCircle size={20} /> Add
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-800">
            <h4 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">Danger Zone</h4>
            <button
              onClick={handleDeleteProfile}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition duration-300 ease-in-out font-semibold shadow-md hover:shadow-lg disabled:opacity-50 hover:scale-105"
              disabled={loading}
            >
              <Trash2 size={20} /> {loading ? 'Deleting Account...' : 'Delete My Account'}
            </button>
            <p className="text-sm text-red-600 dark:text-red-300 mt-2">This action is irreversible and will permanently delete your profile, projects, and blog posts.</p>
          </div>

        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 animate-fade-in">
          <div className="flex-shrink-0">
            <img
              src={profile.avatarUrl || 'https://placehold.co/200x200/AEC6CF/FFFFFF?text=Avatar'}
              alt="Avatar"
              className="w-48 h-48 rounded-full object-cover shadow-lg border-4 transition duration-300 ease-in-out hover:scale-105"
              style={{borderColor: profile.primaryColor || primaryColor}}
            />
          </div>
          <div className="text-center md:text-left flex-grow">
            <h4 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{profile.name}</h4>
            <p className="text-xl font-semibold mb-3" style={{color: profile.primaryColor || primaryColor}}>{profile.title}</p>
            {profile.location && (
              <p className="text-gray-600 text-base mb-1 flex items-center justify-center md:justify-start gap-2 dark:text-gray-300">
                <MapPin size={18} className="text-gray-500 dark:text-gray-400" /> {profile.location}
              </p>
            )}
            {profile.industry && (
              <p className="text-gray-600 text-base mb-1 flex items-center justify-center md:justify-start gap-2 dark:text-gray-300">
                <Briefcase size={18} className="text-gray-500 dark:text-gray-400" /> {profile.industry}
              </p>
            )}
            {profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined && (
              <p className="text-gray-600 text-base mb-1 flex items-center justify-center md:justify-start gap-2 dark:text-gray-300">
                <Book size={18} className="text-gray-500 dark:text-gray-400" /> {profile.yearsOfExperience} years of experience
              </p>
            )}
            {profile.websiteUrl && (
              <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-base mb-3 flex items-center justify-center md:justify-start gap-2 transition duration-200 ease-in-out hover:scale-[1.02]" style={{color: profile.primaryColor || primaryColor}}>
                <Globe size={18} style={{color: profile.primaryColor || primaryColor}} /> {profile.websiteUrl.replace(/^(https?:\/\/)?(www\.)?/,'').split('/')[0]}
              </a>
            )}
            <p className="text-gray-700 leading-relaxed mb-4 text-lg dark:text-gray-200">{profile.bio}</p>

            {profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
              <div className="mt-4 mb-4 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="text-gray-700 font-semibold flex items-center gap-1 dark:text-gray-300">
                  <Tag size={18} className="text-gray-500 dark:text-gray-400" /> Interests:
                </span>
                {profile.interests.map((interest, index) => (
                  <span key={index} className="text-sm font-medium px-3 py-1 rounded-full shadow-sm transition duration-200 ease-in-out hover:scale-105" style={{backgroundColor: profile.primaryColor || primaryColor, color: 'white'}}>
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {profile.resumeUrl && profile.resumeUrl !== '#' && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300 text-base font-medium shadow-sm hover:shadow-md mt-4 hover:scale-105 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <ExternalLink size={18} className="mr-2" /> View Resume
              </a>
            )}
            {socialLinks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 justify-center md:justify-start">
                {socialLinks.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium transition duration-300 hover:scale-[1.02]" style={{color: profile.primaryColor || primaryColor, hoverColor: profile.secondaryColor || secondaryColor}}>
                    <LinkIcon size={18} style={{color: profile.primaryColor || primaryColor}} /> {link.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={isPublishConfirmOpen}
        title="Confirm Publishing Profile"
        message="Publishing your profile will make it visible to other users in the 'Discover Profiles' section. You can unpublish it at any time by changing the status back to 'Draft'."
        onConfirm={handleStatusConfirm}
        onCancel={handleStatusCancel}
      />
    </div>
  );
};

export default ProfileSection;

// src/components/PublicProfiles.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { X, Search, Share2, ExternalLink, Github, Link as LinkIcon, MapPin, Tag, Globe, Briefcase, Book } from 'lucide-react';
import apiService from '../apiService';
import AuthContext from '../AuthContext';
import { MessageBox } from './CommonComponents';

// Public Profiles Section (for viewing other users' profiles)
export const PublicProfilesSection = ({ setCurrentPage, setCurrentBlogPostSlug, initialViewProfileId }) => {
  const { primaryColor: globalPrimaryColor, secondaryColor: globalSecondaryColor, token: authToken } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterInterests, setFilterInterests] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterYearsOfExperience, setFilterYearsOfExperience] = useState('');


  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const interestsArray = filterInterests.split(',').map(item => item.trim()).filter(item => item !== '');
      const filters = {
        search: searchQuery,
        location: filterLocation,
        interests: interestsArray,
        industry: filterIndustry,
        yearsOfExperience: filterYearsOfExperience,
        status: 'published',
      };
      const response = await apiService.getProfiles(filters);
      setProfiles(response.profiles || []);
    } catch (error) {
      setMessage(`Error fetching profiles: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterLocation, filterInterests, filterIndustry, filterYearsOfExperience]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'searchQuery') setSearchQuery(value);
    else if (name === 'filterLocation') setFilterLocation(value);
    else if (name === 'filterInterests') setFilterInterests(value);
    else if (name === 'filterIndustry') setFilterIndustry(value);
    else if (name === 'filterYearsOfExperience') setFilterYearsOfExperience(value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProfiles();
  };

  const handleViewProfile = useCallback(async (userId) => {
    setLoading(true);
    setMessage(null);
    try {
      const profile = await apiService.getProfile(userId, authToken);
      if (!profile) {
        setMessage('Profile not found.');
        setMessageType('error');
        setSelectedProfile(null);
        return;
      }
      if (profile.status !== 'published' && profile.userId !== authToken) {
         setMessage('This profile is currently not published.');
         setMessageType('error');
         setSelectedProfile(null);
         return;
      }
      setSelectedProfile(profile);
      setShareMessage('');
    } catch (error) {
      setMessage(`Error fetching profile: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [authToken, setMessage, setMessageType, setSelectedProfile, setShareMessage]);

  useEffect(() => {
    if (initialViewProfileId) {
      handleViewProfile(initialViewProfileId);
    } else {
      fetchProfiles();
    }
  }, [initialViewProfileId, fetchProfiles, handleViewProfile]);

  const handleViewBlogPost = (slug) => {
    setCurrentBlogPostSlug(slug);
    setCurrentPage('blog-detail');
  };

  const copyToClipboard = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setShareMessage('Link copied to clipboard!');
    } catch (err) {
      setShareMessage('Failed to copy link. Please copy manually.');
      console.error('Failed to copy:', err);
    }
    document.body.removeChild(textarea);
    setTimeout(() => setShareMessage(''), 3000);
  };

  const handleShareProfile = (userId) => {
    const shareUrl = `${window.location.origin}/?viewProfileId=${userId}`;
    copyToClipboard(shareUrl);
  };

  if (loading && profiles.length === 0 && !selectedProfile) return <div className="text-center py-8 dark:text-gray-400">Loading profiles...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 animate-fade-in">
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Discover Profiles</h3>
      <MessageBox message={message} type={messageType} onClose={() => setMessage(null)} />
      {shareMessage && <MessageBox message={shareMessage} type="success" onClose={() => setShareMessage('')} />}

      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 animate-slide-up">
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><Search size={20} /> Find Profiles</h4>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="searchQuery" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Search by Name/Title</label>
            <input
              type="text"
              id="searchQuery"
              name="searchQuery"
              value={searchQuery}
              onChange={handleFilterChange}
              placeholder="e.g., John Doe or Software Engineer"
              className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500"
            />
          </div>
          <div>
            <label htmlFor="filterLocation" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Filter by Location</label>
            <input
              type="text"
              id="filterLocation"
              name="filterLocation"
              value={filterLocation}
              onChange={handleFilterChange}
              placeholder="e.g., New York, London"
              className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500"
            />
          </div>
          <div>
            <label htmlFor="filterInterests" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Filter by Interests (comma-separated)</label>
            <input
              type="text"
              id="filterInterests"
              name="filterInterests"
              value={filterInterests}
              onChange={handleFilterChange}
              placeholder="e.g., AI, React"
              className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500"
            />
          </div>
          <div>
            <label htmlFor="filterIndustry" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Filter by Industry</label>
            <input
              type="text"
              id="filterIndustry"
              name="filterIndustry"
              value={filterIndustry}
              onChange={handleFilterChange}
              placeholder="e.g., Tech, Healthcare"
              className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500"
            />
          </div>
          <div>
            <label htmlFor="filterYearsOfExperience" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Min. Years of Experience</label>
            <input
              type="number"
              id="filterYearsOfExperience"
              name="filterYearsOfExperience"
              value={filterYearsOfExperience}
              onChange={handleFilterChange}
              placeholder="e.g., 3"
              min="0"
              className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500"
            />
          </div>
          <div className="md:col-span-3 text-center pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out flex items-center justify-center mx-auto disabled:opacity-50 hover:scale-105"
              disabled={loading}
            >
              <Search size={20} className="mr-2" /> Search Profiles
            </button>
          </div>
        </form>
      </div>


      {selectedProfile ? (
        <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setSelectedProfile(null)} className="text-blue-600 hover:underline flex items-center gap-1 transition duration-200 ease-in-out hover:scale-[1.02] dark:text-blue-400">
              <X size={16} /> Back to all profiles
            </button>
            <button
              onClick={() => handleShareProfile(selectedProfile.userId)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition duration-300 ease-in-out hover:scale-105"
            >
              <Share2 size={16} /> Share Profile
            </button>
          </div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedProfile.name || 'N/A'}</h4>
          <p className="text-lg mb-2" style={{color: selectedProfile.primaryColor || globalPrimaryColor}}>{selectedProfile.title || 'No Title'}</p>
          <p className="text-gray-700 mb-4 dark:text-gray-200">{selectedProfile.bio || 'No bio available.'}</p>
          <img
            src={selectedProfile.avatarUrl || 'https://placehold.co/100x100/AEC6CF/FFFFFF?text=Avatar'}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover mx-auto mb-3 shadow-md border-4 transition duration-300 ease-in-out hover:scale-105"
            style={{borderColor: selectedProfile.primaryColor || globalPrimaryColor}}
          />
          {selectedProfile.location && (
            <p className="text-gray-600 text-base mb-1 flex items-center justify-center md:justify-start gap-2 dark:text-gray-300">
              <MapPin size={18} className="text-gray-500 dark:text-gray-400" /> {selectedProfile.location}
            </p>
          )}
          {selectedProfile.industry && (
            <p className="text-gray-600 text-base mb-1 flex items-center justify-center md:justify-start gap-2 dark:text-gray-300">
              <Briefcase size={18} className="text-gray-500 dark:text-gray-400" /> {selectedProfile.industry}
            </p>
          )}
          {selectedProfile.yearsOfExperience !== null && selectedProfile.yearsOfExperience !== undefined && (
            <p className="text-gray-600 text-base mb-1 flex items-center justify-center md:justify-start gap-2 dark:text-gray-300">
              <Book size={18} className="text-gray-500 dark:text-gray-400" /> {selectedProfile.yearsOfExperience} years of experience
            </p>
          )}
          {selectedProfile.websiteUrl && (
            <a href={selectedProfile.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-base mb-3 flex items-center justify-center md:justify-start gap-2 transition duration-200 ease-in-out hover:scale-[1.02]" style={{color: selectedProfile.primaryColor || globalPrimaryColor}}>
                <Globe size={18} style={{color: selectedProfile.primaryColor || globalPrimaryColor}} /> {selectedProfile.websiteUrl.replace(/^(https?:\/\/)?(www\.)?/,'').split('/')[0]}
            </a>
          )}
          {selectedProfile.interests && Array.isArray(selectedProfile.interests) && selectedProfile.interests.length > 0 && (
            <div className="mt-2 mb-4 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="text-gray-700 font-semibold flex items-center gap-1 dark:text-gray-300">
                <Tag size={18} className="text-gray-500 dark:text-gray-400" /> Interests:
              </span>
              {selectedProfile.interests.map((interest, index) => (
                <span key={index} className="text-sm font-medium px-3 py-1 rounded-full shadow-sm transition duration-200 ease-in-out hover:scale-105" style={{backgroundColor: selectedProfile.primaryColor || globalPrimaryColor, color: 'white'}}>
                  {interest}
                </span>
              ))}
            </div>
          )}

          {selectedProfile.resumeUrl && selectedProfile.resumeUrl !== '#' && (
            <a
              href={selectedProfile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300 text-sm mb-4 hover:scale-105 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
            >
              <ExternalLink size={16} className="mr-2" /> View Resume
            </a>
          )}
          {selectedProfile.SocialLinks && selectedProfile.SocialLinks.length > 0 && (
            <div className="mt-4">
              <h5 className="font-semibold mb-2 text-gray-800 dark:text-white">Social Links:</h5>
              <div className="flex flex-wrap gap-3">
                {selectedProfile.SocialLinks.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium transition duration-300 hover:scale-[1.02]" style={{color: selectedProfile.primaryColor || globalPrimaryColor, hoverColor: selectedProfile.secondaryColor || globalSecondaryColor}}>
                    <LinkIcon size={16} style={{color: selectedProfile.primaryColor || globalPrimaryColor}} /> {link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
          {selectedProfile.Projects && selectedProfile.Projects.length > 0 && (
            <div className="mt-6">
              <h5 className="font-semibold mb-3 text-gray-800 dark:text-white">Projects:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProfile.Projects.map(project => (
                  <div key={project.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm transition duration-300 hover:shadow-lg hover:scale-[1.02] dark:border dark:border-gray-700">
                    <img src={project.imageUrl || 'https://placehold.co/300x150/E2E8F0/A0AEC0?text=Project'} alt={project.title} className="w-full h-32 object-cover rounded-md mb-3" />
                    <h6 className="font-semibold text-gray-800 dark:text-white">{project.title}</h6>
                    <p className="text-gray-600 text-sm dark:text-gray-300">{project.description}</p>
                    <div className="flex gap-2 mt-2">
                      {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1 transition duration-200 ease-in-out hover:scale-[1.02] dark:text-blue-400"><ExternalLink size={14} /> Live</a>}
                      {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline text-xs flex items-center gap-1 transition duration-200 ease-in-out hover:scale-[1.02] dark:text-gray-300"><Github size={14} /> Repo</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedProfile.BlogPosts && selectedProfile.BlogPosts.length > 0 && (
            <div className="mt-6">
              <h5 className="font-semibold mb-3 text-gray-800 dark:text-white">Blog Posts:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProfile.BlogPosts.map(post => (
                  <div key={post.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm transition duration-300 hover:shadow-lg hover:scale-[1.02] dark:border dark:border-gray-700">
                    <img src={post.imageUrl || 'https://placehold.co/300x150/E2E8F0/A0AEC0?text=Blog Post'} alt={post.title} className="w-full h-32 object-cover rounded-md mb-3" />
                    <h6 className="font-semibold text-gray-800 dark:text-white">{post.title}</h6>
                    <p className="text-gray-600 text-sm dark:text-gray-300">{post.content.substring(0, 80)}...</p>
                    <button onClick={() => handleViewBlogPost(post.slug)} className="text-blue-500 hover:underline text-xs mt-2 inline-block transition duration-200 ease-in-out hover:scale-[1.02] dark:text-blue-400">Read More</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        profiles.length === 0 && !loading ? (
          <p className="text-gray-600 text-center py-4 dark:text-gray-400">No public profiles available matching your criteria.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
              <div key={profile.id} className="bg-gray-100 dark:bg-gray-700 p-5 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between items-center text-center hover:scale-[1.02] animate-fade-in-up">
                <img
                  src={profile.avatarUrl || 'https://placehold.co/100x100/AEC6CF/FFFFFF?text=Avatar'}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-3 shadow-md border-4 transition duration-300 ease-in-out hover:scale-105"
                  style={{borderColor: profile.primaryColor || globalPrimaryColor}}
                />
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{profile.name || 'Anonymous User'}</h4>
                <p className="text-sm mb-2" style={{color: profile.primaryColor || globalPrimaryColor}}>{profile.title || 'Developer'}</p>
                {profile.location && (
                  <p className="text-gray-600 text-xs mb-1 flex items-center justify-center gap-1 dark:text-gray-300">
                    <MapPin size={14} className="text-gray-500 dark:text-gray-400" /> {profile.location}
                  </p>
                )}
                {profile.industry && (
                  <p className="text-gray-600 text-xs mb-1 flex items-center justify-center gap-1 dark:text-gray-300">
                    <Briefcase size={14} className="text-gray-500 dark:text-gray-400" /> {profile.industry}
                  </p>
                )}
                {profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined && (
                  <p className="text-gray-600 text-xs mb-1 flex items-center justify-center gap-1 dark:text-gray-300">
                    <Book size={14} className="text-gray-500 dark:text-gray-400" /> {profile.yearsOfExperience} yrs exp.
                  </p>
                )}
                {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-xs mb-2 flex items-center justify-center gap-1 transition duration-200 ease-in-out hover:scale-[1.02]" style={{color: profile.primaryColor || globalPrimaryColor}}>
                    <Globe size={14} style={{color: profile.primaryColor || globalPrimaryColor}} /> {profile.websiteUrl.replace(/^(https?:\/\/)?(www\.)?/,'').split('/')[0]}
                  </a>
                )}
                {profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    <span className="text-gray-700 font-semibold flex items-center gap-1 dark:text-gray-300">
                      <Tag size={14} className="text-gray-500 dark:text-gray-400" />
                    </span>
                    {profile.interests.slice(0, 3).map((interest, index) => (
                      <span key={index} className="text-xs font-medium px-2 py-0.5 rounded-full shadow-sm transition duration-200 ease-in-out hover:scale-105" style={{backgroundColor: profile.primaryColor || globalPrimaryColor, color: 'white'}}>
                        {interest}
                      </span>
                    ))}
                    {profile.interests.length > 3 && <span className="text-gray-500 text-xs dark:text-gray-400">+ {profile.interests.length - 3} more</span>}
                  </div>
                )}
                <button
                  onClick={() => handleViewProfile(profile.userId)}
                  className="mt-3 text-white px-4 py-2 rounded-lg text-sm transition duration-300 ease-in-out hover:scale-105"
                  style={{backgroundColor: profile.primaryColor || globalPrimaryColor, borderColor: profile.primaryColor || globalPrimaryColor, hoverBackgroundColor: profile.secondaryColor || globalSecondaryColor, hoverBorderColor: profile.secondaryColor || globalSecondaryColor}}
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export const PublicProfilesPage = ({ setCurrentPage, setCurrentBlogPostSlug, initialViewProfileId }) => {
  useEffect(() => {
    if (initialViewProfileId) {
    }
  }, [initialViewProfileId]);

  return <PublicProfilesSection setCurrentPage={setCurrentPage} setCurrentBlogPostSlug={setCurrentBlogPostSlug} initialViewProfileId={initialViewProfileId} />;
};

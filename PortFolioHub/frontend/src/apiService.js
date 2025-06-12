// src/apiService.js
const API_BASE_URL = 'http://localhost:5000/api'; // Make sure this matches your backend PORT

const apiService = {
  // Helper to make authenticated requests
  async request(method, url, data = null, token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: method,
      headers: headers,
    };

    if (data instanceof FormData) {
      config.body = data;
    } else if (data) {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || responseData.errors?.join(', ') || 'Something went wrong with the API request.';
      throw new Error(errorMessage);
    }
    return responseData;
  },

  // Auth
  register: (username, email, password) => apiService.request('POST', '/auth/register', { username, email, password }),
  login: (email, password) => apiService.request('POST', '/auth/login', { email, password }),
  getMe: (token) => apiService.request('GET', '/auth/me', null, token),

  // Profiles
  getProfiles: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.interests && Array.isArray(filters.interests) && filters.interests.length > 0) {
      queryParams.append('interests', filters.interests.join(','));
    }
    if (filters.industry) queryParams.append('industry', filters.industry);
    if (filters.yearsOfExperience) queryParams.append('yearsOfExperience', filters.yearsOfExperience);

    const url = `/profiles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.request('GET', url);
  },
  getProfile: (userId, token = null) => apiService.request('GET', `/profiles/${userId}`, null, token),
  updateProfile: (userId, profileData, token) => apiService.request('PUT', `/profiles/${userId}`, profileData, token),
  deleteProfile: (userId, token) => apiService.request('DELETE', `/profiles/${userId}`, null, token),
  addSocialLink: (profileId, socialLinkData, token) => apiService.request('POST', `/profiles/${profileId}/social-links`, socialLinkData, token),
  deleteSocialLink: (profileId, socialLinkId, token) => apiService.request('DELETE', `/profiles/${profileId}/social-links/${socialLinkId}`, null, token),

  // Projects
  getProjects: (userId, token) => apiService.request('GET', `/projects/users/${userId}/projects`, null, token),
  createProject: (projectData, token) => apiService.request('POST', '/projects', projectData, token),
  updateProject: (projectId, projectData, token) => apiService.request('PUT', `/projects/${projectId}`, projectData, token),
  deleteProject: (projectId, token) => apiService.request('DELETE', `/projects/${projectId}`, null, token),

  // Blog Posts
  // Ensure token is passed when fetching blog posts
  getBlogPosts: (userId = null, token = null) => apiService.request('GET', userId ? `/blogposts?userId=${userId}` : '/blogposts', null, token),
  getBlogPostBySlug: (slug) => apiService.request('GET', `/blogposts/slug/${slug}`),
  createBlogPost: (blogPostData, token) => apiService.request('POST', '/blogposts', blogPostData, token),
  updateBlogPost: (blogPostId, blogPostData, token) => apiService.request('PUT', `/blogposts/${blogPostId}`, blogPostData, token),
  deleteBlogPost: (blogPostId, token) => apiService.request('DELETE', `/blogposts/${blogPostId}`, null, token),

  // Contact
  sendContactMessage: (name, email, message) => apiService.request('POST', '/contact', { name, email, message }),
};

export default apiService;

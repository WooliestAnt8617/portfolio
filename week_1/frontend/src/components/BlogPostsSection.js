// src/components/BlogPostsSection.js
import React, { useState, useEffect, useContext } from 'react';
import { X, PlusCircle, Save, Edit, Trash2 } from 'lucide-react';
import apiService from '../apiService';
import AuthContext from '../AuthContext';
import { MessageBox, Switch, ConfirmDialog } from './CommonComponents';

const BlogPostsSection = ({ user, token }) => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', slug: '', status: 'draft', imageUrl: ''
  });
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [loading, setLoading] = useState(false);

  // States for publish confirmation dialog
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      // Ensure user.id and token are available before fetching
      if (user && user.id && token) {
        setLoading(true);
        try {
          // Pass the 'token' to apiService.getBlogPosts
          const fetchedPosts = await apiService.getBlogPosts(user.id, token);
          setBlogPosts(fetchedPosts);
        } catch (error) {
          setMessage(`Error fetching blog posts: ${error.message}`);
          setMessageType('error');
        } finally {
          setLoading(false);
        }
      }
    };
    // Add 'token' to the dependency array
    fetchBlogPosts();
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

  const handleEditClick = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      slug: post.slug,
      status: post.status,
      imageUrl: post.imageUrl || ''
    });
    setIsAdding(true);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (editingPost) {
        await apiService.updateBlogPost(editingPost.id, formData, token);
        setMessage('Blog post updated successfully!');
      } else {
        await apiService.createBlogPost(formData, token);
        setMessage('Blog post created successfully!');
      }
      setMessageType('success');
      // Pass the 'token' to apiService.getBlogPosts here as well after save/update
      const updatedPosts = await apiService.getBlogPosts(user.id, token);
      setBlogPosts(updatedPosts);
      setIsAdding(false);
      setEditingPost(null);
      setFormData({ title: '', content: '', slug: '', status: 'draft', imageUrl: '' });
    } catch (error) {
      setMessage(`Error saving blog post: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const confirmed = await new Promise((resolve) => {
      const confirmDialog = document.createElement('div');
      confirmDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
      confirmDialog.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
          <h3 class="text-lg font-semibold mb-4">Confirm Deletion</h3>
          <p class="mb-4">Are you sure you want to delete this blog post?</p>
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
      await apiService.deleteBlogPost(postId, token);
      // Pass the 'token' to apiService.getBlogPosts after deletion
      const updatedPosts = await apiService.getBlogPosts(user.id, token);
      setBlogPosts(updatedPosts);
      setMessage('Blog post deleted successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error deleting blog post: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 animate-fade-in">
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex justify-between items-center">
        Your Blog Posts
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingPost(null);
            setFormData({ title: '', content: '', slug: '', status: 'draft', imageUrl: '' });
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition duration-300 ease-in-out hover:scale-105"
        >
          {isAdding ? <X size={18} /> : <PlusCircle size={18} />} {isAdding ? 'Cancel' : 'Add New Post'}
        </button>
      </h3>
      <MessageBox message={message} type={messageType} onClose={() => setMessage(null)} />

      {isAdding && (
        <form onSubmit={handleSavePost} className="space-y-4 mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 animate-slide-up">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">{editingPost ? 'Edit Blog Post' : 'Add New Blog Post'}</h4>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" required />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Slug</label>
            <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" required />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Content</label>
            <textarea name="content" value={formData.content} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" rows="8" required></textarea>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Image URL (Optional)</label>
            <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" />
          </div>
          <div className="pt-2">
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Post Status</label>
            <Switch
              label={formData.status === 'published' ? 'Published' : 'Draft'}
              checked={formData.status === 'published'}
              onChange={(e) => handleChange({ target: { name: 'status', type: 'checkbox', checked: e.target.checked } })}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Toggle to make this blog post visible or hidden in your public profile.</p>
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition duration-300 ease-in-out disabled:opacity-50 hover:scale-105"
            disabled={loading}
          >
            <Save size={20} /> {loading ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
          </button>
        </form>
      )}

      {loading && !blogPosts.length ? (
        <div className="text-center py-8 dark:text-gray-400">Loading blog posts...</div>
      ) : blogPosts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No blog posts found. Add your first post above!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map(post => (
            <div key={post.id} className="bg-gray-100 dark:bg-gray-700 p-5 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between hover:scale-[1.02] animate-fade-in-up">
              <div>
                <img src={post.imageUrl || 'https://placehold.co/400x200/D1D5DB/4B5563?text=Blog Post'} alt={post.title} className="w-full h-40 object-cover rounded-md mb-4" />
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{post.title}</h4>
                <p className="text-gray-700 text-sm mb-3 dark:text-gray-200">{post.content.substring(0, 100)}...</p>
                {/* Display current status for the blog post item */}
                <p className={`px-2 py-0.5 rounded-full text-xs font-medium ${post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'}`}>
                  Status: {post.status === 'published' ? 'Published' : 'Draft'}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditClick(post)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition duration-300 ease-in-out hover:scale-105"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition duration-300 ease-in-out hover:scale-105"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={isPublishConfirmOpen}
        title="Confirm Publishing Blog Post"
        message="Publishing this blog post will make it visible in your public profile and to other users in the 'Discover Profiles' section. You can unpublish it at any time by changing the status back to 'Draft'."
        onConfirm={handleStatusConfirm}
        onCancel={handleStatusCancel}
      />
    </div>
  );
};

export default BlogPostsSection;

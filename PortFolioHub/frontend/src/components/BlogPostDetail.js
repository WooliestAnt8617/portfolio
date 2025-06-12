// src/components/BlogPostDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { X } from 'lucide-react';
import apiService from '../apiService';
import AuthContext from '../AuthContext';
import { MessageBox } from './CommonComponents';

const BlogPostDetail = ({ slug, onBack }) => {
  const [post, setPost] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [loading, setLoading] = useState(false);
  const { primaryColor: globalPrimaryColor, token: authToken } = useContext(AuthContext);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const fetchedPost = await apiService.getBlogPostBySlug(slug, authToken);
        if (!fetchedPost) {
          setMessage('Blog post not found.');
          setMessageType('error');
          setPost(null);
          return;
        }
        setPost(fetchedPost);
      } catch (error) {
        setMessage(`Error fetching blog post: ${error.message}`);
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchPost();
    }
  }, [slug, authToken]);

  if (loading) return <div className="text-center py-8 dark:text-gray-400">Loading blog post...</div>;
  if (!post) return <div className="text-center py-8 text-red-600">Blog post not found.</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 animate-fade-in">
      <button onClick={onBack} className="hover:underline mb-4 flex items-center gap-1 transition duration-200 ease-in-out hover:scale-[1.02]" style={{color: post.primaryColor || globalPrimaryColor}}>
        <X size={16} /> Back to all blog posts
      </button>
      <MessageBox message={message} type={messageType} onClose={() => setMessage(null)} />
      <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">{post.title}</h3>
      {post.imageUrl && (
        <img src={post.imageUrl} alt={post.title} className="w-full h-64 object-cover rounded-md mb-6" />
      )}
      <div className="prose max-w-none">
        <p className="text-gray-700 leading-relaxed dark:text-gray-200">{post.content}</p>
      </div>
      <p className="text-gray-500 text-sm mt-6 dark:text-gray-400">Published: {new Date(post.createdAt).toLocaleDateString()}</p>
    </div>
  );
};

export default BlogPostDetail;

import { useState, useCallback } from 'react';
import axios from 'axios';
import URL from '../useUrl.js';

// Custom hook for managing post data
export const usePost = (userId, postId) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPostDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching post detail for user ${userId}, post ${postId}`);
      
      const response = await axios.get(
        `${URL}/post/posts/user/${userId}/posts/${postId}/`, 
        { withCredentials: true }
      );
      
      console.log('📥 Post detail response:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      setPost(response.data);
      
    } catch (err) {
      console.error('❌ Error fetching post detail:', err);
      
      // Handle different error types
      if (err.response?.status === 404) {
        setError('Post not found - The post may not exist or belong to this user');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this post');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load post. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, postId]);

  return { post, loading, error, fetchPostDetail, setPost };
};
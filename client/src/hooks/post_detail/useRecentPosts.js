// hooks/post_detail/useRecentPosts.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import URL from '../useUrl';

export const useRecentPosts = (userId, excludePostId = null) => {
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const fetchRecentPosts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Construire l'URL avec le post_id à exclure si fourni
      let apiUrl = `${URL}/post/posts/user/${userId}/recent/`;
      if (excludePostId) {
        apiUrl += `?exclude_post=${excludePostId}`;
      }
      
      console.log(`🔄 Fetching recent posts from: ${apiUrl}`);
      
      const response = await axios.get(apiUrl, { 
        withCredentials: true,
        timeout: 10000
      });
      
      console.log('✅ Recent posts response:', response.data);
      
      if (response.data) {
        setRecentPosts(response.data.posts || []);
        setUserInfo(response.data.user_info || {});
      } else {
        setError('No data received from server');
      }
      
    } catch (err) {
      console.error('❌ Error fetching recent posts:', err);
      if (err.response?.status === 404) {
        setError('Endpoint not found');
      } else if (err.response) {
        setError(`Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('Network error: Could not connect to server');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentPosts();
  }, [userId, excludePostId]);

  return { 
    recentPosts, 
    userInfo, 
    loading, 
    error, 
    refetch: fetchRecentPosts 
  };
};
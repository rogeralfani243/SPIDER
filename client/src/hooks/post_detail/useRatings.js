import axios from 'axios';
import URL from '../useUrl';

// Custom hook for rating functionality
export const useRating = (postId, post, setPost) => {
  
  // Get CSRF token for Django
  const getCSRFToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  // Handle rating update
  const handleRatingUpdate = async (ratingData) => {
    if (!post) return;

    try {
      console.log('📤 Rating data received:', ratingData);

      // Ignore delete rating click
      if (ratingData.userRating === 0) {
        console.log('⚠️ Ignoring delete rating click - not supported');
        return;
      }

      // Submit rating if valid
      if (ratingData.userRating >= 1 && ratingData.userRating <= 5) {
        console.log('⭐ Setting rating:', ratingData.userRating);

        const response = await axios.post(
          `${URL}/post/posts/${postId}/rate/`,
          { stars: ratingData.userRating },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCSRFToken(),
            },
            withCredentials: true
          }
        );

        console.log('✅ Rating successful:', response.data);

        // Update post with new rating data
        setPost({
          ...post,
          user_rating: response.data.user_rating,
          average_rating: response.data.average_rating,
          total_ratings: response.data.total_ratings
        });
      }

    } catch (err) {
      console.error('❌ Rating error:', err);
      
      // Handle rating errors
      if (err.response?.data?.error) {
        alert(`Error: ${err.response.data.error}`);
      } else if (err.response?.status === 404) {
        alert('Rating endpoint not found. Please contact administrator.');
      } else {
        alert('Connection error. Please check your internet connection.');
      }
    }
  };

  return { handleRatingUpdate };
};
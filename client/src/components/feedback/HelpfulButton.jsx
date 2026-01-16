import React, { useState } from 'react';
import axios from 'axios';
import { FeedbackIcons } from './icons/FeedbackIcons';
import { getCookie, isAuthenticated } from '../../utils/helpers';
import URL from "../../hooks/useUrl";

/**
 * Helpful button component with toggle functionality
 */
const HelpfulButton = ({ 
  feedbackId, 
  isHelpful, 
  helpfulCount, 
  isOwner, 
  onToggle,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;
    
    // Check authentication
    if (!isAuthenticated()) {
      alert('Please log in to mark reviews as helpful');
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    // Check if user is trying to mark their own feedback
    if (isOwner) {
      alert("You can't mark your own review as helpful");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const csrfToken = getCookie('csrftoken');
      
      // Axios configuration
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      };
      
      // Add authorization token
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Add CSRF token
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
      
      // Send request
      const response = await axios.post(
        `${URL}/feedback/${feedbackId}/helpful/`,
        {},
        config
      );
      
      // Notify parent component
      if (onToggle) {
        onToggle(response.data.feedback);
      }
      
    } catch (error) {
      console.error('Error toggling helpful:', error);
      
      // Handle different types of errors
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem('access_token');
          alert('Your session has expired. Please log in again.');
          window.location.href = '/login';
          return;
        }
        
        const errorMessage = error.response.data?.error || 
                           error.response.data?.detail || 
                           'Failed to mark as helpful';
        alert(errorMessage);
        
      } else if (error.request) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className={`helpful-btn ${isHelpful ? 'active' : ''}`}
      onClick={handleClick}
      disabled={isLoading || isOwner || disabled}
      title={!isAuthenticated() ? "Log in to mark as helpful" : 
             isOwner ? "You can't mark your own review as helpful" : ""}
    >
      <span className="icon">
        {isHelpful ? <FeedbackIcons.Check /> : <FeedbackIcons.Helpful />}
      </span>
      <span>{isHelpful ? 'Helpful' : 'Helpful'}</span>
      {helpfulCount > 0 && (
        <span className="count">{helpfulCount}</span>
      )}
      
    </button>
  );
};

export default HelpfulButton;
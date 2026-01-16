// utils/errorHandler.js
import axios from 'axios';

/**
 * Handle axios errors and show appropriate notifications
 * @param {Error} error - Axios error object
 * @param {Function} showError - Function to show error notification
 * @param {Function} showWarning - Function to show warning notification
 */
export const handleAxiosError = (error, showError, showWarning) => {
  console.error('🔍 [AXIOS] Error:', error);

  if (error.response) {
    // The request was made and the server responded with a status code
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        showError(data.error || data.detail || 'Bad request. Please check your input.');
        break;
      case 401:
        showError('Your session has expired. Please log in again.', 6000);
        // Auto logout
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
        break;
      case 403:
        showError('You do not have permission to perform this action.');
        break;
      case 404:
        showWarning('The requested resource was not found.');
        break;
      case 422:
        showError('Validation error. Please check your input.');
        break;
      case 429:
        showWarning('Too many requests. Please try again later.');
        break;
      case 500:
        showError('Server error. Please try again later.');
        break;
      default:
        showError(data.error || data.detail || `Error ${status}: Something went wrong.`);
    }
    
  } else if (error.request) {
    // The request was made but no response was received
    showError('Network error. Please check your internet connection and try again.');
    
  } else {
    // Something happened in setting up the request
    showError('An error occurred. Please try again.');
  }
};

/**
 * Create a configured axios instance with error handling
 * @param {Function} showError - Function to show error notifications
 * @param {Function} showSuccess - Function to show success notifications
 * @returns {axiosInstance} Configured axios instance
 */
export const createAxiosInstance = (showError, showSuccess) => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '',
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      if (showError) showError('Request configuration error');
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      // Show success message for POST, PUT, PATCH, DELETE if configured
      if (showSuccess && ['post', 'put', 'patch', 'delete'].includes(response.config.method)) {
        const successMessage = response.data?.message || 'Operation completed successfully';
        showSuccess(successMessage);
      }
      return response;
    },
    (error) => {
      if (showError) {
        handleAxiosError(error, showError);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};
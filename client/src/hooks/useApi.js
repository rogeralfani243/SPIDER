// hooks/useApi.js
import { useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
         withCredentials: true, 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  }
);

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const get = async (url) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const post = async (url, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { get, post, loading, error, setError };
};
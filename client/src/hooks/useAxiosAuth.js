import axios from 'axios';
import API_URL from './useApiUrl';

// Hook to create authenticated axios instance
export const useAxiosAuth = () => {
  const token = localStorage.getItem("token");
  
  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: token ? `Token ${token}` : '',
      'Content-Type': 'application/json',
    }
  });

  return { axiosAuth };
};
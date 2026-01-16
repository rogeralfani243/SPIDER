import { useState, useCallback } from 'react';
import API_URL from '../hooks/useApiUrl';
import api from './messaging/axiosConfig';
export const usePasswordService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationToken, setVerificationToken] = useState(null);

  const requestPasswordChangeCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`${API_URL}/api/account/request-password-change-code/`);
      console.log('Password change code requested');
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { error: 'Failed to send verification code' };
      setError(errorData);
      console.error('Request Password Change Code Error:', err.response?.data || err.message);
      throw errorData;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPasswordChangeCode = useCallback(async (code) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`${API_URL}/api/account/verify-password-change-code/`, {
        code
      });
      
      // Stocker le token si renvoyé
      if (response.data.token) {
        setVerificationToken(response.data.token);
        localStorage.setItem('password_change_token', response.data.token);
      }
      
      console.log('Password change code verified');
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { error: 'Invalid verification code' };
      setError(errorData);
      console.error('Verify Password Change Code Error:', err.response?.data || err.message);
      throw errorData;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (oldPassword, newPassword, confirmPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer le token si disponible
      const token = verificationToken || localStorage.getItem('password_change_token');
      
      const data = {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      };
      
      // Ajouter le token si disponible
      if (token) {
        data.verification_token = token;
      }
      
      console.log('Changing password...');
      
      const response = await api.post(`${API_URL}/api/account/change-password/`, data);
      
      // Nettoyer après succès
      localStorage.removeItem('password_change_token');
      setVerificationToken(null);
      
      console.log('Password changed successfully');
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { error: 'Failed to change password' };
      setError(errorData);
      console.error('Change Password Error:', err.response?.data || err.message);
      throw errorData;
    } finally {
      setLoading(false);
    }
  }, [verificationToken]);

  const cancelPasswordChange = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`${API_URL}/api/account/cancel-password-change/`);
      
      // Nettoyer
      localStorage.removeItem('password_change_token');
      setVerificationToken(null);
      
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { error: 'Failed to cancel password change' };
      setError(errorData);
      throw errorData;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    requestPasswordChangeCode,
    verifyPasswordChangeCode,
    changePassword,
    cancelPasswordChange,
    verificationToken,
    loading,
    error,
    clearError: () => setError(null)
  };
};
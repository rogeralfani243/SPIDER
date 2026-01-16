// components/IconDropdown/hooks/useAccountService.js - Version corrigée
import { useState, useCallback } from 'react';
import API_URL from '../../hooks/useApiUrl';
import api from '../services/api';

export const useAccountService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const requestDeletionCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📧 Requesting deletion code...');
      const response = await api.post(`${API_URL}/api/account/request-deletion-code/`);
      console.log('✅ Code requested:', response.data);
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { error: 'Failed to send code' };
      setError(errorData);
      console.error('❌ Request Deletion Code Error:', err.response?.data || err.message);
      throw errorData;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyDeletionCode = useCallback(async (code) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Verifying code:', code);
      const response = await api.post(`${API_URL}/api/account/verify-deletion-code/`, {
        code
      });
      console.log('✅ Code verified:', response.data);
      setIsVerified(true);
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { error: 'Invalid code' };
      setError(errorData);
      console.error('❌ Verify Deletion Code Error:', err.response?.data || err.message);
      throw errorData;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async (confirmation) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🗑️ Deleting account with confirmation:', confirmation);
      const response = await api.delete(`${API_URL}/api/account/delete/`, {
        data: { confirmation }
      });
      console.log('✅ Account deleted:', response.data);
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { error: 'Failed to delete account' };
      setError(errorData);
      console.error('❌ Delete Account Error:', err.response?.data || err.message);
      throw errorData;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    requestDeletionCode,
    verifyDeletionCode,
    deleteAccount,
    isVerified,
    loading,
    error,
    clearError: () => setError(null),
    resetVerification: () => setIsVerified(false)
  };
};
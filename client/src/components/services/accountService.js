// hooks/useAccountService.js - Version corrigée
import API_URL from '../../hooks/useApiUrl';
import api from './api';

export const accountService = {
  async deleteAccount(confirmation) {
    try {
      // CORRECTION: Supprimez le '}' à la fin de l'URL
      const response = await api.delete(`${API_URL}/api/account/delete/`, {
        data: { confirmation }
      });
      return response.data;
    } catch (error) {
      // Amélioration du message d'erreur
      const errorData = error.response?.data || { error: 'Connection error' };
      console.error('Delete Account Error:', error);
      console.error('Error Details:', errorData);
      throw errorData;
    }
  },

  async requestDeletion() {
    try {
      const response = await api.post(`${API_URL}/api/account/request-deletion/`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { error: 'Connection error' };
      console.error('Request Deletion Error:', error);
      throw errorData;
    }
  },

  async cancelDeletion() {
    try {
      const response = await api.post(`${API_URL}/api/account/cancel-deletion/`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { error: 'Connection error' };
      console.error('Cancel Deletion Error:', error);
      throw errorData;
    }
  },

  // Ajoutez ces méthodes pour la vérification par email
  async requestDeletionCode() {
    try {
      const response = await api.post(`${API_URL}/api/account/request-deletion-code/`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { error: 'Failed to send code' };
      console.error('Request Deletion Code Error:', error);
      throw errorData;
    }
  },

  async verifyDeletionCode(code) {
    try {
      const response = await api.post(`${API_URL}/api/account/verify-deletion-code/`, {
        code
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { error: 'Invalid code' };
      console.error('Verify Deletion Code Error:', error);
      throw errorData;
    }
  }
};
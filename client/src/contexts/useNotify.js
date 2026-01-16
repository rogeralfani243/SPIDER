// hooks/useNotify.js
import { useNotification, NOTIFICATION_TYPES } from './NotificationContext';

/**
 * Hook simplifié pour utiliser les notifications
 * @returns {Object} Méthodes pour afficher des notifications
 */
export const useNotify = () => {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    addNotification 
  } = useNotification();

  return {
    // Méthodes basiques
    success: (message, duration = 3000) => 
      showSuccess(message, duration),
    
    error: (message, duration = 5000) => 
      showError(message, duration),
    
    warning: (message, duration = 4000) => 
      showWarning(message, duration),
    
    info: (message, duration = 3000) => 
      showInfo(message, duration),
    
    // Méthodes spécialisées pour des cas courants
    apiError: (error, defaultMessage = 'Une erreur est survenue') => {
      let message = defaultMessage;
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      showError(message, 5000);
    },
    
    networkError: () => 
      showError('Problème de connexion. Vérifiez votre internet.', 5000),
    
    saveSuccess: () => 
      showSuccess('Sauvegardé avec succès!', 3000),
    
    deleteSuccess: () => 
      showSuccess('Supprimé avec succès!', 3000),
    
    loginSuccess: () => 
      showSuccess('Connexion réussie!', 3000),
    
    logoutSuccess: () => 
      showInfo('Déconnexion réussie.', 3000),
    
    // Pour les chargements
    loading: (message = 'Chargement en cours...') => 
      showInfo(message, 0), // 0 = pas de fermeture auto
    
    // Pour supprimer un chargement
    clearLoading: (id) => {
      // Tu peux gérer cela si tu stockes l'ID
    }
  };
};
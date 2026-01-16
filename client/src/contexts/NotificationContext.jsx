import React, { createContext, useContext, useState, useCallback } from 'react';

// Types de notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Structure d'une notification
export const createNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => ({
  id: Date.now(),
  message,
  type,
  duration,
  timestamp: new Date()
});

// Contexte
const NotificationContext = createContext(null);

// Hook personnalisé
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Ajouter une notification
  const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const notification = createNotification(message, type, duration);
    
    setNotifications(prev => [notification, ...prev]);
    
    // Auto-dismiss après la durée
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
    }
    
    return notification.id;
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Méthodes helpers
  const showSuccess = useCallback((message, duration = 3000) => {
    return addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
  }, [addNotification]);

  const showError = useCallback((message, duration = 5000) => {
    return addNotification(message, NOTIFICATION_TYPES.ERROR, duration);
  }, [addNotification]);

  const showWarning = useCallback((message, duration = 4000) => {
    return addNotification(message, NOTIFICATION_TYPES.WARNING, duration);
  }, [addNotification]);

  const showInfo = useCallback((message, duration = 3000) => {
    return addNotification(message, NOTIFICATION_TYPES.INFO, duration);
  }, [addNotification]);

  // Vider toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
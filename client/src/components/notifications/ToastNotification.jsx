import React, { useEffect, useState } from 'react';
import { NOTIFICATION_TYPES } from '../../contexts/NotificationContext';
import '../../styles/profile_details/NotificationContainer.css';

// Icônes pour les différents types
const NotificationIcons = {
  [NOTIFICATION_TYPES.SUCCESS]: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  [NOTIFICATION_TYPES.ERROR]: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  [NOTIFICATION_TYPES.WARNING]: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  [NOTIFICATION_TYPES.INFO]: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
};

const ToastNotification = ({ notification, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  // Gérer la fermeture avec animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Durée de l'animation
  };

  // Auto-dismiss
  useEffect(() => {
    if (notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  // Classes CSS en fonction du type
  const getTypeClasses = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'toast-success';
      case NOTIFICATION_TYPES.ERROR:
        return 'toast-error';
      case NOTIFICATION_TYPES.WARNING:
        return 'toast-warning';
      case NOTIFICATION_TYPES.INFO:
        return 'toast-info';
      default:
        return 'toast-info';
    }
  };

  return (
    <div 
      className={`toast-notification ${getTypeClasses()} ${isExiting ? 'exiting' : ''}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="toast-icon">
        {NotificationIcons[notification.type]}
      </div>
      <div className="toast-content">
        <p className="toast-message">{notification.message}</p>
        <div className="toast-time">
          {new Date(notification.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      <button 
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      
      {/* Barre de progression */}
      {notification.duration > 0 && (
        <div 
          className="toast-progress"
          style={{ 
            animationDuration: `${notification.duration}ms`,
            animationPlayState: isExiting ? 'paused' : 'running'
          }}
        />
      )}
    </div>
  );
};

export default ToastNotification;
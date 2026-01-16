import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import ToastNotification from './ToastNotification';
import '../../styles/profile_details/NotificationContainer.css';

const NotificationContainer = () => {
  const { notifications, removeNotification, clearAll } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container" aria-live="polite">
      <div className="notification-header">
        <h3 className="notification-title">
          Notifications ({notifications.length})
        </h3>
        {notifications.length > 1 && (
          <button 
            className="notification-clear-all"
            onClick={clearAll}
            aria-label="Clear all notifications"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="notification-list">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;
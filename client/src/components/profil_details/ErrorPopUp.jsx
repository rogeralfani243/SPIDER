import { useEffect } from "react";
// Composant Popup pour les erreurs
import '../../styles/profiles/popup.css'
 const ErrorPopup = ({ message, onClose, type = 'error' }) => {
  useEffect(() => {
    // Fermer automatiquement après 5 secondes
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getPopupStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 20px',
      borderRadius: '8px',
      color: 'white',
      zIndex: 1000,
      minWidth: '300px',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      animation: 'slideIn 0.3s ease-out'
    };

    if (type === 'success') {
      return {
        ...baseStyles,
        backgroundColor: '#10b981',
        borderLeft: '4px solid #059669'
      };
    } else if (type === 'warning') {
      return {
        ...baseStyles,
        backgroundColor: '#f59e0b',
        borderLeft: '4px solid #d97706'
      };
    } else {
      return {
        ...baseStyles,
        backgroundColor: '#ef4444',
        borderLeft: '4px solid #dc2626'
      };
    }
  };

  return (
    <div style={getPopupStyles()} className="error-popup">
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {type === 'success' ? '✅ Success' : type === 'warning' ? '⚠️ Warning' : '❌ Error'}
        </div>
        <div style={{ fontSize: '0.9rem' }}>{message}</div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          marginLeft: '10px',
          padding: '0',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  );
};

 export default ErrorPopup;
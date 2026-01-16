// LogoutButton.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
const LogoutButton = () => {
    const { logout, user, loading } = useAuth();
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <button className="logout-btn" onClick={() => {logout(); window.location.reload()}}>
 Log out
    </button>
  );
};

export default LogoutButton;
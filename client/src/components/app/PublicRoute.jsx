import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children, isAuthenticated }) => {
  if (isAuthenticated === undefined) {
    return <LoadingScreen />;
  }

  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px'
  }}>
    🔒 Security check...
  </div>
);

export default PublicRoute;
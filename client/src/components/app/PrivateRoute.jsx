import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useSecurity } from '../messaging/securtity/SecurityInterceptor.jsx';
import { securityService } from '../messaging/securtity/SecurityInterceptor.jsx';

const PrivateRoute = ({ 
  children, 
  isAuthenticated,
  requireAdmin = false, 
  requireCreator = false 
}) => {
  const { loading: authLoading } = useAuth();
  const { userPermissions, isLoading: securityLoading } = useSecurity();

  if (authLoading || securityLoading) {
    return <LoadingScreen message="🔒 Verifying permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !userPermissions.is_admin) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    securityService.logViolation(
      user.id,
      window.location.pathname,
      'Non-admin user attempted to access admin-only route'
    );
    return <Navigate to="/security/violation" replace />;
  }

  return children;
};

const LoadingScreen = ({ message = "Loading..." }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px'
  }}>
    {message}
  </div>
);

export default PrivateRoute;
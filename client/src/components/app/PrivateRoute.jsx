import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useSecurity } from '../messaging/securtity/SecurityInterceptor.jsx';
import { securityService } from '../messaging/securtity/SecurityInterceptor.jsx';

const PrivateRoute = ({
  children,
  requireAdmin = false,
  requireCreator = false, // gardé si futur
}) => {
  const location = useLocation();

  const { loading: authLoading } = useAuth();
  const { userPermissions, isLoading: securityLoading } = useSecurity();

  /* ================= LOADING ================= */
  if (authLoading || securityLoading) {
    return <LoadingScreen message="Checking permissions..." />;
  }

  /* ================= AUTH ================= */
  const isAuthenticated = userPermissions?.is_authenticated === true;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /* ================= ADMIN ================= */
  const isAdmin =
    userPermissions?.is_admin === true ||
    userPermissions?.is_superuser === true;

  if (requireAdmin && !isAdmin) {
    securityService.logViolation(
      userPermissions?.user_id ?? 'unknown',
      location.pathname,
      'Non-admin user attempted to access admin-only route'
    );

    return <Navigate to="/security/violation" replace />;
  }

  return children;
};

/* ================= UI ================= */
const LoadingScreen = ({ message }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      fontWeight: '500',
      color: '#444',
    }}
  >

  </div>
);

export default PrivateRoute;

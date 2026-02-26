import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SecurityViolationPage from './SecurityInterceptorPage';
import API_URL from '../../../hooks/useApiUrl';

/* =========================================================
   SecurityService (LOG + UX uniquement)
========================================================= */
class SecurityService {
  constructor() {
    this.violations = [];
  }

  isRestrictedRoute(path) {
    return (
      path.includes('/admin') ||
      path.includes('/settings/security') ||
      path.includes('/database') ||
      path.includes('/server') ||
      path.includes('/config') ||
      path.includes('/logs')
    );
  }

  logViolation(userId, path, reason) {
    const violation = {
      user_id: userId,
      path,
      reason,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    this.violations.push(violation);

    // Log backend (optionnel)
    fetch(`${API_URL}/api/security/log-violation/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(violation),
    }).catch(() => {});

    return violation;
  }
}

export const securityService = new SecurityService();

/* =========================================================
   useSecurity hook (ALIGNÉ BACKEND)
========================================================= */
/* =========================================================
   useSecurity hook (ALIGNÉ BACKEND) - VERSION CORRIGÉE
========================================================= */
export const useSecurity = () => {
  const [userPermissions, setUserPermissions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setUserPermissions({ is_authenticated: false });
        setIsLoading(false);
        return;
      }

      try {
        // ⚠️ VÉRIFIEZ QUE CETTE URL EST CORRECTE !
        const response = await fetch(`${API_URL}/api/auth/permissions/`, { // ou votre endpoint réel
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // Essayez aussi de vérifier si le token est expiré
          if (response.status === 401) {
            localStorage.removeItem('token');
          }
          setUserPermissions({ is_authenticated: false });
          setIsLoading(false);
          return;
        }

        const permissions = await response.json();
        setUserPermissions(permissions);
      } catch (error) {
        console.error('Error loading permissions:', error);
        setUserPermissions({ is_authenticated: false });
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const isAuthenticated = userPermissions?.is_authenticated === true;
  const isAdmin =
    userPermissions?.is_admin === true ||
    userPermissions?.is_superuser === true;

  return {
    userPermissions,
    isAuthenticated,
    isAdmin,
    isLoading,
  };
};

/* =========================================================
   SecurityInterceptor Component - VERSION CORRIGÉE
========================================================= */
const SecurityInterceptor = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [securityAlert, setSecurityAlert] = useState(null);

  const {
    userPermissions,
    isAuthenticated,
    isAdmin,
    isLoading,
  } = useSecurity();

  useEffect(() => {
  if (isLoading || !userPermissions) return;

  const path = location.pathname;
  const userId = userPermissions?.user_id ?? 'anonymous';

  if (!securityService.isRestrictedRoute(path)) return;

  // ❌ Non connecté → redirection login
  if (!isAuthenticated) {
    securityService.logViolation(
      userId,
      path,
      'Unauthenticated access to restricted route'
    );

    navigate('/login', { replace: true });
    return;
  }

  // ❌ Connecté mais pas admin
  if (!isAdmin) {
    setSecurityAlert({
      type: 'insufficient_permissions',
      violation: securityService.logViolation(
        userId,
        path,
        'Non-admin user attempted restricted access'
      ),
    });
    return;
  }

  // ✅ Tout est OK
  setSecurityAlert(null);

}, [
  location.pathname,
  isAuthenticated,
  isAdmin,
  isLoading,
  userPermissions,
  navigate
]);

  if (securityAlert) {
    return (
      <SecurityViolationPage
        violation={securityAlert.violation}
        violationType={securityAlert.type}
        onContinue={() => {
          setSecurityAlert(null);
          navigate('/');
        }}
      />
    );
  }

  return children;
};
export default SecurityInterceptor;

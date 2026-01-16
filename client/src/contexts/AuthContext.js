// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../hooks/messaging/messagingApi';
import { authUtils } from '../hooks/messaging/axiosConfig';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Fonction pour vérifier l'authentification
  const checkAuth = useCallback(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedProfile = localStorage.getItem('profile');
    
    const authStatus = !!storedToken;
    setIsAuthenticated(authStatus);
    setToken(storedToken);
    
    if (storedUser && authStatus) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        } else if (parsedUser.profile) {
          setProfile(parsedUser.profile);
        }
      } catch (err) {
        console.error('❌ Error parsing user data:', err);
        setUser(null);
        setProfile(null);
      }
    } else {
      setUser(null);
      setProfile(null);
    }
    
    setLoading(false);
    return authStatus;
  }, []);

  // Initialisation au chargement
  useEffect(() => {
    checkAuth();
    
    // Écouter les changements de localStorage (autres onglets)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user' || e.key === 'profile') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  // Connexion
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data.token && response.data.user) {
        // Stocker les données
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (response.data.user.profile) {
          localStorage.setItem('profile', JSON.stringify(response.data.user.profile));
          setProfile(response.data.user.profile);
        }
        
        setUser(response.data.user);
        setToken(response.data.token);
        setIsAuthenticated(true);
        
        return { 
          success: true, 
          user: response.data.user,
          token: response.data.token
        };
      } else {
        const errorMsg = 'Token ou données utilisateur manquants dans la réponse';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail || 
                          err.response?.data?.message ||
                          err.message || 
                          'Erreur de connexion';
      setError(errorMessage);
      console.error('❌ Login error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Inscription
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail || 
                          err.response?.data?.message ||
                          err.message || 
                          'Erreur d\'inscription';
      setError(errorMessage);
      console.error('❌ Registration error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      // Appeler l'API de déconnexion si disponible
      if (token) {
        await authAPI.logout();
      }
    } catch (err) {
      console.error('❌ Logout API error:', err);
    } finally {
      // Nettoyer le localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      
      // Réinitialiser l'état
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
      setToken(null);
      setError(null);
      
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }
  };

  // Mettre à jour le profil
  const updateProfile = (profileData) => {
    setProfile(profileData);
    localStorage.setItem('profile', JSON.stringify(profileData));
    
    // Mettre à jour aussi dans l'objet user si nécessaire
    if (user) {
      const updatedUser = { ...user, profile: profileData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Mettre à jour l'utilisateur
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Mettre à jour le profil si inclus
    if (userData.profile) {
      setProfile(userData.profile);
      localStorage.setItem('profile', JSON.stringify(userData.profile));
    }
  };

  // Rafraîchir les données utilisateur depuis l'API
  const refreshUserData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await authAPI.verifyToken();
      if (response.data.user) {
        updateUser(response.data.user);
      }
    } catch (err) {
      console.error('❌ Error refreshing user data:', err);
      // Si le token est invalide, déconnecter
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  // Vérifier le token
  const verifyToken = async () => {
    try {
      await authAPI.verifyToken();
      return true;
    } catch (err) {
      console.error('❌ Token verification failed:', err);
      return false;
    }
  };

  // Obtenir les en-têtes d'authentification
  const getAuthHeaders = (isFormData = false) => {
    const currentToken = token || localStorage.getItem('token');
    
    if (!currentToken) return {};
    
    const headers = {
      'Authorization': `Token ${currentToken}`
    };
    
    // Ajouter le token CSRF si disponible (pour les requêtes non-GET)
    if (!isFormData) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  };

  // Obtenir le token CSRF
  const getCsrfToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  };

  // Obtenir le token d'authentification
  const getToken = () => {
    return token || localStorage.getItem('token');
  };

  // Vérifier les permissions (si vous avez un système de rôles)
  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  // Vérifier le rôle (si vous avez un système de rôles)
  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  // Effacer les erreurs
  const clearError = () => {
    setError(null);
  };

  // Recharger l'authentification
  const reloadAuth = () => {
    setLoading(true);
    checkAuth();
  };

  return {
    // État
    isAuthenticated,
    user,
    profile,
    loading,
    error,
    token,
    
    // Actions
    login,
    register,
    logout,
    checkAuth,
    reloadAuth,
    
    // Gestion des données utilisateur
    updateUser,
    updateProfile,
    refreshUserData,
    
    // Utilitaires d'authentification
    getAuthHeaders,
    getCsrfToken,
    getToken,
    verifyToken,
    
    // Permissions et rôles
    hasPermission,
    hasRole,
    
    // Gestion des erreurs
    clearError,
    
    // Alias pour compatibilité
    isLoggedIn: isAuthenticated,
    currentUser: user,
  };
};

// Hook personnalisé pour vérifier l'authentification
export const useRequireAuth = (redirectTo = '/login') => {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [auth.loading, auth.isAuthenticated, redirectTo]);
  
  return auth;
};

// Hook pour protéger les routes
export const useProtectedRoute = (allowedRoles = [], allowedPermissions = []) => {
  const auth = useAuth();
  const [isAllowed, setIsAllowed] = useState(false);
  
  useEffect(() => {
    if (!auth.loading && auth.isAuthenticated) {
      let allowed = true;
      
      // Vérifier les rôles
      if (allowedRoles.length > 0) {
        allowed = allowedRoles.some(role => auth.hasRole(role));
      }
      
      // Vérifier les permissions
      if (allowed && allowedPermissions.length > 0) {
        allowed = allowedPermissions.every(permission => auth.hasPermission(permission));
      }
      
      setIsAllowed(allowed);
      
      if (!allowed) {
        window.location.href = '/unauthorized';
      }
    }
  }, [auth, allowedRoles, allowedPermissions]);
  
  return { ...auth, isAllowed };
};
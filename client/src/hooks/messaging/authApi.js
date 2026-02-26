// src/api/authApi.js
import api from './axiosConfig';

// Endpoints d'authentification
export const authAPI = {
  // Connexion
  login: (username, password) => {
    return api.post('/api/auth/login/', {
      username,
      password
    });
  },
  
  // Inscription
  register: (userData) => {
    return api.post('/api/auth/register/', userData);
  },
  
  // Déconnexion
  logout: () => {
    const token = localStorage.getItem('token');
    return api.post('/api/auth/logout/', {}, {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
  },
  
  // Vérifier le token
  verifyToken: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return Promise.reject(new Error('Token manquant'));
    }
    return api.post('/api/auth/verify/', {
      token
    });
  },
  
  // Récupérer l'utilisateur courant
  getCurrentUser: () => {
    return api.get('/api/auth/user/');
  },
  
  // Rafraîchir le token (si vous utilisez JWT)
  refreshToken: (refreshToken) => {
    return api.post('/api/auth/refresh/', {
      refresh: refreshToken
    });
  },
  
  // Réinitialiser le mot de passe
  resetPassword: (email) => {
    return api.post('/api/auth/password/reset/', { email });
  },
  
  // Confirmer la réinitialisation du mot de passe
  confirmResetPassword: (uid, token, newPassword) => {
    return api.post('/api/auth/password/reset/confirm/', {
      uid,
      token,
      new_password: newPassword
    });
  },
};

// Fonctions utilitaires pour la gestion des tokens
export const authUtils = {
  // Vérifier si l'utilisateur est authentifié
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },
  
  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    window.location.href = '/login';
  },
  
  // Stocker le token après connexion
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  // Récupérer le token
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  // Stocker les données utilisateur
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  // Récupérer l'utilisateur
  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // Vérifier si le token a expiré
  isTokenExpired: () => {
    const token = localStorage.getItem('token');
    if (!token) return true;
    
    // Pour un token JWT, vous pouvez vérifier l'expiration
    // Pour un token Django simple, on ne peut pas vérifier côté client
    return false;
  },
};
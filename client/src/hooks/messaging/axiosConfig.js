// src/api/axiosConfig.js
import axios from 'axios';
import API_URL from '../useApiUrl';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fonction pour récupérer le token CSRF
const getCsrfToken = () => {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  return cookieValue || '';
};

// Intercepteur pour ajouter les tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Votre code utilise 'token'
    const csrfToken = getCsrfToken();
    
    // Ajouter le token d'authentification
    if (token) {
      config.headers.Authorization = `Token ${token}`; // Utilise Token au lieu de Bearer
    }
    
    // Ajouter le token CSRF pour les requêtes non-GET
    if (csrfToken && config.method !== 'get' && config.method !== 'GET') {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    console.log(`🌐 [AXIOS] ${config.method?.toUpperCase()} ${config.url}`, {
      token: token ? 'Token présent' : 'Token absent',
      csrf: csrfToken ? 'CSRF présent' : 'CSRF absent',
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('❌ [AXIOS] Erreur requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [AXIOS] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    console.error(`❌ [AXIOS] Erreur ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    const originalRequest = error.config;

    // Si l'erreur est 401 (non authentifié)
    if (error.response?.status === 401) {
      console.warn('⚠️ [AXIOS] Session expirée - Déconnexion');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Si l'erreur est 403 (interdit - peut-être CSRF manquant)
    if (error.response?.status === 403 && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      
      try {
        // Réessayer avec un nouveau token CSRF
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          originalRequest.headers['X-CSRFToken'] = csrfToken;
          console.log('🔄 [AXIOS] Réessai avec nouveau token CSRF');
          return api(originalRequest);
        }
      } catch (csrfError) {
        console.error('❌ [AXIOS] Erreur CSRF:', csrfError);
      }
    }
    
    return Promise.reject(error);
  }
);

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
    // Supprimer aussi d'autres données utilisateur si nécessaire
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
  }
};

export default api;
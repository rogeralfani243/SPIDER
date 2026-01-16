import axios from 'axios';

// Configuration axios optimisée
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
  // Important: Gérer les connexions persistantes
  httpAgent: { keepAlive: true },
  httpsAgent: { keepAlive: true }
});

// Cache des requêtes en cours pour éviter les doublons
const pendingRequests = new Map();

api.interceptors.request.use(
  (config) => {
    // Créer une clé unique pour cette requête
    const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
    
    // Annuler la requête précédente si elle existe
    if (pendingRequests.has(requestKey)) {
      const source = pendingRequests.get(requestKey);
      source.cancel('Duplicate request cancelled');
    }
    
    // Créer un nouveau token d'annulation
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    
    // Stocker la requête
    pendingRequests.set(requestKey, source);
    
    console.log(`🌐 Request: ${config.method.toUpperCase()} ${config.url}`);
    
    // Ajouter le token d'authentification
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Nettoyer la requête des pending requests
    const requestKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.params)}`;
    pendingRequests.delete(requestKey);
    
    console.log(`✅ Response ${response.status}: ${response.config.url}`);
    return response;
  },
  (error) => {
    // Nettoyer la requête des pending requests
    if (error.config) {
      const requestKey = `${error.config.method}-${error.config.url}-${JSON.stringify(error.config.params)}`;
      pendingRequests.delete(requestKey);
    }
    
    if (axios.isCancel(error)) {
      console.log('⏹️ Request cancelled:', error.message);
      return Promise.reject(error);
    }
    
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url
    });
    
    // Broken pipe handling
    if (error.code === 'ECONNRESET' || error.message.includes('pipe')) {
      console.warn('🔌 Connection reset/broken pipe detected');
      console.warn('This is often caused by too many concurrent requests');
    }
    
    return Promise.reject(error);
  }
);
// services/api.js
export const dashboardAPI = {
  // Dashboard data
  getDashboardData: () => 
    api.get('/dashboard/data/'),
  
  getDashboardStats: () => 
    api.get('/dashboard/stats/'),
  
  getActivityFeed: (params = {}) => 
    api.get('/dashboard/activity/', { params }),
  
  getChartData: () => 
    api.get('/dashboard/charts/'),

};
export const reportApi = {
  // Signalements
  getReports: (params = {}) => api.get('/report/reports/', { params }),
  getReport: (id) => api.get(`/report/reports/${id}/`),
  createReport: (data) => api.post('/report/reports/', data),
  updateReport: (id, data) => api.patch(`/report/reports/${id}/`, data),
  deleteReport: (id) => api.delete(`/report/reports/${id}/`),
  
  // Mes signalements
  getMyReports: () => api.get('/report/reports/my_reports/'),
    getUserReports : () => api.get('/dashboard/profile/report/'),
  // Vérification
  checkReport: (contentType, contentId) => 
    api.get('/report/reports/check/', { params: { content_type: contentType, content_id: contentId } }),
  
  // Signalement rapide
  quickReport: (data) => api.post('/report/reports/quick/', data),
  
  // Actions modérateur
  updateStatus: (id, data) => api.post(`/report/reports/${id}/update_status/`, data),
  takeAction: (id, data) => api.post(`/report/reports/${id}/take_action/`, data),
  
  // Statistiques
  getStats: () => api.get('/report/reports/stats/'),
  
  // Actions
  getReportActions: (reportId) => api.get('/report/report-actions/', { params: { report_id: reportId } }),
  createReportAction: (data) => api.post('/report/report-actions/', data),
};
// services/api.js
// services/api.js
export const profileAPI = {
  getProfileData: () => api.get('/dashboard/profile/data/'),
  getProfileStats: () => api.get('/dashboard/profile/stats/'),
  getProfileActivity: (params) => api.get('/dashboard/profile/activity/', { params }),
  getProfilePosts: (params) => api.get('/dashboard/profile/posts/', { params }),
  getProfileComments: (params) => api.get('/dashboard/profile/comments/', { params }),
  updateProfile: (data) => api.put('/dashboard/profile/update/', data),
};
// services/api.js - ajoutez ces fonctions
export const searchAPI = {
  // RECHERCHE GÉNÉRALE
  searchAll: (query, params = {}) => 
    api.get('/search/', { params: { q: query, ...params } }),
  
  // RECHERCHE PAR TYPE
  searchProfiles: (query, params = {}) => 
    api.get('/search/profiles/', { params: { q: query, ...params } }),
  
  searchPosts: (query, params = {}) => 
    api.get('/search/posts/', { params: { q: query, ...params } }),
  
  searchGroups: (query, params = {}) => 
    api.get('/search/groups/', { params: { q: query, ...params } }),
  
  searchCategories: (query, params = {}) => 
    api.get('/search/categories/', { params: { q: query, ...params } }),
  
  searchTags: (query, params = {}) => 
    api.get('/search/tags/', { params: { q: query, ...params } }),
  
  // RECHERCHE AVANCÉE
  searchPostsAdvanced: (query, filters = {}) => 
    api.get('/search/posts/advanced/', { params: { q: query, ...filters } }),
  
  // SUGGESTIONS
  getSearchSuggestions: (query) => 
    api.get('/search/suggestions/', { params: { q: query } }),
  
  // FILTRES
  getSearchFilters: () => 
    api.get('/search/filters/'),
  
  // RECHERCHE RAPIDE (autocomplete)
  quickSearch: (query, limit = 5) => {
    const params = { q: query, limit };
    return Promise.all([
      api.get('/search/posts/', { params: { ...params, limit: 2 } }),
      api.get('/search/profiles/', { params: { ...params, limit: 2 } }),
      api.get('/search/categories/', { params: { ...params, limit: 1 } })
    ]).then(([posts, profiles, categories]) => ({
      posts: posts.data,
      profiles: profiles.data,
      categories: categories.data
    }));
  }
};
export default api;
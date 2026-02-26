// src/hooks/useAdminApi.js
import api from './messaging/axiosConfig';  // Assure-toi que le chemin est correct
import { useState, useCallback } from 'react';

// API de l'administration (objet)
export const adminAPI = {
  // ==================== DASHBOARD ====================
  getDashboardStats: () => {
    return api.get('dash/admin/dashboard-stats/');
  },
  
  getUsersList: (params = {}) => {
    return api.get('dash/admin/users/', { params });
  },
  
  getUserDetail: (userId) => {
    return api.get(`dash/admin/users/${userId}/`);
  },
  
  updateUserStatus: (userId, action) => {
    return api.post(`dash/admin/users/${userId}/update-status/`, { action });
  },
  
  createUser: (userData) => {
    return api.post('dash/admin/users/create/', userData);
  },
  
  updateUser: (userId, userData) => {
    return api.put(`/dash/admin/users/${userId}/update/`, userData);
  },
  
  deleteUser: (userId) => {
    return api.delete(`/dash/admin/users/${userId}/delete/`);
  },
  userAnalytics:(params = {}) => {
    return api.get('dash/admin/users/analytics/', { params });
  },
  // ==================== POSTS ====================
  getPostsList: (params = {}) => {
    return api.get('dash/admin/posts/', { params });
  },
  getPostsAnalytics: (params = {}) => {
    return api.get('dash/admin/posts/analytics/', { params });
  },
  
  getPostDetail: (postId) => {
    return api.get(`dash/admin/posts/${postId}/`);
  },
  
  deletePost: (postId) => {
    return api.delete(`dash/admin/posts/${postId}/delete/`);
  },
  
  moderatePost: (postId, action, reason = '') => {
    return api.post(`dash/admin/posts/${postId}/moderate/`, { action, reason });
  },
  

  // ==================== SIGNALEMENTS ====================
  getReportsList: (params = {}) => {
    return api.get('dash/admin/reports/', { params });
  },
  
  getReportDetail: (reportId) => {
    return api.get(`dash/admin/reports/${reportId}/`);
  },
  getReportAnalytics: (params = {}) => {
    return api.get('dash/admin/reports/analytics/', { params });
  },
  updateReportStatus: (reportId, data) => {
  // data est déjà un objet complet, envoyez-le directement
  return api.post(`dash/admin/reports/${reportId}/update-status/`, data);
},
  
  // ==================== CERTIFICATIONS ====================
  getCertificationsList: (params = {}) => {
    return api.get('dash/admin/certifications/', { params });
  },
  
  manageCertification: (certId, action, data = {}) => {
    return api.post(`/dash/admin/certifications/${certId}/manage/`, { action, ...data });
  },
  getCertificationAnalytics: (params = {}) =>  {
    return api.get('dash/admin/certifications/analytics/', { params }); 
  },
updateCertification(certId, data) {
  return api.patch(
    `/dash/admin/certifications/${certId}/update/`,
    data
  );
},

  // ==================== PAIEMENTS ====================
  getPaymentsList: (params = {}) => {
    return api.get('/dash/admin/payments/', { params });
  },
  
  getRevenueStats: (params = {}) => {
    return api.get('/dash/admin/revenue-stats/', { params });
  },
  
  getPaymentDetail: (paymentId) => {
    return api.get(`/dash/admin/payments/${paymentId}/`);
  },
  fetchPaymentAnalytics: (params = {}) => {
    return api.get('/dash/admin/payments/analytics/', { params });
  },
  // ==================== CATÉGORIES & TAGS ====================
  getCategoriesList: () => {
    return api.get('/dash/admin/categories/');
  },
  
  manageCategory: (categoryId, action, data = {}) => {
    return api.post(`/dash/admin/categories/${categoryId}/manage/`, { action, ...data });
  },
  
  getTagsList: () => {
    return api.get('/dash/admin/tags/');
  },
  
  // ==================== OUTILS ADMIN ====================
  searchAdmin: (query) => {
    return api.get('/dash/admin/search/', { params: { q: query } });
  },
  
  exportData: (dataType, format = 'json') => {
    return api.get('/dash/admin/export/', { 
      params: { type: dataType, format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
  },
  
  getSystemHealth: () => {
    return api.get('/dash/admin/system-health/');
  },
  
  getSystemLogs: (params = {}) => {
    return api.get('/dash/admin/system-logs/', { params });
  },
  
  getAdvancedStats: (params = {}) => {
    return api.get('/dash/admin/advanced-stats/', { params });
  },
  
  // ==================== GESTION DES PERMISSIONS ====================
  getUserPermissions: (userId) => {
    return api.get(`/dash/admin/users/${userId}/permissions/`);
  },
  
  updateUserPermissions: (userId, permissions) => {
    return api.post(`/dash/admin/users/${userId}/permissions/`, { permissions });
  },
  
  getGroupsList: () => {
    return api.get('/dash/admin/groups/');
  },
  
  // ==================== PUBLICITÉ & SPONSORISÉ ====================
  getAdCampaigns: (params = {}) => {
    return api.get('/dash/admin/ad-campaigns/', { params });
  },
  
  getSponsoredPosts: (params = {}) => {
    return api.get('/dash/admin/sponsored-posts/', { params });
  },
  // ==================== COMMENTAIRES ====================
getCommentsList: (params = {}) => {
  return api.get('dash/admin/comments/', { params });
},

getCommentDetail: (commentId) => {
  return api.get(`dash/admin/comments/${commentId}/`);
},

deleteComment: (commentId) => {
  return api.delete(`dash/admin/comments/${commentId}/delete/`);
},



// Bonus - Actions supplémentaires pour l'admin
toggleHideComment: (commentId) => {
  return api.post(`dash/admin/comments/${commentId}/toggle-hide/`);
},

toggleSpamComment: (commentId) => {
  return api.post(`dash/admin/comments/${commentId}/toggle-spam/`);
},

togglePinComment: (commentId) => {
  return api.post(`dash/admin/comments/${commentId}/toggle-pin/`);
},

getCommentReplies: (commentId, params = {}) => {
  return api.get(`dash/admin/comments/${commentId}/replies/`, { params });
},

bulkDeleteComments: (commentIds) => {
  return api.post('dash/admin/comments/bulk-delete/', { comment_ids: commentIds });
},

getCommentsStats: () => {
  return api.get('dash/admin/comments/stats/');
},

// Dans useAdminApi.js - AJOUTER CETTE FONCTION

// ==================== COMMENT ANALYTICS ====================
getCommentsAnalytics: (params = {}) => {
  return api.get('dash/admin/comments/analytics/', { params });
},
getFetchGroupsList: (params = {}) => {
  return api.get('/dash/admin/groups/', { params });  
},
getFetchAnalyst : (params = {}) => {
  return api.get('/dash/admin/groups/analytics/', { params });    
},

getDeleteGroup: (groupId) => {
  return api.delete(`/dash/admin/groups/${groupId}/update/`);
},
getBuilkMnanageGroup: (action, groupIds, data = {}) => {
  return api.post('/dash/admin/groups/bulk-manage/', { action, group_ids: groupIds, ...data });
},
getUpdateGroup: (groupId, data) => {
  return api.put(`/dash/admin/groups/${groupId}/update/`, data);
},  

};
// ==================== HOOK PERSONNALISÉ ====================

const useAdminApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Wrapper pour gérer le loading et les erreurs
  const withLoading = useCallback(async (apiCall, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(...args);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.detail || 
                          err.message || 
                          'Une erreur est survenue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Implémentation des fonctions avec loading
  const getDashboardStats = useCallback(async () => {
    return await withLoading(adminAPI.getDashboardStats);
  }, [withLoading]);
  
  const getUsersList = useCallback(async (params) => {
    return await withLoading(adminAPI.getUsersList, params);
  }, [withLoading]);
  
  const getUserDetail = useCallback(async (userId) => {
    return await withLoading(adminAPI.getUserDetail, userId);
  }, [withLoading]);
  
  const updateUserStatus = useCallback(async (userId, action) => {
    return await withLoading(adminAPI.updateUserStatus, userId, action);
  }, [withLoading]);
  const getUsersAnalytics = useCallback(async (params) => {
    return await withLoading(adminAPI.userAnalytics, params);
  }, [withLoading]);
  const getPostsList = useCallback(async (params) => {
    return await withLoading(adminAPI.getPostsList, params);
  }, [withLoading]);
  const getPostsAnalytics = useCallback(async ({ timeRange, geoType }) => {
    return await withLoading(adminAPI.getPostsAnalytics, { time_range: timeRange, geo_type: geoType });
  }, [withLoading]);
  const getPostDetail = useCallback(async (postId) => {
    return await withLoading(adminAPI.getPostDetail, postId);
  }, [withLoading]);
  
  const deletePost = useCallback(async (postId) => {
    return await withLoading(adminAPI.deletePost, postId);
  }, [withLoading]);
  
  const getReportsList = useCallback(async (params) => {
    return await withLoading(adminAPI.getReportsList, params);
  }, [withLoading]);
  
  const getReportDetail = useCallback(async (reportId) => {
    return await withLoading(adminAPI.getReportDetail, reportId);
  }, [withLoading]);
  const getReportsAnalytics  = useCallback(async ({ timeRange, geoType }) => {
    return await withLoading(adminAPI.getReportAnalytics, { time_range: timeRange, geo_type: geoType });
  }, [withLoading]);
// Dans useAdminApi.js, modifiez la fonction updateReportStatus :
const updateReportStatus = useCallback(async (reportId, data) => {
  // data doit déjà être un objet avec action, notes, etc.
  // Ne pas l'emballer dans un autre objet
  return await withLoading(adminAPI.updateReportStatus, reportId, data);
}, [withLoading]);
  
  const getCertificationsList = useCallback(async (params) => {
    return await withLoading(adminAPI.getCertificationsList, params);
  }, [withLoading]);
  const getCertificationAnalytics  = useCallback(async(params) => {
    return await withLoading(adminAPI.getCertificationAnalytics, params);
  },[withLoading] );
  const manageCertification = useCallback(async (certId, action, data) => {
    return await withLoading(adminAPI.manageCertification, certId, action, data);
  }, [withLoading]);
  const updateCertification = useCallback(async (certId,action, data)=> {
    return await withLoading(adminAPI.updateCertification, certId, action, data);
  }, [withLoading]);
  const getPaymentsList = useCallback(async (params) => {
    return await withLoading(adminAPI.getPaymentsList, params);
  }, [withLoading]);
  const fetchPaymentAnalytics= useCallback(async (params) => {
    return await withLoading(adminAPI.fetchPaymentAnalytics, params);
  }, [withLoading]);
  const getRevenueStats = useCallback(async (params) => {
    return await withLoading(adminAPI.getRevenueStats, params);
  }, [withLoading]);
  
  const searchAdmin = useCallback(async (query) => {
    return await withLoading(adminAPI.searchAdmin, query);
  }, [withLoading]);
  
  const exportData = useCallback(async (dataType, format) => {
    return await withLoading(adminAPI.exportData, dataType, format);
  }, [withLoading]);
  
  const getSystemHealth = useCallback(async () => {
    return await withLoading(adminAPI.getSystemHealth);
  }, [withLoading]);
  // ==================== COMMENTAIRES ====================
const getCommentsList = useCallback(async (params) => {
  return await withLoading(adminAPI.getCommentsList, params);
}, [withLoading]);

const getCommentDetail = useCallback(async (commentId) => {
  return await withLoading(adminAPI.getCommentDetail, commentId);
}, [withLoading]);

const deleteComment = useCallback(async (commentId) => {
  return await withLoading(adminAPI.deleteComment, commentId);
}, [withLoading]);

// Bonus
const toggleHideComment = useCallback(async (commentId) => {
  return await withLoading(adminAPI.toggleHideComment, commentId);
}, [withLoading]);

const toggleSpamComment = useCallback(async (commentId) => {
  return await withLoading(adminAPI.toggleSpamComment, commentId);
}, [withLoading]);

const togglePinComment = useCallback(async (commentId) => {
  return await withLoading(adminAPI.togglePinComment, commentId);
}, [withLoading]);

const getCommentReplies = useCallback(async (commentId, params) => {
  return await withLoading(adminAPI.getCommentReplies, commentId, params);
}, [withLoading]);

const bulkDeleteComments = useCallback(async (commentIds) => {
  return await withLoading(adminAPI.bulkDeleteComments, commentIds);
}, [withLoading]);

const getCommentsStats = useCallback(async () => {
  return await withLoading(adminAPI.getCommentsStats);
}, [withLoading]);

const getCommentsAnalytics = useCallback(async (params) => {
  return await withLoading(adminAPI.getCommentsAnalytics, params);
}, [withLoading]);

const fetchGroups= useCallback(async (params) => {
  return await withLoading(adminAPI.getFetchGroupsList, params);
}, [withLoading]);

const fetchGroupAnalytics = useCallback(async (params) => {
  return await withLoading(adminAPI.getFetchAnalyst, params);
} , [withLoading]);
const deleteGroup = useCallback(async (groupId) => {
  return await withLoading(adminAPI.getDeleteGroup, groupId);
}, [withLoading]);

const bulkManageGroup = useCallback(async (action, groupIds, data) => {
  return await withLoading(adminAPI.getBuilkMnanageGroup, action, groupIds, data);
}, [withLoading]);

const updateGroup = useCallback(async (groupId, data) => {
  return await withLoading(adminAPI.getUpdateGroup, groupId, data);
}, [withLoading]);

  return {
    // État
    loading,
    error,
    clearError: () => setError(null),
    
    // Dashboard
    getDashboardStats,
    
    // Users
    getUsersList,
    getUserDetail,
    updateUserStatus,
    getUsersAnalytics,
    // Posts
    getPostsList,
    getPostDetail,
    deletePost,
    getPostsAnalytics,
    // Reports
    getReportsList,
    getReportDetail,
    updateReportStatus,
    getReportsAnalytics ,
    // Certifications
    getCertificationsList,
    manageCertification,
    getCertificationAnalytics ,
    updateCertification,
    // Payments
    getPaymentsList,
    getRevenueStats,
    fetchPaymentAnalytics,
    // Tools
    searchAdmin,
    exportData,
    getSystemHealth,
      // Comments
  getCommentsList,
  getCommentDetail,
  deleteComment,
  toggleHideComment,
  toggleSpamComment,
  togglePinComment,
  getCommentReplies,
  bulkDeleteComments,
  getCommentsStats,
  getCommentsAnalytics,

  // Groups
  fetchGroups,
  fetchGroupAnalytics,
  deleteGroup,
  bulkManageGroup,
  updateGroup,


    // API brute (sans gestion de loading)
    api: adminAPI
  };
};

// Export par défaut le hook
export default useAdminApi;


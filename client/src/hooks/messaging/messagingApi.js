// src/api/messagingApi.js
import api from './axiosConfig';
import API_URL from '../useApiUrl';
import axios from 'axios';
// ==================== AUTHENTIFICATION ====================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



export const groupAPI = {
  // Categories
  getCategories: () => api.get('/msg/groups/categories/'),
  
  // Explore groups
  exploreGroups: (params) => api.get('/msg/groups/explore/', { params }),
  
  // Search
  searchGroupsAdvanced: (data) => api.post('/msg/groups/search/', data),
  
  // Group details
  getGroupDetails: (groupId) => api.get(`/msg/groups/${groupId}/` ),
  
  // Join requests
  requestToJoin: (groupId, data) => api.post(`/msg/groups/${groupId}/join/`, data),
  cancelJoinRequest: (groupId) => api.post(`/msg/groups/${groupId}/cancel-join/`),
  getJoinRequests: (groupId) => api.get(`/msg/groups/${groupId}/requests/`),
  approveJoinRequest: (groupId, requestId, data) => 
    api.post(`/msg/groups/${groupId}/requests/${requestId}/approve/`, data),
  rejectJoinRequest: (groupId, requestId, data) => 
    api.post(`/msg/groups/${groupId}/requests/${requestId}/reject/`, data),
  
  // Feedback
  submitFeedback: (groupId, data) => api.post(`/msg/groups/${groupId}/feedback/`, data),
  getGroupFeedbacks: (groupId, params) => api.get(`/msg/groups/${groupId}/reviews/`, { params }),
  
  // Members
  getGroupMembers: (groupId, params) => api.get(`/msg/groups/${groupId}/members/`, { params }),
  removeMember: (groupId, userId) => api.post(`/msg/groups/${groupId}/remove-member/${userId}/`),
  
  // Group management - CORRECTION
  createGroup: (data) => {
    const formData = new FormData();
    
    // Add base fields
    formData.append('name', data.name || '');
    formData.append('description', data.description || '');
    formData.append('group_type', data.group_type || 'group_private');
    formData.append('can_anyone_invite', 
      data.can_anyone_invite !== undefined ? data.can_anyone_invite : true
    );
    formData.append('max_participants', data.max_participants || 100);
    if (data.is_visible !== undefined) 
      formData.append('is_visible', data.is_visible);
    
    // Add category if provided
    if (data.category_id) {
      formData.append('category_id', data.category_id);
    }
    
    // Add additional parameters
    if (data.requires_approval !== undefined) {
      formData.append('requires_approval', data.requires_approval);
    }
    
    if (data.tags && Array.isArray(data.tags)) {
      formData.append('tags', JSON.stringify(data.tags));
    }
    
    if (data.location) {
      formData.append('location', data.location);
    }
    
    if (data.website) {
      formData.append('website', data.website);
    }
    
    if (data.rules) {
      formData.append('rules', data.rules);
    }
    
    // Add participants
    if (data.participant_ids && Array.isArray(data.participant_ids)) {
      data.participant_ids.forEach(id => {
        formData.append('participant_ids', id);
      });
    }
    
    // Add group photo
    if (data.group_photo) {
      formData.append('group_photo', data.group_photo);
    }
    
    return api.post('/msg/groups/create/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
 updateGroup: (groupId, data) => {
  // Use fetch directly to avoid axios issues
  const token = localStorage.getItem('token');
  const url = `${API_URL}/msg/groups/${groupId}/update/`;
  
  console.log('🚀 Sending with fetch to:', url);
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
    },
    body: data,
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.error || `HTTP ${response.status}`);
      });
    }
    return response.json();
  });
},  
  deleteGroup: (groupId) => api.delete(`/msg/groups/${groupId}/delete/`),
  leaveGroup: (groupId) => api.post(`/msg/groups/${groupId}/leave/`),
  inviteToGroup: (groupId, data) => api.post(`/msg/groups/${groupId}/invite/`, data),

  transferOwnership: async (groupId, newOwnerId) => {
    try {
      console.log(`🔧 API: Transfer group ${groupId} to ${newOwnerId}`);
      
      const response = await api.post(
        `/msg/groups/${groupId}/transfer-ownership/`,
        { new_owner_id: newOwnerId }
      );
      
      console.log('✅ API: Response received', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ API: Error', error.response?.data || error.message);
      throw error;
    }
  },

  // My requests
  getMyJoinRequests: () => api.get('/msg/my-group-requests/'),
};

export const authAPI = {
  login: (username, password) => 
    api.post('/api/auth/login/', { username, password }),
  
  register: (userData) => 
    api.post('/api/auth/register/', userData),
  
  logout: () => {
    const token = localStorage.getItem('token');
    return api.post('/api/auth/logout/', {}, {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
  },
  
  verifyToken: () => {
    const token = localStorage.getItem('token');
    return api.post('/api/auth/verify/', { token });
  },
  
  getCurrentUser: () => api.get('/api/auth/user/'),
};

// ==================== CONVERSATIONS ====================

export const conversationAPI = {
  // Get all conversations
  getConversations: () => api.get('/msg/conversations/'),
  
  // Get a specific conversation
  getConversation: (id) => api.get(`/msg/conversations/${id}/`),
  
  // Create a new conversation
  createConversation: (participantIds) => 
    api.post('/msg/conversations/', { participant_ids: participantIds }),
  
  // Get or create a 1-to-1 conversation
  getOrCreateConversationWithUser: (userId) => 
    api.get(`/msg/conversations/with-user/?user_id=${userId}`),
  
  // Add a participant to a conversation
  addParticipant: (conversationId, userId) => 
    api.post(`/msg/conversations/${conversationId}/add-participant/`, { user_id: userId }),
  
  // Mark a conversation as read
  markAsRead: (conversationId) => 
    api.post(`/msg/conversations/${conversationId}/mark-as-read/`),
  
  // Create a group conversation
  createGroupConversation: async (participantIds, groupName) => {
    try {
      const response = await api.post('/msg/conversations/create-group/', {
        participant_ids: participantIds,
        name: groupName,
        is_group: true
      });
      return response;
    } catch (error) {
      console.error('Group creation error:', error);
      throw error;
    }
  },
  
  // Delete a conversation
  deleteConversation: (conversationId) => 
    api.delete(`/msg/conversations/${conversationId}/`),
  
  // List public groups
  listPublicGroups: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(
        `/msg/groups/public/?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Public groups listing error:', error);
      throw error;
    }
  },
  
  // Search groups
  searchGroups: async (query) => {
    try {
      const response = await api.get(
        `/msg/groups/search/?q=${encodeURIComponent(query)}`
      );
      return response;
    } catch (error) {
      console.error('Group search error:', error);
      throw error;
    }
  },
  
  // Join a group
  joinGroup: async (groupId) => {
    try {
      const response = await api.post(`/msg/groups/${groupId}/join/`);
      return response;
    } catch (error) {
      console.error('Join group error:', error);
      throw error;
    }
  },
  
  // Leave a group
  leaveGroup: async (groupId) => {
    try {
      const response = await api.post(`/msg/groups/${groupId}/leave/`);
      return response;
    } catch (error) {
      console.error('Leave group error:', error);
      throw error;
    }
  },
  
  // Update a group
  updateGroup: async (groupId, groupData) => {
    const formData = new FormData();
    
    if (groupData.name) formData.append('name', groupData.name);
    if (groupData.description !== undefined) formData.append('description', groupData.description);
    if (groupData.group_photo) formData.append('group_photo', groupData.group_photo);
    if (groupData.can_anyone_invite !== undefined) 
      formData.append('can_anyone_invite', groupData.can_anyone_invite);
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(
        `${API_URL}/msg/groups/${groupId}/update/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
          },
          body: formData,
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Group update error');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Group update error:', error);
      throw error;
    }
  },
  
  // Invite to group
  inviteToGroup: async (groupId, userIds) => {
    try {
      const response = await api.post(`/msg/groups/${groupId}/invite/`, {
        user_ids: userIds
      });
      return response;
    } catch (error) {
      console.error('Group invitation error:', error);
      throw error;
    }
  },
  
  // Remove a member from a group
  removeMemberFromGroup: async (groupId, userId) => {
    try {
      const response = await api.post(
        `/msg/groups/${groupId}/remove-member/${userId}/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a group
  deleteGroup: async (groupId) => {
    try {
      const response = await api.post(
        `/msg/groups/${groupId}/delete/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Transfer group ownership
  transferGroupOwnership: async (groupId, newOwnerId) => {
    try {
      const response = await api.post(
        `/msg/groups/${groupId}/transfer-ownership/`,
        { new_owner_id: newOwnerId }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get group admin info
  getGroupAdminInfo: async (groupId) => {
    try {
      const response = await api.get(
        `/msg/groups/${groupId}/admin-info/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ========== NEW ENDPOINTS FOR MESSAGING COMPONENT ==========
  
  // Get conversation by group ID (for auto-selection from groups)
getConversationByGroupId: async (groupId) => {
  try {
    // Si l'ID de groupe est le même que l'ID de conversation
    const response = await api.get(`/msg/conversations/${groupId}/`);
    return response;
  } catch (error) {
    console.error('Get conversation error:', error);
    throw error;
  }
},
  // Get conversation details (for auto-selection by conversation ID)
  getConversationDetails: async (conversationId) => {
    try {
      const response = await api.get(`/msg/conversations/${conversationId}/`);
      return response;
    } catch (error) {
      console.error('Get conversation details error:', error);
      throw error;
    }
  },
  
  // Create a complete group (advanced creation)
  createGroup: async (groupData) => {
    const formData = new FormData();
    
    // Add all group data to formData
    Object.keys(groupData).forEach(key => {
      if (Array.isArray(groupData[key])) {
        groupData[key].forEach(item => {
          formData.append(key, item);
        });
      } else if (groupData[key] !== null && groupData[key] !== undefined) {
        formData.append(key, groupData[key]);
      }
    });
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/msg/groups/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Advanced group creation failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Advanced group creation error:', error);
      throw error;
    }
  },
  
  // Search users for conversation
  searchUsersForConversation: async (query) => {
    try {
      const response = await api.get(`/msg/users/search/?q=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      console.error('User search error:', error);
      throw error;
    }
  }

};

// ==================== MESSAGES ====================

export const messageAPI = {
  // Conversations
  getConversations: () => api.get('/msg/conversations/'),
  createConversation: (data) => api.post('/msg/conversations/', data),
  getConversation: (id) => api.get(`/msg/conversations/${id}/`),
  deleteConversation: (id) => api.delete(`/msg/conversations/${id}/`),
  
  // Messages
  getMessages: (conversationId) => api.get(`/msg/conversations/${conversationId}/messages/`),
  
  // IMPORTANT: Function to send message with FormData
  sendMessage: (conversationId, formData) => {
    const token = localStorage.getItem('token');
    
    return fetch(`${API_URL}/msg/conversations/${conversationId}/messages/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
      },
      body: formData,
    }).then(response => response.json());
  },
  
  // Update message - FIXED
  updateMessage: (conversationId, messageId, data) => {
    return api.patch(`/msg/conversations/${conversationId}/messages/${messageId}/`, data);
  },
  
  // Delete message
  deleteMessage: (conversationId, messageId) => 
    api.delete(`/msg/conversations/${conversationId}/messages/${messageId}/`),
  
  // WhatsApp-like delete
  deleteMessageForMe: (conversationId, messageId) => 
    api.post(`/msg/conversations/${conversationId}/messages/${messageId}/delete-for-me/`),
  
  deleteMessageForEveryone: (conversationId, messageId) => 
    api.post(`/msg/conversations/${conversationId}/messages/${messageId}/delete-for-everyone/`),
  
  // Mark as read
  markMessageAsRead: (conversationId, messageId) => 
    api.post(`/msg/conversations/${conversationId}/messages/${messageId}/mark-as-read/`),
  
  // Users
  getUsers: () => api.get('/msg/users/'),
  searchUsers: (query) => api.get(`/msg/users/search/?q=${query}`),
  
  // Stats
  getStats: () => api.get('/msg/stats/'),
};

// ==================== USERS ====================

export const userAPI = {
  // User list
  getUsers: (search = '') => 
    api.get(`/msg/users/${search ? `?search=${search}` : ''}`),
  
  // User search
  searchUsers: (query) => 
    api.get(`/msg/users/search/?q=${query}`),
  
  // Get current user (alternative if /api/auth/user/ doesn't exist)
  getMe: () => api.get('/msg/users/me/'),
  
  // Search for messaging (new)
  searchUsersForMessaging: (query) => 
    api.get(`/msg/users/search-for-messaging/?q=${encodeURIComponent(query)}`),
};

// ==================== STATISTICS ====================

export const statsAPI = {
  getMessagingStats: () => api.get('/msg/messaging/stats/'),
};

// ==================== AUTH UTILITIES ====================

export const authUtils = {
  // Check if authenticated
  isAuthenticated: () => !!localStorage.getItem('token'),
  
  // Get token
  getToken: () => localStorage.getItem('token'),
  
  // Store token
  setToken: (token) => localStorage.setItem('token', token),
  
  // Store user
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  
  // Get user
  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
};

// ==================== WEB SOCKET UTILITIES ====================

export const webSocketAPI = {
  // Get WebSocket URL
  getWebSocketUrl: (conversationId) => {
    const token = localStorage.getItem('token');
    return `ws://${window.location.host}/ws/messaging/${conversationId}/?token=${token}`;
  },
  
  // Get alternative WebSocket URL (if different structure)
  getWebSocketUrlV2: (conversationId) => {
    const token = localStorage.getItem('token');
    return `ws://${window.location.host}/ws/chat/${conversationId}/?token=${token}`;
  }
};
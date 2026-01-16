// src/contexts/WebSocketContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API_URL from '../useApiUrl';
const WebSocketContext = createContext({});

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  // Récupérer l'utilisateur depuis localStorage au lieu d'importer useAuth
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const connectWebSocket = useCallback((conversationId) => {
    if (!conversationId) return null;
    
    const token = localStorage.getItem('token');
    const user = getUserFromStorage();
    
    if (!token) {
      console.error('No token found for WebSocket connection');
      return null;
    }

    // Fermer la connexion existante
    if (socket) {
      socket.close();
    }

    const wsUrl = `ws://${API_URL}ws/chat/${conversationId}/?token=${token}`;
    
    console.log('🔄 Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Gérer les différents types de messages
        switch (data.type) {
          case 'message':
            window.dispatchEvent(new CustomEvent('new-message', { detail: data }));
            break;
          
          case 'typing':
            handleTypingIndicator(data);
            break;
          
          case 'message_read':
            window.dispatchEvent(new CustomEvent('message-read', { detail: data }));
            break;
          
          default:
            setNotifications(prev => [...prev, data]);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('🔴 WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setIsConnected(false);
    };
    
    setSocket(ws);
    
    return ws;
  }, [socket]);

  const handleTypingIndicator = useCallback((data) => {
    const { conversation_id, user_id, is_typing } = data;
    
    setTypingUsers(prev => {
      const newTypingUsers = { ...prev };
      
      if (is_typing) {
        if (!newTypingUsers[conversation_id]) {
          newTypingUsers[conversation_id] = [];
        }
        if (!newTypingUsers[conversation_id].includes(user_id)) {
          newTypingUsers[conversation_id] = [...newTypingUsers[conversation_id], user_id];
        }
      } else {
        if (newTypingUsers[conversation_id]) {
          newTypingUsers[conversation_id] = newTypingUsers[conversation_id].filter(id => id !== user_id);
          if (newTypingUsers[conversation_id].length === 0) {
            delete newTypingUsers[conversation_id];
          }
        }
      }
      
      window.dispatchEvent(new CustomEvent('typing-update', { 
        detail: { conversation_id, typing_users: newTypingUsers[conversation_id] || [] }
      }));
      
      return newTypingUsers;
    });
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (socket) {
      console.log('🔌 Disconnecting WebSocket');
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const sendMessage = useCallback((conversationId, message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const user = getUserFromStorage();
      const data = {
        type: 'message',
        conversation_id: conversationId,
        content: message,
        sender_id: user?.id
      };
      socket.send(JSON.stringify(data));
      return true;
    } else {
      console.error('❌ Cannot send message: WebSocket not connected');
      return false;
    }
  }, [socket]);

  const sendTypingIndicator = useCallback((conversationId, isTyping) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const user = getUserFromStorage();
      const data = {
        type: 'typing',
        conversation_id: conversationId,
        user_id: user?.id,
        is_typing: isTyping
      };
      socket.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('⚠️ Cannot send typing indicator: WebSocket not connected');
      return false;
    }
  }, [socket]);

  const markAsRead = useCallback((conversationId, messageId) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const user = getUserFromStorage();
      const data = {
        type: 'mark_read',
        conversation_id: conversationId,
        message_id: messageId,
        user_id: user?.id
      };
      socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, [socket]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const getTypingUsers = useCallback((conversationId) => {
    return typingUsers[conversationId] || [];
  }, [typingUsers]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const value = {
    socket,
    isConnected,
    notifications,
    typingUsers,
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    clearNotifications,
    getTypingUsers
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
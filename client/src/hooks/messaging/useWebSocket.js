
// hooks/messaging/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../useAuth';
import API_URL from '../useApiUrl';
export const useWebSocket = (conversationId, onNewMessage) => {
  const wsRef = useRef(null);
  const { user } = useAuth();
  
  const connect = useCallback(() => {
    if (!conversationId || !user) return;
    
    const token = localStorage.getItem('token');
    const wsUrl = `ws://${API_URL}/ws/chat/${conversationId}/?token=${token}`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          const message = {
            ...data.message,
            sender: data.message.sender || {},
            isOwn: data.message.sender?.id === user?.id
          };
          
          onNewMessage(message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnexion après 5 secondes
      setTimeout(connect, 5000);
    };
  }, [conversationId, user, onNewMessage]);
  
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        message: message
      }));
    }
  }, []);
  
  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
  
  return { sendMessage };
};
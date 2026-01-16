// src/hooks/useConversations.js
import { useState, useEffect, useCallback } from 'react';
import { conversationAPI } from './messagingApi';

export const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await conversationAPI.getConversations();
      setConversations(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des conversations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markConversationAsRead = useCallback(async (conversationId) => {
    try {
      await conversationAPI.markAsRead(conversationId);
      
      // Mettre à jour localement
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Erreur:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    
    // Rafraîchir périodiquement (toutes les 30 secondes)
    const interval = setInterval(fetchConversations, 30000);
    
    return () => clearInterval(interval);
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refreshConversations: fetchConversations,
    markConversationAsRead,
  };
};
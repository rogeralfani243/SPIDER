// hooks/useOnlineStatus.js
import { useState, useEffect, useCallback, useRef } from 'react';
import API_URL from './useApiUrl';
export const useOnlineStatus = (userId = null) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [formattedLastSeen, setFormattedLastSeen] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const pingIntervalRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // Fonction pour ping son propre statut
  const pingMyStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/msg/online-status/ping/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Error pinging status:', err);
    }
  }, []);

  // Fonction pour vérifier le statut d'un utilisateur
  const checkUserStatus = useCallback(async (id = userId) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/msg/users/${id}/online-status/`,
        {
          headers: {
            'Authorization': `Token ${token}`,
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setIsOnline(data.is_online);
        setLastSeen(data.last_seen);
        setFormattedLastSeen(data.formatted_last_seen);
      }
    } catch (err) {
      console.error('Error checking online status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fonction pour définir manuellement son statut
  const setMyStatus = useCallback(async (online = true) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/msg/online-status/set/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_online: online }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsOnline(data.is_online);
        return data;
      }
    } catch (err) {
      console.error('Error setting online status:', err);
      throw err;
    }
  }, []);

  // Effet pour gérer le ping automatique (pour l'utilisateur courant)
  useEffect(() => {
    if (!userId) {
      // C'est l'utilisateur courant, on fait des pings réguliers
      pingMyStatus(); // Ping immédiat
      
      // Ping toutes les 30 secondes
      pingIntervalRef.current = setInterval(pingMyStatus, 30000);
      
      // Nettoyer à la fin
      return () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
      };
    }
  }, [userId, pingMyStatus]);

  // Effet pour vérifier le statut d'un autre utilisateur
  useEffect(() => {
    if (userId) {
      checkUserStatus(); // Vérifier immédiatement
      
      // Vérifier toutes les 15 secondes
      checkIntervalRef.current = setInterval(checkUserStatus, 15000);
      
      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }
  }, [userId, checkUserStatus]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  return {
    isOnline,
    lastSeen,
    formattedLastSeen,
    loading,
    error,
    checkUserStatus,
    setMyStatus,
    pingMyStatus,
  };
};

// Hook pour le statut de l'utilisateur courant
export const useMyOnlineStatus = () => {
  return useOnlineStatus(); // Sans userId
};
// frontend/src/pages/dashboard/analytics/hooks/useAnalyticsData.js
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const useAnalyticsData = (timeRange) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [premiumError, setPremiumError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setPremiumError(null);
      
      const response = await api.get('/dashboard/analytics/');
      
      // Vérifier si la réponse indique un problème premium
      if (response.data.code === 'premium_required') {
        setPremiumError(response.data);
        setError(null);
      } else {
        setData(response.data);
        setError(null);
        setPremiumError(null);
      }
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      
      // Gérer l'erreur 403 Forbidden (premium requis)
      if (err.response?.status === 403 && err.response?.data?.code === 'premium_required') {
        setPremiumError(err.response.data);
        setError(null);
      } else {
        setError('Failed to load analytics data');
        setPremiumError(null);
      }
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpgrade = () => {
    if (premiumError?.upgrade_url) {
      navigate(premiumError.upgrade_url);
    } else {
      navigate('/certifications');
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  return {
    data,
    loading,
    error,
    premiumError,
    refreshing,
    handleRefresh: fetchAnalytics,
    handleUpgrade
  };
};
import { useState, useCallback } from 'react';
import PostBoostService from '../components/services/PostBoostService';

export const usePostBoost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [boostStatus, setBoostStatus] = useState({});

  /**
   * Vérifie le statut de boost d'un post
   */
  const checkBoostStatus = useCallback(async (postId) => {
    if (!postId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await PostBoostService.checkPostBoost(postId);
      
      if (result.success) {
        setBoostStatus(prev => ({
          ...prev,
          [postId]: result.data
        }));
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Unexpected error checking boost status');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Boost un post
   */
  const boostPost = useCallback(async (postId, packageId, paymentMethod = 'stripe') => {
    if (!postId || !packageId) {
      setError('Missing post ID or package ID');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await PostBoostService.boostPost(postId, {
        package_id: packageId,
        payment_method: paymentMethod
      });
      
      if (result.success) {
        // Mettre à jour le statut local
        setBoostStatus(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            is_boosted: true,
            boost_details: result.data.boost
          }
        }));
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Unexpected error boosting post');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les packages de boost
   */
  const getBoostPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await PostBoostService.getBoostPackages();
      return result.success ? result.data : null;
    } catch (err) {
      setError('Failed to fetch boost packages');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fonction utilitaire pour vérifier localement si un post est boosté
   */
  const isPostBoosted = useCallback((post) => {
    // Vérifier via les données reçues de l'API
    if (post?.is_boosted === true || post?.is_boosted === 'true') {
      return true;
    }
    
    // Vérifier via boost_details
    if (post?.boost_details?.is_active === true) {
      return true;
    }
    
    // Vérifier via le statut local
    const localStatus = boostStatus[post?.id];
    if (localStatus?.is_boosted) {
      return true;
    }
    
    // Vérifier les champs hérités
    if (post?.is_sponsored === true || post?.sponsored_type) {
      return true;
    }
    
    return false;
  }, [boostStatus]);

  /**
   * Fonction utilitaire pour obtenir les détails du boost
   */
  const getBoostDetails = useCallback((post) => {
    // Priorité 1: Détails du post
    if (post?.boost_details) {
      return post.boost_details;
    }
    
    // Priorité 2: Statut local
    const localStatus = boostStatus[post?.id];
    if (localStatus?.boost_details) {
      return localStatus.boost_details;
    }
    
    // Priorité 3: Fabriquer des détails basiques
    if (isPostBoosted(post)) {
      return {
        type: 'boosted',
        type_display: 'Boosted Post',
        is_active: true,
        days_remaining: 7, // Valeur par défaut
        multiplier: 1.5
      };
    }
    
    return null;
  }, [boostStatus, isPostBoosted]);

  return {
    loading,
    error,
    boostStatus,
    checkBoostStatus,
    boostPost,
    getBoostPackages,
    isPostBoosted,
    getBoostDetails,
    clearError: () => setError(null)
  };
};
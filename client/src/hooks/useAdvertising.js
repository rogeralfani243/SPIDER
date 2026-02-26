// hooks/useAdvertising.js
import { useState, useCallback } from 'react';
import api from './messaging/axiosConfig';

export const useAdvertising = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [sponsoredPosts, setSponsoredPosts] = useState([]);
  const [activeSponsoredPosts, setActiveSponsoredPosts] = useState([]);

  // Fonction générique pour les requêtes
  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api({
        method,
        url,
        data,
        ...config
      });
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { error: err.message };
      setError(errorData);
      console.error(`API Error (${method} ${url}):`, errorData);
      throw errorData;
    } finally {
      setLoading(false);
    }
  }, []);

  // Méthodes HTTP
  const get = useCallback((url, config = {}) => request('GET', url, null, config), [request]);
  const post = useCallback((url, data, config = {}) => request('POST', url, data, config), [request]);
  const put = useCallback((url, data, config = {}) => request('PUT', url, data, config), [request]);
  const del = useCallback((url, config = {}) => request('DELETE', url, null, config), [request]);

  // ============ AD CAMPAIGNS ============
  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await get('/api/ad-campaigns/');
      setCampaigns(data);
      return data;
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      throw err;
    }
  }, [get]);

  const createCampaign = useCallback(async (campaignData) => {
    try {
      const data = await post('/api/ad-campaigns/', campaignData);
      setCampaigns(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating campaign:', err);
      throw err;
    }
  }, [post]);

  const activateCampaign = useCallback(async (campaignId) => {
    try {
      const data = await post(`/api/ad-campaigns/${campaignId}/activate/`);
      setCampaigns(prev => prev.map(c => 
        c.id === campaignId ? { ...c, status: 'active' } : c
      ));
      return data;
    } catch (err) {
      console.error('Error activating campaign:', err);
      throw err;
    }
  }, [post]);

  const getCampaignStats = useCallback(async (campaignId) => {
    try {
      const data = await get(`/api/ad-campaigns/${campaignId}/stats/`);
      return data;
    } catch (err) {
      console.error('Error fetching campaign stats:', err);
      throw err;
    }
  }, [get]);

  // ============ SPONSORED POSTS ============
  const fetchSponsoredPosts = useCallback(async () => {
    try {
      const data = await get('/api/sponsored-posts/');
      setSponsoredPosts(data);
      return data;
    } catch (err) {
      console.error('Error fetching sponsored posts:', err);
      throw err;
    }
  }, [get]);

  const fetchActiveSponsoredPosts = useCallback(async () => {
    try {
      const data = await get('/api/sponsored-posts/active/');
      setActiveSponsoredPosts(data);
      return data;
    } catch (err) {
      console.error('Error fetching active sponsored posts:', err);
      throw err;
    }
  }, [get]);

  // ============ BOOST POST FUNCTIONS ============
  const getBoostOptions = useCallback(async (postId) => {
    try {
      console.log(`🔄 Fetching boost options for post ${postId}...`);
      const response = await api.get(`post/api/posts/${postId}/boost-options/`);
      console.log('✅ Boost options response:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Error fetching boost options:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
      throw err;
    }
  }, []);

  const createBoostPayment = useCallback(async (sponsoredPostId) => {
    try {
      console.log(`🔄 Creating payment for sponsored post ${sponsoredPostId}...`);
      const response = await api.post(`post/api/sponsored-posts/${sponsoredPostId}/process-payment/`);
      console.log('✅ Payment created:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Error creating boost payment:', err);
      throw err;
    }
  }, []);

  const confirmBoostPayment = useCallback(async (postId, paymentIntentId) => {
    try {
      console.log(`🔄 Confirming payment ${paymentIntentId} for post ${postId}...`);
      const response = await api.post(`post/api/posts/${postId}/confirm-boost/`, {
        payment_intent_id: paymentIntentId
      });
      console.log('✅ Payment confirmed:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Error confirming boost payment:', err);
      throw err;
    }
  }, []);

 const boostPostDirectly = useCallback(async (postId, boostData) => {
  try {
    console.log(`🔄 Boosting post ${postId} with data:`, boostData);
    
    // Step 1: Create the boost - CORRIGEZ LE NOM DES CHAMPS
    const boostResponse = await api.post(`post/api/posts/${postId}/boost/`, {
      boost_type: boostData.boost_type,
      boost_days: boostData.boost_duration,  // Votre backend attend "boost_days" !
      always_on_top: boostData.always_on_top
    });
    
    console.log('✅ Boost response:', boostResponse.data);
    
    // Votre backend retourne:
    // {
    //   "message": "Post ready to be boosted",
    //   "sponsored_post_id": X,
    //   "payment_id": Y,
    //   "price": Z,
    //   "boost_days": N,
    //   "boost_type": "standard"
    // }
    
    if (!boostResponse.data.sponsored_post_id) {
      console.error('❌ sponsored_post_id manquant dans la réponse:', boostResponse.data);
      throw new Error('Réponse invalide du serveur: sponsored_post_id manquant');
    }
    
    // Step 2: Create Stripe PaymentIntent
    console.log(`💰 Creating payment intent for sponsored post ${boostResponse.data.sponsored_post_id}`);
    
    const paymentResponse = await api.post(
      `post/api/sponsored-posts/${boostResponse.data.sponsored_post_id}/create-payment-intent/`
    );
    
    console.log('✅ Payment intent created:', paymentResponse.data);
    
    // Votre backend retourne:
    // {
    //   'client_secret': '...',
    //   'payment_intent_id': '...',
    //   'amount': X,
    //   'currency': 'usd',
    //   'sponsored_post_id': Y,
    //   'post_title': '...'
    // }
    
    return {
      ...boostResponse.data,
      ...paymentResponse.data,
      // S'assurer que ces champs existent
      client_secret: paymentResponse.data.client_secret,
      payment_intent_id: paymentResponse.data.payment_intent_id
    };
    
  } catch (err) {
    console.error('❌ Error boosting post:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      url: err.config?.url,
      data: err.config?.data
    });
    
    let errorMessage = 'Erreur inconnue';
    
    if (err.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err.response?.data?.detail) {
      errorMessage = err.response.data.detail;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    throw new Error(errorMessage);
  }
}, []);

  const checkBoostStatus = useCallback(async (postId) => {
    try {
      const response = await api.get(`post/api/posts/${postId}/check-boost/`);
      return response.data;
    } catch (err) {
      console.error('Error checking boost status:', err);
      throw err;
    }
  }, []);

  const getActiveBoosts = useCallback(async () => {
    try {
      const response = await api.get(`post/api/active-boosts/`);
      return response.data;
    } catch (err) {
      console.error('Error fetching active boosts:', err);
      throw err;
    }
  }, []);

  // ============ PAYMENTS ============
  const fetchPayments = useCallback(async () => {
    try {
      const response = await api.get(`post/api/payments/`);
      return response.data;
    } catch (err) {
      console.error('Error fetching payments:', err);
      throw err;
    }
  }, []);

  const getPaymentDetail = useCallback(async (paymentId) => {
    try {
      const response = await api.get(`post/api/payments/${paymentId}/`);
      return response.data;
    } catch (err) {
      console.error('Error fetching payment detail:', err);
      throw err;
    }
  }, []);

  // ============ CREATE SPONSORED POST ============
  const createSponsoredPost = useCallback(async (postId, campaignId, packageType) => {
    try {
      const response = await api.post(`post/api/sponsored-posts/`, {
        post_id: postId,
        campaign_id: campaignId,
        post_type: packageType
      });
      
      setSponsoredPosts(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error creating sponsored post:', err);
      throw err;
    }
  }, []);

  return {
    // State
    campaigns,
    sponsoredPosts,
    activeSponsoredPosts,
    loading,
    error,
    
    // Actions - Campaigns
    fetchCampaigns,
    createCampaign,
    activateCampaign,
    getCampaignStats,
    
    // Actions - Sponsored Posts
    fetchSponsoredPosts,
    fetchActiveSponsoredPosts,
    createSponsoredPost,
    
    // Actions - Boost Posts
    getBoostOptions,
    createBoostPayment,
    confirmBoostPayment,
    boostPostDirectly,
    checkBoostStatus,
    getActiveBoosts,
    
    // Actions - Payments
    fetchPayments,
    getPaymentDetail,
    
    // Utils
    resetError: () => setError(null)
  };
};
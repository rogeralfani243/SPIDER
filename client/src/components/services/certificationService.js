import API_URL from "../../hooks/useApiUrl";
import api from "./api";
const BASE_URL = `certifications`;
export const certificationService = {
  // Récupérer les certifications d'un profil
  getProfileCertifications: async (profileId) => {
    try {
      const response = await fetch(`${API_URL}/certifications/profile/${profileId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching profile certifications:', error);
      // Retourner un objet par défaut en cas d'erreur
      return {
        profile_id: profileId,
        certifications: [],
        summary: {
          total: 0,
          has_premium: false,
          has_fire: false,
          has_influencer: false,
          has_verified: false
        }
      };
    }
  },



  // Vérifier l'éligibilité fire


  // Obtenir les informations sur les certifications

  // ======================
  // ID VERIFICATION ENDPOINTS
  // ======================

  // Soumettre une demande de vérification d'identité


  // ======================
  // PREMIUM SUBSCRIPTION ENDPOINTS
  // ======================

  // Vérifier l'éligibilité premium (abonnement actif)


  // Créer une session de paiement (ex: Stripe)
  createPremiumCheckoutSession: async (planData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/certifications/create-checkout-session/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },



  // ======================
  // INFLUENCER BADGE ENDPOINTS
  // ======================


  // Soumettre une demande de badge influencer


  // ======================
  // USER STATISTICS ENDPOINTS
  // ======================

  // Obtenir les statistiques de l'utilisateur


  // ======================
  // ADMIN ENDPOINTS (pour le dashboard)
  // ======================

  // Obtenir toutes les certifications (admin seulement)
  getAllCertifications: async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/certifications/admin/certifications/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting all certifications:', error);
      throw error;
    }
  },

  // Obtenir les demandes de vérification en attente (admin)
  getPendingVerifications: async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/certifications/admin/verifications/pending/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting pending verifications:', error);
      throw error;
    }
  },

  // ======================
  // UTILITY FUNCTIONS
  // ======================
  // Premium
  checkPremiumEligibility: () => api.post(`${BASE_URL}/check-premium/`),
// Paiement Stripe
  createCheckoutSession: (planType) => api.post('/certifications/create-checkout-session/', {
    plan_type: planType
  }),
  
  getPaymentStatus: (sessionId) => api.get(`/certifications/payment/status/${sessionId}/`),
  
  checkoutSuccess: (sessionId) => api.get('/certifications/checkout/success/', {
    params: { session_id: sessionId }
  }),
  
  checkoutCancel: (sessionId) => api.get('/certifications/checkout/cancel/', {
    params: { session_id: sessionId }
  }),
  
  manageSubscription: () => api.get('/certifications/manage-subscription/'),
  // Influencer
  getUserStats: () => api.get(`${BASE_URL}/user-stats/`),
  checkInfluencerEligibility: () => api.post(`${BASE_URL}/check-influencer/`),
  requestInfluencerBadge: () => api.post(`${BASE_URL}/request-influencer/`),
  
  // Verification
  requestVerification: (formData) => api.post(`${BASE_URL}/request-verification/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getVerificationStatus: () => api.get(`${BASE_URL}/verification-status/`),
  
  // Fire
  checkFireEligibility: () => api.post(`${BASE_URL}/check_fire/`),
  
  // General
  getUserCertifications: () => api.get(`${BASE_URL}/`),
  getCertificationInfo: () => api.get(`${BASE_URL}/info/`),
  
  // Payment Simulation
  simulatePayment: (sessionId) => api.get(`${BASE_URL}/payment/simulate/${sessionId}/`),
 getSubscriptionDetails: (data) => api.get('/certifications/subscription/details/', { params: data }),
  
  cancelSubscription: (data) => api.post('/certifications/subscription/cancel/', data),
  
  reactivateSubscription: () => api.post('/certifications/subscription/reactivate/'),
  
  getCancellationHistory: () => api.get('/certifications/subscription/cancellation-history/'),
  // Générer une URL de redirection pour le paiement
  generatePaymentRedirect: (planType, amount, currency = 'USD') => {
    const baseUrl = `${API_URL}/certifications/payment-redirect/`;
    const params = new URLSearchParams({
      plan_type: planType,
      amount: amount,
      currency: currency,
      return_url: `${window.location.origin}/certifications/success`,
      cancel_url: `${window.location.origin}/certifications/cancel`
    });
    
    return `${baseUrl}?${params.toString()}`;
  },

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Obtenir l'en-tête d'autorisation
  getAuthHeader: () => {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Token ${token}` } : {};
  },

  // Gérer les erreurs de manière centralisée
  handleError: (error, context = 'certification service') => {
    console.error(`Error in ${context}:`, error);
    
    // Vous pouvez ajouter ici de la logique pour afficher des notifications
    // ou rediriger vers la page de connexion si l'erreur est liée à l'authentification
    
    if (error.message.includes('401') || error.message.includes('403')) {
      // Redirection vers la page de connexion
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
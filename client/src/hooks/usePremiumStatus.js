// hooks/usePremiumStatus.js
import { useState, useEffect } from 'react';
import api from '../components/services/api';

export const usePremiumStatus = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [certification, setCertification] = useState(null);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        setLoading(true);
        const response = await api.get('/certifications/check-premium/');
        
        console.log('✅ Backend response:', response.data);
        
        // ✅ CORRECTION: L'utilisateur est premium si:
        // 1. status est 'success' ET
        // 2. certification existe ET
        // 3. days_remaining > 0
        const isPremiumValue = 
          response.data.status === 'success' && 
          response.data.certification !== null && 
          response.data.certification?.status === 'active' &&
          response.data.days_remaining > 0;
        
        console.log('🎉 Premium status:', isPremiumValue);
        console.log('📅 Days remaining:', response.data.days_remaining);
        
        setIsPremium(isPremiumValue);
        setDaysRemaining(response.data.days_remaining || 0);
        
        if (response.data.certification) {
          setCertification(response.data.certification);
          setSubscriptionEnd(response.data.certification.subscription_end);
        }
        
      } catch (error) {
        console.error('❌ Error checking premium status:', error);
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, []);

  const handleUpgrade = () => {
    window.location.href = '/certifications/premium';
  };

  return {
    isPremium,      // ✅ true si l'utilisateur est premium
    loading,
    certification,
    subscriptionEnd,
    daysRemaining,  // ✅ 43 jours
    handleUpgrade
  };
};
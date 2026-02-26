// components/PremiumTab.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Diamond as CrownIcon,
  CreditCard as CreditCardIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Block as BlockIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { certificationService } from '../../services/certificationService';
import { emailSupport } from '../../../hooks/useSupport';
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
}));

const PremiumTab = ({ loading, setLoading, showMessage }) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cancelType, setCancelType] = useState('end_of_period');
  const [cancelling, setCancelling] = useState(false);

  // Fetch subscription info on component mount
  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const response = await certificationService.getSubscriptionDetails();
      setSubscriptionInfo(response.data);
      
      // Check if user has active subscription
      const hasActive = response.data?.has_active_subscription || false;
      setHasActiveSubscription(hasActive);
      
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPremiumEligibility = async () => {
    setLoading(true);
    try {
      const response = await certificationService.checkPremiumEligibility();
      if (response.data.status === 'success') {
        showMessage('success', '🎉 Premium certification activated!');
        // Refresh subscription info
        await fetchSubscriptionInfo();
      } else {
        showMessage('info', response.data.message);
      }
    } catch (error) {
      showMessage('error', 'Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaymentSession = async (planType) => {
    // Check if user already has an active subscription
    if (hasActiveSubscription) {
      setSelectedPlan(planType);
      setContactDialogOpen(true);
      return;
    }

    setLoading(true);
    try {
      const response = await certificationService.createCheckoutSession(planType);
      
      // Check response structure
      const checkoutUrl = response.checkout_url || response.data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL in response');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Payment processing failed';
      showMessage('error', 'Payment error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Subscription Upgrade Request');
    const body = encodeURIComponent(
      `Hello Support Team,\n\nI would like to upgrade/modify my current subscription.\n\n` +
      `Current Plan: ${subscriptionInfo?.subscription_summary?.plan_type || 'Unknown'}\n` +
      `Desired Plan: ${selectedPlan}\n` +
      `User ID: ${subscriptionInfo?.user_id || 'N/A'}\n` +
      `Subscription End Date: ${subscriptionInfo?.subscription_summary?.end_date || 'N/A'}\n\n` +
      `Please contact me to discuss the upgrade options.\n\nBest regards,`
    );
    
    window.location.href = `mailto:${emailSupport}?subject=${subject}&body=${body}`;
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const response = await certificationService.manageSubscription();
      
      if (response.data?.stripe_info?.portal_url) {
        // Redirect to Stripe customer portal
        window.open(response.data.stripe_info.portal_url, '_blank');
      } else if (response.data?.has_active_subscription) {
        showMessage('info', 'Please contact support for subscription management.');
        setContactDialogOpen(true);
      } else {
        showMessage('info', 'No active subscription found.');
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
      showMessage('error', 'Unable to manage subscription. Please contact support.');
      setContactDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

const handleCancelSubscription = async () => {
  setCancelling(true);
  
  try {
    // 1. Vérification détaillée comme dans SubscriptionManagement
    if (!subscriptionInfo) {
      console.error('❌ No subscription data available');
      showMessage({
        type: 'error',
        text: 'Cannot cancel: No subscription information available'
      });
      setCancelDialogOpen(false);
      return;
    }

    // 2. Vérifier si l'abonnement existe et est actif
    const hasActive = subscriptionInfo.has_active_subscription;
    const daysRemaining = subscriptionInfo.subscription_summary?.days_remaining || 0;
    const paymentStatus = subscriptionInfo.payment?.status;
    
    console.log('📊 Subscription status check:', {
      hasActive,
      daysRemaining,
      paymentStatus,
      subscriptionSummary: subscriptionInfo.subscription_summary
    });

    // Si pas d'abonnement actif (comme backend le vérifie)
    if (!hasActive && daysRemaining <= 0) {
      console.warn('⚠️ No active subscription to cancel');
      showMessage({
        type: 'warning',
        text: 'No active subscription found. Your subscription may have already expired or been cancelled.'
      });
      setCancelDialogOpen(false);
      
      // Rafraîchir pour obtenir l'état actuel (comme SubscriptionManagement)
      setTimeout(() => fetchSubscriptionInfo(), 500);
      return;
    }

    // 3. Vérifier si déjà annulé ou en attente d'annulation
    const isAlreadyCancelled = paymentStatus === 'canceled';
    const isScheduled = subscriptionInfo.stripe_subscription?.cancel_at_period_end;
    
    if (isAlreadyCancelled || isScheduled) {
      console.warn('⚠️ Subscription already cancelled/scheduled');
      showMessage({
        type: 'info',
        text: 'Subscription is already cancelled or scheduled for cancellation'
      });
      setCancelDialogOpen(false);
      
      // Rafraîchir les données
      setTimeout(() => fetchSubscriptionInfo(), 500);
      return;
    }

    // 4. Préparer les données pour le backend
    const cancellationData = {
      type: cancelType
      // Le backend cherche Payment.objects.filter(status='completed', subscription_end__gt=timezone.now())
      // Pas besoin d'envoyer plus de données
    };

    console.log('📤 Attempting cancellation with data:', cancellationData);

    // 5. Appel au service
    const response = await certificationService.cancelSubscription(cancellationData);
    
    console.log('✅ Cancellation response:', response.data);

    // 6. Vérifier la réponse (backend retourne success: true/false)
    if (response.data.success) {
      // Message personnalisé selon le type
      let messageText = response.data.message;
      const messageType = cancelType === 'immediate' ? 'warning' : 'success';
      
      // Ajouter des informations supplémentaires si disponibles
      if (response.data.subscription_end) {
        const endDate = new Date(response.data.subscription_end).toLocaleDateString();
        messageText += ` Access ends: ${endDate}`;
      }
      
      showMessage({
        type: messageType,
        text: messageText
      });
      
      setCancelDialogOpen(false);
      
      // 7. Rafraîchissement stratégique (comme SubscriptionManagement)
      console.log('🔄 Scheduling data refresh...');
      
      // Premier rafraîchissement rapide
      setTimeout(() => {
        fetchSubscriptionInfo();
      }, 800);
      
      // Second rafraîchissement après 2 secondes
      setTimeout(() => {
        fetchSubscriptionInfo();
      }, 2000);
      
      // Message de confirmation supplémentaire
      if (cancelType === 'immediate') {
        setTimeout(() => {
          showMessage({
            type: 'info',
            text: 'Please refresh the page to see updated status'
          });
        }, 1500);
      }
      
    } else {
      // 8. Gestion d'erreur du backend
      console.error('❌ Backend returned error:', response.data);
      
      // Message spécifique selon l'erreur du backend
      let errorMessage = response.data.message;
      
      if (response.data.message.includes('No active subscription found')) {
        errorMessage = 'No active subscription found. ';
        errorMessage += 'Your subscription may have expired or already been cancelled.';
        
        // Rafraîchir pour vérifier l'état
        setTimeout(() => {
          fetchSubscriptionInfo();
          showMessage({
            type: 'info',
            text: 'Checking current subscription status...'
          });
        }, 1000);
      }
      
      showMessage({
        type: 'error',
        text: errorMessage
      });
    }

  } catch (err) {
    // 9. Gestion d'erreur réseau/HTTP
    console.error('🔥 HTTP error during cancellation:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    });

    // Message d'erreur spécifique
    let errorMessage = 'Failed to cancel subscription';
    
    if (err.response?.status === 404) {
      // C'est ici que le backend retourne 404 quand il ne trouve pas d'abonnement actif
      const backendMessage = err.response.data?.message || err.response.data?.detail;
      
      if (backendMessage?.includes('No active subscription found')) {
        errorMessage = 'No active subscription found to cancel. ';
        errorMessage += 'Your subscription may have already expired.';
        
        // Vérifier l'état actuel
        setTimeout(() => {
          fetchSubscriptionInfo();
          showMessage({
            type: 'info',
            text: 'Refreshing subscription status...'
          });
        }, 1000);
        
      } else {
        errorMessage = 'Cancellation endpoint not available. Please try again later.';
      }
      
    } else if (err.response?.status === 400) {
      errorMessage = err.response.data?.message || 'Invalid cancellation request';
    } else if (err.response?.status === 403) {
      errorMessage = 'You do not have permission to cancel this subscription';
    } else if (err.response?.status === 500) {
      errorMessage = 'Server error. Please try again later';
    } else if (!err.response) {
      errorMessage = 'Network error. Please check your internet connection';
    } else {
      errorMessage = err.response.data?.message || err.message;
    }
    
    showMessage({
      type: 'error',
      text: errorMessage
    });
    
    // 10. Log supplémentaire pour debug
    if (err.response?.status === 404) {
      console.warn('⚠️ 404 Error - likely no active subscription found by backend');
      console.warn('Current subscription data:', {
        has_active_subscription: subscriptionInfo?.has_active_subscription,
        payment_status: subscriptionInfo?.payment?.status,
        days_remaining: subscriptionInfo?.subscription_summary?.days_remaining,
        stripe_id: subscriptionInfo?.payment?.stripe_subscription_id
      });
    }

  } finally {
    setCancelling(false);
  }
};
  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);
      const response = await certificationService.reactivateSubscription();
      
      if (response.data.success) {
        showMessage('success', response.data.message);
        await fetchSubscriptionInfo();
      } else {
        showMessage('error', response.data.message || 'Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      showMessage('error', 'Reactivation failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { 
      id: 'individual_monthly', 
      name: 'Monthly Individual', 
      price: '$10/month', 
      desc: 'Perfect for getting started',
      features: ['All basic features', 'Premium badge', 'Priority support']
    },
    { 
      id: 'individual_yearly', 
      name: 'Yearly Individual', 
      price: '$100/year', 
      desc: 'Save 2 months',
      features: ['All premium features', 'Premium badge', 'Priority support', 'Save 16%']
    },
    { 
      id: 'organization_basic', 
      name: 'Organization Basic', 
      price: '$50/month', 
      desc: 'For small teams',
      features: ['Up to 5 users', 'Team management', 'Advanced analytics']
    },
    { 
      id: 'organization_pro', 
      name: 'Organization Pro', 
      price: '$100/month', 
      desc: 'Advanced features',
      features: ['Unlimited users', 'Full team management', 'API access', 'Custom branding']
    }
  ];

  // Check if subscription is cancelled but not expired
  const isCancelledButActive = subscriptionInfo?.payment?.status === 'canceled' && 
    subscriptionInfo?.payment?.subscription_end && 
    new Date(subscriptionInfo.payment.subscription_end) > new Date();

  return (
    <>
      <StyledCard>
        <CardHeader
          avatar={
            <Box sx={{ bgcolor: 'gold', color: '#fff', p: 2, borderRadius: 2 }}>
              <CrownIcon />
            </Box>
          }
          title={<Typography variant="h5" fontWeight="bold">Premium Certification</Typography>}
          subheader="Access exclusive features and benefits"
        />
        
        <CardContent>
          {/* Active Subscription Alert */}
          {hasActiveSubscription && (
            <Alert 
              severity="info" 
              icon={<InfoIcon />}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                🎉 You already have an active premium subscription!
              </Typography>
              {subscriptionInfo?.subscription_summary && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Plan:</strong> {subscriptionInfo.subscription_summary.plan_type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>End Date:</strong> {new Date(subscriptionInfo.subscription_summary.end_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Days Remaining:</strong> {subscriptionInfo.subscription_summary.days_remaining}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleManageSubscription}
                  disabled={loading}
                  startIcon={<ArrowForwardIcon />}
                >
                  Manage Subscription
                </Button>
                
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={loading}
                  startIcon={<CancelIcon />}
                >
                  Cancel Subscription
                </Button>
                
                <Button
                  variant="text"
                  color="primary"
                  startIcon={<EmailIcon />}
                  onClick={() => setContactDialogOpen(true)}
                >
                  Contact Support
                </Button>
              </Box>
            </Alert>
          )}

          {/* Cancelled but still active subscription */}
          {isCancelledButActive && (
            <Alert 
              severity="warning" 
              icon={<WarningIcon />}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                ⚠️ Subscription Cancelled
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your subscription has been cancelled but will remain active until {new Date(subscriptionInfo.payment.subscription_end).toLocaleDateString()}.
                You can reactivate it if you change your mind.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleReactivateSubscription}
                disabled={loading}
                sx={{ mt: 2 }}
                startIcon={<RefreshIcon />}
              >
                Reactivate Subscription
              </Button>
            </Alert>
          )}

          {/* Subscription Blocked Warning */}
          {hasActiveSubscription && !isCancelledButActive && (
            <Alert 
              severity="warning" 
              icon={<BlockIcon />}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                ⚠️ Subscription Change Required
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                You cannot purchase a new subscription while an active one exists. 
                Please cancel your current subscription first or contact support for upgrades.
              </Typography>
            </Alert>
          )}

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Premium Benefits
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              'Advanced post analytics',
              'Priority support 24/7',
              'Exclusive content and tools',
              'Ad-free experience',
              'Premium badge on your profile',
              'Advanced search filters',
              'Higher visibility in search results',
              'Custom profile customization'
            ].map((benefit, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">{benefit}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Eligibility Check Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleCheckPremiumEligibility}
            disabled={loading || (hasActiveSubscription && !isCancelledButActive)}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            sx={{
              mb: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
              },
              '&.Mui-disabled': {
                background: '#e0e0e0',
              }
            }}
          >
            {hasActiveSubscription ? 'Premium Active ✓' : 'Check Premium Eligibility'}
          </Button>

          {/* Show plans only if no active subscription or subscription is cancelled */}
          {(!hasActiveSubscription || isCancelledButActive) && (
            <>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Subscription Plans
              </Typography>
              
              <Grid container spacing={3}>
                {plans.map((plan) => (
                  <Grid item xs={12} sm={6} key={plan.id}>
                    <Paper sx={{ 
                      p: 3, 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      opacity: (hasActiveSubscription && !isCancelledButActive) ? 0.7 : 1,
                      pointerEvents: (hasActiveSubscription && !isCancelledButActive) ? 'none' : 'auto'
                    }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        {plan.name}
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
                        {plan.price}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                        {plan.desc}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        {plan.features.map((feature, idx) => (
                          <Box key={idx} display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography variant="body2">{feature}</Typography>
                          </Box>
                        ))}
                      </Box>
                      
                      <Button
                        fullWidth
                        variant={hasActiveSubscription ? "outlined" : "contained"}
                        startIcon={<CreditCardIcon />}
                        onClick={() => handleCreatePaymentSession(plan.id)}
                        disabled={loading || (hasActiveSubscription && !isCancelledButActive)}
                        sx={{ mt: 'auto' }}
                      >
                        {hasActiveSubscription ? 'Renew Subscription' : 'Subscribe'}
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
          
          {/* Contact Support Section */}
          {hasActiveSubscription && (
            <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Need to change your plan?
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Contact our support team for assistance with:
              </Typography>
              <Box sx={{ pl: 2, mb: 3 }}>
                {[
                  'Upgrading or downgrading your plan',
                  'Changing billing cycle',
                  'Adding more users (for organization plans)',
                  'Billing issues or refunds',
                  'Custom enterprise solutions'
                ].map((item, index) => (
                  <Box key={index} display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <CheckCircleIcon color="primary" fontSize="small" />
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                ))}
              </Box>
              <Button
                variant="contained"
                fullWidth
                startIcon={<EmailIcon />}
                onClick={() => setContactDialogOpen(true)}
                sx={{ py: 1.5 }}
              >
                Contact Support Team
              </Button>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              All payments are processed securely through Stripe. 
              {hasActiveSubscription ? ' You can cancel your subscription at any time.' : ' You can cancel your subscription at any time.'}
            </Typography>
          </Alert>
        </CardContent>
      </StyledCard>

      {/* Cancel Subscription Dialog */}
      <Dialog 
        open={cancelDialogOpen} 
        onClose={() => !cancelling && setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CancelIcon color="warning" />
            <Typography variant="h6">Cancel Subscription</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to cancel your subscription?
          </Typography>
          
          {subscriptionInfo?.subscription_summary && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Your Current Subscription:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Plan" 
                    secondary={subscriptionInfo.subscription_summary.plan_type}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Status" 
                    secondary="Active"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Renews on" 
                    secondary={new Date(subscriptionInfo.subscription_summary.end_date).toLocaleDateString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Days remaining" 
                    secondary={subscriptionInfo.subscription_summary.days_remaining}
                  />
                </ListItem>
              </List>
            </Paper>
          )}
          
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Cancellation Options:
          </Typography>
          
          <RadioGroup 
            value={cancelType} 
            onChange={(e) => setCancelType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <FormControlLabel 
              value="end_of_period" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Cancel at end of billing period
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Keep premium access until {subscriptionInfo?.subscription_summary?.end_date ? new Date(subscriptionInfo.subscription_summary.end_date).toLocaleDateString() : 'your billing period ends'}
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="immediate" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Cancel immediately
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Lose premium access immediately. You may receive a partial refund.
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
          
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              {cancelType === 'immediate' 
                ? '⚠️ You will lose access to premium features immediately. This action cannot be undone.' 
                : '⚠️ You will keep premium access until the end of your billing period. After that, your subscription will not renew.'}
            </Typography>
          </Alert>
          
          {cancelType === 'immediate' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Immediate cancellation will revoke your premium certification badge and all premium features immediately.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialogOpen(false)} 
            disabled={cancelling}
          >
            Keep Subscription
          </Button>
          <Button 
            onClick={handleCancelSubscription} 
            variant="contained"
            color="error"
            startIcon={cancelling ? <CircularProgress size={20} /> : <CancelIcon />}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Support Dialog */}
      <Dialog 
        open={contactDialogOpen} 
        onClose={() => setContactDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EmailIcon color="primary" />
            <Typography variant="h6">Contact Support Team</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You already have an active subscription. To modify, upgrade, or cancel your plan, please contact our support team.
          </Typography>
          
          {subscriptionInfo && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Your Subscription Details:
              </Typography>
              <Box sx={{ pl: 1 }}>
                <Typography variant="body2">
                  <strong>Current Plan:</strong> {subscriptionInfo.subscription_summary?.plan_type || 'Unknown'}
                </Typography>
                {selectedPlan && (
                  <Typography variant="body2">
                    <strong>Requested Plan:</strong> {selectedPlan}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Status:</strong> Active
                </Typography>
                {subscriptionInfo.subscription_summary?.end_date && (
                  <Typography variant="body2">
                    <strong>Renews on:</strong> {new Date(subscriptionInfo.subscription_summary.end_date).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </Paper>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Contact Options:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<EmailIcon />}
                  onClick={handleContactSupport}
                  sx={{ py: 1.5 }}
                >
                  Send Email
                </Button>
              </Grid>
               
       <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    navigator.clipboard.writeText(emailSupport);
                    showMessage('success', 'Email copied to clipboard!');
                  }}
                  sx={{ py: 1.5 }}
                >
                  Copy Support Email
                </Button>
              </Grid> 
            </Grid>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Our support team typically responds within 24 hours. Please include your user ID and subscription details in your message.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleContactSupport} 
            variant="contained"
            color="primary"
            startIcon={<EmailIcon />}
          >
            Open Email
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PremiumTab;
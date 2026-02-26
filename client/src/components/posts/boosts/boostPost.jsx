// components/post/BoostDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Card, CardContent, Typography,
  CircularProgress, Alert, Box, IconButton, Chip
} from '@mui/material';
import {
  TrendingUp, Star, Rocket, LocalFireDepartment,
  CheckCircle, Close, Payment, Bolt, Timer, Euro
} from '@mui/icons-material';
import { useAdvertising } from '../../../hooks/useAdvertising';
import api from '../../services/api';

const BoostDialog = ({ postId, postTitle, isOpen, onClose, onSuccess }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [boostOptions, setBoostOptions] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('select');
  const [error, setError] = useState(null);
  const [postInfo, setPostInfo] = useState(null);
  const [alreadyBoosted, setAlreadyBoosted] = useState(false);
  const [currentBoostDetails, setCurrentBoostDetails] = useState(null);
  
  const { 
    getBoostOptions, 
    confirmBoostPayment,
    loading 
  } = useAdvertising();

  useEffect(() => {
    if (isOpen && postId) {
      loadBoostOptions();
      resetState();
      checkCurrentBoostStatus();
    }
  }, [isOpen, postId]);

  const resetState = () => {
    setSelectedPackage(null);
    setStep('select');
    setError(null);
    setProcessing(false);
    setAlreadyBoosted(false);
    setCurrentBoostDetails(null);
  };

  const checkCurrentBoostStatus = async () => {
    try {
      const response = await api.get(`post/api/posts/${postId}/check-boost/`);
      if (response.data.is_boosted) {
        setAlreadyBoosted(true);
        setCurrentBoostDetails(response.data.boost_details);
        
        // Calculate remaining time
        const boostEnd = new Date(response.data.boost_details.boost_until);
        const now = new Date();
        const diffTime = Math.abs(boostEnd - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setError({
          type: 'info',
          message: `This post is already boosted with ${response.data.boost_details.type} package`,
          details: `Expires in ${diffDays} days (${boostEnd.toLocaleDateString()})`,
          remainingDays: diffDays
        });
      }
    } catch (err) {
      console.log('Boost status check:', err.message);
    }
  };

  const loadBoostOptions = async () => {
    console.log('🔄 Loading boost options for post:', postId);
    
    try {
      const data = await getBoostOptions(postId);
      console.log('✅ Data received:', data);
      
      setBoostOptions(data.options || []);
      setPostInfo(data.post);
      
      if (data.is_boosted && data.current_boost) {
        const boostUntil = new Date(data.current_boost.boost_until);
        const now = new Date();
        const daysRemaining = Math.ceil((boostUntil - now) / (1000 * 60 * 60 * 24));
        
        setAlreadyBoosted(true);
        setCurrentBoostDetails(data.current_boost);
        
        if (daysRemaining > 0) {
          setError({
            type: 'info',
            message: `This post is already boosted with ${data.current_boost.type} package`,
            details: `Expires on ${boostUntil.toLocaleDateString()} (${daysRemaining} days remaining)`,
            remainingDays: daysRemaining,
            multiplier: data.current_boost.multiplier
          });
        } else {
          setError({
            type: 'warning',
            message: 'Previous boost has expired',
            details: 'You can boost this post again'
          });
          setAlreadyBoosted(false);
        }
      }
    } catch (err) {
      console.error('❌ Error loading boost options:', err);
      setError({
        type: 'error',
        message: `Unable to load boost options: ${err.message || 'Please try again later.'}`
      });
    }
  };

  const handlePackageSelect = (pkg) => {
    console.log('📦 Package selected:', pkg);
    
    if (alreadyBoosted) {
      setError({
        type: 'error',
        message: 'This post is already boosted',
        details: 'You cannot boost it again until the current boost expires.'
      });
      return;
    }
    
    setSelectedPackage(pkg);
    setStep('payment');
    setError(null);
  };

  const handleCreatePayment = async () => {
    if (!selectedPackage) return;
    
    console.log('💳 Starting boost payment:', selectedPackage);
    setProcessing(true);
    setError(null);
    
    try {
      // 1. Create checkout session
      const response = await api.post(
        `post/api/posts/${postId}/create-boost-checkout/`,
        {
          boost_type: `${selectedPackage.type}_${selectedPackage.duration_days}`
        }
      );
      
      console.log('✅ Session created:', response.data);
      
      // 2. Redirect to Stripe
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('Payment URL not received');
      }
      
    } catch (err) {
      console.error('❌ Payment creation error:', err);
      
      let errorMessage = 'An error occurred';
      let errorType = 'error';
      
      if (err.response?.status === 400) {
        if (err.response.data?.error?.includes('already boosted')) {
          errorMessage = 'This post is already boosted';
          errorType = 'info';
          setAlreadyBoosted(true);
        } else {
          errorMessage = err.response.data.error || 'Invalid request';
        }
      } else if (err.response?.status === 404) {
        errorMessage = 'Payment service unavailable';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError({
        type: errorType,
        message: errorMessage,
        details: err.message
      });
      setProcessing(false);
    }
  };

  const handleStripePayment = async (paymentData) => {
    console.log('💳 Stripe payment process:', paymentData.payment_intent_id);
    setStep('confirm');
    
    try {
      // Note: In production, use Stripe.js here
      // stripe.confirmCardPayment(paymentData.client_secret, {...})
      
      // For now, simulation with delay
      setTimeout(async () => {
        try {
          // Confirm payment on backend
          const confirmResult = await confirmBoostPayment(postId, {
            payment_intent_id: paymentData.payment_intent_id
          });
          
          console.log('✅ Payment confirmed:', confirmResult);
          
          if (confirmResult.success) {
            onSuccess?.({
              ...confirmResult,
              package: selectedPackage,
              message: '✅ Post boosted successfully!'
            });
            
            // Close after delay
            setTimeout(() => {
              onClose();
            }, 2000);
          } else {
            throw new Error(confirmResult.error || 'Confirmation failed');
          }
        } catch (confirmErr) {
          console.error('❌ Confirmation error:', confirmErr);
          setError({
            type: 'error',
            message: 'Confirmation failed',
            details: confirmErr.message
          });
          setStep('payment');
          setProcessing(false);
        }
      }, 3000);
      
    } catch (err) {
      console.error('❌ Stripe payment error:', err);
      setError({
        type: 'error',
        message: 'Payment error',
        details: err.message
      });
      setStep('payment');
      setProcessing(false);
    }
  };

  const getPackageIcon = (type) => {
    switch(type) {
      case 'standard': return <TrendingUp />;
      case 'premium': return <Star />;
      case 'featured': return <Rocket />;
      case 'spotlight': return <LocalFireDepartment />;
      default: return <Bolt />;
    }
  };

  const getPackageColor = (type) => {
    switch(type) {
      case 'standard': return '#1976d2';
      case 'premium': return '#ff9800';
      case 'featured': return '#9c27b0';
      case 'spotlight': return '#f44336';
      default: return '#1976d2';
    }
  };

  // Render boost options
  const renderBoostOptions = () => {
    console.log('🔄 Rendering options:', boostOptions.length, 'options available');
    
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (boostOptions.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No boost options available at the moment.
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={loadBoostOptions}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {boostOptions.map((option, index) => (
          <Grid item xs={12} md={6} key={option.type || index}>
            <Card 
              sx={{
                border: selectedPackage?.type === option.type 
                  ? `2px solid ${getPackageColor(option.type)}` 
                  : '1px solid #e0e0e0',
                height: '100%',
                cursor: alreadyBoosted ? 'default' : 'pointer',
                opacity: alreadyBoosted ? 0.6 : 1,
                transition: 'all 0.3s ease',
                position: 'relative',
                '&:hover': {
                  boxShadow: alreadyBoosted ? 'none' : 6,
                  transform: alreadyBoosted ? 'none' : 'translateY(-4px)',
                }
              }}
              onClick={() => !alreadyBoosted && handlePackageSelect(option)}
            >
              {option.type === 'premium' && !alreadyBoosted && (
                <Chip
                  label="Best Value"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: 10,
                    backgroundColor: getPackageColor(option.type),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.7rem'
                  }}
                />
              )}
              
              {alreadyBoosted && (
                <Chip
                  label="Already Boosted"
                  size="small"
                  color="info"
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: 10,
                    fontWeight: 'bold',
                    fontSize: '0.7rem'
                  }}
                />
              )}
              
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      backgroundColor: `${getPackageColor(option.type)}20`,
                      color: getPackageColor(option.type),
                      borderRadius: '50%',
                      p: 1.5,
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getPackageIcon(option.type)}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {option.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Box display="flex" alignItems="baseline" gap={1}>
                    <Euro fontSize="small" color="action" />
                    <Typography variant="h4" color={getPackageColor(option.type)} fontWeight="bold">
                      {option.price}€
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Timer fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {option.duration_days} days
                    </Typography>
                  </Box>
                </Box>

                <Box mb={3}>
                  {option.features && option.features.map((feature, idx) => (
                    <Box 
                      key={idx} 
                      display="flex" 
                      alignItems="flex-start" 
                      mb={1}
                      sx={{ opacity: alreadyBoosted ? 0.5 : 0.9 }}
                    >
                      <CheckCircle 
                        fontSize="small" 
                        sx={{ 
                          color: getPackageColor(option.type), 
                          mr: 1,
                          flexShrink: 0,
                          mt: 0.25
                        }} 
                      />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box 
                  sx={{
                    backgroundColor: `${getPackageColor(option.type)}10`,
                    p: 1.5,
                    borderRadius: 1,
                    textAlign: 'center',
                    border: `1px solid ${getPackageColor(option.type)}30`,
                    opacity: alreadyBoosted ? 0.5 : 1
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    <Box component="span" fontWeight="bold" color={getPackageColor(option.type)}>
                      {option.multiplier}x
                    </Box> visibility increase
                  </Typography>
                </Box>

                {alreadyBoosted && currentBoostDetails && (
                  <Box 
                    sx={{
                      backgroundColor: '#e3f2fd',
                      p: 1.5,
                      borderRadius: 1,
                      textAlign: 'center',
                      border: '1px solid #90caf9',
                      mt: 2
                    }}
                  >
                    <Typography variant="body2" color="info.main">
                      Current boost: {currentBoostDetails.multiplier}x
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentBoostDetails.remainingDays} days remaining
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render payment step
  const renderPaymentStep = () => {
    if (!selectedPackage) return null;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Payment for {selectedPackage.name}
        </Typography>
        
        <Card variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: '#fafafa' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Package:</Typography>
              <Typography fontWeight="medium">{selectedPackage.name}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Duration:</Typography>
              <Typography fontWeight="medium">{selectedPackage.duration_days} days</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Increase:</Typography>
              <Typography fontWeight="medium">{selectedPackage.multiplier}x</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Total amount:</Typography>
              <Box display="flex" alignItems="baseline" gap={0.5}>
                <Euro fontSize="small" />
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {selectedPackage.price}€
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Click "Pay & Boost" to proceed with secure payment.
          </Typography>
        </Alert>
      </Box>
    );
  };

  // Render confirmation step
  const renderConfirmationStep = () => (
    <Box textAlign="center" py={4}>
      <CircularProgress 
        size={60} 
        sx={{ 
          mb: 3,
          color: getPackageColor(selectedPackage?.type)
        }} 
      />
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Processing your payment...
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
        Please wait while we confirm your payment and activate your boost.
        This usually takes a few seconds.
      </Typography>
    </Box>
  );

  const renderCurrentBoostInfo = () => {
    if (!currentBoostDetails) return null;
    
    const boostEnd = new Date(currentBoostDetails.boost_until);
    const now = new Date();
    const daysRemaining = Math.ceil((boostEnd - now) / (1000 * 60 * 60 * 24));
    
    return (
      <Alert 
        severity={daysRemaining > 0 ? "info" : "warning"}
        sx={{ mb: 2 }}
        icon={<Bolt />}
      >
        <Box>
          <Typography fontWeight="bold">
            {daysRemaining > 0 ? 'Active Boost' : 'Expired Boost'}
          </Typography>
          <Typography variant="body2">
            {daysRemaining > 0 
              ? `Currently boosted with ${currentBoostDetails.type} package`
              : 'Previous boost has expired'
            }
          </Typography>
          <Box display="flex" gap={2} mt={1} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary">Multiplier:</Typography>
              <Typography variant="body2" fontWeight="medium">
                {currentBoostDetails.multiplier}x
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Expires:</Typography>
              <Typography variant="body2" fontWeight="medium">
                {boostEnd.toLocaleDateString()}
              </Typography>
            </Box>
            {daysRemaining > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Remaining:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Alert>
    );
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={processing ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Bolt color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Boost "{postTitle}"
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose} 
            disabled={processing}
            size="small"
          >
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Increase your post visibility and reach more users
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Current Boost Information */}
        {renderCurrentBoostInfo()}

        {/* Error/Info Messages */}
        {error && (
          <Alert 
            severity={error.type || (alreadyBoosted ? "info" : "error")}
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error.message && <Typography>{error.message}</Typography>}
            {error.details && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {error.details}
              </Typography>
            )}
          </Alert>
        )}

        {/* Step Content */}
        {step === 'select' ? renderBoostOptions() :
         step === 'payment' ? renderPaymentStep() :
         step === 'confirm' ? renderConfirmationStep() : null}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
        {step === 'select' ? (
          <>
            <Button 
              onClick={onClose} 
              disabled={processing}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            {selectedPackage && !alreadyBoosted && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Payment />}
                onClick={handleCreatePayment}
                disabled={processing || loading}
                sx={{ 
                  minWidth: 140,
                  backgroundColor: getPackageColor(selectedPackage.type),
                  '&:hover': {
                    backgroundColor: getPackageColor(selectedPackage.type),
                    opacity: 0.9
                  }
                }}
              >
                {loading ? 'Loading...' : 'Boost Now'}
              </Button>
            )}
          </>
        ) : step === 'payment' && (
          <>
            <Button 
              onClick={() => {
                setStep('select');
                setProcessing(false);
              }} 
              disabled={processing}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <Payment />}
              onClick={handleCreatePayment}
              disabled={processing}
              sx={{ 
                minWidth: 140,
                backgroundColor: getPackageColor(selectedPackage.type),
                '&:hover': {
                  backgroundColor: getPackageColor(selectedPackage.type),
                  opacity: 0.9
                }
              }}
            >
              {processing ? 'Processing...' : 'Pay & Boost'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BoostDialog;
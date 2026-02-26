// components/SubscriptionManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { certificationService } from '../../services/certificationService';

const SubscriptionManagement = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [cancellationType, setCancellationType] = useState('end_of_period');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchSubscriptionDetails = async () => {
    console.log("🔄 Fetching subscription details...");
    
    setLoading(true);
    setError(null);
    try {
      const response = await certificationService.getSubscriptionDetails();
      console.log("✅ Subscription data received:", response.data);
      
      setSubscriptionData(response.data);
      
      // Si le statut est "pending", activer le rafraîchissement automatique
      if (response.data.status === 'pending' && !autoRefresh) {
        console.log("⏳ Payment pending, enabling auto-refresh...");
        setAutoRefresh(true);
      }
      
    } catch (err) {
      console.error('❌ Error fetching subscription details:', err);
      setError(err.response?.data?.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchissement automatique si statut "pending"
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        console.log("🔄 Auto-refreshing subscription data...");
        
      }, 5000); // Rafraîchir toutes les 5 secondes
      fetchSubscriptionDetails();
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Désactiver le rafraîchissement automatique une fois que c'est actif
  useEffect(() => {
    if (subscriptionData?.status === 'active' && autoRefresh) {
      console.log("✅ Subscription active, disabling auto-refresh");
      setAutoRefresh(false);
    }
  }, [subscriptionData, autoRefresh]);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const handleCancelSubscription = async () => {
    setProcessing(true);
    try {
      const response = await certificationService.cancelSubscription({
        type: cancellationType
      });
      
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message
        });
        setCancelDialogOpen(false);
        
        // Rafraîchir immédiatement
        setTimeout(() => {
          fetchSubscriptionDetails();
        }, 1000);
        
      } else {
        setMessage({
          type: 'error',
          text: response.data.message
        });
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel subscription'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setProcessing(true);
    try {
      const response = await certificationService.reactivateSubscription();
      
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message
        });
        setReactivateDialogOpen(false);
        
        // Rafraîchir immédiatement
        setTimeout(() => {
          fetchSubscriptionDetails();
        }, 1000);
        
      } else {
        setMessage({
          type: 'error',
          text: response.data.message
        });
      }
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reactivate subscription'
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'Invalid date';
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscriptionData) return null;
    
    const stripeSub = subscriptionData.stripe_subscription;
    const payment = subscriptionData.payment;
    
    if (stripeSub?.cancel_at_period_end) {
      return {
        label: 'Cancellation Scheduled',
        color: 'warning',
        icon: <AccessTimeIcon />,
        message: `Will cancel on ${formatDate(stripeSub.current_period_end)}`
      };
    }
    
    if (payment?.status === 'canceled') {
      return {
        label: 'Cancelled',
        color: 'error',
        icon: <CancelIcon />,
        message: 'Subscription has been cancelled'
      };
    }
    
    // Vérifier si actif
    const isActive = subscriptionData.has_active_subscription === true ||
                     subscriptionData.status === 'active' ||
                     (subscriptionData.subscription_summary?.days_remaining || 0) > 0;
    
    if (isActive) {
      return {
        label: 'Active',
        color: 'success',
        icon: <CheckCircleIcon />,
        message: 'Subscription is active'
      };
    }
    
    return {
      label: 'Inactive',
      color: 'error',
      icon: <ErrorIcon />,
      message: 'No active subscription'
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" p={4}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading subscription details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={fetchSubscriptionDetails}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            }
          >
            <Typography variant="body1" fontWeight="bold">
              Failed to load subscription details
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
          
          <Box textAlign="center" py={2}>
            <Button
              variant="outlined"
              onClick={() => window.location.href = '/certifications'}
              sx={{ mr: 2 }}
            >
              View Plans
            </Button>
            <Button
              variant="contained"
              onClick={fetchSubscriptionDetails}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Déterminer si l'abonnement est actif
  const isActive = subscriptionData.has_active_subscription === true ||
                   subscriptionData.status === 'active' ||
                   (subscriptionData.subscription_summary?.days_remaining || 0) > 0;
  
  const status = getSubscriptionStatus();
  
  // Si pas actif, afficher un message
  if (!isActive) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <InfoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {subscriptionData.status === 'pending' ? 'Payment Processing' : 'No Active Subscription'}
            </Typography>
            
            {subscriptionData.status === 'pending' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Your payment is being processed. This page will update automatically...
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="caption">
                    Auto-refreshing every 5 seconds
                  </Typography>
                </Box>
              </Alert>
            )}
            
            <Typography color="text.secondary" paragraph>
              {subscriptionData.message || 'You don\'t have an active premium subscription.'}
            </Typography>
            
            <Box display="flex" gap={2} justifyContent="center" mt={3}>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/certifications'}
              >
                View Premium Plans
              </Button>
              
              <Button
                variant="outlined"
                onClick={fetchSubscriptionDetails}
                startIcon={<RefreshIcon />}
                disabled={autoRefresh}
              >
                {autoRefresh ? 'Auto-refreshing...' : 'Refresh Status'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Si actif, afficher la gestion
  const isCancelled = subscriptionData.payment?.status === 'canceled';
  const isScheduledForCancellation = subscriptionData.stripe_subscription?.cancel_at_period_end;

  const endDate = 
    subscriptionData.certification?.subscription_end ||
    subscriptionData.subscription_summary?.end_date ||
    subscriptionData.payment?.subscription_end;

  const daysRemaining = 
    subscriptionData.certification?.days_remaining ||
    subscriptionData.subscription_summary?.days_remaining ||
    0;

  return (
    <>
      <Card>
        <CardHeader
          title="Subscription Management"
          subheader="Manage your premium subscription"
          action={
            <Box display="flex" alignItems="center" gap={2}>
              {status && (
                <Chip
                  icon={status.icon}
                  label={status.label}
                  color={status.color}
                  variant="outlined"
                />
              )}
              <Button
                size="small"
                onClick={fetchSubscriptionDetails}
                startIcon={<RefreshIcon />}
                disabled={loading || autoRefresh}
              >
                {autoRefresh ? 'Auto-refresh...' : 'Refresh'}
              </Button>
            </Box>
          }
        />
        
        <CardContent>
          {/* Message Alert */}
          {message.text && (
            <Alert 
              severity={message.type} 
              sx={{ mb: 3 }}
              onClose={() => setMessage({ type: '', text: '' })}
            >
              {message.text}
            </Alert>
          )}

          {/* Auto-refresh indicator */}
          {autoRefresh && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center">
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Payment processing... Auto-refreshing every 5 seconds
                </Typography>
              </Box>
            </Alert>
          )}

          {/* Subscription Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Subscription Details
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Plan" 
                  secondary={
                    subscriptionData.payment?.plan_type ||
                    subscriptionData.subscription_summary?.plan_type ||
                    'Premium'
                  } 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Status" 
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        {status?.label}
                      </Typography>
                      {status?.message && (
                        <Typography variant="caption" color="text.secondary">
                          {status.message}
                        </Typography>
                      )}
                    </Box>
                  } 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Current Period End" 
                  secondary={formatDate(endDate)} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Days Remaining" 
                  secondary={
                    daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'
                  } 
                />
              </ListItem>
              
              {subscriptionData.payment?.amount && (
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Amount" 
                    secondary={`${subscriptionData.payment.amount} ${subscriptionData.payment.currency || 'USD'}`} 
                  />
                </ListItem>
              )}
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Box display="flex" gap={2}>
            {!isCancelled && !isScheduledForCancellation ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
                fullWidth
               
              >
                {subscriptionData.can_cancel ? 'Cancel Subscription' : 'Cannot Cancel'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircleIcon />}
                onClick={() => setReactivateDialogOpen(true)}
                fullWidth
                disabled={processing}
              >
                Reactivate Subscription
              </Button>
            )}
            
            <Button
              variant="outlined"
              onClick={() => window.open('https://billing.stripe.com/', '_blank')}
              fullWidth
              disabled={!subscriptionData.payment?.stripe_subscription_id}
            >
              Billing Portal
            </Button>
          </Box>

          {/* Additional Info */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Changes may take a few moments to reflect. 
              Use the Refresh button to update the status.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => !processing && setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Cancel Subscription</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Are you sure you want to cancel your subscription? This action may affect your access to premium features.
            </Typography>
          </Alert>

          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend">Cancellation Options</FormLabel>
            <RadioGroup
              value={cancellationType}
              onChange={(e) => setCancellationType(e.target.value)}
            >
              <FormControlLabel
                value="end_of_period"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Cancel at Period End
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Continue premium access until {formatDate(endDate)}.
                      No further charges will be made.
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                value="immediate"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Cancel Immediately
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lose access to premium features immediately. 
                      You may receive a prorated refund for unused time.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          <Alert severity="error" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> Immediate cancellation will revoke your premium access right away.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={processing}>
            Go Back
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubscription}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {processing ? 'Processing...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={reactivateDialogOpen} onClose={() => !processing && setReactivateDialogOpen(false)}>
        <DialogTitle>
          Reactivate Subscription
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Reactivating your subscription will restore premium access and resume billing.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Your subscription will be reactivated immediately. 
            You'll be charged on your next billing date.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReactivateDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReactivateSubscription}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {processing ? 'Processing...' : 'Reactivate'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubscriptionManagement;
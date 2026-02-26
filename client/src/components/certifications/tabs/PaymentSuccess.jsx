// Dans votre composant PaymentSuccess.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { certificationService } from '../../services/certificationService';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  
  const [status, setStatus] = useState('loading'); // loading, success, failed, processing
  const [paymentData, setPaymentData] = useState(null);
  const [certificationData, setCertificationData] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [autoCheck, setAutoCheck] = useState(true);

  const checkPaymentStatus = async () => {
    if (!sessionId) {
      setError('No session ID found in URL');
      setStatus('failed');
      return;
    }

    try {
      console.log('🔄 Checking payment status for session:', sessionId);
      
      const response = await certificationService.checkoutSuccess(sessionId);
      console.log('✅ API Response:', response);
      
      if (response.data.status === 'success' || response.data.status === 'already_completed') {
        setStatus('success');
        setPaymentData(response.data.payment);
        setCertificationData(response.data.certification);
        
        // Si une redirection est fournie, attendre un peu puis rediriger
        if (response.data.redirect_url) {
          setTimeout(() => {
            window.location.href = '/certifications/'; // Redirige vers la page des certifications
          }, 3000);
        }
        
      } else if (response.data.status === 'processing') {
        setStatus('processing');
        setPaymentData(response.data);
        
        // Si l'API suggère de réessayer, configurer un auto-refresh
        if (autoCheck && retryCount < 10) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            checkPaymentStatus();
          }, 3000);
        }
        
      } else if (response.data.status === 'failed') {
        setStatus('failed');
        setError(response.data.message || 'Payment failed');
      } else {
        setStatus('failed');
        setError('Unknown payment status');
      }
      
    } catch (err) {
      console.error('❌ Error checking payment status:', err);
      
      // Vérifier la structure de l'erreur
      let errorMessage = 'Failed to verify payment';
      if (err.response) {
        console.error('Error response:', err.response);
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setStatus('failed');
      
      // Réessayer si c'est une erreur réseau
      if (autoCheck && retryCount < 5 && err.message?.includes('Network')) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkPaymentStatus();
        }, 5000);
      }
    }
  };

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    } else {
      setError('No session ID provided');
      setStatus('failed');
    }
  }, [sessionId]);

  // Auto-refresh pour les paiements en cours
  useEffect(() => {
    let interval;
    if (status === 'processing' && autoCheck) {
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, autoCheck]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box textAlign="center" py={6}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Verifying Payment...
            </Typography>
            <Typography color="text.secondary">
              Please wait while we verify your payment.
            </Typography>
            {retryCount > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Attempt {retryCount} of 10
              </Typography>
            )}
          </Box>
        );

      case 'success':
        return (
          <Box>
            <Alert 
              severity="success" 
              icon={<CheckCircleIcon fontSize="large" />}
              sx={{ mb: 4 }}
            >
              <Typography variant="h5" fontWeight="bold">
                Payment Successful! 🎉
              </Typography>
              <Typography variant="body1">
                Your premium subscription has been activated.
              </Typography>
            </Alert>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Payment Details
              </Typography>
              {paymentData && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Status:</strong> Completed
                  </Typography>
                  {paymentData.amount && (
                    <Typography variant="body2">
                      <strong>Amount:</strong> ${paymentData.amount} {paymentData.currency || 'USD'}
                    </Typography>
                  )}
                  {paymentData.subscription_end && (
                    <Typography variant="body2">
                      <strong>Subscription End:</strong> {formatDate(paymentData.subscription_end)}
                    </Typography>
                  )}
                  {paymentData.id && (
                    <Typography variant="body2">
                      <strong>Payment ID:</strong> {paymentData.id}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>

            {certificationData && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light' }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Premium Certification Activated
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Status:</strong> Active
                  </Typography>
                  {certificationData.subscription_end && (
                    <Typography variant="body2">
                      <strong>Valid Until:</strong> {formatDate(certificationData.subscription_end)}
                    </Typography>
                  )}
                </Box>
              </Paper>
            )}

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                You will be redirected to the certifications page in a few seconds...
              </Typography>
            </Alert>

            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                onClick={() => navigate('/certifications')}
                startIcon={<CheckCircleIcon />}
              >
                Go to Certifications
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Box>
        );

      case 'processing':
        return (
          <Box>
            <Alert 
              severity="info" 
              icon={<HourglassEmptyIcon fontSize="large" />}
              sx={{ mb: 4 }}
            >
              <Typography variant="h5" fontWeight="bold">
                Payment Processing
              </Typography>
              <Typography variant="body1">
                Your payment is being processed. This page will update automatically...
              </Typography>
            </Alert>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={24} />
                <Box>
                  <Typography variant="body1">
                    Auto-refreshing every 5 seconds
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Attempt {retryCount} of 10
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {paymentData?.suggestion && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  {paymentData.suggestion}
                </Typography>
              </Alert>
            )}

            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                onClick={checkPaymentStatus}
                startIcon={<RefreshIcon />}
                disabled={!autoCheck}
              >
                Check Now
              </Button>
              <Button
                variant="outlined"
                onClick={() => setAutoCheck(!autoCheck)}
              >
                {autoCheck ? 'Stop Auto-refresh' : 'Start Auto-refresh'}
              </Button>
              <Button
                variant="text"
                onClick={() => navigate('/certifications')}
                startIcon={<ArrowBackIcon />}
              >
                Back to Certifications
              </Button>
            </Box>
          </Box>
        );

      case 'failed':
        return (
          <Box>
            <Alert 
              severity="error" 
              icon={<ErrorIcon fontSize="large" />}
              sx={{ mb: 4 }}
            >
              <Typography variant="h5" fontWeight="bold">
                Payment Verification Failed
              </Typography>
              <Typography variant="body1">
                {error || 'We could not verify your payment.'}
              </Typography>
            </Alert>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                What to do next:
              </Typography>
              <ul style={{ paddingLeft: '20px' }}>
                <li>
                  <Typography variant="body2">
                    Check your email for a payment confirmation from Stripe
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Wait a few minutes and try again
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Contact support if the problem persists
                  </Typography>
                </li>
              </ul>
            </Paper>

            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                onClick={checkPaymentStatus}
                startIcon={<RefreshIcon />}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/certifications')}
              >
                Back to Certifications
              </Button>
              <Button
                variant="text"
                onClick={() => window.location.href = 'mailto:support@example.com'}
              >
                Contact Support
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardHeader
          title="Payment Status"
          subheader={`Session: ${sessionId ? `${sessionId.substring(0, 20)}...` : 'Not found'}`}
        />
        <Divider />
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

     
    </Container>
  );
};

export default PaymentSuccess;
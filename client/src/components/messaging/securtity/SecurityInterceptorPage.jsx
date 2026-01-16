// src/components/security/SecurityViolationPage.jsx
import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Chip,
  Grid,
  Fade,
  Slide,
  IconButton,
  Tooltip,
  LinearProgress,
  Container,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon,
  Report as ReportIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  ExitToApp as ExitToAppIcon,
  GppGood as GppGoodIcon,
  SecurityUpdateGood as SecurityUpdateGoodIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  VpnKey as VpnKeyIcon,
  BugReport as BugReportIcon,
  Timeline as TimelineIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
const SecurityCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e 0%, #311b92 100%)',
  color: 'white',
  borderRadius: theme.spacing(3),
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
  color: 'white',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 6px 20px rgba(255, 65, 108, 0.4)',
  '&:hover': {
    background: 'linear-gradient(135deg, #ff2b5b 0%, #ff3a1f 100%)',
    boxShadow: '0 8px 25px rgba(255, 65, 108, 0.6)',
    transform: 'translateY(-2px)',
  },
  transition: 'all 0.3s ease',
}));

const SecurityViolationPage = ({ violation, violationType, onContinue }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
 const location = useLocation()
  // Traduire le type de violation
  const getViolationTitle = (type) => {
    const titles = {
      unauthorized: 'Unauthorized Access Attempt',
      insufficient_permissions: 'Insufficient Permissions',
      blocked: 'Access Blocked - Security Violation',
      suspicious_activity: 'Suspicious Activity Detected',
      rate_limit: 'Rate Limit Exceeded',
      malware_detected: 'Malicious Activity Detected',
    };
    return titles[type] || 'Security Violation Detected';
  };

  const getViolationDescription = (type) => {
    const descriptions = {
      unauthorized: 'You attempted to access a restricted area without proper authentication.',
      insufficient_permissions: 'Your account does not have sufficient permissions to access this resource.',
      blocked: 'Your access has been temporarily blocked due to repeated security violations.',
      suspicious_activity: 'Suspicious activity patterns detected from your connection.',
      rate_limit: 'Too many requests from your IP address. Please try again later.',
      malware_detected: 'Potential malicious activity detected from your connection.',
    };
    return descriptions[type] || 'A security violation has been detected and logged.';
  };
  useEffect(() => {
    if (location.state) {
      // Si des données sont passées via navigate()
      console.log('Security violation data from location:', location.state);
    }
    
    // Si violation/violationType ne sont pas fournis, utilisez les valeurs par défaut
    if (!violationType) {
      violationType = 'unauthorized'; // Valeur par défaut
    }
    
    if (!violation) {
      violation = {
        path: window.location.pathname,
        reason: 'Access denied by security policy',
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('user_id') || 'anonymous',
        userAgent: navigator.userAgent
      };
    }
  }, [location.state]);

  const getSeverityColor = (type) => {
    const colors = {
      unauthorized: 'warning',
      insufficient_permissions: 'info',
      blocked: 'error',
      suspicious_activity: 'error',
      rate_limit: 'warning',
      malware_detected: 'error',
    };
    return colors[type] || 'error';
  };

  const handleReportIssue = () => {
    // Ouvrir un formulaire de rapport
    window.open('/support/security-issue', '_blank');
  };

  const handleViewLogs = () => {
    navigate('/security/logs');
  };

  const handleEmergencyLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        p: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />

      <Container maxWidth="md">
        <Slide direction="up" in={true} timeout={500}>
          <SecurityCard>
            <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 3, md: 4 } }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                  <SecurityIcon sx={{ fontSize: 80, color: 'error.main' }} />
                  <LockIcon 
                    sx={{ 
                      fontSize: 40, 
                      color: 'warning.main',
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }} 
                  />
                </Box>
                
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, mb: 2 }}>
                  <SecurityIcon sx={{ verticalAlign: 'middle', mr: 2 }} />
                  {getViolationTitle(violationType)}
                </Typography>
                
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
                  {getViolationDescription(violationType)}
                </Typography>
                
                <Chip
                  label={`SECURITY ALERT: ${violationType.toUpperCase()}`}
                  color={getSeverityColor(violationType)}
                  icon={<ShieldIcon />}
                  sx={{ fontSize: '0.9rem', fontWeight: 700, py: 1.5, px: 2 }}
                />
              </Box>

              <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', my: 4 }} />

              {/* Violation Details */}
              <Fade in={true} timeout={800}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon /> Violation Details
                  </Typography>
                  
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                      <Alert 
                        severity="info" 
                        icon={<TimelineIcon />}
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          Path Attempted
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {violation?.path || 'Unknown'}
                        </Typography>
                      </Alert>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Alert 
                        severity="warning" 
                        icon={<AccountTreeIcon />}
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          Reason
                        </Typography>
                        <Typography variant="body2">
                          {violation?.reason || 'Security policy violation'}
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>

                  {showDetails && violation && (
                    <Fade in={showDetails}>
                      <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                          <BugReportIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />
                          Technical Details
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', mb: 1 }}>
                          Timestamp: {new Date(violation.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', mb: 1 }}>
                          User ID: {violation.userId || 'anonymous'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
                          User Agent: {violation.userAgent?.substring(0, 80)}...
                        </Typography>
                      </Box>
                    </Fade>
                  )}
                </Box>
              </Fade>

              {/* Security Progress */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                  Security System Status
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={100} 
                  color="error"
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    <GppGoodIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                    Intrusion Prevention: ACTIVE
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    <SecurityUpdateGoodIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                    Real-time Monitoring: ENABLED
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <GradientButton
                    fullWidth
                    onClick={onContinue}
                    startIcon={<HomeIcon />}
                  >
                    Return to Safety
                  </GradientButton>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowDetails(!showDetails)}
                    startIcon={showDetails ? <VpnKeyIcon /> : <AdminPanelSettingsIcon />}
                    sx={{ 
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                  >
                    {showDetails ? 'Hide Details' : 'View Details'}
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleViewLogs}
                    startIcon={<HistoryIcon />}
                    sx={{ 
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                  >
                    View Logs
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleReportIssue}
                    startIcon={<ReportIcon />}
                    sx={{ 
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                  >
                    Report Issue
                  </Button>
                </Grid>
              </Grid>

              {/* Emergency Actions */}
              <Alert 
                severity="error" 
                icon={<ExitToAppIcon />}
                sx={{ 
                  bgcolor: 'rgba(244, 67, 54, 0.2)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: 2,
                }}
                action={
                  <Tooltip title="Emergency Logout">
                    <IconButton
                      size="small"
                      onClick={handleEmergencyLogout}
                      sx={{ color: 'error.main' }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                }
              >
                <Typography variant="body2">
                  If you believe this is an error or your account has been compromised, 
                  you can perform an emergency logout.
                </Typography>
              </Alert>

              {/* Footer */}
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px dashed', borderColor: 'rgba(255, 255, 255, 0.2)', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>
                  <SecurityIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                  Security System v2.4 • Incident ID: {Math.random().toString(36).substr(2, 12).toUpperCase()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5 }}>
                  All unauthorized access attempts are logged and may be reported to authorities.
                </Typography>
              </Box>
            </CardContent>
          </SecurityCard>
        </Slide>
      </Container>
    </Box>
  );
};

export default SecurityViolationPage;
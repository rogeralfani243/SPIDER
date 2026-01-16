// components/SettingsDashboard/PasswordChangeTab.jsx
import React, { useState, useEffect } from 'react';
import {
  FaKey,
  FaTimes,
  FaEnvelope,
  FaCheckCircle,
  FaRedo,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
  FaArrowLeft,
  FaInfoCircle
} from 'react-icons/fa';
import {
  Box,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import API_URL from '../../hooks/useApiUrl';
import '../../styles/dashboard-table/password-change.css';

// Styles personnalisés
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'visible',
  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  marginBottom: theme.spacing(3),
}));

const StepIndicator = styled(Box)(({ theme, completed, active }) => ({
  width: { xs: 32, sm: 36, md: 40 },
  height: { xs: 32, sm: 36, md: 40 },
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
  backgroundColor: completed ? '#4CAF50' : active ? '#2196F3' : '#E0E0E0',
  color: completed || active ? 'white' : '#666',
  marginRight: theme.spacing(2),
  boxShadow: completed || active ? '0 4px 12px rgba(33, 150, 243, 0.3)' : 'none',
  flexShrink: 0
}));

const CodeInput = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    fontSize: { xs: '1.8rem', sm: '2rem', md: '2.2rem' },
    textAlign: 'center',
    letterSpacing: '0.5em',
    fontFamily: 'monospace',
    height: { xs: 60, sm: 65, md: 70 },
    padding: theme.spacing(2),
    backgroundColor: '#f8f9ff',
    borderRadius: '12px',
    [theme.breakpoints.down('sm')]: {
      letterSpacing: '0.3em',
    }
  },
}));

const PasswordStrengthBar = styled(LinearProgress)(({ theme, strength }) => ({
  height: 8,
  borderRadius: 4,
  marginTop: theme.spacing(1),
  '& .MuiLinearProgress-bar': {
    backgroundColor: strength < 40 ? '#FF5252' : strength < 70 ? '#FFC107' : '#4CAF50',
    borderRadius: 4,
  },
}));

const PasswordChangeTab = () => {
  const { user, token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [step, setStep] = useState(1);
  const [emailCode, setEmailCode] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Compte à rebours
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Vérifier la force du mot de passe
  useEffect(() => {
    if (newPassword) {
      checkPasswordStrength(newPassword);
    } else {
      setPasswordStrength(0);
      setPasswordCriteria({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      });
    }
  }, [newPassword]);

  const resetForm = () => {
    setStep(1);
    setEmailCode('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLocalError('');
    setSuccess('');
    setIsCodeSent(false);
    setCountdown(0);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsLoading(false);
  };

  const checkPasswordStrength = (password) => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    setPasswordCriteria(criteria);
    
    const met = Object.values(criteria).filter(Boolean).length;
    setPasswordStrength((met / 5) * 100);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'No password';
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  // 1. Demander un code de changement de mot de passe
  const handleRequestCode = async () => {
    setIsLoading(true);
    setLocalError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_URL}/api/account/request-password-change-code/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send verification code');
      }

      const result = await response.json();
      console.log('Code requested successfully:', result);
      
      setIsCodeSent(true);
      setStep(2);
      setCountdown(900);
      setSuccess('Verification code sent to your email');
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to send verification code';
      setLocalError(errorMessage);
      console.error('Error requesting code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Vérifier le code reçu
  const handleVerifyCode = async () => {
    if (emailCode.length !== 6) {
      setLocalError('Please enter the 6-digit code');
      return;
    }
    
    setIsLoading(true);
    setLocalError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_URL}/api/account/verify-password-change-code/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ 
          code: emailCode
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid verification code');
      }

      const result = await response.json();
      console.log('Code verified successfully:', result);
      
      setStep(3);
      setSuccess('Email verified successfully');
      
    } catch (err) {
      const errorMessage = err.message || 'Invalid verification code';
      setLocalError(errorMessage);
      console.error('Error verifying code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Changer le mot de passe
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setLocalError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setLocalError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters long');
      return;
    }
    
    if (passwordStrength < 40) {
      setLocalError('Please choose a stronger password');
      return;
    }
    
    setIsLoading(true);
    setLocalError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_URL}/api/account/change-password/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ 
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }

      const result = await response.json();
      console.log('Password changed successfully:', result);
      
      setSuccess('Password changed successfully! You will be logged out in 5 seconds...');
      
      setTimeout(() => {
        window.location.reload();
      }, 5000);
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to change password';
      setLocalError(errorMessage);
      console.error('Error changing password:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setLocalError('');
      setSuccess('');
    }
  };

  const steps = [
    { label: 'Verify Email', description: 'Send verification code' },
    { label: 'Enter Code', description: 'Verify your identity' },
    { label: 'New Password', description: 'Set new password' }
  ];

  return (
    <div className="password-change-tab">
      {/* Header */}
      <StyledCard>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: '#2196F3', width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
              <FaLock fontSize={isMobile ? 'small' : 'medium'} />
            </Avatar>
          }
          title={
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              fontWeight="600"
              sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
            >
              Change Password
            </Typography>
          }
          subheader={
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Secure your account with a new password
            </Typography>
          }
        />
        <CardContent>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            paragraph
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            For security reasons, we need to verify your identity before you can change your password.
            Follow these 3 simple steps to update your password.
          </Typography>
        </CardContent>
      </StyledCard>

      {/* Stepper - Version responsive */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Stepper 
          activeStep={step - 1} 
          alternativeLabel
          sx={{
            '& .MuiStepLabel-label': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              '&.Mui-active, &.Mui-completed': {
                fontWeight: 600
              }
            }
          }}
        >
          {steps.map((stepLabel, index) => (
            <Step key={stepLabel.label}>
              <StepLabel>
                <Typography 
                  variant="subtitle2" 
                  fontWeight="500"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {stepLabel.label}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {stepLabel.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Message d'erreur */}
      {localError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setLocalError('')}
            >
              <FaTimes fontSize="inherit" />
            </IconButton>
          }
        >
          {localError}
        </Alert>
      )}

      {/* Message de succès */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setSuccess('')}
            >
              <FaTimes fontSize="inherit" />
            </IconButton>
          }
        >
          {success}
        </Alert>
      )}

      {/* Contenu par étape */}
      <div className="password-change-content">
        {/* Étape 1: Demander le code par email */}
        {step === 1 && (
          <StyledCard>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box 
                display="flex" 
                alignItems="center" 
                mb={3}
                flexDirection={{ xs: 'column', sm: 'row' }}
                textAlign={{ xs: 'center', sm: 'left' }}
              >
                <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 0 }}>
                  <StepIndicator completed={false} active={step === 1}>
                    1
                  </StepIndicator>
                  <Box>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Email Verification
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      We'll send a verification code to your email
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={2} flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 2, sm: 0 }}>
                  <Box display="flex" alignItems="center" mr={{ sm: 2 }}>
                    <FaEnvelope style={{ 
                      marginRight: 12, 
                      fontSize: isMobile ? 20 : 24, 
                      color: '#2196F3' 
                    }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Your email address
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {user?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  A 6-digit verification code will be sent to this address. Check your spam folder if you don't see it.
                </Typography>
              </Paper>

              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size={isMobile ? "medium" : "large"}
                  fullWidth
                  onClick={handleRequestCode}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <FaEnvelope />}
                >
                  {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
              </Box>
            </CardContent>
          </StyledCard>
        )}

        {/* Étape 2: Entrer le code de vérification */}
        {step === 2 && (
          <StyledCard>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box 
                display="flex" 
                alignItems="center" 
                mb={3}
                flexDirection={{ xs: 'column', sm: 'row' }}
                textAlign={{ xs: 'center', sm: 'left' }}
              >
                <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 0 }}>
                  <StepIndicator completed={false} active={step === 2}>
                    2
                  </StepIndicator>
                  <Box>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Enter Verification Code
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Enter the 6-digit code from your email
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
                <Typography 
                  variant="body1" 
                  paragraph
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  A 6-digit code has been sent to: <strong>{user?.email}</strong>
                </Typography>

                {countdown > 0 && (
                  <Chip
                    icon={<span>⏰</span>}
                    label={`Expires in: ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`}
                    color="warning"
                    sx={{ 
                      mb: 3,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  />
                )}

                <Box sx={{ my: 4 }}>
                  <CodeInput
                    fullWidth
                    value={emailCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setEmailCode(value);
                      setLocalError('');
                    }}
                    placeholder="000000"
                    autoFocus
                    disabled={isLoading || countdown === 0}
                  />
                </Box>

                <Box 
                  display="flex" 
                  justifyContent="center" 
                  gap={2} 
                  mt={3}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={isLoading}
                    startIcon={<FaArrowLeft />}
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleRequestCode}
                    disabled={isLoading || countdown > 300}
                    startIcon={<FaRedo />}
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                    sx={{ mt: { xs: 1, sm: 0 } }}
                  >
                    Resend Code
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleVerifyCode}
                    disabled={isLoading || emailCode.length !== 6 || countdown === 0}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <FaCheckCircle />}
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                    sx={{ mt: { xs: 1, sm: 0 } }}
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                  </Button>
                </Box>
              </Paper>
            </CardContent>
          </StyledCard>
        )}

        {/* Étape 3: Changer le mot de passe */}
        {step === 3 && (
          <StyledCard>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box 
                display="flex" 
                alignItems="center" 
                mb={3}
                flexDirection={{ xs: 'column', sm: 'row' }}
                textAlign={{ xs: 'center', sm: 'left' }}
              >
                <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 0 }}>
                  <StepIndicator completed={false} active={step === 3}>
                    3
                  </StepIndicator>
                  <Box>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Set New Password
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Create a strong new password for your account
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {/* Ancien mot de passe */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setLocalError('');
                    }}
                    placeholder="Enter your current password"
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaLock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            edge="end"
                            size="small"
                          >
                            {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Nouveau mot de passe */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setLocalError('');
                    }}
                    placeholder="Enter your new password"
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaKey color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            size="small"
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Force du mot de passe */}
                {newPassword && (
                  <Grid item xs={12}>
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Password strength: <strong>{getPasswordStrengthText()}</strong>
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {Math.round(passwordStrength)}%
                        </Typography>
                      </Box>
                      <PasswordStrengthBar
                        variant="determinate"
                        value={passwordStrength}
                        strength={passwordStrength}
                      />
                    </Box>
                  </Grid>
                )}

                {/* Critères du mot de passe */}
                {newPassword && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography 
                        variant="subtitle2" 
                        gutterBottom 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        <FaInfoCircle size={isMobile ? 12 : 14} />
                        Password requirements:
                      </Typography>
                      <List dense>
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <Typography color={passwordCriteria.length ? '#4CAF50' : '#FF5252'}>
                              {passwordCriteria.length ? '✓' : '✗'}
                            </Typography>
                          </ListItemIcon>
                          <ListItemText 
                            primary="At least 8 characters" 
                            sx={{ 
                              '& .MuiTypography-root': { 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                              } 
                            }} 
                          />
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <Typography color={passwordCriteria.uppercase ? '#4CAF50' : '#FF5252'}>
                              {passwordCriteria.uppercase ? '✓' : '✗'}
                            </Typography>
                          </ListItemIcon>
                          <ListItemText 
                            primary="One uppercase letter" 
                            sx={{ 
                              '& .MuiTypography-root': { 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                              } 
                            }} 
                          />
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <Typography color={passwordCriteria.lowercase ? '#4CAF50' : '#FF5252'}>
                              {passwordCriteria.lowercase ? '✓' : '✗'}
                            </Typography>
                          </ListItemIcon>
                          <ListItemText 
                            primary="One lowercase letter" 
                            sx={{ 
                              '& .MuiTypography-root': { 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                              } 
                            }} 
                          />
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <Typography color={passwordCriteria.number ? '#4CAF50' : '#FF5252'}>
                              {passwordCriteria.number ? '✓' : '✗'}
                            </Typography>
                          </ListItemIcon>
                          <ListItemText 
                            primary="One number" 
                            sx={{ 
                              '& .MuiTypography-root': { 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                              } 
                            }} 
                          />
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <Typography color={passwordCriteria.special ? '#4CAF50' : '#FF5252'}>
                              {passwordCriteria.special ? '✓' : '✗'}
                            </Typography>
                          </ListItemIcon>
                          <ListItemText 
                            primary="One special character (!@#$% etc.)" 
                            sx={{ 
                              '& .MuiTypography-root': { 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                              } 
                            }} 
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                )}

                {/* Confirmer le nouveau mot de passe */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setLocalError('');
                    }}
                    placeholder="Confirm your new password"
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaKey color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    error={confirmPassword && newPassword !== confirmPassword}
                    helperText={
                      confirmPassword && newPassword !== confirmPassword
                        ? 'Passwords do not match'
                        : confirmPassword && newPassword === confirmPassword
                        ? 'Passwords match ✓'
                        : ''
                    }
                  />
                </Grid>
              </Grid>

              <Box 
                display="flex" 
                justifyContent="space-between" 
                mt={4}
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={{ xs: 2, sm: 0 }}
              >
                <Box 
                  display="flex" 
                  gap={2}
                  justifyContent={{ xs: 'center', sm: 'flex-start' }}
                  order={{ xs: 2, sm: 1 }}
                >
                  <Button
                    onClick={resetForm}
                    disabled={isLoading}
                    startIcon={<FaTimes />}
                    size={isMobile ? "small" : "medium"}
                  >
                    Start Over
                  </Button>
                  <Button
                    onClick={handleBack}
                    disabled={isLoading}
                    startIcon={<FaArrowLeft />}
                    size={isMobile ? "small" : "medium"}
                  >
                    Back to Code
                  </Button>
                </Box>
                <Box order={{ xs: 1, sm: 2 }} mb={{ xs: 2, sm: 0 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size={isMobile ? "medium" : "large"}
                    onClick={handleChangePassword}
                    disabled={
                      isLoading ||
                      !oldPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword ||
                      passwordStrength < 40
                    }
                    startIcon={isLoading ? <CircularProgress size={20} /> : <FaKey />}
                    fullWidth={isMobile}
                  >
                    {isLoading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        )}
      </div>

      {/* Informations de sécurité */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mt: 3, 
          borderRadius: 2, 
          bgcolor: '#f8f9ff' 
        }}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <FaShieldAlt style={{ 
            marginRight: 12, 
            color: '#2196F3', 
            fontSize: isMobile ? 16 : 20 
          }} />
          <Typography 
            variant="subtitle1" 
            fontWeight="600"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Security Tips
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List dense>
          <ListItem>
            <ListItemText 
              primary="• Never share your password or verification codes with anyone" 
              sx={{ 
                '& .MuiTypography-root': { 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                } 
              }} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="• Use a unique password that you don't use elsewhere" 
              sx={{ 
                '& .MuiTypography-root': { 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                } 
              }} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="• Consider using a password manager to generate and store strong passwords" 
              sx={{ 
                '& .MuiTypography-root': { 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                } 
              }} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="• Enable two-factor authentication for extra security" 
              sx={{ 
                '& .MuiTypography-root': { 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                } 
              }} 
            />
          </ListItem>
        </List>
        <Box sx={{ mt: 2 }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Need help? <a 
              href="/support" 
              style={{ 
                color: '#2196F3', 
                textDecoration: 'none', 
                fontWeight: '500',
                fontSize: 'inherit'
              }}
            >
              Contact Support
            </a>
          </Typography>
        </Box>
      </Paper>
    </div>
  );
};

export default PasswordChangeTab;
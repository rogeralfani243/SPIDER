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
  FaShieldAlt
} from 'react-icons/fa';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
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
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import '../../styles/auth/change-password.css'
// Styles personnalisés
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    maxWidth: 500,
    width: '100%',
  },
}));

const StepIndicator = styled(Box)(({ theme, completed, active }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  backgroundColor: completed ? '#28a745' : active ? '#007bff' : '#e9ecef',
  color: completed || active ? 'white' : '#6c757d',
  marginRight: theme.spacing(1),
}));

const CodeInput = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    fontSize: '2rem',
    textAlign: 'center',
    letterSpacing: '0.5em',
    fontFamily: 'monospace',
    height: '60px',
    padding: theme.spacing(1),
  },
}));

const PasswordStrengthBar = styled(LinearProgress)(({ theme, strength }) => ({
  height: 8,
  borderRadius: 4,
  marginTop: theme.spacing(1),
  '& .MuiLinearProgress-bar': {
    backgroundColor: strength < 40 ? '#dc3545' : strength < 70 ? '#ffc107' : '#28a745',
  },
}));

const PasswordChangeModal = ({
  isOpen,
  onClose,
  user,
  onRequestCode,
  onVerifyCode,
  onChangePassword,
  loading,
  error,
  onSupportClick
}) => {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: change password
  const [emailCode, setEmailCode] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Reset quand la modal ferme
  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

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

  const resetModal = () => {
    setStep(1);
    setEmailCode('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLocalError('');
    setIsCodeSent(false);
    setCountdown(0);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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
    
    // Calculer la force (0-100)
    const met = Object.values(criteria).filter(Boolean).length;
    setPasswordStrength((met / 5) * 100);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'No password';
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  const handleRequestCode = async () => {
    setLocalError('');
    try {
      const response = await onRequestCode();
      setIsCodeSent(true);
      setStep(2);
      setCountdown(15 * 60); // 15 minutes
      return response;
    } catch (err) {
      const errorMsg = err.error || err.message || 'Failed to send code';
      setLocalError(errorMsg);
      throw err;
    }
  };

  const handleVerifyCode = async () => {
    if (emailCode.length !== 6) {
      setLocalError('Please enter the 6-digit code');
      return;
    }
    
    setLocalError('');
    try {
      const response = await onVerifyCode(emailCode);
      setStep(3); // Passer à l'étape de changement de mot de passe
      return response;
    } catch (err) {
      const errorMsg = err.error || err.message || 'Invalid code';
      setLocalError(errorMsg);
      throw err;
    }
  };

  const handleChangePassword = async () => {
    // Validation
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
    
    // Vérifier les critères de force
    if (passwordStrength < 40) {
      setLocalError('Please choose a stronger password');
      return;
    }
    
    setLocalError('');
    try {
      await onChangePassword(oldPassword, newPassword, confirmPassword);
    } catch (err) {
      const errorMsg = err.error || err.message || 'Failed to change password';
      setLocalError(errorMsg);
      throw err;
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel the password change process?')) {
      onClose();
    }
  };

  const steps = [
    { label: 'Verify Email', description: 'Send verification code' },
    { label: 'Enter Code', description: 'Verify your identity' },
    { label: 'New Password', description: 'Set new password' }
  ];

  const displayError = localError || error?.error || error;

  return (
    <StyledDialog
      open={isOpen}
      onClose={handleCancel}
      aria-labelledby="password-change-dialog-title"
    >
      <DialogTitle id="password-change-dialog-title">
        <Box display="flex" alignItems="center">
          <FaLock style={{ marginRight: 12 }} />
          <Typography variant="h6" component="span">
            Change Password
          </Typography>
          <Box flexGrow={1} />
          <IconButton
            onClick={handleCancel}
            disabled={loading}
            size="small"
          >
            <FaTimes />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Indicateur d'étapes */}
        <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((stepLabel, index) => (
            <Step key={stepLabel.label}>
              <StepLabel>{stepLabel.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Message d'erreur */}
        {displayError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {displayError}
          </Alert>
        )}

        {/* Étape 1: Demander le code par email */}
        {step === 1 && (
          <Box>
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <FaShieldAlt style={{ marginRight: 8 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Security Verification Required
                </Typography>
              </Box>
              <Typography variant="body2">
                For security reasons, we need to verify your identity before you can change your password.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <FaEnvelope style={{ marginRight: 8, color: '#6c757d' }} />
                <Typography variant="body2" color="textSecondary">
                  Email on file
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                {user?.email}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                We'll send a 6-digit verification code to this address.
              </Typography>
            </Paper>

            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography>✓</Typography>
                </ListItemIcon>
                <ListItemText primary="Check your spam folder if you don't see the email" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography>✓</Typography>
                </ListItemIcon>
                <ListItemText primary="The code expires in 15 minutes" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography>✓</Typography>
                </ListItemIcon>
                <ListItemText primary="Never share your verification code with anyone" />
              </ListItem>
            </List>
          </Box>
        )}

        {/* Étape 2: Entrer le code de vérification */}
        {step === 2 && (
          <Box>
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Box display="flex" alignItems="center">
                <FaCheckCircle style={{ marginRight: 8 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Enter Verification Code
                </Typography>
              </Box>
            </Paper>

            <Typography variant="body1" gutterBottom>
              A 6-digit code has been sent to: <strong>{user?.email}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Please enter the code you received in your email.
            </Typography>

            {countdown > 0 && (
              <Chip
                icon={<span>⏰</span>}
                label={`Code expires in: ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`}
                color="warning"
                sx={{ mb: 2 }}
              />
            )}

            {countdown === 0 && isCodeSent && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Code has expired. Please request a new one.
              </Alert>
            )}

            <Box sx={{ my: 3 }}>
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
                disabled={loading || countdown === 0}
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                6-digit code from your email
              </Typography>
            </Box>
          </Box>
        )}

        {/* Étape 3: Changer le mot de passe */}
        {step === 3 && (
          <Box>
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Box display="flex" alignItems="center">
                <FaCheckCircle style={{ marginRight: 8 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Email Verified Successfully
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your email has been verified. You can now set a new password.
              </Typography>
            </Paper>

            <Box sx={{ '& > *': { mb: 3 } }}>
              {/* Ancien mot de passe */}
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
                autoFocus
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
                      >
                        {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Nouveau mot de passe */}
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
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {newPassword && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">
                      Password strength: <strong>{getPasswordStrengthText()}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {Math.round(passwordStrength)}%
                    </Typography>
                  </Box>
                  <PasswordStrengthBar
                    variant="determinate"
                    value={passwordStrength}
                    strength={passwordStrength}
                  />
                </Box>
              )}

              {/* Critères du mot de passe */}
              {newPassword && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Password must contain:
                  </Typography>
                  <List dense>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <Typography color={passwordCriteria.length ? 'success.main' : 'error.main'}>
                          {passwordCriteria.length ? '✓' : '✗'}
                        </Typography>
                      </ListItemIcon>
                      <ListItemText primary="At least 8 characters" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <Typography color={passwordCriteria.uppercase ? 'success.main' : 'error.main'}>
                          {passwordCriteria.uppercase ? '✓' : '✗'}
                        </Typography>
                      </ListItemIcon>
                      <ListItemText primary="One uppercase letter" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <Typography color={passwordCriteria.lowercase ? 'success.main' : 'error.main'}>
                          {passwordCriteria.lowercase ? '✓' : '✗'}
                        </Typography>
                      </ListItemIcon>
                      <ListItemText primary="One lowercase letter" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <Typography color={passwordCriteria.number ? 'success.main' : 'error.main'}>
                          {passwordCriteria.number ? '✓' : '✗'}
                        </Typography>
                      </ListItemIcon>
                      <ListItemText primary="One number" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <Typography color={passwordCriteria.special ? 'success.main' : 'error.main'}>
                          {passwordCriteria.special ? '✓' : '✗'}
                        </Typography>
                      </ListItemIcon>
                      <ListItemText primary="One special character" />
                    </ListItem>
                  </List>
                </Paper>
              )}

              {/* Confirmer le nouveau mot de passe */}
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
                    ? 'Passwords match'
                    : ''
                }
              />
            </Box>
          </Box>
        )}

        {/* Informations de sécurité */}
        <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
          <Box display="flex" alignItems="center" mb={1}>
            <FaShieldAlt style={{ marginRight: 8, color: '#6c757d' }} />
            <Typography variant="body2" fontWeight="bold">
              Security Notice:
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Never share your password or verification codes.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Need help? <a onClick={onSupportClick} style={{ color: '#007bff', textDecoration: 'none', cursor:'pointer' }}>Contact Support</a>
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {/* Étape 1: Bouton Envoyer le code */}
        {step === 1 && (
          <>
            <Button
              onClick={handleCancel}
              disabled={loading}
              startIcon={<FaTimes />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleRequestCode}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <FaEnvelope />}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>
          </>
        )}

        {/* Étape 2: Bouton Vérifier le code */}
        {step === 2 && (
          <Box display="flex" justifyContent="space-between" width="100%">
            <Box>
              <Button
                onClick={() => setStep(1)}
                disabled={loading}
                startIcon={<FaTimes />}
              >
                Back
              </Button>
              <Button
                onClick={handleRequestCode}
                disabled={loading}
                startIcon={<FaRedo />}
                sx={{ ml: 1 }}
              >
                Resend Code
              </Button>
            </Box>
            <Button
              variant="contained"
              onClick={handleVerifyCode}
              disabled={loading || emailCode.length !== 6 || countdown === 0}
              startIcon={loading ? <CircularProgress size={16} /> : <FaCheckCircle />}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </Box>
        )}

        {/* Étape 3: Bouton Changer le mot de passe */}
        {step === 3 && (
          <Box display="flex" justifyContent="space-between" width="100%">
            <Box>
              <Button
                onClick={handleCancel}
                disabled={loading}
                startIcon={<FaTimes />}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={loading}
                sx={{ ml: 1 }}
              >
                Back to Verification
              </Button>
            </Box>
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={
                loading ||
                !oldPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                passwordStrength < 40
              }
              startIcon={loading ? <CircularProgress size={16} /> : <FaKey />}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </Box>
        )}
      </DialogActions>
    </StyledDialog>
  );
};

export default PasswordChangeModal;
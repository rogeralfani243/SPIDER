import React, { useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  TextField,
  Avatar,
  IconButton,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  CameraAlt as CameraIcon,
  Image as ImageIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import api from '../services/api'; // Assurez-vous que le chemin est correct

const PersonalInfoStep = ({ 
  profile, 
  errors, 
  loading, 
  previewImage, 
  previewImageBio,
  handleInputChange, 
  handleImageChange,
  handleImageBioChange 
}) => {
  // State pour le dialogue de vérification d'email
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);

  // Gérer l'ouverture du dialogue de vérification
  const handleEmailClick = () => {
    setNewEmail(profile.email || '');
    setEmailDialogOpen(true);
    setVerifyError('');
    setVerifySuccess(false);
    setPassword('');
  };

  // Gérer la fermeture du dialogue
  const handleCloseDialog = () => {
    setEmailDialogOpen(false);
    setPassword('');
    setVerifyError('');
    setVerifySuccess(false);
  };

  // Basculer l'affichage du mot de passe
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Vérifier le mot de passe et mettre à jour l'email
  const handleVerifyPassword = async () => {
    if (!password) {
      setVerifyError('Password is required');
      return;
    }

    if (!newEmail) {
      setVerifyError('Email is required');
      return;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setVerifyError('Please enter a valid email address');
      return;
    }

    try {
      setVerifying(true);
      setVerifyError('');

      const response = await api.post('/accounts/verify-password/', {
        password: password
      });

      if (response.data.verified) {
        setVerifySuccess(true);
        
        // Mettre à jour l'email via le handler parent
        setTimeout(() => {
          handleInputChange({
            target: { name: 'email', value: newEmail }
          });
          handleCloseDialog();
        }, 1500);
      } else {
        setVerifyError('Incorrect password');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setVerifyError(error.response?.data?.error || 'Failed to verify password');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            {/* Background Bio Image */}
            {previewImageBio && (
              <Box 
                sx={{ 
                  position: 'relative',
                  width: '100%',
                  height: 200,
                  mb: 3,
                  borderRadius: 2,
                  overflow: 'hidden',
                  backgroundImage: `url(${previewImageBio})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  border: '1px solid #e0e0e0'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Profile Image Container */}
                  <Box sx={{ position: 'relative' }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-image-upload"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <label htmlFor="profile-image-upload">
                      <IconButton component="span">
                        <Avatar
                          sx={{
                            width: 120,
                            height: 120,
                            border: `3px solid white`,
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8
                            }
                          }}
                          src={previewImage}
                        >
                          {!previewImage && <CameraIcon sx={{ fontSize: 40 }} />}
                        </Avatar>
                      </IconButton>
                    </label>
                  </Box>
                </Box>
              </Box>
            )}
            
            {/* Bio Image Upload Button - visible même sans background */}
            <Box sx={{ width: '100%', mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="bio-image-upload"
                type="file"
                onChange={handleImageBioChange}
              />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Profile Background Image (Optional)
              </Typography>
              <label htmlFor="bio-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<ImageIcon />}
                  sx={{ mb: 2 }}
                  fullWidth
                >
                  {previewImageBio ? 'Change Background Image' : 'Add Background Image'}
                </Button>
              </label>
              
              {/* Version sans background (quand previewImageBio n'existe pas) */}
              {!previewImageBio && (
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-image-upload-fallback"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="profile-image-upload-fallback">
                    <IconButton 
                      component="span" 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        margin: '0 auto'
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 120,
                          height: 120,
                          border: `3px solid`,
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                        src={previewImage}
                      >
                        {!previewImage && <CameraIcon sx={{ fontSize: 40 }} />}
                      </Avatar>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                        Click to change profile photo
                      </Typography>
                    </IconButton>
                  </label>
                </Box>
              )}
            </Box>
            
            <Typography variant="caption" color="textSecondary">
              Background image will be displayed behind your profile photo (max 5MB)
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={profile.first_name}
            onChange={handleInputChange}
            error={!!errors.first_name}
            helperText={errors.first_name}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={profile.last_name}
            onChange={handleInputChange}
            error={!!errors.last_name}
            helperText={errors.last_name}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        {/* ✅ EMAIL MODIFIÉ - Avec vérification de mot de passe */}
        <Grid item xs={12}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={profile.email}
              onClick={handleEmailClick}
              onChange={() => {}} // Désactivé - modification via dialogue
              error={!!errors.email}
              helperText={errors.email || 'Click to change your email address'}
              disabled={loading}
              InputProps={{
                readOnly: true, // Rend le champ non éditable directement
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleEmailClick}
                      edge="end"
                      size="small"
                      sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        mr: -0.5
                      }}
                    >
                      <LockIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.02)'
                  }
                }
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={profile.phone || ''}
            onChange={handleInputChange}
            error={!!errors.phone}
            helperText={errors.phone}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Birth Date"
            name="birth_date"
            type="date"
            value={profile.birth_date}
            onChange={handleInputChange}
            error={!!errors.birth_date}
            helperText={errors.birth_date}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* ✅ DIALOGUE DE VÉRIFICATION DU MOT DE PASSE - NOUVEAU */}
      <Dialog 
        open={emailDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LockIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Verify Your Password
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {verifySuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✓ Password verified! Updating your email...
              </Alert>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  For security reasons, please confirm your password to change your email address.
                </Alert>
                
                <TextField
                  fullWidth
                  label="New Email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={verifying}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Current Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!verifyError}
                  helperText={verifyError}
                  disabled={verifying}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={verifying}
            variant="outlined"
          >
            Cancel
          </Button>
          
          {!verifySuccess && (
            <Button
              onClick={handleVerifyPassword}
              variant="contained"
              disabled={verifying || !password || !newEmail}
              startIcon={verifying ? <CircularProgress size={20} /> : <LockIcon />}
            >
              {verifying ? 'Verifying...' : 'Verify & Update'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PersonalInfoStep;
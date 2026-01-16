import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  Paper,
  useTheme,
  useMediaQuery,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Language as LanguageIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Public as PublicIcon,
  PinDrop as PinDropIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const PLATFORM_OPTIONS = [
  { value: 'website', label: 'Website', icon: <LanguageIcon /> },
  { value: 'github', label: 'GitHub', icon: <GitHubIcon /> },
  { value: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon /> },
  { value: 'twitter', label: 'Twitter', icon: <TwitterIcon /> },
  { value: 'instagram', label: 'Instagram', icon: <InstagramIcon /> },
  { value: 'facebook', label: 'Facebook', icon: <FacebookIcon /> },
  { value: 'youtube', label: 'YouTube', icon: <YouTubeIcon /> },
  { value: 'other', label: 'Other', icon: <LinkIcon /> }
];

const getPlatformIcon = (platform) => {
  const option = PLATFORM_OPTIONS.find(opt => opt.value === platform);
  return option ? option.icon : <LinkIcon />;
};

const getPlatformLabel = (platform) => {
  const option = PLATFORM_OPTIONS.find(opt => opt.value === platform);
  return option ? option.label : platform;
};

// Fonction utilitaire pour parser social_links depuis différentes sources
const parseSocialLinks = (socialLinksData) => {
  if (!socialLinksData) return [];
  
  // Si c'est déjà un tableau
  if (Array.isArray(socialLinksData)) {
    return socialLinksData;
  }
  
  // Si c'est une chaîne JSON
  if (typeof socialLinksData === 'string') {
    try {
      const parsed = JSON.parse(socialLinksData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to parse social_links JSON:', error);
      return [];
    }
  }
  
  // Si c'est null, undefined ou autre
  return [];
};

const ProfileModif = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    website: '', // Garder pour compatibilité
    social_links: [], // Nouveau champ pour les liens multiples
    birth_date: '',
    category: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [socialLinkDialog, setSocialLinkDialog] = useState({
    open: false,
    editingIndex: null,
    link: {
      platform: 'website',
      url: '',
      label: ''
    }
  });

  const steps = ['Personal Info', 'Social Links', 'Professional Details', 'Location', 'Review'];

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      initializeProfile();
    } else if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authLoading, isAuthenticated]);

  const showAlert = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get('http://localhost:8000/api/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      showAlert('Error loading categories', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProfileId = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/my-profile-id/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const profileId = response.data.profile_id;
      setProfileId(profileId);
      return profileId;
    } catch (error) {
      console.error('Error fetching profile ID:', error);
      return null;
    }
  };

  const fetchProfileData = async (profileId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/profile/${profileId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      console.log('📥 Profile API Response:', response.data);
      console.log('📥 social_links field:', response.data.social_links);
      console.log('📥 social_links type:', typeof response.data.social_links);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching profile data:', error);
      return null;
    }
  };

  const fetchUserInfoFromToken = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/auth/user/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      return response.data.user;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  };

  const initializeProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Token not available', 'error');
        window.location.href = '/login';
        return;
      }

      await fetchCategories();
      const profileId = await fetchProfileId();
      if (!profileId) {
        showAlert('Could not retrieve profile ID', 'error');
        return;
      }

      const userInfo = await fetchUserInfoFromToken();
      const profileData = await fetchProfileData(profileId);
      
      if (profileData) {
        // Utiliser la fonction utilitaire pour parser social_links
        let socialLinks = parseSocialLinks(profileData.social_links);
        
        console.log('🔄 Parsed social links:', socialLinks);
        console.log('🔍 Parsed type:', Array.isArray(socialLinks));
        console.log('🔍 Parsed length:', socialLinks.length);
        
        // Si pas de social_links mais il y a un website, créer un lien à partir de website
        if (socialLinks.length === 0 && profileData.website) {
          socialLinks = [{
            platform: 'website',
            url: profileData.website,
            label: 'Website'
          }];
          console.log('🔄 Migrated website to social links:', socialLinks);
        }

        setProfile({
          first_name: userInfo?.first_name || profileData.first_name || '',
          last_name: userInfo?.last_name || profileData.last_name || '',
          email: userInfo?.email || profileData.email || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          zip_code: profileData.zip_code || '',
          country: profileData.country || '',
          website: profileData.website || '', // Garder pour compatibilité
          social_links: socialLinks,
          birth_date: profileData.birth_date || '',
          category: profileData.category_name || ''
        });

        if (profileData.image) {
          setPreviewImage(profileData.image);
        }
      } else if (userInfo) {
        setProfile({
          first_name: userInfo.first_name || '',
          last_name: userInfo.last_name || '',
          email: userInfo.email || '',
          bio: '',
          location: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          country: '',
          website: '',
          social_links: [],
          birth_date: '',
          category: ''
        });
      }

      setInitialized(true);
      console.log('✅ Profile initialized with social links:', profile.social_links);
      
    } catch (error) {
      console.error('Error initializing profile:', error);
      if (error.response?.status === 401) {
        showAlert('Session expired. Please log in again.', 'error');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        setProfile({
          first_name: '',
          last_name: '',
          email: '',
          bio: '',
          location: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          country: '',
          website: '',
          social_links: [],
          birth_date: '',
          category: ''
        });
        setInitialized(true);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Image must not exceed 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image', 'error');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Fonctions pour gérer les liens sociaux
  const handleOpenSocialLinkDialog = (index = null) => {
    if (index !== null) {
      // Éditer un lien existant
      const links = Array.isArray(profile.social_links) ? profile.social_links : [];
      setSocialLinkDialog({
        open: true,
        editingIndex: index,
        link: { ...links[index] }
      });
    } else {
      // Ajouter un nouveau lien
      setSocialLinkDialog({
        open: true,
        editingIndex: null,
        link: {
          platform: 'website',
          url: '',
          label: ''
        }
      });
    }
  };

  const handleCloseSocialLinkDialog = () => {
    setSocialLinkDialog({
      open: false,
      editingIndex: null,
      link: {
        platform: 'website',
        url: '',
        label: ''
      }
    });
  };

  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setSocialLinkDialog(prev => ({
      ...prev,
      link: {
        ...prev.link,
        [name]: value
      }
    }));
  };

  const handleSaveSocialLink = () => {
    const { url, platform } = socialLinkDialog.link;
    
    if (!url) {
      showAlert('URL is required', 'error');
      return;
    }

    // Valider l'URL
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      showAlert('Please enter a valid URL', 'error');
      return;
    }

    // S'assurer que social_links est un tableau
    const currentLinks = Array.isArray(profile.social_links) ? [...profile.social_links] : [];
    const newLinks = [...currentLinks];
    
    if (socialLinkDialog.editingIndex !== null) {
      // Mettre à jour un lien existant
      newLinks[socialLinkDialog.editingIndex] = socialLinkDialog.link;
    } else {
      // Ajouter un nouveau lien
      newLinks.push(socialLinkDialog.link);
    }

    setProfile(prev => ({
      ...prev,
      social_links: newLinks
    }));

    handleCloseSocialLinkDialog();
    showAlert(socialLinkDialog.editingIndex !== null ? 'Link updated' : 'Link added', 'success');
  };

  const handleDeleteSocialLink = (index) => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      const currentLinks = Array.isArray(profile.social_links) ? profile.social_links : [];
      const newLinks = currentLinks.filter((_, i) => i !== index);
      setProfile(prev => ({
        ...prev,
        social_links: newLinks
      }));
      showAlert('Link deleted', 'success');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (profile.email && !/\S+@\S+\.\S+/.test(profile.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Valider chaque lien social
    const links = Array.isArray(profile.social_links) ? profile.social_links : [];
    links.forEach((link, index) => {
      if (link && link.url && !/^https?:\/\/.+/.test(link.url)) {
        newErrors[`social_links_${index}`] = `Invalid URL in link ${index + 1}`;
      }
    });
    
    if (profile.birth_date) {
      const birthDate = new Date(profile.birth_date);
      const today = new Date();
      if (birthDate > today) newErrors.birth_date = 'Birth date cannot be in the future';
    }
    
    if (profile.zip_code && !/^\d{5}(-\d{4})?$/.test(profile.zip_code)) {
      newErrors.zip_code = 'Invalid ZIP code format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('Please correct errors in the form', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      console.log('🚀 Submitting profile update...');
      console.log('📤 Social links to submit:', profile.social_links);
      console.log('📤 Social links type:', typeof profile.social_links);

      // Ajouter tous les champs du profil
      Object.keys(profile).forEach(key => {
        if (key === 'social_links') {
          // Convertir social_links en JSON string
          const links = Array.isArray(profile[key]) ? profile[key] : [];
          if (links.length > 0) {
            const jsonLinks = JSON.stringify(links);
            formData.append(key, jsonLinks);
            console.log('📝 Added social_links as JSON:', jsonLinks);
          } else {
            formData.append(key, '[]'); // Envoyer un tableau vide
            console.log('📝 Added empty social_links array');
          }
        } else if (key === 'category' && profile[key]) {
          // Trouver l'ID de la catégorie par son nom
          const categoryObj = categories.find(cat => cat.name === profile[key]);
          if (categoryObj) {
            formData.append('category', categoryObj.id);
            console.log(`📝 Added category ID: ${categoryObj.id} for name: ${profile[key]}`);
          } else {
            formData.append('category', '');
          }
        } else if (profile[key] !== null && profile[key] !== undefined && profile[key] !== '') {
          formData.append(key, profile[key]);
          console.log(`📝 Added ${key}: ${profile[key]}`);
        }
      });

      if (image) {
        formData.append('image', image);
        console.log('📝 Added image file');
      }

      // Afficher le contenu de formData pour debug
      console.log('📋 FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await axios.put(`http://localhost:8000/api/profile/${profileId}/update/`, formData, {
        headers: { 
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Profile update response:', response.data);
      showAlert('Profile updated successfully!', 'success');
      setImage(null);
      await initializeProfile(); // Recharger les données
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      if (error.response?.data) {
        console.error('❌ Server response:', error.response.data);
        const fieldErrors = {};
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) {
            fieldErrors[key] = error.response.data[key].join(', ');
          } else {
            fieldErrors[key] = error.response.data[key];
          }
        });
        setErrors(fieldErrors);
        showAlert('Please correct the errors in the form', 'error');
      } else if (error.request) {
        console.error('❌ No response received:', error.request);
        showAlert('No response from server. Please check your connection.', 'error');
      } else {
        console.error('❌ Request setup error:', error.message);
        showAlert('Error setting up request: ' + error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setImage(null);
    setErrors({});
    setActiveStep(0);
    onClose();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const primaryGradient = 'linear-gradient(135deg, rgb(10, 10, 10), rgb(60, 10, 10), rgb(180, 20, 20), rgb(177, 14, 65))';

  // Fonction pour obtenir les liens sociaux en tant que tableau sûr
  const getSafeSocialLinks = () => {
    return Array.isArray(profile.social_links) ? profile.social_links : [];
  };

  const renderStepContent = (step) => {
    const socialLinks = getSafeSocialLinks();
    
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
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
                        border: `3px solid ${theme.palette.primary.main}`,
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
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  Click to change profile photo
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
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
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
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Social Links
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenSocialLinkDialog()}
                  size="small"
                >
                  Add Link
                </Button>
              </Box>

              {socialLinks.length === 0 ? (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    bgcolor: 'grey.50'
                  }}
                >
                  <LanguageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    No links added yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Add your website, social media profiles, or portfolio links
                  </Typography>
                </Paper>
              ) : (
                <List>
                  {socialLinks.map((link, index) => {
                    // S'assurer que le lien est un objet valide
                    if (!link || typeof link !== 'object') {
                      return null;
                    }
                    
                    return (
                      <ListItem
                        key={index}
                        sx={{
                          borderBottom: '1px solid #eee',
                          '&:last-child': { borderBottom: 'none' },
                          bgcolor: 'white',
                          mb: 1,
                          borderRadius: 1
                        }}
                      >
                        <Box sx={{ mr: 2 }}>
                          {getPlatformIcon(link.platform || 'other')}
                        </Box>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="500">
                                {link.label || getPlatformLabel(link.platform || 'other')}
                              </Typography>
                              <Chip
                                label={getPlatformLabel(link.platform || 'other')}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            <a 
                              href={link.url || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#1976d2', textDecoration: 'none', fontSize: '0.875rem' }}
                            >
                              {link.url ? (link.url.length > 50 ? `${link.url.substring(0, 47)}...` : link.url) : 'No URL'}
                            </a>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleOpenSocialLinkDialog(index)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteSocialLink(index)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              )}

              <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                Tip: Add links to your portfolio, social media profiles, or other relevant websites
              </Typography>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.category} disabled={loading || categoriesLoading}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={profile.category}
                  onChange={handleInputChange}
                  label="Category"
                  startAdornment={
                    <InputAdornment position="start">
                      <CategoryIcon color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Select a category</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                {profile.category && (
                  <FormHelperText>
                    Current: {profile.category}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                error={!!errors.bio}
                helperText={errors.bio}
                disabled={loading}
                multiline
                rows={4}
                placeholder="Tell us about your expertise, experience, and skills..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="address"
                value={profile.address}
                onChange={handleInputChange}
                error={!!errors.address}
                helperText={errors.address}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={profile.city}
                onChange={handleInputChange}
                error={!!errors.city}
                helperText={errors.city}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ApartmentIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/Province"
                name="state"
                value={profile.state}
                onChange={handleInputChange}
                error={!!errors.state}
                helperText={errors.state}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ZIP/Postal Code"
                name="zip_code"
                value={profile.zip_code}
                onChange={handleInputChange}
                error={!!errors.zip_code}
                helperText={errors.zip_code}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PinDropIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={profile.country}
                onChange={handleInputChange}
                error={!!errors.country}
                helperText={errors.country}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PublicIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="General Location (Optional)"
                name="location"
                value={profile.location}
                onChange={handleInputChange}
                error={!!errors.location}
                helperText={errors.location}
                disabled={loading}
                placeholder="City, Country"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormHelperText>
                This field is kept for compatibility
              </FormHelperText>
            </Grid>
          </Grid>
        );

      case 4:
        const reviewSocialLinks = getSafeSocialLinks();
        
        return (
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom color="primary">
              Review Your Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Personal Information</Typography>
                <Typography variant="body1">
                  {profile.first_name} {profile.last_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">{profile.email}</Typography>
                {profile.birth_date && (
                  <Typography variant="body2" color="textSecondary">
                    Born: {new Date(profile.birth_date).toLocaleDateString()}
                  </Typography>
                )}
              </Grid>
              
              {reviewSocialLinks.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="textSecondary">Social Links</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {reviewSocialLinks.map((link, index) => (
                      <Chip
                        key={index}
                        icon={getPlatformIcon(link.platform || 'other')}
                        label={link.label || getPlatformLabel(link.platform || 'other')}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
              
              {profile.category && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                  <Typography variant="body1">{profile.category}</Typography>
                </Grid>
              )}
              
              {profile.bio && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="textSecondary">Bio</Typography>
                  <Typography variant="body1">{profile.bio}</Typography>
                </Grid>
              )}
              
              {(profile.address || profile.city || profile.state || profile.country) && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="textSecondary">Location</Typography>
                  <Typography variant="body1">
                    {[profile.address, profile.city, profile.state, profile.country]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        );

      default:
        return null;
    }
  };

  // Dialog pour ajouter/modifier un lien social
  const renderSocialLinkDialog = () => (
    <Dialog 
      open={socialLinkDialog.open} 
      onClose={handleCloseSocialLinkDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {socialLinkDialog.editingIndex !== null ? 'Edit Link' : 'Add New Link'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Platform</InputLabel>
              <Select
                name="platform"
                value={socialLinkDialog.link.platform}
                onChange={handleSocialLinkChange}
                label="Platform"
              >
                {PLATFORM_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Display Label (Optional)"
              name="label"
              value={socialLinkDialog.link.label}
              onChange={handleSocialLinkChange}
              placeholder="e.g., My Portfolio"
              helperText="Leave empty to use platform name"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="URL"
              name="url"
              value={socialLinkDialog.link.url}
              onChange={handleSocialLinkChange}
              placeholder="https://example.com"
              required
              error={!!errors.url}
              helperText={errors.url || "Must start with http:// or https://"}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseSocialLinkDialog}>Cancel</Button>
        <Button 
          onClick={handleSaveSocialLink} 
          variant="contained"
        >
          {socialLinkDialog.editingIndex !== null ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (!initialized && open) {
    return (
      <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress size={40} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading Profile...
            </Typography>
            {categoriesLoading && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Loading categories...
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: primaryGradient, 
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2em'
        }}>
          <Typography variant="h5"sx={{color: '#ffff',}}>
            Edit Profile
          </Typography>
          <IconButton onClick={handleCancel} sx={{ color: 'inherit' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label} >
                <StepLabel >{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}
            
            <DialogActions sx={{ 
              mt: 3, 
              px: 0,
              justifyContent: activeStep === 0 ? 'flex-end' : 'space-between'
            }}>
              {activeStep > 0 && (
                <Button
                  onClick={handleBack}
                  disabled={loading}
                  startIcon={<CancelIcon />}
                >
                  Back
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {renderSocialLinkDialog()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProfileModif;
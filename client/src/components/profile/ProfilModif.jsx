import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import API_URL from '../../hooks/useApiUrl';
import { STEPS, parseSocialLinks } from '../../utils/constants';
import ProfileStepper from '../profile_modif/Profile_step';
import PersonalInfoStep from '../profile_modif/ProfilePersonalInfo';
import SocialLinksStep from '../profile_modif/SocialLinkStep';
import ProfessionalDetailsStep from '../profile_modif/ProfessionalDetailStep';
import LocationStep from '../profile_modif/LocationStep';
import ReviewStep from '../profile_modif/ReviewStep';
import SocialLinkDialog from '../profile_modif/SocialLinkDialog';

const ProfileModif = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '', // Ajout du champ téléphone
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
    category: '',
    image_bio: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [imageBio, setImageBio] = useState(null);
  const [previewImageBio, setPreviewImageBio] = useState('');
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
      const response = await axios.get(`${API_URL}/api/categories/`);
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
      const response = await axios.get(`${API_URL}/api/my-profile-id/`, {
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
      const response = await axios.get(`${API_URL}/api/profile/${profileId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      console.log('📥 Profile API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile data:', error);
      return null;
    }
  };

  const fetchUserInfoFromToken = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/auth/user/`, {
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
        let socialLinks = parseSocialLinks(profileData.social_links);
        
        if (socialLinks.length === 0 && profileData.website) {
          socialLinks = [{
            platform: 'website',
            url: profileData.website,
            label: 'Website'
          }];
        }

        setProfile({
          first_name: userInfo?.first_name || profileData.first_name || '',
          last_name: userInfo?.last_name || profileData.last_name || '',
          email: userInfo?.email || profileData.email || '',
          phone: profileData.phone || '', // Ajout du téléphone depuis profileData
          bio: profileData.bio || '',
          location: profileData.location || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          zip_code: profileData.zip_code || '',
          country: profileData.country || '',
          website: profileData.website || '',
          social_links: socialLinks,
          birth_date: profileData.birth_date || '',
          category: profileData.category_name || '',
          category_id: profileData.category || profileData.category_id || '',
          image_bio: profileData.image_bio || ''
        });

        if (profileData.image) {
          setPreviewImage(profileData.image);
        }
        
        if (profileData.image_bio) {
          setPreviewImageBio(profileData.image_bio);
        }
      } else if (userInfo) {
        setProfile({
          first_name: userInfo.first_name || '',
          last_name: userInfo.last_name || '',
          email: userInfo.email || '',
          phone: '', // Initialisation du téléphone
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
          category: '',
          image_bio: ''
        });
      }

      setInitialized(true);
      
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
          phone: '', // Initialisation du téléphone
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
          category: '',
          image_bio: ''
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

  const handleImageBioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Bio image must not exceed 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image', 'error');
        return;
      }
      setImageBio(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImageBio(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleOpenSocialLinkDialog = (index = null) => {
    if (index !== null) {
      const links = Array.isArray(profile.social_links) ? profile.social_links : [];
      setSocialLinkDialog({
        open: true,
        editingIndex: index,
        link: { ...links[index] }
      });
    } else {
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

    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      showAlert('Please enter a valid URL', 'error');
      return;
    }

    const currentLinks = Array.isArray(profile.social_links) ? [...profile.social_links] : [];
    const newLinks = [...currentLinks];
    
    if (socialLinkDialog.editingIndex !== null) {
      newLinks[socialLinkDialog.editingIndex] = socialLinkDialog.link;
    } else {
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

      Object.keys(profile).forEach(key => {
        if (key === 'social_links') {
          const links = Array.isArray(profile[key]) ? profile[key] : [];
          if (links.length > 0) {
            const jsonLinks = JSON.stringify(links);
            formData.append(key, jsonLinks);
          } else {
            formData.append(key, '[]');
          }
        } else if (key === 'category' && profile[key]) {
          const categoryObj = categories.find(cat => cat.name === profile[key]);
          if (categoryObj) {
            formData.append('category', categoryObj.id);
          } else {
            formData.append('category', '');
          }
        } else if (profile[key] !== null && profile[key] !== undefined && profile[key] !== '') {
          formData.append(key, profile[key]);
        }
      });

      if (image) {
        formData.append('image', image);
      }

      if (imageBio) {
        formData.append('image_bio', imageBio);
      }

      const response = await axios.put(`${API_URL}/api/profile/${profileId}/update/`, formData, {
        headers: { 
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Profile update response:', response.data);
      showAlert('Profile updated successfully!', 'success');
      setImage(null);
      setImageBio(null);
      await initializeProfile();
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      if (error.response?.data) {
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
        showAlert('No response from server. Please check your connection.', 'error');
      } else {
        showAlert('Error setting up request: ' + error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setImage(null);
    setImageBio(null);
    setErrors({});
    setActiveStep(0);
    onClose();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <PersonalInfoStep
            profile={profile}
            errors={errors}
            loading={loading}
            previewImage={previewImage}
            handleInputChange={handleInputChange}
            handleImageChange={handleImageChange}
          />
        );
      case 1:
        return (
          <SocialLinksStep
            profile={profile}
            handleOpenSocialLinkDialog={handleOpenSocialLinkDialog}
            handleDeleteSocialLink={handleDeleteSocialLink}
          />
        );
      case 2:
        return (
          <ProfessionalDetailsStep
            profile={profile}
            errors={errors}
            loading={loading}
            categories={categories}
            categoriesLoading={categoriesLoading}
            previewImageBio={previewImageBio}
            handleInputChange={handleInputChange}
            handleImageBioChange={handleImageBioChange}
          />
        );
      case 3:
        return (
          <LocationStep
            profile={profile}
            errors={errors}
            loading={loading}
            handleInputChange={handleInputChange}
          />
        );
      case 4:
        return (
          <ReviewStep
            profile={profile}
            previewImageBio={previewImageBio}
          />
        );
      default:
        return null;
    }
  };

  const primaryGradient = 'linear-gradient(135deg, rgb(10, 10, 10), rgb(60, 10, 10), rgb(180, 20, 20), rgb(177, 14, 65))';

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
          <ProfileStepper activeStep={activeStep} />
          
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
              
              {activeStep < STEPS.length - 1 ? (
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

      <SocialLinkDialog
        open={socialLinkDialog.open}
        socialLinkDialog={socialLinkDialog}
        errors={errors}
        handleCloseSocialLinkDialog={handleCloseSocialLinkDialog}
        handleSocialLinkChange={handleSocialLinkChange}
        handleSaveSocialLink={handleSaveSocialLink}
      />

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
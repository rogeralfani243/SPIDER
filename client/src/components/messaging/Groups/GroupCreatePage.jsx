// src/components/groups/GroupCreatePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { groupAPI, userAPI } from '../../../hooks/messaging/messagingApi';

// Import sub-components
import BasicInfoStep from './group-create/BasicInfoStep';
import SettingsStep from './group-create/SettingStep';
import DetailsStep from './group-create/DetailStep';
import ParticipantsStep from './group-create/ParticipantsStep';
import GroupSummary from './group-create/GroupSummary';

/**
 * Main Group Creation Page
 * Orchestrates the multi-step group creation process
 */
const GroupCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    description: '',
    group_type: 'group_public',
    category_id: '',
    
    // Step 2: Settings
    requires_approval: true,
    can_anyone_invite: true,
    max_participants: 100,
    is_visible: true,
    
    // Step 3: Details
    tags: [],
    location: '',
    website: '',
    rules: '',
    
    // Step 4: Participants
    selectedUsers: [],
    participant_ids: [],
  });

  // UI state
  const [tagInput, setTagInput] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchTimeoutRef = useRef(null);

  const steps = [
    'Basic Information',
    'Group Settings',
    'Additional Details',
    'Add Participants',
  ];

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Effect for user search with debounce
  useEffect(() => {
    if (userSearchQuery.trim().length >= 2) {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }

      userSearchTimeoutRef.current = setTimeout(async () => {
        try {
          setUserSearchLoading(true);
          const response = await userAPI.searchUsers(userSearchQuery);
          // Filter out already selected users
          const filteredResults = response.data.results?.filter(
            user => !formData.selectedUsers.some(selected => selected.id === user.id)
          ) || [];
          setUserSearchResults(filteredResults);
        } catch (error) {
          console.error('Search error:', error);
          setUserSearchResults([]);
        } finally {
          setUserSearchLoading(false);
        }
      }, 300);
    } else {
      setUserSearchResults([]);
    }

    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, [userSearchQuery, formData.selectedUsers]);

  // ============ Data Loading ============
  const loadCategories = async () => {
    try {
      const response = await groupAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // ============ Form Handlers ============
  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.checked,
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ============ User Selection Handlers ============
  const handleAddUser = (user) => {
    if (formData.selectedUsers.length >= formData.max_participants - 1) {
      return; // -1 for owner
    }
    
    if (!formData.selectedUsers.some(selected => selected.id === user.id)) {
      const updatedUsers = [...formData.selectedUsers, user];
      setFormData({
        ...formData,
        selectedUsers: updatedUsers,
        participant_ids: updatedUsers.map(u => u.id),
      });
      // Remove from search results
      setUserSearchResults(userSearchResults.filter(u => u.id !== user.id));
      setUserSearchQuery('');
    }
  };

  const handleRemoveUser = (userId) => {
    const updatedUsers = formData.selectedUsers.filter(user => user.id !== userId);
    setFormData({
      ...formData,
      selectedUsers: updatedUsers,
      participant_ids: updatedUsers.map(u => u.id),
    });
  };

  // ============ Step Navigation ============
  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (!formData.name.trim()) {
        setError('Group name is required');
        return;
      }
      if (formData.group_type === 'group_public' && !formData.name.trim()) {
        setError('Public groups must have a name');
        return;
      }
    }
    
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // ============ Form Submission ============
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🟡 [FRONTEND] Creating group...');
      console.log('🟡 [FRONTEND] FormData:', formData);
      console.log('🟡 [FRONTEND] Photo file:', photoFile);

      // Prepare data for API
      const groupData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        group_type: formData.group_type,
        category_id: formData.category_id || null,
        requires_approval: formData.requires_approval,
        can_anyone_invite: formData.can_anyone_invite,
        max_participants: parseInt(formData.max_participants) || 100,
        tags: formData.tags || [],
        location: formData.location?.trim() || '',
        website: formData.website?.trim() || '',
        rules: formData.rules?.trim() || '',
        participant_ids: formData.participant_ids || [],
        is_visible: formData.is_visible,
      };

      // Add photo if exists
      if (photoFile) {
        groupData.group_photo = photoFile;
        console.log('🟡 [FRONTEND] Photo added:', photoFile.name, photoFile.type, photoFile.size);
      }

      console.log('🟡 [FRONTEND] Data sent to groupAPI:', groupData);

      // Use groupAPI.createGroup with raw data
      const response = await groupAPI.createGroup(groupData);
      
      console.log('✅ [FRONTEND] Group created successfully:', response.data);
      
      setSuccess('Group created successfully!');
      
      // Redirect to group page after 2 seconds
      setTimeout(() => {
        navigate(`/groups/${response.data.id}`);
      }, 2000);

    } catch (err) {
      console.error('🔴 [FRONTEND] Group creation error:', err);
      
      // Display detailed error
      if (err.response?.data) {
        console.error('🔴 [FRONTEND] Backend error:', err.response.data);
        
        // Handle different error types
        if (typeof err.response.data === 'object') {
          // Django validation error
          const errors = [];
          Object.keys(err.response.data).forEach(key => {
            if (Array.isArray(err.response.data[key])) {
              errors.push(`${key}: ${err.response.data[key].join(', ')}`);
            } else {
              errors.push(`${key}: ${err.response.data[key]}`);
            }
          });
          setError(errors.join('; '));
        } else if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError('Failed to create group. Please check your input.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============ Render Step Content ============
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoStep
            formData={formData}
            categories={categories}
            photoPreview={photoPreview}
            onInputChange={handleInputChange}
            onPhotoChange={handlePhotoChange}
          />
        );

      case 1:
        return (
          <SettingsStep
            formData={formData}
            onSwitchChange={handleSwitchChange}
            onInputChange={handleInputChange}
          />
        );

      case 2:
        return (
          <DetailsStep
            formData={formData}
            tagInput={tagInput}
            onInputChange={handleInputChange}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onTagInputChange={(e) => setTagInput(e.target.value)}
            onTagKeyPress={handleTagKeyPress}
          />
        );

      case 3:
        return (
          <ParticipantsStep
            formData={formData}
            userSearchQuery={userSearchQuery}
            userSearchResults={userSearchResults}
            userSearchLoading={userSearchLoading}
            onSearchQueryChange={(e) => setUserSearchQuery(e.target.value)}
            onClearSearch={() => {
              setUserSearchQuery('');
              setUserSearchResults([]);
            }}
            onAddUser={handleAddUser}
            onRemoveUser={handleRemoveUser}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/groups')}
        sx={{ mb: 3 }}
      >
        Back to Groups
      </Button>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Create New Group
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Build your community in just a few steps
        </Typography>
      </Box>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Card variant="outlined" sx={{ mt: 2, mb: 4 }}>
                <CardContent>
                  {renderStepContent(index)}
                </CardContent>
              </Card>
              
              <Box sx={{ mb: 2 }}>
                <div>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                    disabled={loading}
                    startIcon={index === steps.length - 1 ? <SaveIcon /> : null}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {index === steps.length - 1 ? 'Create Group' : 'Continue'}
                    {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
                  </Button>
                  
                  <Button
                    disabled={index === 0 || loading}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Success Card */}
      {activeStep === steps.length && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Group Created Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your group "{formData.name}" has been created. You will be redirected to the group page shortly.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/groups')}
              sx={{ mr: 2 }}
            >
              Browse Groups
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/groups/create')}
            >
              Create Another Group
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Group Summary */}
      <GroupSummary
        formData={formData}
        categories={categories}
        photoPreview={photoPreview}
      />
    </Container>
  );
};

export default GroupCreatePage;
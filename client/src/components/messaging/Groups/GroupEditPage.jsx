// src/components/groups/GroupEditPage.jsx - VERSION FINALE
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  PersonRemove as PersonRemoveIcon,
  Warning as WarningIcon,
  Group as GroupIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../../../hooks/messaging/messagingApi';
import { useAuth } from '../../../hooks/useAuth';

const GroupEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [initialized, setInitialized] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'group_private',
    category_id: '',
    requires_approval: true,
    can_anyone_invite: true,
    is_visible: true,
    max_participants: 100,
    tags: [],
    location: '',
    website: '',
    rules: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    if (id && user) {
      loadGroupData();
      loadCategories();
    }
  }, [id, user]);

  const loadGroupData = async () => {
    if (!id || !user) return;
    
    setLoading(true);
    setError('');
    try {
      const [groupRes, membersRes] = await Promise.all([
        groupAPI.getGroupDetails(id),
        groupAPI.getGroupMembers(id, { page: 1, limit: 50 }),
      ]);
      
      const group = groupRes.data;
      const membersList = membersRes.data.results || membersRes.data || [];
      setMembers(membersList);
      
      // Vérification des permissions
      const isOwner = group.created_by?.id === user?.id;
      const isAdmin = membersList.find(m => 
        m.user?.id === user?.id && (m.role === 'admin' || m.role === 'owner')
      );
      
      if (!isOwner && !isAdmin) {
        setError('You do not have permission to edit this group');
        setTimeout(() => navigate(`/groups/${id}`), 2000);
        return;
      }
      
      // Mettre à jour formData
      const newFormData = {
        name: group.name || '',
        description: group.description || '',
        group_type: group.group_type || 'group_private',
        category_id: group.category?.id || group.category_id || '',
        requires_approval: group.requires_approval !== undefined ? group.requires_approval : true,
        can_anyone_invite: group.can_anyone_invite !== undefined ? group.can_anyone_invite : true,
        is_visible: group.is_visible !== undefined ? group.is_visible : true,
        max_participants: group.max_participants || 100,
        tags: Array.isArray(group.tags) ? group.tags : [],
        location: group.location || '',
        website: group.website || '',
        rules: group.rules || '',
      };
      
      setFormData(newFormData);
      setPhotoPreview(group.group_photo_url || null);
      setOriginalData({
        ...newFormData,
        group_photo_url: group.group_photo_url || null
      });
      setInitialized(true);
      
    } catch (err) {
      console.error('Error loading group data:', err);
      setError('Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await groupAPI.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

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
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag],
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
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const hasChanges = () => {
    if (!originalData || !initialized) return false;
    
    const changedFields = Object.keys(formData).filter(key => {
      if (key === 'tags') {
        return JSON.stringify(formData[key]) !== JSON.stringify(originalData[key] || []);
      }
      return formData[key] !== (originalData[key] || '');
    });
    
    return changedFields.length > 0 || photoFile !== null || (photoPreview === null && originalData.group_photo_url);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!hasChanges()) {
    setSuccess('No changes to save');
    return;
  }
  
  setSaving(true);
  setError('');
  setSuccess('');

  try {
    const formDataToSend = new FormData();
    
    // DEBUG: Afficher ce qui est changé
    console.log('🔄 Changes detected:');
    Object.keys(formData).forEach(key => {
      if (formData[key] !== (originalData[key] || '')) {
        console.log(`  ${key}: "${formData[key]}" (was: "${originalData[key]}")`);
      }
    });
    
    // AJOUTER TOUS LES CHAMPS (même inchangés) pour tester
    // Ajoutons d'abord juste un champ pour voir si ça passe
    formDataToSend.append('name', formData.name || '');
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('group_type', formData.group_type || 'group_private');
    formDataToSend.append('can_anyone_invite', formData.can_anyone_invite);
    formDataToSend.append('is_visible', formData.is_visible);
    formDataToSend.append('max_participants', formData.max_participants);
    formDataToSend.append('requires_approval', formData.requires_approval);
    
    // Catégorie
    if (formData.category_id) {
      formDataToSend.append('category_id', formData.category_id);
    } else {
      formDataToSend.append('category_id', '');
    }
    
    // Tags
    formDataToSend.append('tags', JSON.stringify(formData.tags || []));
    
    // Autres champs
    formDataToSend.append('location', formData.location || '');
    formDataToSend.append('website', formData.website || '');
    formDataToSend.append('rules', formData.rules || '');
    
    // Gestion de la photo
    if (photoFile) {
      console.log('📸 Adding photo file:', photoFile.name);
      formDataToSend.append('group_photo', photoFile);
    } else if (photoPreview === null && originalData.group_photo_url) {
      console.log('🗑️ Setting empty string to remove photo');
      formDataToSend.append('group_photo', '');
    }
    
    // DEBUG: Vérifier ce qui est dans FormData
    console.log('📤 FormData contents:');
    for (let [key, value] of formDataToSend.entries()) {
      if (key === 'group_photo' && value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.type}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: "${value}"`);
      }
    }

    console.log('🚀 Calling groupAPI.updateGroup...');
    const response = await groupAPI.updateGroup(id, formDataToSend);
    console.log('✅ Update response:', response);
    
    setSuccess('Group updated successfully!');
    
    // Réinitialiser le fichier photo
    if (photoFile) {
      setPhotoFile(null);
    }
    
    // Recharger les données
    setTimeout(() => {
      console.log('🔄 Reloading group data...');
      loadGroupData();
    }, 1500);

  } catch (err) {
    console.error('❌ Error updating group:', err);
    
    let errorMsg = 'Failed to update group. Please try again.';
    
    if (err.response?.data) {
      console.error('Backend error details:', err.response.data);
      
      if (typeof err.response.data === 'object') {
        // Afficher la première erreur
        const errors = Object.values(err.response.data);
        if (errors.length > 0) {
          const firstError = errors[0];
          if (Array.isArray(firstError)) {
            errorMsg = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMsg = firstError;
          }
        }
      } else if (typeof err.response.data === 'string') {
        errorMsg = err.response.data;
      }
    } else if (err.message) {
      errorMsg = err.message;
    }
    
    setError(errorMsg);
  } finally {
    setSaving(false);
  }
};
  const handleDeleteGroup = async () => {
    setDeleteDialogOpen(false);
    
    try {
      await groupAPI.deleteGroup(id);
      alert('Group deleted successfully');
      navigate('/groups');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.error || 
                      'Failed to delete group';
      alert(errorMsg);
    }
  };

const handleTransferOwnership = async () => {
  if (!newOwnerId) {
    alert('Please select a new owner');
    return;
  }
  
  setTransferDialogOpen(false);
  
  try {
    // Version 1: Envoyer juste l'ID (recommandé)
    await groupAPI.transferOwnership(id, newOwnerId);
    
    // Version 2: Si vous préférez l'ancienne syntaxe
    // await groupAPI.transferOwnership(id, { new_owner_id: newOwnerId });
    
    alert('Ownership transferred successfully');
    navigate('/groups');
  } catch (err) {
    const errorMsg = err.response?.data?.message || 
                    err.response?.data?.error || 
                    'Failed to transfer ownership';
    alert(errorMsg);
  }
};

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      await groupAPI.removeMember(id, memberId);
      alert('Member removed successfully');
      loadGroupData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.error || 
                      'Failed to remove member';
      alert(errorMsg);
    }
  };

  const renderTabContent = () => {
    switch (tabValue) {
      case 0: // Basic Info
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="group-photo-upload-edit"
                  type="file"
                  onChange={handlePhotoChange}
                />
                <label htmlFor="group-photo-upload-edit">
                  <IconButton component="span">
                    <Avatar
                      src={photoPreview}
                      sx={{
                        width: 150,
                        height: 150,
                        cursor: 'pointer',
                        border: '3px solid',
                        borderColor: 'primary.main',
                        bgcolor: 'grey.100',
                      }}
                    >
                      {!photoPreview && <PhotoCameraIcon sx={{ fontSize: 60 }} />}
                    </Avatar>
                  </IconButton>
                </label>
                <Box sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    onClick={() => document.getElementById('group-photo-upload-edit').click()}
                    startIcon={<PhotoCameraIcon />}
                    sx={{ mr: 1 }}
                  >
                    Change Photo
                  </Button>
                  {photoPreview && (
                    <Button
                      size="small"
                      color="error"
                      onClick={handleRemovePhoto}
                      startIcon={<DeleteIcon />}
                    >
                      Remove Photo
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Group Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!formData.name.trim()}
                helperText={!formData.name.trim() ? "Group name is required" : ""}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Group Type</InputLabel>
                <Select
                  value={formData.group_type}
                  label="Group Type"
                  onChange={handleInputChange('group_type')}
                >
                  <MenuItem value="group_public">Public Group</MenuItem>
                  <MenuItem value="group_private">Private Group</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category_id}
                  label="Category"
                  onChange={handleInputChange('category_id')}
                >
                  <MenuItem value="">
                    <em>No Category</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_visible}
                    onChange={handleSwitchChange('is_visible')}
                    color="primary"
                  />
                }
                label="Group is visible to others"
              />
            </Grid>
          </Grid>
        );

      case 1: // Settings
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requires_approval}
                    onChange={handleSwitchChange('requires_approval')}
                    color="primary"
                  />
                }
                label="Require Approval to Join"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
                New members must be approved by an admin before joining
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.can_anyone_invite}
                    onChange={handleSwitchChange('can_anyone_invite')}
                    color="primary"
                  />
                }
                label="Anyone Can Invite Members"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
                Any member can invite new people to join the group
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Participants"
                value={formData.max_participants}
                onChange={handleInputChange('max_participants')}
                InputProps={{ inputProps: { min: 2, max: 1000 } }}
                helperText="Set the maximum number of members allowed in the group"
              />
            </Grid>
          </Grid>
        );

      case 2: // Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Tags (press Enter to add)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add tags (press Enter)"
                  size="small"
                />
                <IconButton
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  sx={{ ml: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              {formData.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleInputChange('location')}
                placeholder="e.g., Paris, France"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={handleInputChange('website')}
                placeholder="https://example.com"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Group Rules"
                value={formData.rules}
                onChange={handleInputChange('rules')}
                placeholder="Set rules for your group members..."
                helperText="These rules will be displayed to all members"
              />
            </Grid>
          </Grid>
        );

      case 3: // Members
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Manage group members and permissions. As the owner, you can remove members or transfer ownership.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Current Members ({members.length})
              </Typography>
              
              {members.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No members found
                </Typography>
              ) : (
                <List>
                  {members.map((member, index) => (
                    <ListItem key={member.user?.id || member.id || index}>
                      <ListItemAvatar>
                        <Avatar src={member.user?.profile_image || ''}>
                          {member.user?.username?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {member.user?.username || 'Unknown User'}
                            {member.role && (
                              <Chip
                                label={member.role}
                                size="small"
                                color={
                                  member.role === 'owner' ? 'primary' :
                                  member.role === 'admin' ? 'secondary' : 'default'
                                }
                                sx={{ ml: 2 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={member.joined_at ? `Joined ${new Date(member.joined_at).toLocaleDateString()}` : ''}
                      />
                      <ListItemSecondaryAction>
                        {member.role !== 'owner' && member.user?.id !== user?.id && (
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveMember(member.user?.id)}
                            color="error"
                            size="small"
                          >
                            <PersonRemoveIcon />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Danger Zone
              </Typography>
              
              <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" color="error">
                        Transfer Ownership
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Transfer group ownership to another member
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setTransferDialogOpen(true)}
                      disabled={members.filter(m => m.user?.id !== user?.id && m.role !== 'banned').length === 0}
                    >
                      Transfer
                    </Button>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" color="error">
                        Delete Group
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Permanently delete this group and all its content
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Delete Group
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!initialized) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Failed to load group data. You may not have permission to edit this group.'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/groups/${id}`)}
          sx={{ mt: 2 }}
        >
          Back to Group
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/groups/${id}`)}
        sx={{ mb: 3 }}
      >
        Back to Group
      </Button>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Edit Group
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your group settings and members
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Basic Info" />
              <Tab label="Settings" />
              <Tab label="Details" />
              <Tab label="Members" />
            </Tabs>
            
            <CardContent sx={{ pt: 3 }}>
              {renderTabContent()}
            </CardContent>
          </Card>

          {(tabValue !== 3 || hasChanges()) && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                onClick={() => navigate(`/groups/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!hasChanges() || saving}
                startIcon={saving ? null : <SaveIcon />}
              >
                {saving ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Group Preview
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={photoPreview}
                  sx={{ width: 80, height: 80, mr: 2 }}
                >
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {formData.name || 'Unnamed Group'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formData.group_type === 'group_public' ? 'Public Group' : 'Private Group'}
                    {!formData.is_visible && ' (Hidden)'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {formData.description?.substring(0, 100) || 'No description'}
                  {formData.description?.length > 100 ? '...' : ''}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {formData.category_id && (
                  <Chip
                    label={categories.find(c => c.id === formData.category_id)?.name || 'Category'}
                    size="small"
                    icon={<CategoryIcon />}
                  />
                )}
                
                <Chip
                  label={`${members.length} members`}
                  size="small"
                  icon={<PeopleIcon />}
                />
                
                {formData.requires_approval && (
                  <Chip
                    label="Approval required"
                    size="small"
                    color="warning"
                  />
                )}
                
                {formData.tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {formData.tags.length > 3 && (
                  <Chip
                    label={`+${formData.tags.length - 3}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Changes Made
              </Typography>
              
              {hasChanges() ? (
                <Box>
                  {Object.keys(formData).map(key => {
                    if (key === 'tags') {
                      if (JSON.stringify(formData[key]) !== JSON.stringify(originalData.tags || [])) {
                        return (
                          <Typography key={key} variant="body2" color="primary" sx={{ mb: 0.5 }}>
                            • Tags updated
                          </Typography>
                        );
                      }
                    } else if (formData[key] !== (originalData[key] || '')) {
                      const fieldName = key
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <Typography key={key} variant="body2" color="primary" sx={{ mb: 0.5 }}>
                          • {fieldName} changed
                        </Typography>
                      );
                    }
                    return null;
                  })}
                  {photoFile && (
                    <Typography variant="body2" color="primary" sx={{ mb: 0.5 }}>
                      • Group photo updated
                    </Typography>
                  )}
                  {photoPreview === null && originalData.group_photo_url && (
                    <Typography variant="body2" color="primary" sx={{ mb: 0.5 }}>
                      • Group photo removed
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No changes made yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete and Transfer Dialogs remain the same */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          Delete Group
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>This action cannot be undone!</Alert>
          <Typography>Are you sure you want to delete the group <strong>"{formData.name}"</strong>?</Typography>
          <List dense>
            <ListItem>• All group messages and conversations</ListItem>
            <ListItem>• All group memberships</ListItem>
            <ListItem>• All group reviews and ratings</ListItem>
            <ListItem>• All group settings and data</ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteGroup} color="error" variant="contained">
            Delete Group
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)}>
        <DialogTitle>Transfer Group Ownership</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            After transferring ownership, you will become a regular member and lose admin privileges.
          </Alert>
          <FormControl fullWidth>
            <InputLabel>New Owner</InputLabel>
            <Select
              value={newOwnerId}
              label="New Owner"
              onChange={(e) => setNewOwnerId(e.target.value)}
            >
              {members
                .filter(member => member.user?.id !== user?.id && member.role !== 'banned')
                .map(member => (
                  <MenuItem key={member.user?.id} value={member.user?.id}>
                    {member.user?.username} ({member.role})
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTransferOwnership} color="warning" variant="contained">
            Transfer Ownership
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GroupEditPage;
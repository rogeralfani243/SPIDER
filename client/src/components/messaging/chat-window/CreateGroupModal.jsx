// src/components/messaging/CreateGroupModal.jsx - CORRECTION
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Avatar,
  IconButton,
  CircularProgress,
  Chip,
  Alert,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { userAPI } from '../../../hooks/messaging/messagingApi'; // AJOUTEZ CET IMPORT

const CreateGroupModal = ({ open, onClose, onGroupCreated, currentUser }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false); // NOUVEAU ÉTAT
  
  // État du groupe
  const [groupData, setGroupData] = useState({
    group_type: 'group_private',
    name: '',
    description: '',
    group_photo: null,
    can_anyone_invite: true,
    max_participants: 100,
    participant_ids: [],
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const fileInputRef = useRef(null);
  
  // Gestion des changements
// Gestion des changements - Version finale
const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  
  console.log('🔍 handleChange appelé:', {
    name,
    value,
    type,
    checked,
    target: e.target,
    tagName: e.target.tagName
  });
  
  // Déterminer la valeur à utiliser
  let newValue;
  
  if (type === 'checkbox' || e.target.getAttribute('role') === 'switch') {
    newValue = checked;
  } else if (type === 'radio') {
    newValue = value;
  } else {
    newValue = value;
  }
  
  console.log(`🔍 Mise à jour ${name} = ${newValue}`);
  
  setGroupData(prev => ({
    ...prev,
    [name]: newValue
  }));
};
  // Gestion de la photo
  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La photo ne doit pas dépasser 5MB');
        return;
      }
      setGroupData(prev => ({
        ...prev,
        group_photo: file,
        group_photo_preview: URL.createObjectURL(file)
      }));
    }
  };
  
  const removePhoto = () => {
    setGroupData(prev => ({
      ...prev,
      group_photo: null,
      group_photo_preview: null
    }));
  };
  
  // CORRECTION: Implémentez la recherche d'utilisateurs
  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const response = await userAPI.searchUsers(searchQuery);
      // Filtrer l'utilisateur courant et ceux déjà sélectionnés
      const filteredResults = response.data.results?.filter(user => 
        user.id !== currentUser?.id && 
        !selectedUsers.some(selected => selected.id === user.id)
      ) || [];
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Erreur recherche:', err);
      setError('Erreur lors de la recherche d\'utilisateurs');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };
  
  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        if (prev.length >= groupData.max_participants) {
          setError(`Maximum ${groupData.max_participants} participants`);
          return prev;
        }
        return [...prev, user];
      }
    });
  };
  
  const removeSelectedUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };
  
  // Soumission
  const handleSubmit = async () => {
    // Validation
    if (groupData.group_type === 'group_public' && !groupData.name.trim()) {
      setError('Un nom est requis pour un groupe public');
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError('Sélectionnez au moins un participant');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Préparer les données
      const submitData = {
        ...groupData,
        participant_ids: selectedUsers.map(u => u.id),
        group_photo: groupData.group_photo,
           can_anyone_invite: Boolean(groupData.can_anyone_invite)
      };
        console.log('🔍 Données envoyées:', submitData);
      // Appeler le callback
      if (onGroupCreated) {
        await onGroupCreated(submitData);
      }
      
      // Fermer le modal
      handleClose();
      
    } catch (err) {
      setError(err.message || 'Erreur création groupe');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setStep(1);
    setGroupData({
      group_type: 'group_private',
      name: '',
      description: '',
      group_photo: null,
      can_anyone_invite: true,
      max_participants: 100,
      participant_ids: [],
    });
    setSelectedUsers([]);
    setSearchResults([]);
    setSearchQuery('');
    setError('');
    onClose();
  };
  
  const nextStep = () => {
    if (step === 1 && !groupData.group_type) {
      setError('Sélectionnez un type de groupe');
      return;
    }
    setStep(step + 1);
    setError('');
  };
  
  const prevStep = () => {
    setStep(step - 1);
    setError('');
  };
  
  // Fonction utilitaire pour obtenir les initiales
  const getInitials = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };
  
  // Rendu étape 1: Type de groupe
  const renderStep1 = () => (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Choisissez le type de groupe que vous souhaitez créer
      </Typography>
      
      <RadioGroup
        name="group_type"
        value={groupData.group_type}
        onChange={handleChange}
      >
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            value="group_private"
            control={<Radio />}
            label={
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <LockIcon fontSize="small" />
                  <Typography fontWeight="bold">Groupe Privé</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Seulement sur invitation • Idéal pour les amis, famille, projets privés
                </Typography>
              </Box>
            }
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: groupData.group_type === 'group_private' ? 'primary.main' : 'divider',
              borderRadius: 2,
              mb: 1,
              width: '100%',
            }}
          />
        </Box>
        
        <Box>
          <FormControlLabel
            value="group_public"
            control={<Radio />}
            label={
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <PublicIcon fontSize="small" />
                  <Typography fontWeight="bold">Groupe Public</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Visible par tous • N'importe qui peut rejoindre • Idéal pour les communautés
                </Typography>
              </Box>
            }
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: groupData.group_type === 'group_public' ? 'primary.main' : 'divider',
              borderRadius: 2,
              width: '100%',
            }}
          />
        </Box>
      </RadioGroup>
    </Box>
  );
  
  // Rendu étape 2: Détails du groupe
  const renderStep2 = () => (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configurez les détails de votre groupe
      </Typography>
      
      {/* Photo du groupe */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
        
        <Avatar
          src={groupData.group_photo_preview}
          sx={{
            width: 120,
            height: 120,
            mb: 2,
            bgcolor: 'primary.light',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {groupData.group_photo_preview ? null : <GroupIcon sx={{ fontSize: 60 }} />}
        </Avatar>
        
        <Button
          startIcon={<AddPhotoIcon />}
          onClick={() => fileInputRef.current?.click()}
          variant="outlined"
          size="small"
        >
          {groupData.group_photo ? 'Changer la photo' : 'Ajouter une photo'}
        </Button>
        
        {groupData.group_photo && (
          <Button
            onClick={removePhoto}
            color="error"
            size="small"
            sx={{ mt: 1 }}
          >
            Supprimer la photo
          </Button>
        )}
      </Box>
      
      {/* Nom du groupe */}
      <TextField
        fullWidth
        label="Nom du groupe"
        name="name"
        value={groupData.name}
        onChange={handleChange}
        required={groupData.group_type === 'group_public'}
        helperText={
          groupData.group_type === 'group_public' 
            ? "Le nom sera visible par tous" 
            : "Facultatif pour les groupes privés"
        }
        sx={{ mb: 3 }}
      />
      
      {/* Description */}
      <TextField
        fullWidth
        label="Description"
        name="description"
        value={groupData.description}
        onChange={handleChange}
        multiline
        rows={3}
        helperText="Décrivez le but de votre groupe"
        sx={{ mb: 3 }}
      />
      
      {/* Options */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              name="can_anyone_invite"
              checked={groupData.can_anyone_invite}
              onChange={handleChange}
            />
          }
          label="Tous les membres peuvent inviter"
        />
      </Box>
      
      {groupData.group_type === 'group_public' && (
        <TextField
          fullWidth
          label="Nombre maximum de membres"
          name="max_participants"
          type="number"
          value={groupData.max_participants}
          onChange={handleChange}
          inputProps={{ min: 2, max: 1000 }}
          sx={{ mb: 2 }}
        />
      )}
    </Box>
  );
  
  // Rendu étape 3: Participants
  const renderStep3 = () => (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Sélectionnez les membres de votre groupe ({selectedUsers.length}/{groupData.max_participants})
      </Typography>
      
      {/* Utilisateurs sélectionnés */}
      {selectedUsers.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Membres sélectionnés:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedUsers.map((user) => (
              <Chip
                key={user.id}
                label={user.username}
                onDelete={() => removeSelectedUser(user.id)}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {/* Recherche */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          label="Rechercher des utilisateurs"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Recherche automatique au changement
            if (e.target.value.length >= 2) {
              handleSearch();
            } else {
              setSearchResults([]);
            }
          }}
          placeholder="Tapez au moins 2 caractères..."
          sx={{ flex: 1 }}
        />
        <Button
          onClick={handleSearch}
          variant="outlined"
          disabled={searchQuery.length < 2 || searching}
        >
          {searching ? <CircularProgress size={24} /> : 'Rechercher'}
        </Button>
      </Box>
      
      {/* Résultats de recherche */}
      <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
        {searching ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        ) : searchResults.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" p={3}>
            {searchQuery.length >= 2 
              ? 'Aucun utilisateur trouvé' 
              : 'Tapez au moins 2 caractères pour rechercher'}
          </Typography>
        ) : (
          searchResults.map((user) => {
            const isSelected = selectedUsers.some(u => u.id === user.id);
            return (
              <Box
                key={user.id}
                onClick={() => toggleUserSelection(user)}
                sx={{
                  p: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'primary.light' : 'background.paper',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.light' : 'action.hover',
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar 
                    src={user.profile_image} 
                    sx={{ 
                      width: 40, 
                      height: 40,
                      bgcolor: user.profile_image ? undefined : 'primary.main'
                    }}
                  >
                    {!user.profile_image && getInitials(user.username)}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle1">{user.username}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  {isSelected && (
                    <Typography variant="caption" color="primary" fontWeight="bold">
                      ✓
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
      
      {/* Info sur la sélection */}
      {selectedUsers.length > 0 && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography variant="caption" color="success.dark">
            {selectedUsers.length} utilisateur(s) sélectionné(s)
          </Typography>
        </Box>
      )}
    </Box>
  );
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Créer un nouveau groupe
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Indicateur d'étape */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="center" gap={1}>
            {[1, 2, 3].map((s) => (
              <Box
                key={s}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: step >= s ? 'primary.main' : 'grey.300',
                  color: step >= s ? 'white' : 'text.secondary',
                  fontWeight: 'bold',
                }}
              >
                {s}
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
            {step === 1 ? 'Type' : step === 2 ? 'Détails' : 'Participants'}
          </Typography>
        </Box>
        
        {/* Erreur */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {/* Contenu de l'étape */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </DialogContent>
      
      <DialogActions>
        {step > 1 && (
          <Button onClick={prevStep} disabled={loading}>
            Précédent
          </Button>
        )}
        
        {step < 3 ? (
          <Button onClick={nextStep} variant="contained" disabled={loading}>
            Suivant
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || selectedUsers.length === 0}
            startIcon={loading && <CircularProgress size={16} />}
          >
            {loading ? 'Création...' : 'Créer le groupe'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupModal;
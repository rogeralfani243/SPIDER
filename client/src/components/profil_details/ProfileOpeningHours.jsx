import React, { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  Box,
  Typography,
  Chip,
  Paper,
  useMediaQuery,
  useTheme,
  Tooltip,
  Snackbar,
  Alert,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Popover,
  List,
  ListItem,
  Divider,
  Collapse,
  colors
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Call as CallIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import API_URL from '../../hooks/useApiUrl';

// Styles personnalisés
const FloatingDesktopWidget = styled(Paper)(({ theme }) => ({
  position:'absolute',
  right: 20,
  top: '175% auto',
  paddingsLeft:'50%',
  float:'right',
  transform: 'translateY(-50%)',
  width: 320,
  padding: theme.spacing(2.5),
  borderRadius: theme.shape.borderRadius * 1.5,

  zIndex: 10,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid #fdfdfdab`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[16],
    transform: 'translateY(-50%) scale(1.02)',
  },
  '@media (max-width: 1400px)': {
    width: 220,
    right: 10,
    top:'120%'
  }
}));

const MobileFabButton = styled(IconButton)(({ theme }) => ({
  position: 'sticky',
  bottom: 20,
  right: 20,
  backgroundColor: '#ffffff',
  color:'#a80505d0',
  width: 56,
  height: 56,
  zIndex: 10,
  '&:hover': {
    backgroundColor: '#ffffff',
    boxShadow: theme.shadows[12],
 
   
  },
  transition: 'all 0.2s ease',
}));

const StatusBadge = styled(Chip)(({ theme, status }) => ({
  fontWeight: 'bold',
  marginLeft: theme.spacing(1),
  backgroundColor: status === 'open' 
    ? theme.palette.success.main 
    : theme.palette.error.main,
  color: theme.palette.common.white,
  fontSize: '0.7rem',
  height: 24,
  border:'none'
}));

const HoursRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
  }
}));

const OpeningHoursWidget = ({ profile, currentUserId, onHoursUpdate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isEditing, setIsEditing] = useState(false);
  const [openingHours, setOpeningHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHours, setLoadingHours] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tempHours, setTempHours] = useState([]);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [hasHours, setHasHours] = useState(false);
  const [profileInfo, setProfileInfo] = useState({
    phone: '',
    name: '',
    username: ''
  });
  
  // État pour le popup mobile
  const [anchorEl, setAnchorEl] = useState(null);
  // État pour l'édition compacte
  const [expandedDay, setExpandedDay] = useState(null);

  // Jours de la semaine ordonnés
  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  // Charger les données
  useEffect(() => {
    console.log('🔍 [OpeningHoursWidget] Profile:', profile);
    
    if (profile?.id) {
      setProfileInfo({
        phone: profile.phone || '',
        name: profile.business_name || profile.user?.username || 'Profile',
        username: profile.user?.username || ''
      });
      fetchOpeningHours();
      checkOpenStatus();
    } else {
      setLoadingHours(false);
    }
  }, [profile]);

  // Synchroniser tempHours avec openingHours quand elles changent
  useEffect(() => {
    if (openingHours.length > 0 && !isEditing) {
      // Mettre à jour tempHours avec les données actuelles
      const preparedHours = prepareHoursForEdit(openingHours);
      setTempHours(preparedHours);
    }
  }, [openingHours, isEditing]);

  const fetchOpeningHours = async () => {
    if (!profile?.id) return;
    
    try {
      setLoadingHours(true);
      console.log('🔄 [DEBUG] Fetching opening hours for profile:', profile.id);
      
      const response = await fetch(`${API_URL}/api/profile/${profile.id}/opening-hours/`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [DEBUG] Opening hours response:', data);
        
        if (data.opening_hours && Array.isArray(data.opening_hours)) {
          // CORRECTION: Si is_closed n'est pas défini dans les données, mais que les heures sont vides, considérer comme fermé
          const correctedHours = data.opening_hours.map(hour => {
            // Déterminer si le jour est vraiment fermé
            // Si is_closed est true OU si les deux heures sont vides/nulles, alors c'est fermé
            const isClosed = hour.is_closed === true || 
                            (!hour.open_time && !hour.close_time);
            
            return {
              ...hour,
              is_closed: isClosed,
              open_time: hour.open_time || '',
              close_time: hour.close_time || ''
            };
          });
          
          setOpeningHours(correctedHours);
          setTempHours(correctedHours);
          setHasHours(correctedHours.length > 0);
        } else {
          // Si pas d'heures du tout
          setOpeningHours([]);
          setTempHours([]);
          setHasHours(false);
        }
      } else {
        console.warn('⚠️ [DEBUG] Failed to fetch opening hours:', response.status);
        setOpeningHours([]);
        setTempHours([]);
        setHasHours(false);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching opening hours:', error);
      setOpeningHours([]);
      setTempHours([]);
      setHasHours(false);
    } finally {
      setLoadingHours(false);
    }
  };

  const prepareHoursForEdit = (hoursFromServer) => {
    // Créer un tableau pour tous les jours de la semaine
    return daysOfWeek.map(day => {
      // Chercher les données existantes pour ce jour
      const existingHour = hoursFromServer.find(h => h.day === day.key);
      
      if (existingHour) {
        // Retourner les données existantes avec la logique de fermeture corrigée
        return {
          day: day.key,
          open_time: existingHour.open_time || '',
          close_time: existingHour.close_time || '',
          // CORRECTION: Si les heures sont vides, considérer comme fermé
          is_closed: existingHour.is_closed === true || 
                    (!existingHour.open_time && !existingHour.close_time),
          notes: existingHour.notes || ''
        };
      } else {
        // Pas de données pour ce jour = considérer comme fermé par défaut
        return {
          day: day.key,
          open_time: '',
          close_time: '',
          is_closed: true, // Par défaut, fermé si pas de données
          notes: ''
        };
      }
    });
  };

  const checkOpenStatus = async () => {
    if (!profile?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/profile/${profile.id}/is-open/`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [DEBUG] Open status response:', data);
        setIsOpenNow(data.is_open || false);
      } else {
        console.warn('⚠️ [DEBUG] Failed to check open status:', response.status);
        setIsOpenNow(false);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error checking open status:', error);
      setIsOpenNow(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setExpandedDay(null);
    
    // Préparer les données pour l'édition
    const hoursForEdit = prepareHoursForEdit(openingHours);
    setTempHours(hoursForEdit);
    
    // En mobile, garder le popup ouvert
    if (isMobile && anchorEl) {
      // Le popup reste ouvert
    }
  };

  const handleSaveClick = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      // Préparer les données pour l'envoi
      const hoursToSend = tempHours.map(hour => {
        const hourData = {
          day: hour.day,
          is_closed: hour.is_closed || false
        };
        
        // CORRECTION: Si c'est fermé, envoyer des chaînes vides
        if (hour.is_closed) {
          hourData.open_time = '';
          hourData.close_time = '';
        } else {
          // Si c'est ouvert, s'assurer d'avoir des heures valides
          hourData.open_time = hour.open_time ? formatTimeToHHMM(hour.open_time) : '09:00';
          hourData.close_time = hour.close_time ? formatTimeToHHMM(hour.close_time) : '18:00';
        }
        
        return hourData;
      });

      console.log('📤 [DEBUG] Sending hours to server:', hoursToSend);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/profile/${profile.id}/opening-hours/update-all/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Token ${token}` : '',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(hoursToSend)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [DEBUG] Update response:', data);
        
        // Recharger les données depuis le serveur
        await fetchOpeningHours();
        
        setSnackbar({
          open: true,
          message: data.message || 'Opening hours updated successfully!',
          severity: 'success'
        });
        
        setIsEditing(false);
        setExpandedDay(null);
        
        if (onHoursUpdate) {
          onHoursUpdate(data.opening_hours || []);
        }
        
        // Re-vérifier le statut
        await checkOpenStatus();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [DEBUG] Server error response:', errorData);
        throw new Error(errorData.error || errorData.detail || 'Failed to update hours');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error updating hours:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error updating hours',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setExpandedDay(null);
    // Revenir aux données originales
    const hoursForEdit = prepareHoursForEdit(openingHours);
    setTempHours(hoursForEdit);
  };

  const handleHourChange = (index, field, value) => {
    const newTempHours = [...tempHours];
    
    // Assurer que l'élément existe
    if (!newTempHours[index]) {
      newTempHours[index] = {
        day: daysOfWeek[index].key,
        open_time: '',
        close_time: '',
        is_closed: true, // Par défaut fermé
        notes: ''
      };
    }
    
    if (field === 'is_closed') {
      const isClosed = Boolean(value);
      newTempHours[index] = {
        ...newTempHours[index],
        is_closed: isClosed,
        // Si on passe à ouvert, mettre des heures par défaut si vides
        open_time: isClosed ? '' : (newTempHours[index].open_time || '09:00'),
        close_time: isClosed ? '' : (newTempHours[index].close_time || '18:00')
      };
    } else if (field === 'open_time' || field === 'close_time') {
      const newValue = value || '';
      const hasTime = newValue.trim() !== '';
      
      newTempHours[index] = {
        ...newTempHours[index],
        [field]: newValue,
        // Si on ajoute une heure, passer à ouvert
        is_closed: hasTime ? false : newTempHours[index].is_closed
      };
    } else {
      newTempHours[index] = { ...newTempHours[index], [field]: value };
    }
    
    setTempHours(newTempHours);
  };

  const formatTimeToHHMM = (time) => {
    if (!time || time.trim() === '') return '';
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(time)) {
      return time;
    }
    
    const cleanedTime = time.toString().replace(/[^0-9:]/g, '');
    const parts = cleanedTime.split(':');
    
    if (parts.length >= 2) {
      let hours = parseInt(parts[0]) || 9;
      let minutes = parseInt(parts[1]) || 0;
      
      hours = Math.max(0, Math.min(23, hours));
      minutes = Math.max(0, Math.min(59, minutes));
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return '09:00';
  };

  const formatTimeForDisplay = (time) => {
    if (!time || time.trim() === '') return '--:--';
    
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      
      if (isNaN(hour)) return time;
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes || '00'} ${ampm}`;
    } catch {
      return time;
    }
  };

  const getCsrfToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  };

  const isOwner = currentUserId === profile?.user_id;

  const handleMobileClick = (event) => {
    console.log('🟢 Mobile button clicked for profile:', profile?.id);
    setAnchorEl(event.currentTarget);
  };

  const handleMobileClose = () => {
    if (isEditing) {
      // En mode édition, on annule d'abord
      handleCancelClick();
    }
    setAnchorEl(null);
  };

  const toggleDayExpansion = (dayKey) => {
    if (expandedDay === dayKey) {
      setExpandedDay(null);
    } else {
      setExpandedDay(dayKey);
    }
  };

  // Fonction pour trouver les données d'un jour spécifique
  const getDayData = (dayKey) => {
    const hourData = openingHours.find(h => h.day === dayKey);
    if (hourData) {
      // Appliquer la même logique de correction
      const isClosed = hourData.is_closed === true || 
                      (!hourData.open_time && !hourData.close_time);
      return {
        ...hourData,
        is_closed: isClosed
      };
    }
    return null;
  };

  // Si pas de profil, ne rien afficher
  if (!profile) {
    return null;
  }

  const open = Boolean(anchorEl);
  const id = open ? 'mobile-hours-popover' : undefined;

  // Rendu Desktop
  if (!isMobile) {
    return (
      <>
        <FloatingDesktopWidget>
          {/* En-tête avec statut */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {profileInfo.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Availability
              </Typography>
            </Box>
            {hasHours && (
              <StatusBadge
                size="small"
                label={isOpenNow ? 'OPEN' : 'CLOSED'}
                status={isOpenNow ? 'open' : 'closed'}
              />
            )}
          </Box>

          {/* Bouton d'édition pour le propriétaire */}
          {isOwner && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              {!isEditing ? (
                <Tooltip title="Edit opening hours">
                  <Button
                    size="small"
                    onClick={handleEditClick}
                    startIcon={<EditIcon />}
                    variant="outlined"
                  >
                    Edit
                  </Button>
                </Tooltip>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                  <Button
                    size="small"
                    onClick={handleSaveClick}
                    disabled={loading}
                    startIcon={<SaveIcon />}
                    variant="contained"
                    sx={{ flex: 1 }}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="small"
                    onClick={handleCancelClick}
                    startIcon={<CancelIcon />}
                    variant="outlined"
                    sx={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Mode édition compact */}
          {isEditing ? (
            <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2 }}>
              {daysOfWeek.map((day, index) => {
                const hourData = tempHours[index] || {
                  day: day.key,
                  open_time: '',
                  close_time: '',
                  is_closed: true
                };

                return (
                  <Box 
                    key={day.key} 
                    sx={{ 
                      mb: 1,
                      p: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleDayExpansion(day.key)}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {day.label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={!hourData.is_closed}
                              onChange={(e) => handleHourChange(index, 'is_closed', !e.target.checked)}
                              color="primary"
                            />
                          }
                          label={hourData.is_closed ? "Closed" : "Open"}
                          sx={{ m: 0 }}
                        />
                        {expandedDay === day.key ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </Box>
                    </Box>

                    <Collapse in={expandedDay === day.key}>
                      {!hourData.is_closed && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <TextField
                            size="small"
                            type="time"
                            label="From"
                            value={hourData.open_time || ''}
                            onChange={(e) => handleHourChange(index, 'open_time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                            required={!hourData.is_closed}
                          />
                          <Typography variant="body2" color="text.secondary">to</Typography>
                          <TextField
                            size="small"
                            type="time"
                            label="Until"
                            value={hourData.close_time || ''}
                            onChange={(e) => handleHourChange(index, 'close_time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                            required={!hourData.is_closed}
                          />
                        </Box>
                      )}
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          ) : (
            /* Mode affichage normal */
            <>
              {/* Liste des horaires */}
              {loadingHours ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : hasHours ? (
                <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                  {daysOfWeek.map((day) => {
                    const hourData = getDayData(day.key);
                    
                    return (
                      <HoursRow key={day.key}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {day.label.slice(0, 3)}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {!hourData || hourData.is_closed ? (
                            <span style={{ color: theme.palette.error.main, fontStyle: 'italic' }}>
                              Closed
                            </span>
                          ) : hourData.open_time && hourData.close_time ? (
                            `${formatTimeForDisplay(hourData.open_time)} - ${formatTimeForDisplay(hourData.close_time)}`
                          ) : (
                            <span style={{ color: theme.palette.warning.main }}>Not set</span>
                          )}
                        </Typography>
                      </HoursRow>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', my: 3, py: 2 }}>
                  <ScheduleIcon sx={{ fontSize: 40, color: theme.palette.text.disabled, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No hours set
                  </Typography>
                </Box>
              )}

              {/* Bouton d'appel si numéro disponible */}
              {profileInfo.phone && (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PhoneIcon />}
                  href={`tel:${profileInfo.phone}`}
                  sx={{ 
                    backgroundColor: theme.palette.success.main,
                    '&:hover': {
                      backgroundColor: theme.palette.success.dark,
                        color:'#ffff',
                    }
                  }}
                >
                  Call {profileInfo.name.split(' ')[0]}
                </Button>
              )}
            </>
          )}
        </FloatingDesktopWidget>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // Rendu Mobile - Petit popup direct avec édition compacte
  return (
    <>
      {/* Bouton flottant mobile */}
      <MobileFabButton
        onClick={handleMobileClick}
        size="large"
      >
        <TimeIcon />
      </MobileFabButton>

      {/* Popup mobile avec les horaires */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleMobileClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            zIndex:'10',
            width: 300,
            maxHeight: 500,
            borderRadius: 2,
            boxShadow: theme.shadows[10],
            p: 2,
          }
        }}
      >
        {/* En-tête du popup */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon color="primary" sx={{ mr: 1.5, fontSize: 24 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {profileInfo.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Availability
            </Typography>
          </Box>
          {hasHours && (
            <Chip
              label={isOpenNow ? 'OPEN' : 'CLOSED'}
              size="small"
              sx={{
                backgroundColor: isOpenNow ? theme.palette.success.main : theme.palette.error.main,
                color: 'white',
                fontWeight: 'bold',
                border:'none'
              }}
            />
          )}
        </Box>

        {/* Boutons d'édition pour le propriétaire */}
        {isOwner && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {!isEditing ? (
              <Button
                size="small"
                onClick={handleEditClick}
                startIcon={<EditIcon />}
                variant="outlined"
                fullWidth
              >
                Edit Hours
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  onClick={handleSaveClick}
                  disabled={loading}
                  startIcon={<SaveIcon />}
                  variant="contained"
                  sx={{ flex: 1 }}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="small"
                  onClick={handleCancelClick}
                  startIcon={<CancelIcon />}
                  variant="outlined"
                  sx={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Contenu selon le mode */}
        {loadingHours ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : isEditing ? (
          /* Mode édition mobile compact - LE POPUP RESTE OUVERT */
          <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
            {daysOfWeek.map((day, index) => {
              const hourData = tempHours[index] || {
                day: day.key,
                open_time: '',
                close_time: '',
                is_closed: true
              };

              return (
                <Box 
                  key={day.key} 
                  sx={{ 
                    mb: 1,
                    p: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    backgroundColor: 'background.paper'
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleDayExpansion(day.key)}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {day.label.slice(0, 3)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {hourData.is_closed ? 'Closed' : 'Open'}
                      </Typography>
                      {expandedDay === day.key ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                  </Box>

                  <Collapse in={expandedDay === day.key}>
                    <Box sx={{ mt: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={!hourData.is_closed}
                            onChange={(e) => handleHourChange(index, 'is_closed', !e.target.checked)}
                            color="primary"
                          />
                        }
                        label={hourData.is_closed ? "Closed" : "Open"}
                        sx={{ m: 0, mb: 1 }}
                      />
                      
                      {!hourData.is_closed && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            size="small"
                            type="time"
                            label="From"
                            value={hourData.open_time || ''}
                            onChange={(e) => handleHourChange(index, 'open_time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                            required={!hourData.is_closed}
                          />
                          <Typography variant="body2" color="text.secondary">to</Typography>
                          <TextField
                            size="small"
                            type="time"
                            label="Until"
                            value={hourData.close_time || ''}
                            onChange={(e) => handleHourChange(index, 'close_time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                            required={!hourData.is_closed}
                          />
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        ) : hasHours ? (
          /* Mode affichage mobile */
          <List dense sx={{ py: 0, maxHeight: 300, overflowY: 'auto' }}>
            {daysOfWeek.map((day) => {
              const hourData = getDayData(day.key);
              
              return (
                <ListItem 
                  key={day.key} 
                  sx={{ 
                    px: 1, 
                    py: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ minWidth: 70, fontWeight: 'medium' }}>
                    {day.label.slice(0, 3)}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      textAlign: 'right',
                      color: !hourData || hourData.is_closed ? 'error.main' : 'text.primary',
                      fontStyle: !hourData || hourData.is_closed ? 'italic' : 'normal'
                    }}
                  >
                    {!hourData || hourData.is_closed ? 'Closed' : 
                     hourData.open_time && hourData.close_time ? 
                     `${formatTimeForDisplay(hourData.open_time)} - ${formatTimeForDisplay(hourData.close_time)}` : 
                     'Not set'}
                  </Typography>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <ScheduleIcon sx={{ fontSize: 40, color: theme.palette.text.disabled, mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary">
              No hours set
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {profileInfo.phone && !isEditing && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CallIcon />}
              href={`tel:${profileInfo.phone}`}
              fullWidth
              sx={{ 
                
                backgroundColor: theme.palette.success.main,
                '&:hover': {
                    color:'#ffff',
                  backgroundColor: theme.palette.success.dark,
                }
              }}
            >
              Call Now
            </Button>
          )}
          
          <Button
            variant="text"
            size="small"
            onClick={handleMobileClose}
            fullWidth
          >
            {isEditing ? 'Cancel & Close' : 'Close'}
          </Button>
        </Box>
      </Popover>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OpeningHoursWidget;
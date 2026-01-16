// components/MessageBubble.js
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import {
  Close as CancelIcon,
  Check as CheckIcon,
  ArrowDropDown as ArrowDropDownIcon,
  // Icônes pour les messages système
  PersonRemove as PersonRemoveIcon,
  PhotoCamera as PhotoCameraIcon,
  PersonAdd as PersonAddIcon,
  GroupRemove as GroupRemoveIcon,
  AdminPanelSettings as AdminIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Create as CreateIcon,
} from '@mui/icons-material';

const MessageBubble = ({ 
  message,  // SINGULIER - un message individuel
  currentUser, 
  isOwn, 
  renderMediaDirectly, 
  handleContextMenu, 
  editingMessage, 
  editContent, 
  setEditContent, 
  saveEditMessage, 
  cancelEdit 
}) => {
  const [showArrow, setShowArrow] = useState(false);
  
  // DÉTECTION DES MESSAGES SYSTÈMES
  const isSystemMessage = message?.is_system_message || 
                         message?.message_type === 'system' ||
                         message?.system_message_type;
  
  // Détecter le type de message système
  const getSystemMessageType = () => {
    if (!isSystemMessage) return null;
    
    // Priorité au champ system_message_type
    if (message?.system_message_type) {
      return message.system_message_type;
    }
    
    // Sinon détecter par le contenu
    const content = message?.content?.toLowerCase() || '';
    
    if (content.includes('removed') || content.includes('supprimé') || content.includes('retiré')) {
      return 'user_removed';
    } else if (content.includes('photo') || content.includes('image') || content.includes('a changé la photo')) {
      return 'group_photo_changed';
    } else if (content.includes('created the group') || content.includes('created a group')) {
      return 'group_created';
    } else if (content.includes('joined') || content.includes('a rejoint') || content.includes('rejoint le groupe')) {
      return 'user_joined';
    } else if (content.includes('left') || content.includes('a quitté') || content.includes('quitté le groupe')) {
      return 'user_left';
    } else if (content.includes('invited') || content.includes('a invité') || content.includes('invité à rejoindre') || content.includes('added')) {
      return 'user_added';
    } else if (content.includes('changed the group name') || content.includes('a changé le nom')) {
      return 'group_name_changed';
    } else if (content.includes('promoted') || content.includes('promu')) {
      return 'admin_promoted';
    } else if (content.includes('demoted') || content.includes('rétrogradé')) {
      return 'admin_demoted';
    } else if (content.includes('transferred') || content.includes('transféré')) {
      return 'ownership_transferred';
    }
    
    return 'info';
  };

  // Obtenir l'icône
  const getSystemMessageIcon = () => {
    const type = getSystemMessageType();
    
    switch(type) {
      case 'user_removed':
        return <PersonRemoveIcon fontSize="small" />;
      case 'group_photo_changed':
        return <PhotoCameraIcon fontSize="small" />;
      case 'group_created':
        return <GroupIcon fontSize="small" />;
      case 'user_joined':
        return <PersonAddIcon fontSize="small" />;
      case 'user_left':
        return <GroupRemoveIcon fontSize="small" />;
      case 'user_added':
        return <PersonAddIcon fontSize="small" />;
      case 'group_name_changed':
        return <CreateIcon fontSize="small" />;
      case 'admin_promoted':
        return <AdminIcon fontSize="small" />;
      case 'admin_demoted':
        return <SettingsIcon fontSize="small" />;
      case 'ownership_transferred':
        return <CheckCircleIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  // Obtenir la couleur
  const getSystemMessageColor = () => {
    const type = getSystemMessageType();
    
    switch(type) {
      case 'user_removed':
        return 'error';
      case 'group_photo_changed':
      case 'group_name_changed':
        return 'info';
      case 'user_joined':
      case 'user_added':
      case 'group_created':
        return 'success';
      case 'user_left':
        return 'warning';
      case 'ownership_transferred':
      case 'admin_promoted':
      case 'admin_demoted':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Si plus de 24 heures, afficher la date complète
    if (diffHours > 24) {
      return messageDate.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Sinon, afficher seulement l'heure
    return messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction utilitaire pour obtenir les initiales
  const getInitials = (username) => {
    if (!username) return 'U';
    return username.charAt(0).toUpperCase();
  };

  // Récupérer l'image de profil pour l'expéditeur
  const getSenderProfileImage = () => {
    if (!message?.sender) return null;
    
    return message.sender.profile_image || 
           message.sender?.image || 
           message.sender?.avatar || 
           message.sender?.profile?.image;
  };

  const senderProfileImage = getSenderProfileImage();
  
  // Gestionnaire de clic pour la bulle de message
  const handleBubbleClick = (e) => {
    // Empêcher le menu contextuel par défaut
    e.preventDefault();
    // Déclencher le menu contextuel personnalisé
    handleContextMenu(e, message);
  };
  
  // Gestionnaire pour l'affichage du menu au clic
  const handleBubbleMouseDown = (e) => {
    // On utilise mouseDown plutôt que click pour être plus rapide
    // et éviter les conflits avec d'autres événements
    if (e.button === 0) { // Clic gauche seulement
      e.preventDefault();
      handleContextMenu(e, message);
    }
  };

  // RENDU DES MESSAGES SYSTÈMES
  const renderSystemMessage = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          my: 2,
          px: 2,
        }}
      >
        <Chip
          label={message?.content}
          icon={getSystemMessageIcon()}
          color={getSystemMessageColor()}
          size="small"
          variant="outlined"
          sx={{
            maxWidth: '85%',
            bgcolor: 'background.paper',
            borderColor: 'divider',
            fontSize: '0.75rem',
            py: 0.75,
            px: 1.5,
            '& .MuiChip-icon': {
              color: `${getSystemMessageColor()}.main`,
            },
            '& .MuiChip-label': {
              px: 0.5,
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            fontSize: '0.7rem',
            ml: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {formatMessageTime(message?.timestamp)}
        </Typography>
      </Box>
    );
  };

  // RENDU DU CONTENU DES MESSAGES (pour messages normaux)
  const renderContent = () => {
    if (editingMessage?.id === message?.id) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1, 
          bgcolor: '#dcf8c6', 
          p: 1.5, 
          borderRadius: '18px 18px 4px 18px',
          border: '1px solid #dcf8c6'
        }}>
          {(message?.image || message?.file) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Existing media (cannot be changed):
              </Typography>
              {renderMediaDirectly(message)}
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            size="small"
            autoFocus
            sx={{ bgcolor: 'white' }}
            placeholder="Edit your message..."
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              startIcon={<CancelIcon />}
              onClick={cancelEdit}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={saveEditMessage}
            >
              Save
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Paper
        elevation={0}
        className={`message-bubble ${isOwn ? 'message-bubble-sent' : 'message-bubble-received'} whatsapp-message`}
        sx={{
          p: 1.5,
          backgroundColor: isOwn ? '#920909ff' : '#640505ff',
          border: '1px solid',
          color:'white',
          borderColor: isOwn ? '#dcf8c6' : '#e0e0e0',
          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          position: 'relative',
          cursor: 'pointer', // Curseur main pour indiquer que c'est cliquable
          '&:hover': {
            boxShadow: 2, // Effet de surbrillance au survol
            borderColor: isOwn ? '#a8d8a8' : '#c0c0c0',
          },
          '&:active': {
            backgroundColor: isOwn ? '#820808ff' : '#540404ff',
          }
        }}
        onClick={handleBubbleClick} // Gestionnaire de clic
        onContextMenu={(e) => {
          e.preventDefault(); // Empêcher le menu contextuel par défaut
          handleContextMenu(e, message);
        }}
        onMouseDown={handleBubbleMouseDown} // Alternative au clic
      >
        {!isOwn && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', color:'#ebe7e7ff' }}>
            {message?.sender?.username || 'User'}
          </Typography>
        )}
        
        {message?.content && (
          <Typography sx={{ wordBreak: 'keep-all', mb: message?.image || message?.file ? 1 : 0 }}>
            {message.content}
          </Typography>
        )}
        
        {renderMediaDirectly(message)}
        
        <Typography
          variant="caption"
          color="#bebdbdff"
          sx={{
            display: 'block',
            textAlign: 'right',
            mt: 0.5,
            fontSize: '0.7rem'
          }}
        >
          {formatMessageTime(message?.timestamp)}
          {isOwn && message?.is_read && ' ✓✓'}
        </Typography>
      </Paper>
    );
  };

  // RENDU DES MESSAGES NORMAUX
  const renderNormalMessage = () => {
    return (
      <Box
        key={message.id}
        className="message-container"
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: 2,
          px: 2,
          position: 'relative',
          cursor: 'default', // Curseur par défaut pour le conteneur
        }}
        // Retirer le onContextMenu du conteneur, maintenant sur la bulle
      >
        {!isOwn ? (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', maxWidth: '70%', position: 'relative' }}>
            {/* Avatar pour les messages reçus */}
            <Avatar
              src={senderProfileImage}
              alt={message?.sender?.username}
              sx={{ 
                mr: 1, 
                width: 32, 
                height: 32,
                bgcolor: senderProfileImage ? undefined : 'secondary.main',
                mt: 0.5
              }}
            >
              {!senderProfileImage && getInitials(message?.sender?.username)}
            </Avatar>
            
            <Box sx={{ maxWidth: 'calc(100% - 40px)', position: 'relative', color:'black' }}>
              {renderContent()}
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', maxWidth: '70%', flexDirection: 'row-reverse' }}>
            <Box sx={{ maxWidth: 'calc(100% - 1px)', position: 'relative' }}>
              {renderContent()}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // Vérifier si message est défini
  if (!message) {
    return null;
  }

  // Si c'est un message système, afficher la version spéciale
  if (isSystemMessage) {
    return renderSystemMessage();
  }

  // Sinon, afficher le message normal
  return renderNormalMessage();
};

export default MessageBubble;
// src/components/groups/JoinGroupDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Lock as LockIcon,
  Public as PublicIcon,
  Block as BlockIcon,
  PersonAdd as PersonAddIcon,
  Warning as WarningIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';

const JoinGroupDialog = ({ 
  open, 
  onClose, 
  group, 
  joinMessage, 
  setJoinMessage, 
  handleJoinRequest,
  joinError = null, // Nouvelle prop pour les erreurs
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(joinError);
  const [isUserBanned, setIsUserBanned] = useState(false);

  // Réinitialiser les erreurs quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setError(joinError);
      // Détecter si c'est une erreur de bannissement admin
      if (joinError && (
        joinError.includes('removed by admin') || 
        joinError.includes('USER WAS REMOVED BY ADMIN') ||
        joinError.includes('removed from this group') ||
        joinError.includes('cannot rejoin')
      )) {
        setIsUserBanned(true);
      }
    }
  }, [open, joinError]);

  // Réinitialiser quand le dialog se ferme
  useEffect(() => {
    if (!open) {
      setError(null);
      setIsUserBanned(false);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (isUserBanned) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await handleJoinRequest(joinMessage);
    } catch (err) {
      // L'erreur est déjà gérée dans handleJoinRequest
      console.error('Dialog submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdmin = () => {
    if (group?.created_by?.id) {
      window.open(`/messages?user_id=${group.created_by.id}`, '_blank');
    }
  };

  // Si l'utilisateur est banni par admin
  if (isUserBanned && error) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
            <BlockIcon />
            <Typography variant="h6">Access Restricted</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert 
            severity="error" 
            icon={<AdminIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Admin Restriction
            </Typography>
            <Typography variant="body2">
              You cannot join this group due to administrative action.
            </Typography>
          </Alert>

          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mb: 2, 
              backgroundColor: 'error.50',
              borderColor: 'error.100'
            }}
          >
            <Typography variant="subtitle2" color="error.main" gutterBottom>
              <WarningIcon sx={{ mr: 1, fontSize: 'inherit' }} />
              Restriction Details
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {error}
            </Typography>
          </Paper>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              What does this mean?
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" component="li">
                You were previously removed from this group by an administrator
              </Typography>
              <Typography variant="body2" component="li">
                You cannot rejoin automatically or send join requests
              </Typography>
              <Typography variant="body2" component="li">
                Only the group administrator can lift this restriction
              </Typography>
            </Box>
          </Box>

          {group.created_by?.id && (
            <Alert 
              severity="info"
              sx={{ mb: 2 }}
            >
              <Typography variant="body2" gutterBottom>
                If you believe this is a mistake, you can contact the group administrator.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleContactAdmin}
                sx={{ mt: 1 }}
              >
                Contact Administrator
              </Button>
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {group.requires_approval ? 'Request to Join' : 'Join'} {group.name}
      </DialogTitle>
      
      <DialogContent>
        {error && !isUserBanned && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}
        
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          icon={group.requires_approval ? <LockIcon /> : <PublicIcon />}
        >
          {group.requires_approval 
            ? 'Your request will be reviewed by the group admin before approval.'
            : 'You will be added to the group immediately.'}
        </Alert>
        
        {group.is_full && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This group has reached its maximum capacity of {group.max_participants} members.
          </Alert>
        )}
        
        {group.requires_approval && (
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            label="Message (optional)"
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
            placeholder="Tell the group admin why you want to join..."
            sx={{ mt: 1 }}
            disabled={loading}
          />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={group.is_full || loading}
          startIcon={loading ? null : <PersonAddIcon />}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              Processing...
            </Box>
          ) : (
            group.requires_approval ? 'Send Request' : 'Join Now'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinGroupDialog;
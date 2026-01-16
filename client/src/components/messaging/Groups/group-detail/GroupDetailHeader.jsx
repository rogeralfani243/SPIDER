// src/components/groups/GroupHeader.jsx
import React from 'react';
import {
  Card,
  CardMedia,
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import {
  Lock as LockIcon,
  Public as PublicIcon,
  Chat as ChatIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitToAppIcon,
  CheckCircle as CheckCircleIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import ReportButton from '../../../reports/ReportButton';
const GroupHeader = ({
  group,
  isAdmin,
  isMember,
  hasPendingRequest,
  canJoin,
  isPrivateGroup,
  onJoinClick,
  onLeaveGroup,
  onOpenChat,
  onEditGroup,
  onOpenAdminPanel,
}) => {
    const [expanded, setExpanded] = useState(false); 
  return (
    <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
      {/* Banner Image */}
      <Box sx={{ position: 'relative', height: { xs: 200, md: 300 } }}>
        <CardMedia
          component="img"
          height="100%"
          image={group.group_photo_url || '/default-group-banner.jpg'}
          alt={group.name}
          sx={{ objectFit: 'cover' }}
        />
        
        {/* Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
            color: 'white',
            p: 3,
          }}
        >
          <Grid container alignItems="flex-end">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {isPrivateGroup ? (
                  <LockIcon sx={{ mr: 1, color: 'white' }} />
                ) : (
                  <PublicIcon sx={{ mr: 1, color: 'white' }} />
                )}
                <Typography variant="overline" sx={{ color: 'white' }}>
                  {isPrivateGroup ? 'Private Group' : 'Public Group'}
                  {!group.is_visible && ' • Hidden'}
                </Typography>
              </Box>
              
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
      {(() => {
        const MAX_WORDS = 5;
        const words = group.name.split(' ');
        const isTruncated = words.length > MAX_WORDS;
        
        // Modifiez cette partie pour utiliser l'état 'expanded'
        let displayText;
        if (!isTruncated || expanded) {
          displayText = group.name;
        } else {
          displayText = words.slice(0, MAX_WORDS).join(' ') + '...';
        }
        
        return (
          <Box component="span">
            {displayText}
            {isTruncated && (
              <Button 
                size="small" 
                sx={{ 
                  ml: 1, 
                  color: 'white',
                  textTransform: 'none',
                 
                  padding: '2px 8px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded); // <-- ICI, changez l'état
                }}
              >
                {expanded ? 'See less' : 'See more'} {/* <-- Texte changeant */}
              </Button>
            )}
          </Box>
        );
      })()}
    </Typography>
              
              {group.category && (
                <Chip
                  icon={<CategoryIcon sx={{ color: 'white !important' }} />}
                  label={group.category.name}
                  size="small"
                  sx={{ 
                    mt: 1, 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} md={4}>
              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: { xs: 2, md: 0 } }}>
                {isMember && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ChatIcon />}
                    onClick={onOpenChat}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: 'text.primary',
                      '&:hover': {
                        backgroundColor: 'white'
                      }
                    }}
                  >
                    Open Chat
                  </Button>
                )}
                
                {isAdmin && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={onEditGroup}
                      sx={{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'text.primary',

                                 '&:hover': {
                        backgroundColor: 'white'
                      }
                       }}
                    >
                      Edit Group
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      startIcon={<MoreVertIcon />}
                      onClick={onOpenAdminPanel}
                      sx={{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'text.primary' }}
                    >
                      Admin Panel
                    </Button>
                  </>
                )}
                
                {!isMember && !hasPendingRequest  && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAddIcon />}
                    onClick={onJoinClick}
                    disabled={group.is_full}
                    sx={{ 
                      backgroundColor: group.is_full ? 'grey.600' : 'primary.main',
                      '&:hover': {
                        backgroundColor: group.is_full ? 'grey.600' : 'primary.dark',
                      }
                    }}
                  >
                    {group.requires_approval ? 'Request to Join' : 'Join Group'}
                  </Button>
                )}
                 <ReportButton
            contentType="conversation"
            contentId={group?.id}
            contentAuthorId={group?.user?.id}
            contentObject={group}
            buttonVariant="text"
            showIcon={true}
            showText={true}
            className="feedback-report-button"
   
          >
  
          </ReportButton> 
                {hasPendingRequest && (
                  <Alert 
                    severity="warning" 
                    icon={<CheckCircleIcon />}
                    sx={{ 
                      backgroundColor: 'rgba(255,193,7,0.1)',
                      color: 'white',
                      '& .MuiAlert-icon': { color: 'white' }
                    }}
                  >
                    Join request pending approval
                  </Alert>
                )}
                
                {isMember && !isAdmin && (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<ExitToAppIcon />}
                    onClick={onLeaveGroup}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.5)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Leave Group
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Card>
  );
};

export default GroupHeader;
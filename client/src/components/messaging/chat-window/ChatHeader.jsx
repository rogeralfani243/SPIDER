// src/components/messaging/ChatHeader.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Circle as CircleIcon,
  FiberManualRecord as OnlineIcon,
  Group as GroupIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitToAppIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as TransferIcon,  
  PersonRemove as PersonRemoveIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import { conversationAPI } from '../../../hooks/messaging/messagingApi';
import UserSearchDialog from '../UserSearchDialog';
import GroupInfoDialog from './chat-edit/GroupInfoDialog';
import LeaveGroupDialog from './chat-edit/LeaveGroupDialog';
import EditGroupDialog from './chat-edit/EditGroupDialog';
import ContactInfoDialog from './chat-edit/ContactInfoDialog';
import DeleteGroupDialog from './chat-edit/DeleteGroupDialog';
import RemoveMemberDialog from './chat-edit/RemoveMemberDialog';
import TransferAdminDialog from './chat-edit/TransferAdminDialog';
import ChatHeaderStyles from './chat-edit/styles/ChatHeaderStyle';
import DeleteConversationDialog from './chat-edit/DeleteConversationDialog';
import ReportButton from '../../reports/ReportButton';
import BlockButton from '../../blockage/blockButton';
const ChatHeader = ({ conversation, otherParticipant, messages, loadingMessages, loadMessages, currentUser, refreshConversations,onConversationDeleted  }) => {
  // Check if it's a group or private conversation
  const isGroup = conversation?.is_group || conversation?.participants?.length > 2;
  
  // For private conversations, use otherParticipant for status
  const { 
    isOnline, 
    formattedLastSeen, 
    loading: loadingStatus,
    checkUserStatus 
  } = useOnlineStatus(isGroup ? null : otherParticipant?.id);

  // State for menu
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  // State for dialogs
  const [groupInfoDialogOpen, setGroupInfoDialogOpen] = useState(false);
  const [contactInfoDialogOpen, setContactInfoDialogOpen] = useState(false);
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [leaveGroupDialogOpen, setLeaveGroupDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [invitingUsers, setInvitingUsers] = useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
   const [deleteConversationDialogOpen, setDeleteConversationDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // State for group editing
  const [editedGroupData, setEditedGroupData] = useState({
    name: '',
    description: '',
  });
  const [newGroupPhoto, setNewGroupPhoto] = useState(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState(null);
  const [realTimeMembers, setRealTimeMembers] = useState([]);
  const [transferAdminDialogOpen, setTransferAdminDialogOpen] = useState(false);
  
const [blockDialogOpen, setBlockDialogOpen] = useState(false);
const [isBlocked, setIsBlocked] = useState(false);
  const navigate = useNavigate();
  
  // State for adding members
  const [error, setError] = useState('');

  // ==================== UTILITY FUNCTIONS ====================

  // Function to get initials
  const getInitials = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  // Get profile image for private conversation
  const getProfileImage = () => {
    if (!otherParticipant) return null;
    
    return otherParticipant.profile_image || 
           otherParticipant?.image || 
           otherParticipant?.avatar || 
           otherParticipant?.profile?.image;
  };

  // Get group photo URL
  const getGroupPhotoUrl = () => {
    if (conversation?.group_photo_url) {
      return conversation.group_photo_url;
    }
    if (conversation?.group_photo) {
      // Handle case where group_photo is a File object or URL string
      if (typeof conversation.group_photo === 'string') {
        return conversation.group_photo;
      }
      if (conversation.group_photo instanceof File) {
        return URL.createObjectURL(conversation.group_photo);
      }
    }
    return null;
  };

  // Get group avatar text (for fallback when no photo)
  const getGroupAvatarText = () => {
    // Try group name first
    if (conversation?.name) {
      const words = conversation.name.split(' ');
      if (words.length === 1) {
        return getInitials(conversation.name);
      }
      return words.map(word => getInitials(word)).slice(0, 2).join('');
    }
    
    // Otherwise, use participants initials
    if (conversation?.participants?.length > 0) {
      const firstTwoParticipants = conversation.participants
        .filter(p => p.id !== currentUser?.id)
        .slice(0, 2);
      
      if (firstTwoParticipants.length === 1) {
        return getInitials(firstTwoParticipants[0].username);
      } else if (firstTwoParticipants.length >= 2) {
        return firstTwoParticipants
          .map(p => getInitials(p.username))
          .join('');
      }
    }
    
    return 'G'; // Fallback
  };

  // ==================== DISPLAY DATA FUNCTIONS ====================

  // Get display name
  const getDisplayName = () => {
    if (isGroup) {
      // Try group name
      if (conversation?.name) {
        return conversation.name;
      }
      
      // If no name, create name from participants
      if (conversation?.participants?.length > 0) {
        const otherParticipants = conversation.participants
          .filter(p => p.id !== currentUser?.id)
          .slice(0, 3);
        
        const names = otherParticipants.map(p => p.username);
        
        if (names.length === 0) {
          return "Just Me";
        } else if (names.length === 1) {
          return names[0];
        } else if (names.length === 2) {
          return `${names[0]} & ${names[1]}`;
        } else if (names.length === 3) {
          return `${names[0]}, ${names[1]} & ${names[2]}`;
        } else {
          const count = conversation.participants.length - 1;
          return `${names[0]}, ${names[1]} & ${count - 2} others`;
        }
      }
      
      return `Group ${conversation?.id || ''}`;
    }
    
    // Private conversation
    return otherParticipant?.username || 'Conversation';
  };

  // Get status text
  const getStatusText = () => {
    if (isGroup) {
      const participantCount = conversation?.participants?.length || 0;
      const groupType = conversation?.group_type === 'group_public' ? 'Public Group' : 'Private Group';
      return `${participantCount} ${participantCount === 1 ? 'member' : 'members'} • ${groupType}`;
    }
    
    if (loadingStatus) return 'Loading...';
    if (isOnline) return 'Online';
    return formattedLastSeen || 'Offline';
  };

  const getStatusColor = () => {
    if (isGroup) return 'primary.main';
    if (loadingStatus) return 'text.disabled';
    if (isOnline) return 'success.main';
    return 'text.secondary';
  };

  const getStatusIcon = () => {
    if (isGroup) return <GroupIcon sx={ChatHeaderStyles.groupStatusIcon} />;
    if (loadingStatus) return <CircleIcon sx={ChatHeaderStyles.loadingStatusIcon} />;
    if (isOnline) return <OnlineIcon sx={ChatHeaderStyles.onlineStatusIcon} />;
    return <CircleIcon sx={ChatHeaderStyles.offlineStatusIcon} />;
  };

  // ==================== MENU HANDLERS ====================
  
const handleDeleteConversation = () => {
  handleMenuClose();
  setDeleteConversationDialogOpen(true); // Utilisez le bon état
};
const confirmDeleteConversation = async () => {
  if (!conversation?.id) return;
  
  try {
    await conversationAPI.deleteConversation(conversation.id);
    
    // Rafraîchir la liste des conversations
    if (refreshConversations) {
      await refreshConversations();
    }
    
    // Fermer le dialogue
    setDeleteDialogOpen(false);
    
    // Vous pouvez ajouter une notification ou un callback ici
    console.log('✅ Conversation supprimée');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};
// Fonction pour vérifier le statut de blocage
useEffect(() => {
  const checkBlockStatus = async () => {
    if (!isGroup && otherParticipant?.id) {
      try {
        // Implémentez l'appel API pour vérifier le statut
        // const response = await api.checkBlockStatus(otherParticipant.id);
        // setIsBlocked(response.is_blocked);
      } catch (error) {
        console.error('Error checking block status:', error);
      }
    }
  };
  
  checkBlockStatus();
}, [isGroup, otherParticipant]);

const handleBlockClick = () => {
  setBlockDialogOpen(true);
};

const confirmBlock = async () => {
  if (!otherParticipant) return;
  
  try {
    // Implémentez l'appel API pour bloquer
    // await api.blockUser(otherParticipant.id);
    setIsBlocked(true);
    console.log(`✅ User ${otherParticipant.username} blocked`);
    
    // Optionnel: Rafraîchir les conversations
    if (refreshConversations) {
      await refreshConversations();
    }
  } catch (error) {
    console.error('Error blocking user:', error);
  } finally {
    setBlockDialogOpen(false);
  }
};
  const handleMemberRemoved = (removedUser) => {
    // Mettre à jour la liste des membres localement
    setRealTimeMembers(prev => 
      prev.filter(member => member.id !== removedUser.id)
    );
    
    // Rafraîchir les messages pour refléter le changement
    if (loadMessages) {
      loadMessages();
    }
    
    // Vous pouvez également afficher une notification
    console.log(`✅ ${removedUser.username} a été retiré du groupe`);
  };

  const handleDeleteGroup = () => {
    handleMenuClose();
    setDeleteGroupDialogOpen(true);
  };

  const handleRemoveMember = () => {
    handleMenuClose();
    setRemoveMemberDialogOpen(true);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewGroupInfo = () => {
    handleMenuClose();
    if (isGroup) {
      setGroupInfoDialogOpen(true);
    } else {
      setContactInfoDialogOpen(true);
    }
  };

  const handleAddParticipant = () => {
    handleMenuClose();
    setAddMembersDialogOpen(true);
  };

  const handleLeaveGroup = () => {
    handleMenuClose();
    setLeaveGroupDialogOpen(true);
  };

  const handleEditGroup = () => {
  navigate(`/groups/${conversation.id}/edit/`)
  };

  // ==================== INVITE HANDLER ====================
  
  const handleTransferOwnership = () => {
    handleMenuClose();
    setTransferAdminDialogOpen(true);
  };

  const handleInviteUsers = async (users) => {
    if (users.length === 0) return;
    
    setInvitingUsers(true);
    setError('');
    
    try {
      await conversationAPI.inviteToGroup(
        conversation.id,
        users.map(u => u.id)
      );
      
      // Refresh conversation data
      if (refreshConversations) {
        await refreshConversations();
      }
      
      console.log(`✅ Successfully invited ${users.length} user(s)`);
      
    } catch (err) {
      console.error('❌ Error inviting users:', err);
      setError(err.message || 'Error inviting users');
    } finally {
      setInvitingUsers(false);
    }
  };

  // Function to check if current user can invite members
  const canCurrentUserInvite = () => {
    if (!isGroup || !conversation || !currentUser) {
      console.log('❌ canCurrentUserInvite: false (données manquantes)');
      return false;
    }
    
    // Debug logs
    console.log('🔍 [canCurrentUserInvite] Checking permissions:', {
      conversationId: conversation.id,
      can_anyone_invite: conversation.can_anyone_invite,
      created_by_raw: conversation.created_by,
      current_user_id: currentUser.id
    });
    
    // Méthode 1: Utiliser can_invite du serializer si disponible
    if (conversation.can_invite !== undefined) {
      console.log(`✅ [canCurrentUserInvite] Using serializer field: ${conversation.can_invite}`);
      return conversation.can_invite;
    }
    
    // Méthode 2: Vérifier can_anyone_invite
    if (conversation.can_anyone_invite === true) {
      console.log('✅ [canCurrentUserInvite] can_anyone_invite is true');
      return true;
    }
    
    // Méthode 3: Vérifier si l'utilisateur est le créateur
    let isCreator = false;
    
    if (conversation.created_by) {
      // Si created_by est un objet avec un champ id
      if (typeof conversation.created_by === 'object' && conversation.created_by.id) {
        isCreator = conversation.created_by.id === currentUser.id;
      }
      // Si created_by est directement l'ID
      else if (typeof conversation.created_by === 'number') {
        isCreator = conversation.created_by === currentUser.id;
      }
    }
    
    console.log(`✅ [canCurrentUserInvite] isCreator: ${isCreator}`);
    return isCreator;
  };

  const profileImage = getProfileImage();
  const getProfileId = () => {
    if (!otherParticipant) return null;
    return otherParticipant.profile_id;
  };
  
  const profile_id = getProfileId();
  
  const handleClickAvatar = () => {
    navigate(`/profile/${profile_id}`);
  };

  // ==================== RENDER ====================

  return (
    <>
      <Box sx={ChatHeaderStyles.headerContainer}>
        <Box display="flex" alignItems="center" gap={2} flex={1}>
          {/* Avatar */}
          {isGroup ? (
            // Group avatar with photo
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <GroupIcon sx={ChatHeaderStyles.groupBadgeIcon} />
              }
            >
              <Avatar
                src={getGroupPhotoUrl()}
                sx={ChatHeaderStyles.groupAvatar(!getGroupPhotoUrl())}
              >
                {!getGroupPhotoUrl() && getGroupAvatarText()}
              </Avatar>
            </Badge>
          ) : (
            // Private conversation avatar with status badge
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={isOnline ? ChatHeaderStyles.onlineBadge : ChatHeaderStyles.offlineBadge }
            >
              <Avatar 
                src={profileImage}
                alt={otherParticipant?.username}
                sx={ChatHeaderStyles.individualAvatar(!profileImage)}
                onClick={handleClickAvatar}
              >
                {!profileImage && getInitials(otherParticipant?.username)}
              </Avatar>
            </Badge>
          )}
          
          <Box>
            <Typography variant="h6" component="div" sx={ChatHeaderStyles.displayName}>
              {getDisplayName()}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              {getStatusIcon()}
              <Typography 
                variant="caption" 
                color={getStatusColor()}
                sx={ChatHeaderStyles.statusText(isGroup, isOnline)}
              >
                {getStatusText()}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          {/* Refresh status button (only for private conversations) */}
          {!isGroup && (
            <Tooltip title="Refresh status">
              <IconButton 
                onClick={() => otherParticipant?.id && checkUserStatus()} 
                size="small"
                disabled={loadingStatus || !otherParticipant}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Refresh messages button */}
          <Tooltip title="Refresh messages">
            <IconButton 
              onClick={loadMessages} 
              size="small" 
              disabled={loadingMessages}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {/* More options menu */}
          <Tooltip title="More options">
            <IconButton 
              size="small"
              onClick={handleMenuOpen}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>

          {/* Dropdown menu */}
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {isGroup ? (
              <>
                <MenuItem onClick={handleViewGroupInfo}>
                  <ListItemIcon>
                    <InfoIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Group Information</ListItemText>
                </MenuItem>
                {canCurrentUserInvite() && (
                  <MenuItem onClick={handleAddParticipant}>
                    <ListItemIcon>
                      <PersonAddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Add Members</ListItemText>
                  </MenuItem>
                )}
                {conversation?.created_by?.id === currentUser?.id && (
                  <>
                    <MenuItem onClick={handleEditGroup}>
                      <ListItemIcon>
                        <EditIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Edit Group</ListItemText>
                    </MenuItem>
                    
                    <MenuItem onClick={handleRemoveMember}>
                      <ListItemIcon>
                        <PersonRemoveIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Remove Member</ListItemText>
                    </MenuItem>
                    
                    <Divider />
                    
                    <MenuItem onClick={handleDeleteGroup} sx={ChatHeaderStyles.errorMenuItem}>
                      <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText>Delete Group</ListItemText>
                    </MenuItem>
                    
                   
                  </>
                )}
                <Divider />
                   {conversation?.created_by?.id !== currentUser?.id && (
                <MenuItem onClick={handleLeaveGroup} sx={ChatHeaderStyles.errorMenuItem}>
                  <ListItemIcon>
                    <ExitToAppIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Leave Group</ListItemText>
                </MenuItem>
                )}
                  <ReportButton
            contentType="conversation"
            contentId={conversation.id}
            contentAuthorId={conversation?.user?.id}
            contentObject={conversation}
            buttonVariant="text"
            showIcon={true}
            showText={true}
            className="feedback-report-button"
       
          >
  
          </ReportButton>  
              </>
            ) : (
<>
              <MenuItem onClick={handleViewGroupInfo}>
                <ListItemIcon>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Contact Information</ListItemText>
              </MenuItem>
                            <MenuItem 
                onClick={handleDeleteConversation} 
                sx={ChatHeaderStyles.errorMenuItem}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Delete conversation</ListItemText>
              </MenuItem>
                            
     
               <BlockButton 
              targetUser={otherParticipant}
                onBlockChange={(isBlocked) => {
                    console.log(`Utilisateur ${isBlocked ? 'bloqué' : 'débloqué'}`);
                }}
            ></BlockButton>
           
                 <ReportButton
            contentType="conversation"
            contentId={conversation?.id}
            contentAuthorId={conversation?.user?.id}
            contentObject={conversation}
            buttonVariant="text"
            showIcon={true}
            showText={true}
            className="feedback-report-button"
       
          >
  
          </ReportButton> 
              </>
            )}
               
          </Menu>
        </Box>
      </Box>

      {/* Dialogs */}
      {isGroup ? (
        <>
          <GroupInfoDialog
            open={groupInfoDialogOpen}
            onClose={() => setGroupInfoDialogOpen(false)}
            conversation={conversation}
            currentUser={currentUser}
            onEditGroup={() => {
              setGroupInfoDialogOpen(false);
              handleEditGroup();
            }}
            getGroupPhotoUrl={getGroupPhotoUrl}
            getGroupAvatarText={getGroupAvatarText}
            getInitials={getInitials}
          />
          
          <UserSearchDialog
            open={addMembersDialogOpen}
            onClose={() => setAddMembersDialogOpen(false)}
            onInviteUsers={handleInviteUsers}
            existingMemberIds={conversation?.participants?.map(p => p.id) || []}
            currentUserId={currentUser?.id}
            groupName={conversation?.name || 'Group'}
            loading={invitingUsers}
          />
          
          <LeaveGroupDialog
            open={leaveGroupDialogOpen}
            onClose={() => setLeaveGroupDialogOpen(false)}
            conversation={conversation}
            currentUser={currentUser}
            conversationAPI={conversationAPI}
            refreshConversations={refreshConversations}
          />
          
          <EditGroupDialog
            open={editGroupDialogOpen}
            onClose={() => setEditGroupDialogOpen(false)}
            conversation={conversation}
            currentUser={currentUser}
            conversationAPI={conversationAPI}
            refreshConversations={refreshConversations}
            getGroupPhotoUrl={getGroupPhotoUrl}
            getGroupAvatarText={getGroupAvatarText}
          />
          <DeleteGroupDialog
            open={deleteGroupDialogOpen}
            onClose={() => setDeleteGroupDialogOpen(false)}
            conversation={conversation}
            conversationAPI={conversationAPI}
            refreshConversations={refreshConversations}
            currentUser={currentUser}
          />
          <RemoveMemberDialog
            open={removeMemberDialogOpen}
            onClose={() => setRemoveMemberDialogOpen(false)}
            conversation={conversation}
            conversationAPI={conversationAPI}
            refreshConversations={refreshConversations}
            currentUser={currentUser}
            getInitials={getInitials}
            onMemberRemoved={handleMemberRemoved}
          />
          <TransferAdminDialog
            open={transferAdminDialogOpen}
            onClose={() => setTransferAdminDialogOpen(false)}
            conversation={conversation}
            currentUser={currentUser}
            conversationAPI={conversationAPI}
            refreshConversations={refreshConversations}
            getInitials={getInitials}
          />
               
        </>
      ) : (
<>
        <ContactInfoDialog
          open={contactInfoDialogOpen}
          onClose={() => setContactInfoDialogOpen(false)}
          otherParticipant={otherParticipant}
          currentUser={currentUser}
          getInitials={getInitials}
          conversation={conversation}
        />
         <DeleteConversationDialog
      open={deleteConversationDialogOpen}
      onClose={() => setDeleteConversationDialogOpen(false)}
      conversation={conversation}
      otherParticipant={otherParticipant}
      conversationAPI={conversationAPI}
      refreshConversations={refreshConversations}
      currentUser={currentUser}
      getInitials={getInitials}
        onConversationDeleted={() => {
    if (onConversationDeleted) {
      onConversationDeleted(conversation.id);
    }
    console.log('✅ Private conversation deleted');
  }}
  onDeleteSuccess={(conversationId) => {
    // Force page refresh or redirect if needed
    console.log('🔄 Data should be refreshed now');
    

     window.location.reload();
    
    // Option 2: Navigate to messaging inbox
    // navigate('/messages');
    
    // Option 3: Clear current conversation
    // if (setSelectedConversation) {
    //   setSelectedConversation(null);
    // }
  }}
    />
</>
      )}
    </>
  );
};

export default ChatHeader;
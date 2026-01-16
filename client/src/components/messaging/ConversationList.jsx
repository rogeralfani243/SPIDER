// src/components/messaging/ConversationList.jsx
import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  MarkChatRead as MarkChatReadIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  FiberManualRecord as OnlineIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { conversationAPI } from '../../hooks/messaging/messagingApi';
import { useAuth } from '../../hooks/useAuth';
import ConversationListStyles from './chat-window/chat-edit/styles/ConversationListStyles';

const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Filter conversations
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = conversations.filter(conv => {
        // If it's a group, search in group name
        if (conv.is_group && conv.name?.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in participants (for individual conversations)
        if (!conv.is_group && conv.participants) {
          return conv.participants.some(participant =>
            participant.id !== currentUserId &&
            (participant.username?.toLowerCase().includes(searchLower) ||
             participant.email?.toLowerCase().includes(searchLower))
          );
        }
        
        // Search in group display name
        if (conv.is_group && conv.display_name?.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        return false;
      });
      setFilteredConversations(filtered);
    }
  }, [conversations, searchTerm, currentUserId]);

  const getOtherParticipant = (conversation) => {
    if (conversation.is_group) {
      return null;
    }
    return conversation.participants?.find(p => p.id !== currentUserId);
  };

  const getDisplayName = (conversation) => {
    if (conversation.is_group) {
      return conversation.name || conversation.display_name || `Group (${conversation.members_count || conversation.participants?.length || 0} members)`;
    }
    
    const otherParticipant = getOtherParticipant(conversation);
    return otherParticipant?.username || 'Unknown user';
  };

  const getAvatarInfo = (conversation) => {
    if (conversation.is_group) {
      return {
        src: conversation.group_photo_url,
        alt: conversation.name || 'Group',
        text: conversation.name?.[0]?.toUpperCase() || 'G',
        icon: conversation.group_type === 'group_public' ? 
          <PublicIcon fontSize="small" /> : 
          <LockIcon fontSize="small" />
      };
    }
    
    const otherParticipant = getOtherParticipant(conversation);
    return {
      src: otherParticipant?.profile_image,
      alt: otherParticipant?.username || 'User',
      text: otherParticipant?.username?.[0]?.toUpperCase() || 'U'
    };
  };

  const getOnlineStatus = (conversation) => {
    if (conversation.is_group) return null;
    
    const otherParticipant = getOtherParticipant(conversation);
    if (!otherParticipant) return null;
    
    // Check if user has online status data
    if (otherParticipant.is_online !== undefined) {
      if (otherParticipant.is_online) {
        return (
          <Chip
            size="small"
            label="Online"
            color="success"
            variant="outlined"
            sx={ConversationListStyles.onlineStatusChip}
          />
        );
      }
    }
    
    // Check for formatted_last_seen
    if (otherParticipant.formatted_last_seen) {
      return (
        <Typography variant="caption" color="text.secondary" sx={ConversationListStyles.lastSeenText}>
          Last seen {otherParticipant.formatted_last_seen}
        </Typography>
      );
    }
    
    return null;
  };

  const getStatusIcon = (conversation) => {
    if (conversation.is_group) return null;
    
    const otherParticipant = getOtherParticipant(conversation);
    if (!otherParticipant) return null;
    
    if (otherParticipant.is_online === true) {
      return <OnlineIcon sx={ConversationListStyles.getStatusIconStyle(true)} />;
    } else {
      return <CircleIcon sx={ConversationListStyles.getStatusIconStyle(false)} />;
    }
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.last_message) {
      return conversation.is_group ? 'No messages in group' : 'No messages';
    }
    
    const content = conversation.last_message.content || '';
    const sender = conversation.last_message.sender;
    
    let prefix = '';
    if (sender && sender.id === currentUserId) {
      prefix = 'You: ';
    } else if (sender && conversation.is_group) {
      prefix = `${sender.username}: `;
    }
    
    const preview = prefix + content;
    return preview.length > 30 ? `${preview.substring(0, 30)}...` : preview;
  };

  const getGroupTypeBadge = (conversation) => {
    if (!conversation.is_group) return null;
    
    const groupTypeLabels = {
      'group_public': 'Public',
      'group_private': 'Private',
      'group_secret': 'Secret'
    };
    
    const typeLabel = groupTypeLabels[conversation.group_type] || 'Group';
    const color = conversation.group_type === 'group_public' ? 'success' : 'default';
    
    return (
      <Chip
        size="small"
        label={typeLabel}
        color={color}
        variant="outlined"
        sx={ConversationListStyles.groupTypeBadge}
      />
    );
  };

  const getMembersCount = (conversation) => {
    if (!conversation.is_group) return null;
    
    const count = conversation.members_count || conversation.participants?.length || 0;
    return (
      <Typography variant="caption" color="text.secondary" sx={ConversationListStyles.membersCount}>
        {count} member{count !== 1 ? 's' : ''}
      </Typography>
    );
  };

  if (loading) {
    return (
      <Box sx={ConversationListStyles.loadingContainer}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={ConversationListStyles.container}>
      {/* Search bar */}
      <TextField
        fullWidth
        placeholder="Search conversations or groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="small"
        sx={ConversationListStyles.searchField}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Conversation list */}
      <List sx={ConversationListStyles.list}>
        {filteredConversations.length === 0 ? (
          <Box sx={ConversationListStyles.emptyMessage}>
            <Typography color="text.secondary">
              {searchTerm ? 'No conversations found' : 'No conversations'}
            </Typography>
          </Box>
        ) : (
          filteredConversations.map((conversation) => {
            const isGroup = conversation.is_group;
            const otherParticipant = getOtherParticipant(conversation);
            const isSelected = conversation.id === selectedConversationId;
            const unreadCount = conversation.unread_count || 0;
            const displayName = getDisplayName(conversation);
            const avatarInfo = getAvatarInfo(conversation);
            const isOnline = otherParticipant?.is_online === true;

            return (
              <React.Fragment key={conversation.id}>
                <ListItem
                  button
                  selected={isSelected}
                  onClick={() => onSelectConversation(conversation)}
                  sx={ConversationListStyles.listItem(isSelected)}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={unreadCount}
                      color="primary"
                      invisible={unreadCount === 0}
                    >
                      {isGroup ? (
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={avatarInfo.icon}
                        >
                          <Avatar
                            src={avatarInfo.src}
                            alt={avatarInfo.alt}
                            sx={ConversationListStyles.groupAvatar}
                          >
                            {avatarInfo.text}
                          </Avatar>
                        </Badge>
                      ) : (
                        // Avatar avec badge d'état en ligne comme Facebook
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <Box
                              sx={ConversationListStyles.getOnlineBadgeStyle(isOnline)}
                            >
                              <Box
                                sx={ConversationListStyles.getOnlineDotStyle(isOnline)}
                              />
                            </Box>
                          }
                        >
                          <Avatar
                            src={avatarInfo.src}
                            alt={avatarInfo.alt}
                          >
                            {avatarInfo.text}
                          </Avatar>
                        </Badge>
                      )}
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                          <Typography
                            variant="subtitle2"
                            sx={ConversationListStyles.getDisplayNameStyle(unreadCount)}
                          >
                            {displayName}
                            {isGroup && getGroupTypeBadge(conversation)}
                          </Typography>
                          {!isGroup && getOnlineStatus(conversation)}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={ConversationListStyles.timestamp}>
                          {formatDistanceToNow(new Date(conversation.updated_at), {
                            addSuffix: true,
                            locale: enUS,
                          })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={ConversationListStyles.getLastMessagePreviewStyle(unreadCount)}
                      >
                        {isGroup && (
                          <GroupIcon 
                            fontSize="inherit" 
                            sx={ConversationListStyles.groupIcon} 
                          />
                        )}
                        {getLastMessagePreview(conversation)}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            );
          })
        )}
      </List>
    </Box>
  );
};

export default ConversationList;
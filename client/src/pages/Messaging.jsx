// src/pages/Messaging.jsx - VERSION AVEC GESTION DE conversation_id
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  Group as GroupIcon, 
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import ConversationList from '../components/messaging/ConversationList';
import ChatWindow from '../components/messaging/ChatWindow';
import UserSearch from '../components/messaging/UserSearch';
import CreateGroupModal from '../components/messaging/chat-window/CreateGroupModal';
import { useConversations } from '../hooks/messaging/useConversations';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/messaging/webSocketContext';
import { conversationAPI } from '../hooks/messaging/messagingApi';
import '../styles/messaging/index.css';
import { useNavigate } from 'react-router-dom';

// Use React.memo for child components
const MemoizedConversationList = memo(ConversationList);
const MemoizedUserSearch = memo(UserSearch);
const MemoizedChatWindow = memo(ChatWindow);

const Messaging = () => {
  console.log('🎯 Messaging RENDER');
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'
  
  const { user } = useAuth();
  const { connectWebSocket, disconnectWebSocket, isConnected } = useWebSocket();
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    refreshConversations,
    markConversationAsRead
  } = useConversations();
  const navigate = useNavigate();
  
  // Material-UI responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Refs to avoid re-renders and loops
  const prevConversationRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const selectedConversationRef = useRef(null);
  const isRestoringRef = useRef(false);
  const hasHandledUrlParamsRef = useRef(false);
  
  // Get URL parameters
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const groupIdToSelect = searchParams.get('select_group');
  const conversationIdToSelect = searchParams.get('conversation_id');

  // ==================== CONVERSATION FUNCTIONS ====================
  const handleSelectConversation = useCallback(async (conversation) => {
    console.log('🔄 Selecting conversation:', conversation?.id || 'NULL (deselect)');
    
    if (!conversation) {
      console.log('📌 Deselecting conversation');
      setSelectedConversation(null);
      prevConversationRef.current = null;
      selectedConversationRef.current = null;
      
      if (disconnectWebSocket) {
        console.log('🔌 Disconnecting WebSocket');
        disconnectWebSocket();
      }
      
      setIsChatLoading(false);
      setError(null);
      
      if (isMobile) {
        setMobileView('list');
      }
      
      // Clear localStorage when deselecting
      localStorage.removeItem('messaging_selected_conversation');
      localStorage.removeItem('messaging_mobile_view');
      
      return;
    }
    
    if (prevConversationRef.current?.id === conversation.id && !isChatLoading) {
      console.log('🚫 Same conversation, no reload');
      return;
    }
    
    if (!conversation.id) {
      console.error('❌ Conversation without ID:', conversation);
      setError('Invalid conversation');
      setSelectedConversation(null);
      prevConversationRef.current = null;
      selectedConversationRef.current = null;
      setIsChatLoading(false);
      return;
    }
    
    console.log('🔄 Loading conversation:', conversation.id);
    prevConversationRef.current = conversation;
    selectedConversationRef.current = conversation;
    setIsChatLoading(true);
    setError(null);
    
    try {
      setSelectedConversation(conversation);
      
      if (conversation.id) {
        markConversationAsRead(conversation.id).catch(err => 
          console.warn('⚠️ Error marking as read:', err)
        );
      }
      
      if (connectWebSocket) {
        console.log('🔌 Connecting WebSocket for:', conversation.id);
        connectWebSocket(conversation.id);
      }
      
      console.log('✅ Conversation selected');
      
    } catch (err) {
      console.error('❌ Selection error:', err);
      setError(`Error: ${err.message}`);
      setSelectedConversation(null);
      prevConversationRef.current = null;
      selectedConversationRef.current = null;
    } finally {
      setTimeout(() => {
        setIsChatLoading(false);
      }, 300);
    }
  }, [connectWebSocket, disconnectWebSocket, isChatLoading, markConversationAsRead, isMobile]);

  // ==================== FUNCTIONS FOR LOADING CONVERSATIONS ====================
  const loadConversationById = useCallback(async (conversationId) => {
    if (!conversationId || isChatLoading) {
      console.log('🚫 Skipping load - no conversationId or already loading');
      return;
    }
    
    console.log('🔄 Loading conversation by ID from URL:', conversationId);
    setIsChatLoading(true);
    setError(null);
    
    try {
      // First, check if conversation is in the current list
      const existingConversation = conversations.find(conv => 
        conv.id?.toString() === conversationId.toString()
      );
      
      if (existingConversation) {
        console.log('✅ Conversation found in list');
        await handleSelectConversation(existingConversation);
        
        if (isMobile) {
          setMobileView('chat');
        }
        
        return;
      }
      
      // Otherwise, load via API
      console.log('🔄 Loading conversation via API...');
      const response = await conversationAPI.getConversationDetails(conversationId);
      
      if (response.data) {
        console.log('✅ Conversation loaded via API');
        await handleSelectConversation(response.data);
        
        if (isMobile) {
          setMobileView('chat');
        }
        
        // Refresh conversation list
        setTimeout(() => {
          refreshConversations().catch(err => 
            console.warn('⚠️ Refresh error:', err)
          );
        }, 1000);
      }
      
    } catch (err) {
      console.error('❌ Error loading conversation from URL:', err);
      setError(`Error loading conversation: ${err.message}`);
    } finally {
      setTimeout(() => {
        setIsChatLoading(false);
      }, 500);
    }
  }, [conversations, handleSelectConversation, refreshConversations, isChatLoading, isMobile]);

  const loadGroupConversation = useCallback(async (groupId) => {
    if (!groupId || isChatLoading) {
      console.log('🚫 Skipping load - no groupId or already loading');
      return;
    }
    
    console.log('🔄 Loading group conversation:', groupId);
    setIsChatLoading(true);
    setError(null);
    
    try {
      // First, look in existing conversations
      const existingConversation = conversations.find(conv => 
        conv.is_group && conv.id?.toString() === groupId.toString()
      );
      
      if (existingConversation) {
        console.log('✅ Group conversation found in list:', existingConversation.id);
        await handleSelectConversation(existingConversation);
        
        if (isMobile) {
          setMobileView('chat');
        }
        
        return;
      }
      
      // If not found, try to load via API
      console.log('🔄 Group conversation not found, calling API...');
      try {
        const response = await conversationAPI.getConversation(groupId);
        
        if (response.data) {
          console.log('✅ Group conversation loaded via API');
          await handleSelectConversation(response.data);
          
          if (isMobile) {
            setMobileView('chat');
          }
          
          // Refresh conversation list
          setTimeout(() => {
            refreshConversations().catch(err => 
              console.warn('⚠️ Refresh error:', err)
            );
          }, 1000);
        }
      } catch (apiError) {
        console.warn('⚠️ API getConversationByGroupId failed:', apiError.message);
        
        // Fallback
        try {
          console.log('🔄 Fallback: using getConversationDetails...');
          const fallbackResponse = await conversationAPI.getConversationDetails(groupId);
          
          if (fallbackResponse.data) {
            console.log('✅ Conversation loaded via fallback');
            await handleSelectConversation(fallbackResponse.data);
            
            if (isMobile) {
              setMobileView('chat');
            }
            
            setTimeout(() => {
              refreshConversations().catch(err => 
                console.warn('⚠️ Refresh error:', err)
              );
            }, 1000);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          setError('Unable to load group conversation. Try selecting it manually.');
        }
      }
      
    } catch (err) {
      console.error('❌ Error loading group conversation:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setTimeout(() => {
        setIsChatLoading(false);
      }, 500);
    }
  }, [conversations, handleSelectConversation, refreshConversations, isChatLoading, isMobile]);

  // ==================== URL PARAMETER HANDLING ====================
  useEffect(() => {
    const handleUrlParameters = () => {
      // Skip if already handled, loading, or no conversations
      if (hasHandledUrlParamsRef.current || conversationsLoading || !conversations.length) {
        return;
      }
      
      console.log('🔍 Checking URL parameters:', { groupIdToSelect, conversationIdToSelect });
      
      // Handle conversation_id parameter
      if (conversationIdToSelect && !selectedConversation) {
        console.log('🚀 URL conversation auto-selection triggered:', conversationIdToSelect);
        hasHandledUrlParamsRef.current = true;
        
        const timeoutId = setTimeout(() => {
          loadConversationById(conversationIdToSelect);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
      
      // Handle select_group parameter
      if (groupIdToSelect && !selectedConversation) {
        console.log('🚀 URL group auto-selection triggered:', groupIdToSelect);
        hasHandledUrlParamsRef.current = true;
        
        const timeoutId = setTimeout(() => {
          loadGroupConversation(groupIdToSelect);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    };
    
    handleUrlParameters();
  }, [conversations, conversationsLoading, groupIdToSelect, conversationIdToSelect, selectedConversation, loadConversationById, loadGroupConversation]);

  // ==================== EFFECTS POUR RECHARGEMENT ====================

  // 1. Initial setup - run only once
  useEffect(() => {
    if (!hasInitializedRef.current) {
      console.log('🔧 Messaging component initialized');
      hasInitializedRef.current = true;
    }
  }, []);

  // 2. Effect to restore conversation from localStorage (run once)
  useEffect(() => {
    const restoreConversation = async () => {
      // Skip if already restoring, loading, or no conversations
      if (isRestoringRef.current || conversationsLoading || !conversations.length) {
        return;
      }
      
      const savedConversationId = localStorage.getItem('messaging_selected_conversation');
      const savedMobileView = localStorage.getItem('messaging_mobile_view');
      
      // Only restore if we have a saved conversation AND we're not already showing a conversation
      // AND we haven't already handled URL parameters
      if (savedConversationId && !selectedConversation && savedMobileView === 'chat' && !hasHandledUrlParamsRef.current) {
        isRestoringRef.current = true;
        console.log('🔄 Restoring conversation from localStorage:', savedConversationId);
        
        try {
          // First, check if conversation is in the current list
          const foundConversation = conversations.find(conv => 
            conv.id?.toString() === savedConversationId
          );
          
          if (foundConversation) {
            console.log('✅ Found conversation in list, selecting it');
            await handleSelectConversation(foundConversation);
            
            if (isMobile) {
              setMobileView('chat');
            }
          } else {
            console.log('⚠️ Conversation not in list, skipping restoration');
            // Clear the saved state
            localStorage.removeItem('messaging_selected_conversation');
            localStorage.removeItem('messaging_mobile_view');
          }
        } catch (err) {
          console.error('❌ Error restoring conversation:', err);
          localStorage.removeItem('messaging_selected_conversation');
          localStorage.removeItem('messaging_mobile_view');
        } finally {
          // Reset restoring flag after a delay
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 1000);
        }
      }
    };
    
    // Only run once when conversations are loaded
    if (conversations.length > 0 && !conversationsLoading) {
      const timeoutId = setTimeout(restoreConversation, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [conversations, conversationsLoading, selectedConversation, handleSelectConversation, isMobile]);

  // 3. Save state to localStorage
  useEffect(() => {
    if (selectedConversation?.id) {
      localStorage.setItem('messaging_selected_conversation', selectedConversation.id.toString());
    }
  }, [selectedConversation]);

  useEffect(() => {
    localStorage.setItem('messaging_mobile_view', mobileView);
  }, [mobileView]);

  // ==================== OTHER FUNCTIONS ====================
  const handleMobileConversationSelect = useCallback(async (conversation) => {
    if (isMobile) {
      await handleSelectConversation(conversation);
      setMobileView('chat');
    } else {
      await handleSelectConversation(conversation);
    }
  }, [isMobile, handleSelectConversation]);

  const handleStartNewConversation = useCallback(async (userId) => {
    console.log('🚀 New conversation with:', userId);
    setIsChatLoading(true);
    setError(null);
    
    try {
      const response = await conversationAPI.getOrCreateConversationWithUser(userId);
      const newConversation = response.data;
      console.log('✅ Conversation created:', newConversation.id);
      
      await handleSelectConversation(newConversation);
      
      if (isMobile) {
        setMobileView('chat');
      }
      
    } catch (err) {
      console.error('❌ Creation error:', err);
      setError(`Creation error: ${err.message}`);
    } finally {
      setIsChatLoading(false);
    }
  }, [handleSelectConversation, isMobile]);

  const handleCreateGroupConversation = useCallback(async (participantIds, groupName) => {
    console.log('👥 Creating simple group:', { participantIds, groupName });
    setIsChatLoading(true);
    setError(null);
    
    try {
      const response = await conversationAPI.createGroupConversation(participantIds, groupName);
      const newConversation = response.data;
      console.log('✅ Group created:', newConversation.id, newConversation.name);
      
      await handleSelectConversation(newConversation);
      
      if (isMobile) {
        setMobileView('chat');
      }
      
    } catch (err) {
      console.error('❌ Group creation error:', err);
      setError(`Group creation error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsChatLoading(false);
    }
  }, [handleSelectConversation, isMobile]);

  const handleCreateGroup = useCallback(async (groupData) => {
    console.log('👥 Creating advanced group:', groupData);
    setIsChatLoading(true);
    setError(null);
    
    try {
      const response = await conversationAPI.createGroup(groupData);
      const newConversation = response.data;
      console.log('✅ Advanced group created:', newConversation);
      
      await handleSelectConversation(newConversation);
      
      if (isMobile) {
        setMobileView('chat');
      }
      
      setCreateGroupModalOpen(false);
      
    } catch (err) {
      console.error('❌ Advanced group creation error:', err);
      setError(`Group creation error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsChatLoading(false);
    }
  }, [handleSelectConversation, isMobile]);

  // ==================== MOBILE VIEW MANAGEMENT ====================
  const handleBackToList = useCallback(() => {
    setMobileView('list');
  }, []);

  // ==================== OTHER EFFECTS ====================
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshConversations().catch(err => 
        console.warn('⚠️ Auto-refresh:', err.message)
      );
    }, 30000);
    
    return () => {
      clearInterval(intervalId);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshConversations]);

  // ==================== RENDER FUNCTIONS ====================
  const renderMobileListView = () => (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          Messages
        </Typography>
        <Button
          variant="contained"
          startIcon={<GroupIcon />}
          onClick={() => navigate('/groups/create/')}
          size="small"
          sx={{ 
            bgcolor: 'primary.main',
             fontSize:'0.6em',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          Create Group
        </Button>
          <Button 
                variant="outlined" 
                startIcon={<GroupIcon />}
                onClick={() => navigate('/groups/')}
                sx={{ 
                  color: 'primary.main',
                  borderColor: 'primary.main',
                  '&:hover': { 
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderColor: 'primary.main'
                  },
                  borderRadius: '8px',
                  textTransform: 'none',
              fontSize:'0.4em'
                }}
              >
                Explore Groups
              </Button>
      </Box>

      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <MemoizedUserSearch 
          onCreateConversation={handleCreateGroupConversation} 
          onSelectUser={handleStartNewConversation}
          key="user-search-mobile"
          isMobile={true}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <MemoizedConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleMobileConversationSelect}
          currentUserId={user?.id}
          key="conversation-list-mobile"
          isMobile={true}
        />
      </Box>
    </Box>
  );

  const renderMobileChatView = () => {
    const showLoading = isChatLoading || (selectedConversation?.id && isRestoringRef.current);
    
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          minHeight: '64px'
        }}>
          <IconButton 
            onClick={handleBackToList}
            sx={{ mr: 2 }}
            aria-label="Back to messages"
            size="medium"
          >
            <ArrowBackIcon />
          </IconButton>
          
        
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', bgcolor: '#f0f2f5', position: 'relative' }}>
          {showLoading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              flexDirection: 'column',
              p: 3,
              textAlign: 'center'
            }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography color="text.secondary">
                Loading conversation...
              </Typography>
            </Box>
          ) : selectedConversation ? (
            <Box sx={{ height: '100%' }}>
              <MemoizedChatWindow
                conversation={selectedConversation}
                currentUser={user}
                isLoading={false}
                key={`chat-mobile-${selectedConversation.id}`}
                isMobile={true}
              />
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              p: 3,
              textAlign: 'center'
            }}>
              <Typography color="text.secondary">
                No conversation selected
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // ==================== DESKTOP VIEW FUNCTION ====================
  const renderDesktopView = () => (
    <Grid container spacing={3} sx={{ display: 'flex', placeItems: 'center', width: '100%' }}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ 
          p: 2, 
          height: 'calc(100vh - 250px)', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <MemoizedUserSearch 
            onCreateConversation={handleCreateGroupConversation} 
            onSelectUser={handleStartNewConversation}
            key="user-search-desktop"
            isMobile={false}
          />
          
          <Box sx={{ 
            mt: 2, 
            flex: 1, 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              flex: 1,
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 300px)',
            }}>
              <MemoizedConversationList
                conversations={conversations}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                currentUserId={user?.id}
                key="conversation-list-desktop"
                isMobile={false}
              />
            </Box>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ 
          width: "100%",
          placeItems: 'center',
          justifyContent: 'center',
          p: 0,
          height: 'calc(100vh - 250px)', 
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {selectedConversation ? (
            <Box sx={{ height: '100%', width: '100%' }}>
              <MemoizedChatWindow
                conversation={selectedConversation}
                currentUser={user}
                isLoading={false}
                key={`chat-desktop-${selectedConversation.id}`}
                isMobile={false}
              />
            </Box>
          ) : (
            <Box
              width="100%"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              height="100%"
              textAlign="center"
              p={3}
              bgcolor="background.default"
            >
              <Box sx={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}>
                <GroupIcon sx={{ fontSize: 60, color: 'primary.contrastText' }} />
              </Box>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {conversations.length === 0 ? '👋 Welcome!' : '💬 Select a conversation'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mb: 3 }}>
                {conversations.length === 0
                  ? "You don't have any conversations yet. Start one by searching for users or creating a group!"
                  : "Choose a conversation from the list to start chatting"}
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  // ==================== LOADING STATE ====================
  if (conversationsLoading && !hasInitializedRef.current) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <>

      <Container 
        maxWidth="xl" 
        sx={{ 
          mt: 4, 
          mb: 4, 
          p: 0,
          height: '100%',
          '@media (max-width: 900px)': { 
            width: '100%',
            maxWidth: '100%',
            p: 0,
            m: 0,
            mt: 0,
            height: 'calc(100vh - 64px)',
            position: 'relative'
          }
        }}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <>
            <Typography 
              variant="h2"
              gutterBottom 
              sx={{ 
                mb: 4,
                textAlign: 'center',
                fontWeight: 'bold',
                mt: 2,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                color: 'primary.main'
              }}
            >
              Messages
            </Typography>

            {conversationsError && (
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 2, 
                  borderRadius: '8px',
                }} 
              >
                {conversationsError}
              </Alert>
            )}

            <Box sx={{ 
              mb: 3, 
              gap: 2, 
              display: 'flex', 
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <Button 
                variant="contained" 
                startIcon={<GroupIcon />}
                onClick={() => navigate('/groups/create/')}
                sx={{ 
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  px: 3
                }}
              >
                Create Group
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<GroupIcon />}
                onClick={() => navigate('/groups/')}
                sx={{ 
                  color: 'primary.main',
                  borderColor: 'primary.main',
                  '&:hover': { 
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderColor: 'primary.main'
                  },
                  borderRadius: '8px',
                  textTransform: 'none',
                  px: 3
                }}
              >
                Explore Groups
              </Button>
            </Box>
          </>
        )}

        {/* Error display for mobile */}
        {isMobile && conversationsError && (
          <Alert 
            severity="warning" 
            sx={{ 
              m: 2, 
              borderRadius: '8px',
            }} 
          >
            {conversationsError}
          </Alert>
        )}

        {/* Mobile or Desktop View */}
        <Box sx={{ 
          width: '100%',
          height: isMobile ? '100%' : 'auto',
          overflow: 'hidden',
        }}>
          {isMobile ? (
            mobileView === 'list' ? renderMobileListView() : renderMobileChatView()
          ) : (
            renderDesktopView()
          )}
        </Box>

        <CreateGroupModal
          open={createGroupModalOpen}
          onClose={() => setCreateGroupModalOpen(false)}
          onGroupCreated={handleCreateGroup}
          currentUser={user}
        />
      </Container>
    </>
  );
};

export default memo(Messaging);
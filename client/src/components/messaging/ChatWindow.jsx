// ChatWindow.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Snackbar,
  Chip,
  Typography,
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  PlayArrow as PlayArrowIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  DeleteForever as DeleteForeverIcon,
  Report as ReportIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  MoreVert as MoreVertIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Videocam as VideoIcon,
  Audiotrack as AudioIcon,
} from '@mui/icons-material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { messageAPI } from '../../hooks/messaging/messagingApi';
import { useAuth } from '../../hooks/useAuth';
import { useMyOnlineStatus } from '../../hooks/useOnlineStatus';
import API_URL from '../../hooks/useApiUrl';
import IconButton from '@mui/material/IconButton';
// Import components
import ChatHeader from './chat-window/ChatHeader';
import MessageList from './chat-window/MessageList';
import MessageBubble from './chat-window/MessageBubble';
import SystemMessageBubble from './chat-window/SystemMessageBubble.jsx'; // NOUVEAU COMPOSANT
import MessageInput from './chat-window/MessageInput';
import FilePreview from './chat-window/FilePreview';
import AudioRecorder from './chat-window/AudioRecorder';
import ContextMenu from './chat-window/ContextMenu';
import DeleteDialog from './chat-window/DeleteDialog';
import MediaViewer from './chat-window/MediaViewer';
import { getFileType } from '../../utils/fileUtils';
import PauseIcon from '@mui/icons-material/Pause';
const ChatWindow = ({ conversation, currentUser, isLoading }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // States for editing
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
   const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(null);
  
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const [videoStates, setVideoStates] = useState({});
  const videoRefs = useRef({});
  // States for context menu
  const [contextMenu, setContextMenu] = useState({
    mouseX: null,
    mouseY: null,
    message: null,
  });
  const [fullscreenVideoInfo, setFullscreenVideoInfo] = useState({
  messageId: null,
  currentTime: 0,
  isPlaying: false
});
  // State for media viewer
  const [openMediaViewer, setOpenMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  // State for audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [micPermissionError, setMicPermissionError] = useState(false);
   const [audioStates, setAudioStates] = useState({});
  const audioRefs = useRef({});
  // State for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    message: null,
    deleteForEveryone: false,
  });
  
  // State for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

// Fonction pour formater le temps
const formatTime = (seconds) => {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const pollingRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  
  const { user } = useAuth();
  const { pingMyStatus } = useMyOnlineStatus();

  // Mettre à jour le statut quand l'application se charge
  useEffect(() => {
    pingMyStatus();
  }, [pingMyStatus]);

  // Mettre à jour le statut quand l'utilisateur interagit
  useEffect(() => {
    const handleUserActivity = () => {
      pingMyStatus();
    };
    
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [pingMyStatus]);

  // Load messages - Optimized to avoid unnecessary reloads
  useEffect(() => {
    if (conversation) {
      loadMessages();
      startOptimizedPolling();
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [conversation]);
  
   const handleVideoPlayPause = (messageId, action = 'toggle') => {
    const videoElement = videoRefs.current[messageId];
    if (!videoElement) return;
    
    const currentState = videoStates[messageId] || {
      isPlaying: false,
      currentTime: 0,
      duration: 0
    };
    
    if (action === 'play') {
      // Arrêter toutes les autres vidéos en cours de lecture
      Object.keys(videoRefs.current).forEach(id => {
        if (id !== messageId) {
          const otherVideo = videoRefs.current[id];
          if (otherVideo && !otherVideo.paused) {
            otherVideo.pause();
            setVideoStates(prev => ({
              ...prev,
              [id]: { ...prev[id], isPlaying: false }
            }));
          }
        }
      });
      
      // Arrêter tous les audios en cours de lecture
      Object.keys(audioRefs.current).forEach(id => {
        if (audioStates[id]?.isPlaying) {
          audioRefs.current[id].pause();
          setAudioStates(prev => ({
            ...prev,
            [id]: { ...prev[id], isPlaying: false }
          }));
        }
      });
      
      videoElement.play();
      setVideoStates(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          isPlaying: true
        }
      }));
    } 
    else if (action === 'pause') {
      videoElement.pause();
      setVideoStates(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          isPlaying: false
        }
      }));
    }
    else if (action === 'toggle') {
      if (currentState.isPlaying) {
        videoElement.pause();
        setVideoStates(prev => ({
          ...prev,
          [messageId]: {
            ...prev[messageId],
            isPlaying: false
          }
        }));
      } else {
        // Arrêter toutes les autres vidéos et audios
        Object.keys(videoRefs.current).forEach(id => {
          if (id !== messageId) {
            const otherVideo = videoRefs.current[id];
            if (otherVideo && !otherVideo.paused) {
              otherVideo.pause();
              setVideoStates(prev => ({
                ...prev,
                [id]: { ...prev[id], isPlaying: false }
              }));
            }
          }
        });
        
        Object.keys(audioRefs.current).forEach(id => {
          if (audioStates[id]?.isPlaying) {
            audioRefs.current[id].pause();
            setAudioStates(prev => ({
              ...prev,
              [id]: { ...prev[id], isPlaying: false }
            }));
          }
        });
        
        videoElement.play();
        setVideoStates(prev => ({
          ...prev,
          [messageId]: {
            ...prev[messageId],
            isPlaying: true
          }
        }));
      }
    }
  };

  // Gestionnaire d'événements pour la lecture vidéo
  const handleVideoPlay = (messageId) => {
    handleVideoPlayPause(messageId, 'play');
  };

  // Gestionnaire d'événements pour la pause vidéo
  const handleVideoPause = (messageId) => {
    handleVideoPlayPause(messageId, 'pause');
  };

  // Gestionnaire de fin de vidéo
  const handleVideoEnded = (messageId) => {
    setVideoStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isPlaying: false,
        currentTime: 0
      }
    }));
  };

  // Gestionnaire de mise à jour du temps vidéo
  const handleVideoTimeUpdate = (messageId) => {
    const videoElement = videoRefs.current[messageId];
    if (videoElement) {
      setVideoStates(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          currentTime: videoElement.currentTime,
          duration: videoElement.duration || prev[messageId]?.duration || 0
        }
      }));
    }
  };

  // Gestionnaire de chargement des métadonnées vidéo
  const handleVideoLoadedMetadata = (messageId) => {
    const videoElement = videoRefs.current[messageId];
    if (videoElement) {
      setVideoStates(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          duration: videoElement.duration
        }
      }));
    }
  };

  // Nettoyage des vidéos
  useEffect(() => {
    return () => {
      // Arrêter toutes les vidéos lors du démontage
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pause();
        }
      });
    };
  }, []);

const handlePlayPause = (messageId) => {
    const audioElement = audioRefs.current[messageId];
    if (!audioElement) return;
    
    const currentState = audioStates[messageId] || {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isSeeking: false,
      seekPosition: null
    };
    
    if (currentState.isPlaying) {
      audioElement.pause();
    } else {
      // Arrêter tous les autres audios en cours de lecture
      Object.keys(audioRefs.current).forEach(id => {
        if (id !== messageId && audioStates[id]?.isPlaying) {
          audioRefs.current[id].pause();
          setAudioStates(prev => ({
            ...prev,
            [id]: { ...prev[id], isPlaying: false }
          }));
        }
      });
      
      audioElement.play();
    }
    
    setAudioStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isPlaying: !currentState.isPlaying
      }
    }));
  };


  // Mise à jour du temps courant

  const handleTimeUpdate = (messageId) => {
    const audioElement = audioRefs.current[messageId];
    if (audioElement && !(audioStates[messageId]?.isSeeking)) {
      setAudioStates(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          currentTime: audioElement.currentTime
        }
      }));
    }
  };

  // Chargement des métadonnées
const handleLoadedMetadata = (messageId) => {
  const audioElement = audioRefs.current[messageId];
  if (audioElement) {
    setAudioStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        duration: audioElement.duration
      }
    }));
  }
};

  // Fin de lecture
  const handleAudioEnded = (messageId) => {
    setAudioStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isPlaying: false,
        currentTime: 0
      }
    }));
  };

  // Démarrer le glissement
   const handleSeekStart = useCallback((e, messageId, containerRef) => {
    e.preventDefault();
    e.stopPropagation();
    
    const audioElement = audioRefs.current[messageId];
    if (!containerRef.current || !audioElement) return;
    
    setAudioStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isSeeking: true
      }
    }));
    
    updateSeekPosition(e, messageId, containerRef);
    
    // Ajouter les écouteurs pour le glissement continu
    const handleMove = (moveEvent) => {
      updateSeekPosition(moveEvent, messageId, containerRef);
    };
    
    const handleEnd = () => {
      setAudioStates(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          isSeeking: false
        }
      }));
      
      // Appliquer la nouvelle position à l'audio
      const currentState = audioStates[messageId];
      if (currentState?.seekPosition !== null && audioElement) {
        const newTime = (currentState.seekPosition / 100) * (currentState.duration || 0);
        audioElement.currentTime = newTime;
        
        setAudioStates(prev => ({
          ...prev,
          [messageId]: {
            ...prev[messageId],
            currentTime: newTime,
            seekPosition: null
          }
        }));
        
        // Si c'était en lecture, continuer
        if (currentState?.isPlaying) {
          audioElement.play();
        }
      }
      
      // Nettoyer les écouteurs
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    
    // Pause pendant le glissement
    if (audioStates[messageId]?.isPlaying) {
      audioElement.pause();
    }
    
    // Ajouter les écouteurs
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [audioStates]);

  // Mettre à jour la position de glissement
   const updateSeekPosition = useCallback((e, messageId, containerRef) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let clientX;
    if (e.type.includes('touch')) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    // Calculer la position en pourcentage
    let position = ((clientX - rect.left) / rect.width) * 100;
    
    // Limiter entre 0 et 100%
    position = Math.max(0, Math.min(100, position));
    
    setAudioStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        seekPosition: position
      }
    }));
  }, []);


  // Nettoyage
  useEffect(() => {
    return () => {
      // Arrêter tous les audios lors du démontage
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, []);
  // Optimized polling
  const startOptimizedPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      if (!conversation) return;
      
      try {
        const response = await messageAPI.getMessages(conversation.id);
        const newMessages = response.data || [];
        
        if (newMessages.length > 0) {
          const latestMessageId = newMessages[newMessages.length - 1].id;
          
          if (lastMessageIdRef.current !== latestMessageId) {
            lastMessageIdRef.current = latestMessageId;
            
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const newUniqueMessages = newMessages.filter(msg => !existingIds.has(msg.id));
              
              if (newUniqueMessages.length > 0) {
                return [...prev, ...newUniqueMessages].sort((a, b) => 
                  new Date(a.timestamp) - new Date(b.timestamp)
                );
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 10000);
  }, [conversation]);

  const loadMessages = async () => {
    if (!conversation) {
      setMessages([]);
      return;
    }
    
    setLoadingMessages(true);
    setError('');
    
    try {
      const response = await messageAPI.getMessages(conversation.id);
      const formattedMessages = (response.data || []).map(msg => ({
        ...msg,
        sender: msg.sender || {},
        isOwn: msg.sender?.id === currentUser?.id
      }));
      
      setMessages(formattedMessages);
      
      if (formattedMessages.length > 0) {
        lastMessageIdRef.current = formattedMessages[formattedMessages.length - 1].id;
      }
      
      scrollToBottom();
    } catch (err) {
      setError('Error loading messages');
      console.error('❌ Error loadMessages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Context menu handling - MODIFIÉ POUR EXCLURE LES MESSAGES SYSTÈMES
  const handleContextMenu = (event, message) => {
    event.preventDefault();
    
    // NE PAS AFFICHER LE MENU CONTEXTUEL POUR LES MESSAGES SYSTÈMES
    const isSystemMessage = message?.is_system_message || 
                           message?.message_type === 'system' ||
                           message?.system_message_type;
    
    if (isSystemMessage) {
      return; // Ne pas afficher de menu contextuel pour les messages système
    }
    
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      message: message,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({
      mouseX: null,
      mouseY: null,
      message: null,
    });
  };

  // Start editing a message - MODIFIÉ POUR EXCLURE LES MESSAGES SYSTÈMES
  const startEditMessage = () => {
    if (contextMenu.message) {
      // VÉRIFIER SI C'EST UN MESSAGE SYSTÈME
      const isSystemMessage = contextMenu.message?.is_system_message || 
                             contextMenu.message?.message_type === 'system';
      
      if (isSystemMessage) {
        showSnackbar('System messages cannot be edited', 'error');
        handleCloseContextMenu();
        return;
      }
      
      if (contextMenu.message.sender?.id === currentUser?.id) {
        setEditingMessage(contextMenu.message);
        setEditContent(contextMenu.message.content || '');
        handleCloseContextMenu();
      } else {
        showSnackbar('You can only edit your own messages', 'error');
        handleCloseContextMenu();
      }
    }
  };

  // Save edited message
  const saveEditMessage = async () => {
    if (!editingMessage || !conversation) return;
    
    try {
      const updateData = { content: editContent };
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_URL}/msg/conversations/${conversation.id}/messages/${editingMessage.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Edit failed');
      }
      
      await response.json();
      
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage.id ? { 
          ...msg, 
          content: editContent,
          image: msg.image,
          file: msg.file,
          image_url: msg.image_url,
          file_url: msg.file_url
        } : msg
      ));
      
      setEditingMessage(null);
      setEditContent('');
      showSnackbar('Message updated successfully', 'success');
      
    } catch (err) {
      console.error('❌ Edit error:', err);
      
      if (err.message.includes('Only content field can be updated')) {
        setError('Cannot update media files. You can only edit text content.');
      } else if (err.message.includes('You can only edit your own messages')) {
        setError('You can only edit your own messages');
      } else {
        setError(`Edit failed: ${err.message}`);
      }
      
      showSnackbar('Failed to update message', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  // Delete message - MODIFIÉ POUR EXCLURE LES MESSAGES SYSTÈMES
  const handleDeleteMessage = async (message, deleteForEveryone = false) => {
    if (!message || !conversation) return;
    
    // VÉRIFIER SI C'EST UN MESSAGE SYSTÈME
    const isSystemMessage = message?.is_system_message || 
                           message?.message_type === 'system';
    
    if (isSystemMessage) {
      showSnackbar('System messages cannot be deleted', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (deleteForEveryone) {
        if (message.sender?.id !== currentUser?.id && message.conversation?.created_by?.id === currentUser?.id)  {
          showSnackbar('You can only delete your own messages for everyone', 'error');
          return;
        }
        
        const response = await fetch(
          `${API_URL}/msg/conversations/${conversation.id}/messages/${message.id}/delete-for-everyone/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) throw new Error('Failed to delete message for everyone');
        showSnackbar('Message deleted for everyone', 'success');
        
      } else {
        const response = await fetch(
          `${API_URL}/msg/conversations/${conversation.id}/messages/${message.id}/delete-for-me/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) throw new Error('Failed to delete message for you');
        showSnackbar('Message deleted for you', 'info');
      }
      
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
      
    } catch (err) {
      console.error('❌ Delete error:', err);
      setError(err.message);
      showSnackbar(err.message, 'error');
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (deleteForEveryone = false) => {
    if (contextMenu.message) {
      setDeleteDialog({
        open: true,
        message: contextMenu.message,
        deleteForEveryone: deleteForEveryone,
      });
      handleCloseContextMenu();
    }
  };

  // Confirm delete action
  const confirmDelete = () => {
    handleDeleteMessage(deleteDialog.message, deleteDialog.deleteForEveryone);
    setDeleteDialog({
      open: false,
      message: null,
      deleteForEveryone: false,
    });
  };

  const handleReportMessage = () => {
    console.log('Report message:', contextMenu.message);
    showSnackbar('Message reported to administrators', 'warning');
    handleCloseContextMenu();
  };

  // Block user function
  const handleBlockUser = async () => {
    if (!contextMenu.message || !contextMenu.message.sender) return;
    
    try {
      const userId = contextMenu.message.sender.id;
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_URL}api/users/${userId}/block/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        showSnackbar('User blocked successfully', 'success');
      } else {
        throw new Error('Failed to block user');
      }
      
    } catch (err) {
      console.error('❌ Block user error:', err);
      showSnackbar('Failed to block user', 'error');
    } finally {
      handleCloseContextMenu();
    }
  };

  // View media directly
// Fonction pour mettre à jour la vidéo miniature depuis le plein écran
const updateMiniatureVideoFromFullscreen = useCallback((messageId, updatedTime, isPlaying) => {
  // Mettre à jour l'état
  setVideoStates(prev => ({
    ...prev,
    [messageId]: {
      ...prev[messageId],
      currentTime: updatedTime,
      isPlaying: isPlaying,
      duration: prev[messageId]?.duration || 0
    }
  }));
  
  // Mettre à jour l'élément DOM
  const videoElement = videoRefs.current[messageId];
  if (videoElement) {
    // Ne pas interrompre si la vidéo est en cours de lecture
    if (!videoElement.paused && !isPlaying) {
      videoElement.pause();
    }
    videoElement.currentTime = updatedTime;
  }
}, []);

// Modifiez handleViewMedia
const handleViewMedia = (message) => {
  // Sauvegarder l'état actuel avant d'ouvrir
  if (message.id) {
    const videoState = videoStates[message.id];
    if (videoState) {
      // Ajouter l'état actuel au message
      message.initialVideoState = {
        currentTime: videoState.currentTime,
        isPlaying: videoState.isPlaying
      };
    }
  }
  
  setSelectedMedia(message);
  setOpenMediaViewer(true);
};
const handleVideoCloseFromFullscreen = useCallback((videoData) => {
  if (videoData && videoData.messageId) {
    updateMiniatureVideoFromFullscreen(
      videoData.messageId,
      videoData.currentTime,
      videoData.isPlaying
    );
  }
}, [updateMiniatureVideoFromFullscreen]);
  // Display media directly in conversation
  
  const renderMediaDirectly = (message) => {
    const isOwn = message.sender?.id === currentUser?.id;
        const bgcolorAud = `linear-gradient(
      135deg,
      rgb(10, 10, 10),
      rgb(60, 10, 10),
      rgb(180, 20, 20),
      rgb(255, 0, 80)
    )`;
     
    if (message.image && message.image_url) {
      return (
        <Box
          className="media-preview"
          sx={{
            mb: 1,
            borderRadius: 2,
            overflow: 'hidden',
            cursor: 'pointer',
            maxWidth: '100%',
     
           
            backgroundColor: isOwn ? '#dcf8c6' : '#ffffff',
          }}
          onClick={() => handleViewMedia(message)}
        >
          <img 
            src={message.image_url} 
            alt="Message image" 
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: 300,
              objectFit: 'contain',
              display: 'block',
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=Image+not+available';
            }}
          />
        </Box>
      );
    }
    
    if (message.file && message.file_url) {
      const fileType = getFileType(message.file, message.file_url);
      
if (fileType === 'video') {
  const messageId = message.id;
  const currentVideoState = videoStates[messageId] || {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isSeeking: false
  };

  return (
    <Box
      className="media-preview"
      sx={{
        mb: 1,
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
        maxWidth: '100%',
        backgroundColor: '#000000',
        position: 'relative',
        userSelect: 'none',
        '&:hover .video-controls': {
          opacity: 1
        }
      }}
    >
      {/* Élément vidéo */}
      <video
        ref={(el) => {
          videoRefs.current[messageId] = el;
          // Initialiser l'état si nécessaire
          if (el && !videoStates[messageId]) {
            setVideoStates(prev => ({
              ...prev,
              [messageId]: {
                isPlaying: false,
                currentTime: 0,
                duration: el.duration || 0,
                isSeeking: false
              }
            }));
          }
        }}
        style={{
          width: '100%',
          maxHeight: 300,
          objectFit: 'contain',
          backgroundColor: '#000',
          display: 'block'
        }}
        preload="metadata"
        onClick={(e) => {
          e.stopPropagation();
          handleVideoPlayPause(messageId, 'toggle');
        }}
        onTimeUpdate={() => handleVideoTimeUpdate(messageId)}
        onLoadedMetadata={() => handleVideoLoadedMetadata(messageId)}
        onEnded={() => handleVideoEnded(messageId)}
      >
        <source src={message.file_url} type="video/mp4" />
        Votre navigateur ne supporte pas la vidéo.
      </video>

      {/* Bouton plein écran pour ouvrir MediaViewer */}
   <IconButton
  onClick={(e) => {
    e.stopPropagation();
    // Arrêter la vidéo miniature si elle est en lecture
    if (currentVideoState.isPlaying) {
      handleVideoPlayPause(messageId, 'pause');
    }
    
    // Sauvegarder la position actuelle
    const messageWithTime = {
      ...message,
      videoStartTime: currentVideoState.currentTime || 0,
      shouldAutoPlay: currentVideoState.isPlaying || false
    };
    
    handleViewMedia(messageWithTime);
  }}
  sx={{
    position: 'absolute',
    top: 8,
    right: 8,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
    width: 32,
    height: 32,
    minWidth: 32,
    zIndex: 10,
    opacity: 0,
    transition: 'opacity 0.3s',
    '&:hover, .media-preview:hover &': {
      opacity: 1
    }
  }}
  title="Open full screen"
>
  <FullscreenIcon sx={{ fontSize: '18px' }} />
</IconButton>
      {/* Contrôles vidéo personnalisés */}
      <Box
        className="video-controls"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: currentVideoState.isPlaying ? 0 : 1,
          transition: 'opacity 0.3s',
          '&:hover': {
            opacity: 1
          }
        }}
      >
        {/* Bouton Play/Pause */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleVideoPlayPause(messageId, 'toggle');
          }}
          sx={{
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
            width: 36,
            height: 36,
            minWidth: 36,
            flexShrink: 0
          }}
        >
          {currentVideoState.isPlaying ? (
            <PauseIcon sx={{ fontSize: '20px' }} />
          ) : (
            <PlayArrowIcon sx={{ fontSize: '20px', ml: '2px' ,borderRadius:'50%'}} />
          )}
        </IconButton>

        {/* Barre de progression */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Affichage du temps */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mb: 0.5 
          }}>
            <Typography
              variant="caption"
              sx={{
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 500,
                fontFamily: '"Segoe UI", Roboto, sans-serif'
              }}
            >
              {formatTime(currentVideoState.currentTime)}
            </Typography>
            
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.7rem',
                fontWeight: 400,
                fontFamily: '"Segoe UI", Roboto, sans-serif'
              }}
            >
              {formatTime(currentVideoState.duration)}
            </Typography>
          </Box>

          {/* Barre de progression */}
          <Box 
            sx={{ 
              position: 'relative',
              height: 3,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 1.5,
              cursor: 'pointer',
              overflow: 'hidden'
            }}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const percentage = ((e.clientX - rect.left) / rect.width) * 100;
              const videoElement = videoRefs.current[messageId];
              if (videoElement && currentVideoState.duration) {
                const newTime = (percentage / 100) * currentVideoState.duration;
                videoElement.currentTime = newTime;
                setVideoStates(prev => ({
                  ...prev,
                  [messageId]: {
                    ...prev[messageId],
                    currentTime: newTime
                  }
                }));
              }
            }}
          >
            {/* Barre de progression remplie */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${(currentVideoState.currentTime / currentVideoState.duration) * 100 || 0}%`,
                background: bgcolorAud,
                borderRadius: 1.5,
                transition: 'width 0.1s linear'
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Indicateur de lecture */}
      {currentVideoState.isPlaying && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s',
            pointerEvents: 'none'
          }}
        >
          <PlayArrowIcon sx={{ fontSize: 30, color: 'white' }} />
        </Box>
      )}
    </Box>
  );
}

  // Rendu
    if (fileType === 'audio') {
    const messageId = message.id;
    const currentState = audioStates[messageId] || {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isSeeking: false,
      seekPosition: null
    };
    


    return (
      <Box 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          backgroundColor: '#f0f0f0',
          borderRadius: '18px',
          padding: '10px 16px',
          maxWidth: '280px',
          position: 'relative',
          boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
          userSelect: 'none',
          '@media (max-width: 746px)': {
            maxWidth: '240px',
            padding: '8px 12px',
          }
        }}
      >
        {/* Bouton Play/Pause */}
        <IconButton
          onClick={() => handlePlayPause(messageId)}
          sx={{
            background: bgcolorAud,
            color: 'white',
            '&:hover': { backgroundColor: '#1da851' },
            width: '40px',
            height: '40px',
            minWidth: '40px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            flexShrink: 0,
            zIndex: 3,
   
          }}
        >
          {currentState.isPlaying ? (
            <PauseIcon sx={{ fontSize: '20px' }} />
          ) : (
            <PlayArrowIcon sx={{ fontSize: '20px', ml: '2px' }} />
          )}
        </IconButton>
        
        {/* Zone de contrôle audio */}
        <Box 
          ref={containerRef}
          sx={{ 
            flex: 1, 
            minWidth: 0, 
            position: 'relative',
            cursor: 'default',
            touchAction: 'none',
            pointerEvents: currentState.isSeeking ? 'auto' : 'none'
          }}
          onMouseDown={(e) => handleSeekStart(e, messageId, containerRef)}
          onTouchStart={(e) => handleSeekStart(e, messageId, containerRef)}
        >
          {/* Visualiseur audio */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'flex-end',
            height: '24px',
            gap: '2px',
            mb: 0.5,
            position: 'relative',
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            {[...Array(40)].map((_, i) => {
              const progress = (i / 39) * 100;
              const currentProgress = currentState.seekPosition !== null 
                ? currentState.seekPosition 
                : (currentState.currentTime / currentState.duration) * 100;
              const isPlayed = progress <= currentProgress;
              const height = currentState.isPlaying 
                ? `${Math.sin(i * 0.5) * 10 + 12}px` 
                : `${Math.sin(i * 0.3) * 6 + 8}px`;
              
              return (
                <Box
                  key={i}
                  sx={{
                    width: '2px',
                    height: height,
                    background: isPlayed ? bgcolorAud : '#bbb',
                    borderRadius: '1px',
                    transition: currentState.isPlaying 
                      ? 'height 0.3s ease-in-out, background-color 0.2s' 
                      : 'background-color 0.2s',
                    animation: currentState.isPlaying ? 'pulse 1.5s infinite' : 'none',
                    animationDelay: `${i * 0.05}s`,
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    }
                  }}
                />
              );
            })}
            
            {/* Curseur pendant le glissement */}
            {currentState.isSeeking && (
              <Box
                sx={{
                  position: 'absolute',
                  left: `${currentState.seekPosition}%`,
                  top: 0,
                  width: '3px',
                  height: '100%',
                  backgroundColor: '#ff9800',
                  zIndex: 2,
                  transform: 'translateX(-50%)',
                  boxShadow: '0 0 5px rgba(0,0,0,0.3)'
                }}
              />
            )}
            
            {/* Curseur normal */}
            <Box
              sx={{
                position: 'absolute',
                left: `${(currentState.currentTime / currentState.duration) * 100}%`,
                top: 0,
                width: '2px',
                height: '100%',
                backgroundColor: '#751919ff',
                zIndex: 1,
                transform: 'translateX(-50%)',
                opacity: currentState.isSeeking ? 0 : 1,
                transition: 'opacity 0.2s'
              }}
            />
          </Box>
          
          {/* Affichage des temps */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <Typography
              variant="caption"
              sx={{
                color: currentState.isSeeking ? '#ff9800' : '#d32525c4',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: '"Segoe UI", Roboto, sans-serif',
                transition: 'color 0.2s'
              }}
            >
              {formatTime(
                currentState.isSeeking && currentState.seekPosition !== null 
                  ? (currentState.seekPosition / 100) * currentState.duration 
                  : currentState.currentTime
              )}
            </Typography>
            
            <Typography
              variant="caption"
              sx={{
                color: '#666',
                fontSize: '0.75rem',
                fontWeight: 500,
                fontFamily: '"Segoe UI", Roboto, sans-serif'
              }}
            >
              {formatTime(currentState.duration)}
            </Typography>
          </Box>
        </Box>
        
        {/* Élément audio caché */}
        <audio
          ref={(el) => {
            audioRefs.current[messageId] = el;
            // Initialiser l'état si nécessaire
            if (el && !audioStates[messageId]) {
              setAudioStates(prev => ({
                ...prev,
                [messageId]: {
                  isPlaying: false,
                  currentTime: 0,
                  duration: el.duration || 0,
                  isSeeking: false,
                  seekPosition: null
                }
              }));
            }
          }}
          src={message.file_url}
          preload="metadata"
          onTimeUpdate={() => handleTimeUpdate(messageId)}
          onLoadedMetadata={() => handleLoadedMetadata(messageId)}
          onEnded={() => handleAudioEnded(messageId)}
          style={{ display: 'none' }}
        />
      </Box>
    );
  }


      // For other file types
      return (
        <Box
          className="media-preview"
          sx={{
            mb: 1,
            p: 2,
            borderRadius: 2,
            bgcolor: isOwn ? 'rgba(220, 248, 198, 0.5)' : 'grey.100',
            border: '1px solid',
            borderColor: isOwn ? '#dcf8c6' : 'grey.300',
            cursor: 'pointer',
            maxWidth: '100%',
            '&:hover': { bgcolor: isOwn ? 'rgba(220, 248, 198, 0.7)' : 'grey.200' }
          }}
          onClick={() => handleViewMedia(message)}
        >
          <Box display="flex" alignItems="center" gap={2}>
            {fileType === 'pdf' ? (
              <PdfIcon sx={{ color: 'error.main' }} />
            ) : (
              <FileIcon sx={{ color: 'action.active' }} />
            )}
            <Box flex={1} wordBreak="break-all" maxWidth='200px'>
              <Typography variant="body2" fontWeight="medium">
                {message.file || 'File'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to open
              </Typography>
            </Box>
            <DownloadIcon fontSize="small" />
          </Box>
        </Box>
      );
    }
    
    return null;
  };

  // Audio recording
  const startRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setMicPermissionError(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Audio recording error:', err);
      setMicPermissionError(true);
      setError('Microphone not available. Check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Main function to send message
  const handleSendMessage = async () => {
    const content = newMessage.trim();
    
    if (!content && selectedFiles.length === 0 && !audioBlob) return;
    if (!conversation) return;
    
    setUploading(true);
    setError('');
    
    try {
      let response;
      
      if (selectedFiles.length > 0 || audioBlob) {
        const formData = new FormData();
        
        if (content) {
          formData.append('content', content);
        }
        
        if (audioBlob) {
          const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
            type: 'audio/webm'
          });
          formData.append('file', audioFile);
        }
        
        selectedFiles.forEach(file => {
          if (file.type.startsWith('image/')) {
            formData.append('image', file);
          } else {
            formData.append('file', file);
          }
        });
        
        const token = localStorage.getItem('token');
        
        response = await fetch(
          `${API_URL}/msg/conversations/${conversation.id}/messages/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${token}`,
            },
            body: formData,
          }
        );
        
      } else {
        const token = localStorage.getItem('token');
        
        response = await fetch(
          `${API_URL}/msg/conversations/${conversation.id}/messages/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content }),
          }
        );
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Sending error');
      }
      
      const newMessageWithSender = {
        ...data,
        sender: currentUser,
        isOwn: true
      };
      
      setMessages(prev => [...prev, newMessageWithSender]);
      setNewMessage('');
      setSelectedFiles([]);
      setAudioBlob(null);
      
      scrollToBottom();
      
    } catch (err) {
      console.error('❌ Send error:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // File handling
  const handleFileSelect = (event, fileType = 'any') => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    let filteredFiles = files;
    if (fileType === 'image') {
      filteredFiles = files.filter(file => file.type.startsWith('image/'));
    } else if (fileType === 'audio') {
      filteredFiles = files.filter(file => file.type.startsWith('audio/'));
    } else if (fileType === 'video') {
      filteredFiles = files.filter(file => file.type.startsWith('video/'));
    }
    
    const maxSize = 50 * 1024 * 1024;
    const validFiles = filteredFiles.filter(file => file.size <= maxSize);
    
    if (validFiles.length !== filteredFiles.length) {
      showSnackbar('Some files exceed 50MB', 'warning');
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    event.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Function for notifications
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Render messages - MODIFIÉ POUR INCLURE LES MESSAGES SYSTÈMES
  const renderMessages = () => {
    if (!messages || !Array.isArray(messages)) {
      return null;
    }
    
    return messages.map((message) => {
      const isOwn = message?.sender?.id === currentUser?.id;
      const isSystemMessage = message?.is_system_message || 
                             message?.message_type === 'system' ||
                             message?.system_message_type;
      
      // Si c'est un message système, utiliser SystemMessageBubble
      if (isSystemMessage) {
        return (
          <SystemMessageBubble
            key={message.id}
            message={message}
          />
        );
      }
      
      // Sinon, utiliser MessageBubble normal
      return (
        <MessageBubble
          key={message.id}
          message={message}
          currentUser={currentUser}
          isOwn={isOwn}
          renderMediaDirectly={renderMediaDirectly}
          handleContextMenu={handleContextMenu}
          editingMessage={editingMessage}
          editContent={editContent}
          setEditContent={setEditContent}
          saveEditMessage={saveEditMessage}
          cancelEdit={cancelEdit}
        />
      );
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipant = () => {
    if (!conversation?.participants || !Array.isArray(conversation.participants)) {
      return null;
    }
    return conversation.participants.find(p => p.id !== currentUser?.id);
  };

  const otherParticipant = getOtherParticipant();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  // Add a check if conversation is not available yet
  if (!conversation) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" p={3}>
        <Typography color="text.secondary">
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      maxWidth: 'auto',
      display: 'flex', 
      flexDirection: 'column', 
      '@media(max-width:765px)': {
        width: '100%', 
        maxWidth: 'auto', 
        maxHeight: 'auto', 
        height: '100%'
      } 
    }}>
      {/* Header */}
      <ChatHeader
        currentUser={currentUser} 
        conversation={conversation} 
        otherParticipant={otherParticipant}
        messages={messages || []}
        loadingMessages={loadingMessages}
        loadMessages={loadMessages}
      />

      {/* Messages */}
      <MessageList
        messages={messages || []}
        loadingMessages={loadingMessages}
        error={error}
        micPermissionError={micPermissionError}
        currentUser={currentUser}
        renderMediaDirectly={renderMediaDirectly}
        handleContextMenu={handleContextMenu}
        editingMessage={editingMessage}
        editContent={editContent}
        setEditContent={setEditContent}
        saveEditMessage={saveEditMessage}
        cancelEdit={cancelEdit}
        renderMessages={renderMessages}
        messagesEndRef={messagesEndRef}
        setError={setError}
        setMicPermissionError={setMicPermissionError}
      />

      {/* Audio recording area */}
      <AudioRecorder
        isRecording={isRecording}
        recordingTime={recordingTime}
        audioBlob={audioBlob}
        uploading={uploading}
        stopRecording={stopRecording}
        handleSendMessage={handleSendMessage}
        setAudioBlob={setAudioBlob}
      />

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <FilePreview
          selectedFiles={selectedFiles}
          removeFile={removeFile}
        />
      )}

      {/* Input area */}
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        selectedFiles={selectedFiles}
        audioBlob={audioBlob}
        uploading={uploading}
        isRecording={isRecording}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
        handleFileSelect={handleFileSelect}
        startRecording={startRecording}
        stopRecording={stopRecording}
        imageInputRef={imageInputRef}
        fileInputRef={fileInputRef}
        audioInputRef={audioInputRef}
        videoInputRef={videoInputRef}
      />

      {/* Context menu */}
      <ContextMenu
      conversation={conversation}
        contextMenu={contextMenu}
        currentUser={currentUser}
        handleCloseContextMenu={handleCloseContextMenu}
        startEditMessage={startEditMessage}
        openDeleteDialog={openDeleteDialog}
        handleReportMessage={handleReportMessage}
        handleBlockUser={handleBlockUser}
      />

      {/* Delete confirmation dialog */}
      <DeleteDialog
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        confirmDelete={confirmDelete}
      />

      {/* Media viewer modal */}
      <MediaViewer
        openMediaViewer={openMediaViewer}
        setOpenMediaViewer={setOpenMediaViewer}
        selectedMedia={selectedMedia}
         onVideoClose={handleVideoCloseFromFullscreen}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default ChatWindow;
// src/components/RecentComments.jsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Divider,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  Tooltip,
  Alert,
  Badge,
  Paper,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Comment as CommentIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ThumbUp as LikeIcon,
  ThumbDown as DislikeIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon,
  Article as ArticleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Flag as FlagIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  Audiotrack as AudioIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Link as LinkIcon,
  Collections as CollectionsIcon,
  Pin as PinIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
const RecentComments = ({ comments, total }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');
  
  // États SEPARÉS pour les deux menus différents
  const [sortMenuAnchorEl, setSortMenuAnchorEl] = useState(null);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  
  const [selectedComment, setSelectedComment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage, setCommentsPerPage] = useState(10);
  
  // États pour les médias
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  
  // États pour les lecteurs audio/video
  const [playingAudio, setPlayingAudio] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const navigate = useNavigate();
  // Données sécurisées
  const safeComments = Array.isArray(comments) ? comments : [];
  const safeTotal = total || safeComments.length;

  // Options de tri
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Liked' },
    { value: 'replies', label: 'Most Replies' },
    { value: 'pinned', label: 'Pinned First' },
    { value: 'edited', label: 'Recently Edited' },
    { value: 'media', label: 'With Media First' }
  ];

  // Options de filtre
  const filterOptions = [
    { value: 'all', label: 'All Comments' },
    { value: 'with_media', label: 'With Media' },
    { value: 'with_video', label: 'With Video' },
    { value: 'with_audio', label: 'With Audio' },
    { value: 'with_image', label: 'With Image' },
    { value: 'my_comments', label: 'My Comments' },
    { value: 'replies_only', label: 'Replies Only' },
    { value: 'recent_week', label: 'Last 7 Days' }
  ];

  // Fonction pour obtenir l'extension d'un fichier
  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  };

  // Fonction pour déterminer le type de fichier
  const getFileType = (filename, fileUrl) => {
    if (!filename && !fileUrl) return 'unknown';
    
    const ext = getFileExtension(filename || fileUrl);
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    
    if (videoExtensions.includes(ext)) return 'video';
    if (audioExtensions.includes(ext)) return 'audio';
    if (imageExtensions.includes(ext)) return 'image';
    if (documentExtensions.includes(ext)) return 'document';
    
    return 'file';
  };

  // Fonction améliorée pour détecter les types de médias dans un commentaire
  const detectCommentMediaTypes = (comment) => {
    const mediaTypes = {
      hasImage: false,
      hasVideo: false,
      hasAudio: false,
      hasDocument: false,
      hasFile: false,
      hasMedia: false,
      mediaDetails: {
        image: null,
        video: null,
        audio: null,
        document: null,
        file: null
      },
      mediaUrls: []
    };

    // Vérifier les médias directs
    if (comment.image) {
      const fileType = getFileType(comment.image_name, comment.image);
      if (fileType === 'image') {
        mediaTypes.hasImage = true;
        mediaTypes.hasMedia = true;
        mediaTypes.mediaDetails.image = {
          url: comment.image,
          name: comment.image_name || 'image',
          type: 'image'
        };
        mediaTypes.mediaUrls.push({
          url: comment.image,
          name: comment.image_name,
          type: 'image'
        });
      }
    }
    
    if (comment.video) {
      const fileType = getFileType(comment.video_name, comment.video);
      if (fileType === 'video') {
        mediaTypes.hasVideo = true;
        mediaTypes.hasMedia = true;
        mediaTypes.mediaDetails.video = {
          url: comment.video,
          name: comment.video_name || 'video',
          type: 'video'
        };
        mediaTypes.mediaUrls.push({
          url: comment.video,
          name: comment.video_name,
          type: 'video'
        });
      } else if (fileType === 'audio') {
        mediaTypes.hasAudio = true;
        mediaTypes.hasMedia = true;
        mediaTypes.mediaDetails.audio = {
          url: comment.video, // Note: using video field for audio files
          name: comment.video_name || 'audio',
          type: 'audio'
        };
        mediaTypes.mediaUrls.push({
          url: comment.video,
          name: comment.video_name,
          type: 'audio'
        });
      }
    }
    
    if (comment.file) {
      const fileType = getFileType(comment.file_name, comment.file);
      
      if (fileType === 'audio') {
        mediaTypes.hasAudio = true;
        mediaTypes.hasMedia = true;
        mediaTypes.mediaDetails.audio = {
          url: comment.file,
          name: comment.file_name || 'audio',
          type: 'audio'
        };
      } else if (fileType === 'document') {
        mediaTypes.hasDocument = true;
        mediaTypes.hasMedia = true;
        mediaTypes.mediaDetails.document = {
          url: comment.file,
          name: comment.file_name || 'document',
          type: 'document'
        };
      } else {
        mediaTypes.hasFile = true;
        mediaTypes.hasMedia = true;
        mediaTypes.mediaDetails.file = {
          url: comment.file,
          name: comment.file_name || 'file',
          type: 'file'
        };
      }
      
      if (mediaTypes.mediaDetails[fileType]) {
        mediaTypes.mediaUrls.push({
          url: comment.file,
          name: comment.file_name,
          type: fileType
        });
      }
    }

    return mediaTypes;
  };

  // Fonction pour obtenir l'icône du type de média
  const getMediaIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon fontSize="small" />;
      case 'video':
        return <VideoIcon fontSize="small" />;
      case 'audio':
        return <AudioIcon fontSize="small" />;
      case 'document':
        return <PdfIcon fontSize="small" />;
      case 'file':
        return <FileIcon fontSize="small" />;
      default:
        return <FileIcon fontSize="small" />;
    }
  };

  // Fonction pour obtenir le label du type de média
  const getMediaLabel = (type) => {
    switch (type) {
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'audio': return 'Audio';
      case 'document': return 'Document';
      case 'file': return 'File';
      default: return 'File';
    }
  };

  // Filtrer et trier les commentaires
  const filteredAndSortedComments = useMemo(() => {
    let filtered = [...safeComments];
    
    // Filtre par recherche
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(comment => {
        const matchesContent = comment.content?.toLowerCase().includes(searchLower);
        const matchesUsername = comment.user?.username?.toLowerCase().includes(searchLower);
        const matchesPostTitle = comment.post_title?.toLowerCase().includes(searchLower);
        
        return matchesContent || matchesUsername || matchesPostTitle;
      });
    }
    
    // Filtre par type
    if (filterType !== 'all') {
      switch (filterType) {
        case 'with_media':
          filtered = filtered.filter(comment => 
            comment.image || comment.video || comment.file
          );
          break;
        case 'with_video':
          filtered = filtered.filter(comment => {
            const mediaTypes = detectCommentMediaTypes(comment);
            return mediaTypes.hasVideo;
          });
          break;
        case 'with_audio':
          filtered = filtered.filter(comment => {
            const mediaTypes = detectCommentMediaTypes(comment);
            return mediaTypes.hasAudio;
          });
          break;
        case 'with_image':
          filtered = filtered.filter(comment => {
            const mediaTypes = detectCommentMediaTypes(comment);
            return mediaTypes.hasImage;
          });
          break;
        case 'my_comments':
          filtered = filtered.filter(comment => comment.is_owner);
          break;
        case 'replies_only':
          filtered = filtered.filter(comment => comment.parent_comment);
          break;
        case 'recent_week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(comment => {
            const commentDate = comment.created_at ? new Date(comment.created_at) : null;
            return commentDate && commentDate >= weekAgo;
          });
          break;
      }
    }
    
    // Trier
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'popular':
          return (b.likes_count || 0) - (a.likes_count || 0);
        case 'replies':
          return (b.reply_count || b.replies_count || 0) - (a.reply_count || a.replies_count || 0);
        case 'pinned':
          if (a.is_pinned === b.is_pinned) {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          }
          return a.is_pinned ? -1 : 1;
        case 'edited':
          const aEdited = a.is_edited ? new Date(a.edited_at || a.updated_at || 0) : new Date(0);
          const bEdited = b.is_edited ? new Date(b.edited_at || b.updated_at || 0) : new Date(0);
          return bEdited - aEdited;
        case 'media':
          const aHasMedia = a.image || a.video || a.file;
          const bHasMedia = b.image || b.video || b.file;
          if (aHasMedia === bHasMedia) {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          }
          return aHasMedia ? -1 : 1;
        default:
          return 0;
      }
    });
  }, [safeComments, searchQuery, filterType, sortBy]);

  // Pagination
  const currentComments = useMemo(() => {
    const startIndex = (currentPage - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;
    return filteredAndSortedComments.slice(startIndex, endIndex);
  }, [filteredAndSortedComments, currentPage, commentsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedComments.length / commentsPerPage);

  // Gestion des médias
  const handleViewMedia = (comment, mediaInfo) => {
    setSelectedMedia(mediaInfo);
    setMediaType(mediaInfo.type);
    setSelectedComment(comment);
    setMediaModalOpen(true);
  };

  const handleCloseMediaModal = () => {
    setMediaModalOpen(false);
    setSelectedMedia(null);
    setMediaType(null);
    
    // Arrêter la lecture audio/video
    setPlayingAudio(null);
    setPlayingVideo(null);
  };

  const handlePlayAudio = (audioUrl) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null); // Pause
    } else {
      setPlayingAudio(audioUrl); // Play
    }
  };

  const handlePlayVideo = (videoUrl) => {
    if (playingVideo === videoUrl) {
      setPlayingVideo(null); // Pause
    } else {
      setPlayingVideo(videoUrl); // Play
    }
  };

  const handleDownloadMedia = (mediaUrl, fileName) => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Gestionnaires de menus SÉPARÉS
  const handleSortMenuOpen = (event) => {
    setSortMenuAnchorEl(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchorEl(null);
  };

  const handleActionMenuOpen = (event, comment) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedComment(null);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
    handleSortMenuClose();
  };

  const handleEditComment = (comment) => {
    console.log('Edit comment:', comment.id);
     navigate(`/user/${comment.user_id}/posts/${comment.post_id}?comment=${comment.id}`);
    handleActionMenuClose();
  };

  const handleDeleteComment = (comment) => {
    console.log('Delete comment:', comment.id);
    handleActionMenuClose();
  };

  const handleReply = (comment) => {
        navigate(`/user/${comment.user_id}/posts/${comment.post_id}?comment=${comment.id}`);
    handleActionMenuClose();
  };

  const handleViewPost = (comment) => {
    console.log('View post:', comment.post_id);
    // Navigation vers le post
    handleActionMenuClose();
  };

  const handleReport = (comment) => {
    console.log('Report comment:', comment.id);
    handleActionMenuClose();
  };

  const handleLike = (comment) => {
    console.log('Like comment:', comment.id);
  };

  // Composant pour afficher les badges de médias
  const CommentMediaBadges = ({ comment }) => {
    const mediaTypes = detectCommentMediaTypes(comment);
    
    if (!mediaTypes.hasMedia) {
      return null;
    }

    return (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mt={1}>
        {mediaTypes.mediaUrls.map((media, index) => (
          <Tooltip key={index} title={`${getMediaLabel(media.type)}: ${media.name || 'Attachment'}`}>
            <Chip
              icon={getMediaIcon(media.type)}
              label={getMediaLabel(media.type)}
              size="small"
              variant="outlined"
              onClick={() => handleViewMedia(comment, media)}
              sx={{ 
                cursor: 'pointer', 
                height: 24,
                ...(media.type === 'video' && { color: theme.palette.error.main, borderColor: theme.palette.error.main }),
                ...(media.type === 'audio' && { color: theme.palette.success.main, borderColor: theme.palette.success.main }),
                ...(media.type === 'image' && { color: theme.palette.info.main, borderColor: theme.palette.info.main }),
                ...(media.type === 'document' && { color: theme.palette.warning.main, borderColor: theme.palette.warning.main }),
              }}
            />
          </Tooltip>
        ))}
      </Stack>
    );
  };

  // Afficher un aperçu du média (INLINE)
  const MediaPreview = ({ comment }) => {
    const mediaTypes = detectCommentMediaTypes(comment);
    
    if (!mediaTypes.hasMedia) return null;

    const renderPreview = () => {
      // Afficher les images directement
      if (mediaTypes.hasImage && mediaTypes.mediaDetails.image) {
        return (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Attached image:
            </Typography>
            <Box
              component="img"
              src={mediaTypes.mediaDetails.image.url}
              alt={mediaTypes.mediaDetails.image.name || "Comment image"}
              sx={{
                maxWidth: '100%',
                maxHeight: 300,
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { 
                  opacity: 0.9,
                  boxShadow: theme.shadows[4]
                }
              }}
              onClick={() => handleViewMedia(comment, mediaTypes.mediaDetails.image)}
            />
          </Box>
        );
      }
      
      // Afficher les vidéos avec lecteur
      if (mediaTypes.hasVideo && mediaTypes.mediaDetails.video) {
        const isPlaying = playingVideo === mediaTypes.mediaDetails.video.url;
        
        return (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Attached video:
            </Typography>
            <Card variant="outlined" sx={{ bgcolor: 'grey.900' }}>
              <Box position="relative" sx={{ height: 200 }}>
                {isPlaying ? (
                  <Box
                    component="video"
                    src={mediaTypes.mediaDetails.video.url}
                    controls
                    autoPlay
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <>
                    <Box
                      component="video"
                      src={mediaTypes.mediaDetails.video.url}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.7)'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => handlePlayVideo(mediaTypes.mediaDetails.video.url)}
                    >
                      <IconButton
                        sx={{
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          width: 60,
                          height: 60,
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.9)'
                          }
                        }}
                      >
                        <PlayIcon fontSize="large" />
                      </IconButton>
                    </Box>
                  </>
                )}
              </Box>
              <CardContent sx={{ py: 1, px: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {mediaTypes.mediaDetails.video.name || 'Video'}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewMedia(comment, mediaTypes.mediaDetails.video)}
                  >
                    Fullscreen
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
      }
      
      // Afficher les fichiers audio avec lecteur
      if (mediaTypes.hasAudio && mediaTypes.mediaDetails.audio) {
        const isPlaying = playingAudio === mediaTypes.mediaDetails.audio.url;
        
        return (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Attached audio:
            </Typography>
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <IconButton
                    onClick={() => handlePlayAudio(mediaTypes.mediaDetails.audio.url)}
                    color="primary"
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark
                      }
                    }}
                  >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                  <Box flex={1}>
                    <Typography variant="body2">
                      {mediaTypes.mediaDetails.audio.name || 'Audio file'}
                    </Typography>
                    {isPlaying && (
                      <Box
                        component="audio"
                        src={mediaTypes.mediaDetails.audio.url}
                        autoPlay
                        controls
                        style={{ width: '100%', marginTop: 8 }}
                      />
                    )}
                  </Box>
                  <IconButton
                    onClick={() => handleViewMedia(comment, mediaTypes.mediaDetails.audio)}
                  >
                    <FullscreenIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
      }
      
      // Afficher les documents
      if (mediaTypes.hasDocument && mediaTypes.mediaDetails.document) {
        return (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Attached document:
            </Typography>
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PdfIcon color="error" fontSize="large" />
                  <Box flex={1}>
                    <Typography variant="body2">
                      {mediaTypes.mediaDetails.document.name || 'Document'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PDF document
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewMedia(comment, mediaTypes.mediaDetails.document)}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadMedia(
                      mediaTypes.mediaDetails.document.url,
                      mediaTypes.mediaDetails.document.name
                    )}
                  >
                    Download
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
      }
      
      // Afficher les autres fichiers
      if (mediaTypes.hasFile && mediaTypes.mediaDetails.file) {
        return (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Attached file:
            </Typography>
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <FileIcon color="action" fontSize="large" />
                  <Box flex={1}>
                    <Typography variant="body2">
                      {mediaTypes.mediaDetails.file.name || 'File'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getFileExtension(mediaTypes.mediaDetails.file.name).toUpperCase()} file
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadMedia(
                      mediaTypes.mediaDetails.file.url,
                      mediaTypes.mediaDetails.file.name
                    )}
                  >
                    Download
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
      }
      
      return null;
    };

    return renderPreview();
  };

  // Modal pour afficher les médias en plein écran
  const MediaModal = () => (
    <Dialog
      open={mediaModalOpen}
      onClose={handleCloseMediaModal}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {selectedMedia?.name || getMediaLabel(mediaType)}
          </Typography>
          <IconButton onClick={handleCloseMediaModal}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedMedia && (
          <Box sx={{ mt: 2 }}>
            {mediaType === 'image' && (
              <Box
                component="img"
                src={selectedMedia.url}
                alt={selectedMedia.name}
                sx={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            )}
            
            {mediaType === 'video' && (
              <Box
                component="video"
                src={selectedMedia.url}
                controls
                autoPlay
                sx={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            )}
            
            {mediaType === 'audio' && (
              <Box sx={{ py: 4 }}>
                <Box
                  component="audio"
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  style={{ width: '100%' }}
                />
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                  {selectedMedia.name || 'Audio file'}
                </Typography>
              </Box>
            )}
            
            {(mediaType === 'document' || mediaType === 'file') && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <FileIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {selectedMedia.name || 'File'}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {getFileExtension(selectedMedia.name).toUpperCase()} file
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadMedia(selectedMedia.url, selectedMedia.name)}
                  sx={{ mt: 2 }}
                >
                  Download File
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                  Preview not available for this file type
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseMediaModal}>
          Close
        </Button>
        {selectedMedia && (
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadMedia(selectedMedia.url, selectedMedia.name)}
          >
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  // Statistiques des commentaires
  const commentsStats = useMemo(() => {
    const totalComments = safeTotal;
    const thisWeek = safeComments.filter(c => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const commentDate = c.created_at ? new Date(c.created_at) : null;
      return commentDate && commentDate >= weekAgo;
    }).length;
    
    const avgLikes = safeComments.length > 0 ? 
      Math.round(safeComments.reduce((sum, c) => sum + (c.likes_count || 0), 0) / safeComments.length) : 0;
    
    const replies = safeComments.filter(c => c.parent_comment || c.parent_comment_id).length;
    
    const withMedia = safeComments.filter(c => 
      c.image || c.video || c.file
    ).length;
    
    const withVideo = safeComments.filter(c => {
      const mediaTypes = detectCommentMediaTypes(c);
      return mediaTypes.hasVideo;
    }).length;
    
    const withAudio = safeComments.filter(c => {
      const mediaTypes = detectCommentMediaTypes(c);
      return mediaTypes.hasAudio;
    }).length;
    
    const pinned = safeComments.filter(c => c.is_pinned).length;

    return {
      total: totalComments,
      thisWeek,
      avgLikes,
      replies,
      withMedia,
      withVideo,
      withAudio,
      pinned
    };
  }, [safeComments, safeTotal]);

  // Commentaire le plus populaire
  const mostPopularComment = useMemo(() => {
    if (safeComments.length === 0) return null;
    
    return safeComments.reduce((prev, current) => 
      (prev.likes_count || 0) > (current.likes_count || 0) ? prev : current
    );
  }, [safeComments]);

  return (
    <Box>
      {/* Modal pour les médias */}
      <MediaModal />
      
      {/* En-tête avec statistiques */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="700" color="primary">
                {commentsStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Comments
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="700" color="success.main">
                {commentsStats.withMedia}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                With Media
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="700" color="warning.main">
                {commentsStats.avgLikes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. Likes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="700" color="info.main">
                {commentsStats.replies}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Replies
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Statistiques détaillées des médias */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <VideoIcon fontSize="small" color="error" />
                Videos: {commentsStats.withVideo}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <AudioIcon fontSize="small" color="success" />
                Audio: {commentsStats.withAudio}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <ImageIcon fontSize="small" color="info" />
                Images: {commentsStats.withMedia - commentsStats.withVideo - commentsStats.withAudio}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <PinIcon fontSize="small" color="error" />
                Pinned: {commentsStats.pinned}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Barre d'outils */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={6} md={2}>
              <Button
                fullWidth
                startIcon={<FilterIcon />}
                onClick={() => {
                  setFilterType(filterType === 'with_media' ? 'all' : 'with_media');
                  setCurrentPage(1);
                }}
                variant={filterType === 'with_media' ? 'contained' : 'outlined'}
                size="small"
              >
                {filterType === 'with_media' ? 'Media Only' : 'Filter'}
              </Button>
            </Grid>
            
            <Grid item xs={6} md={2}>
              <Button
                fullWidth
                startIcon={<SortIcon />}
                onClick={handleSortMenuOpen}
                variant="outlined"
                size="small"
              >
                {sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort'}
              </Button>
            </Grid>
            
            <Grid item xs={12} md={4} textAlign="right">
              <Box display="flex" alignItems="center" gap={1} justifyContent="flex-end">
                <Typography variant="body2" color="text.secondary">
                  Show:
                </Typography>
                <select
                  value={commentsPerPage}
                  onChange={(e) => {
                    setCommentsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Menu de tri - SÉPARÉ */}
      <Menu
        anchorEl={sortMenuAnchorEl}
        open={Boolean(sortMenuAnchorEl)}
        onClose={handleSortMenuClose}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={sortBy === option.value}
            onClick={() => handleSortChange(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Commentaire le plus populaire */}
      {mostPopularComment && (
        <Card sx={{ 
          mb: 4, 
          bgcolor: 'warning.light', 
          border: `2px solid ${theme.palette.warning.main}`,
          position: 'relative'
        }}>
          {/* Badge de trophée */}
          <Box sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: theme.palette.warning.main,
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows[3]
          }}>
            <TrendingUpIcon />
          </Box>
          
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TrendingUpIcon color="warning" />
              <Typography variant="subtitle1" fontWeight="600">
                Most Popular Comment
              </Typography>
              <Chip
                label={`${mostPopularComment.likes_count || 0} likes`}
                size="small"
                color="warning"
                icon={<LikeIcon />}
              />
            </Box>
            
            <Box display="flex" gap={2}>
              <Avatar
                src={mostPopularComment.user?.profile_picture}
                alt={mostPopularComment.user?.username}
                sx={{ width: 56, height: 56 }}
              >
                {mostPopularComment.user?.username?.charAt(0)}
              </Avatar>
              
              <Box flex={1}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600">
                      {mostPopularComment.user?.username || 'Anonymous'}
                    </Typography>
                    {mostPopularComment.user?.first_name && (
                      <Typography variant="body2" color="text.secondary">
                        {mostPopularComment.user.first_name} {mostPopularComment.user.last_name}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {mostPopularComment.created_at ? 
                        formatDistanceToNow(new Date(mostPopularComment.created_at), { addSuffix: true }) : ''}
                      {mostPopularComment.is_edited && ' (edited)'}
                    </Typography>
                  </Box>
                  
                  {/* Badge de médias */}
                  <CommentMediaBadges comment={mostPopularComment} />
                </Box>
                
                <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                  {mostPopularComment.content || 'No content'}
                </Typography>
                
                {/* Aperçu des médias */}
                <MediaPreview comment={mostPopularComment} />
                
                {/* Informations du post */}
                <Box mt={2} display="flex" alignItems="center" gap={2}>
                  {mostPopularComment.post_title && (
                    <Button
                      startIcon={<ArticleIcon />}
                      size="small"
                      variant="contained"
                      onClick={() => handleViewPost(mostPopularComment)}
                    >
                      View Post: {mostPopularComment.post_title.length > 40 ? 
                        `${mostPopularComment.post_title.substring(0, 40)}...` : mostPopularComment.post_title}
                    </Button>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    {mostPopularComment.reply_count || 0} repl{mostPopularComment.reply_count === 1 ? 'y' : 'ies'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Liste des commentaires */}
      {currentComments.length > 0 ? (
        <Stack spacing={3}>
          {currentComments.map((comment, index) => {
            const commentDate = comment.created_at ? new Date(comment.created_at) : null;
            const timeAgo = commentDate ? formatDistanceToNow(commentDate, { addSuffix: true }) : 'Recently';
            const formattedDate = commentDate ? format(commentDate, 'MMM dd, yyyy HH:mm') : '';
            const mediaTypes = detectCommentMediaTypes(comment);
            
            return (
              <Card 
                key={comment.id || index} 
                elevation={1}
                sx={{
                  borderLeft: comment.is_pinned ? `4px solid ${theme.palette.warning.main}` : 'none',
                  '&:hover': {
                    boxShadow: theme.shadows[2],
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" gap={2}>
                    {/* Avatar avec badge */}
                    <Box position="relative">
                      <Avatar
                        src={comment.user?.profile_picture}
                        alt={comment.user?.username}
                        sx={{ width: 48, height: 48 }}
                      >
                        {comment.user?.username?.charAt(0)}
                      </Avatar>
                      {comment.is_owner && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                          }}
                        >
                          ✓
                        </Box>
                      )}
                    </Box>
                    
                    {/* Contenu du commentaire */}
                    <Box flex={1}>
                      {/* En-tête */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="subtitle2" fontWeight="600">
                              {comment.user?.username || 'Anonymous'}
                            </Typography>
                            
                            {comment.is_pinned && (
                              <Tooltip title="Pinned comment">
                                <PinIcon fontSize="small" color="warning" />
                              </Tooltip>
                            )}
                            
                            {comment.is_post_owner && (
                              <Chip
                                label="Post Author"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20 }}
                              />
                            )}
                            
                            {comment.user_can_pin && comment.is_post_owner && (
                              <Chip
                                label="Can Pin"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 20 }}
                              />
                            )}
                            
                            <Typography variant="caption" color="text.secondary">
                              {formattedDate} • {timeAgo}
                              {comment.is_edited && ' (edited)'}
                            </Typography>
                          </Box>
                          
                          {comment.user?.first_name && (
                            <Typography variant="caption" color="text.secondary">
                              {comment.user.first_name} {comment.user.last_name}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* Menu d'actions - BOUTON SÉPARÉ */}
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleActionMenuOpen(e, comment)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      {/* Badges de médias */}
                      <CommentMediaBadges comment={comment} />
                      
                      {/* Texte du commentaire */}
                      <Typography variant="body1" paragraph sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                        {comment.content || 'No content available'}
                      </Typography>
                      
                      {/* Aperçu des médias */}
                      <MediaPreview comment={comment} />
                      
                      {/* Métadonnées et actions */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                        {/* Actions de base */}
                        <Stack direction="row" spacing={1}>
                          <Tooltip title={comment.has_liked ? "You liked this" : "Like"}>
                            <Button
                              size="small"
                              startIcon={<LikeIcon color={comment.has_liked ? "primary" : "action"} />}
                              sx={{ minWidth: 'auto' }}
                              onClick={() => handleLike(comment)}
                            >
                              {comment.likes_count || 0}
                            </Button>
                          </Tooltip>
                          
                          <Tooltip title="Reply">
                            <Button
                              size="small"
                              startIcon={<ReplyIcon />}
                              onClick={() => handleReply(comment)}
                            >
                              Reply
                            </Button>
                          </Tooltip>
                          
                          {(comment.reply_count || comment.replies_count || 0) > 0 && (
                            <Tooltip title={`${comment.reply_count || comment.replies_count || 0} replies`}>
                              <Button
                                size="small"
                                startIcon={<CommentIcon />}
                              >
                                {comment.reply_count || comment.replies_count || 0}
                              </Button>
                            </Tooltip>
                          )}
                        </Stack>
                        
                        {/* Informations du post */}
                        <Box display="flex" alignItems="center" gap={1}>
                          {comment.post_title && (
                            <Tooltip title="View post">
                              <Button
                                size="small"
                                startIcon={<ArticleIcon />}
                                onClick={() => handleViewPost(comment)}
                                variant="text"
                                sx={{ textTransform: 'none' }}
                              >
                                {comment.post_title.length > 30 ? 
                                  `${comment.post_title.substring(0, 30)}...` : comment.post_title}
                              </Button>
                            </Tooltip>
                          )}
                          
                          {comment.depth > 0 && (
                            <Chip
                              label={`Depth: ${comment.depth}`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 24 }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Réponses imbriquées */}
                      {comment.replies && comment.replies.length > 0 && (
                        <Box mt={2} pl={3} borderLeft={`2px solid ${theme.palette.divider}`}>
                          <Typography variant="caption" fontWeight="600" color="text.secondary" display="block" mb={1}>
                            {comment.replies.length} recent repl{comment.replies.length === 1 ? 'y' : 'ies'}:
                          </Typography>
                          <Stack spacing={1}>
                            {comment.replies.slice(0, 2).map((reply, replyIndex) => (
                              <Box key={replyIndex} display="flex" gap={1}>
                                <Avatar
                                  src={reply.user?.profile_picture}
                                  alt={reply.user?.username}
                                  sx={{ width: 24, height: 24 }}
                                >
                                  {reply.user?.username?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="caption" fontWeight="600">
                                    {reply.user?.username}:
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                    {reply.content?.length > 100 ? 
                                      `${reply.content.substring(0, 100)}...` : reply.content}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                            {comment.replies.length > 2 && (
                              <Typography variant="caption" color="text.secondary">
                                +{comment.replies.length - 2} more replies
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <Box textAlign="center" py={8}>
          <CommentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No comments found
          </Typography>
          <Typography variant="body2" color="text.disabled" paragraph>
            {searchQuery ? 'Try adjusting your search criteria' : 'Start engaging with posts by commenting'}
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {filteredAndSortedComments.length > 0 && (
        <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Showing {(currentPage - 1) * commentsPerPage + 1} to{' '}
            {Math.min(currentPage * commentsPerPage, filteredAndSortedComments.length)} of{' '}
            {filteredAndSortedComments.length} comments
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
              variant="outlined" 
              size="small"
            >
              Previous
            </Button>
            <Button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
              variant="contained" 
              size="small"
            >
              Next
            </Button>
          </Stack>
        </Box>
      )}

      {/* Menu d'actions - SÉPARÉ */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionMenuClose}
      >
    {/*
        {selectedComment?.is_owner && (
          <MenuItem onClick={() => handleEditComment(selectedComment)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
    */}
        
        <MenuItem onClick={() => handleReply(selectedComment)}>
          <ReplyIcon fontSize="small" sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        
 
          <MenuItem onClick={() => handleReply(selectedComment)}>
            <OpenInNewIcon fontSize="small" sx={{ mr: 1 }} />
            View Comment
          </MenuItem>
      
        
        {/* Option pour voir les médias */}
        {selectedComment && detectCommentMediaTypes(selectedComment).hasMedia && (
          <MenuItem onClick={() => {
            const mediaTypes = detectCommentMediaTypes(selectedComment);
            if (mediaTypes.mediaUrls.length > 0) {
              handleViewMedia(selectedComment, mediaTypes.mediaUrls[0]);
            }
            handleActionMenuClose();
          }}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            View Media
          </MenuItem>
        )}
        
        
        
        { /*\
        <Divider />
        <MenuItem onClick={() => handleReport(selectedComment)} sx={{ color: 'error.main' }}>
          <FlagIcon fontSize="small" sx={{ mr: 1 }} />
          Report
        </MenuItem>
        
        {(selectedComment?.is_owner || selectedComment?.user_can_pin) && (
          <MenuItem onClick={() => handleDeleteComment(selectedComment)} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
        */}
      </Menu>

      {/* Conseils */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Interactive Media:</strong> Click on video thumbnails to play, audio icons to listen, 
          and image previews to enlarge. Use media badges to quickly identify content types.
        </Typography>
      </Alert>
    </Box>
  );
};

export default RecentComments;
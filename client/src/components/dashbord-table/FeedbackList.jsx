// src/components/FeedbackList.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Avatar,
  IconButton,
  Stack,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Badge,
  Rating
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Lightbulb as LightbulbIcon,
  BugReport as BugReportIcon,
  Reply as ReplyIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  PersonOff as AnonymousIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Chat as ChatIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../../hooks/useAuth';

const FeedbackContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const StatsCard = styled(Card)(({ theme, color }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  borderLeft: `4px solid ${color}`,
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const FeedbackCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: theme.shadows[8],
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 500,
    minHeight: 48,
  },
}));

const FeedbackList = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    suggestions: 0,
    bugs: 0,
    unread: 0,
    averageRating: 0,
    helpfulCount: 0
  });
  const [replyDialog, setReplyDialog] = useState({
    open: false,
    feedbackId: null,
    content: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Utilise useRef pour suivre si le composant est monté
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    fetchFeedbacks();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      // Annule la requête en cours si le composant est démonté
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    filterFeedbacks();
  }, [feedbacks, activeFilter, searchTerm]);

  const fetchFeedbacks = async () => {
    // Annule la requête précédente s'il y en a une
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Crée un nouveau AbortController pour cette requête
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      
      // Récupère les feedbacks du backend avec signal d'annulation
      const response = await dashboardAPI.getFeedbacks({
        signal: abortControllerRef.current.signal
      });
      
      // Vérifie si le composant est toujours monté
      if (!isMounted.current) return;
      
      // Si l'API retourne un tableau directement
      let feedbacksData = [];
      if (Array.isArray(response.data)) {
        feedbacksData = response.data;
      } else if (response.data && Array.isArray(response.data.feedbacks)) {
        feedbacksData = response.data.feedbacks;
      } else if (response.data && response.data.results) {
        feedbacksData = response.data.results;
      } else if (response.data) {
        // Si c'est un objet unique, le met dans un tableau
        feedbacksData = [response.data];
      }
      
      console.log('Feedbacks data received:', feedbacksData);
      
      // Transforme les données du backend en format utilisable
      const transformedFeedbacks = feedbacksData.map(feedback => {
        // Détermine le type de feedback basé sur le rating
        let feedbackType = 'suggestion';
        if (feedback.rating >= 4) {
          feedbackType = 'positive';
        } else if (feedback.rating <= 2) {
          feedbackType = 'negative';
        }
        
        // Détermine la priorité
        let priority = 'low';
        if (feedback.rating <= 1 || (feedback.helpful_count && feedback.helpful_count > 10)) {
          priority = 'high';
        } else if (feedback.rating <= 2 || (feedback.helpful_count && feedback.helpful_count > 5)) {
          priority = 'medium';
        }
        
        // Récupère les informations de l'utilisateur
        const userData = feedback.user || feedback.professional || {};
        const senderName = userData.username || userData.first_name || 'Unknown User';
        
        return {
          id: feedback.id,
          sender: {
            username: senderName,
            email: userData.email || '',
            avatar: userData.first_name?.[0] || senderName[0] || 'U',
            first_name: userData.first_name,
            last_name: userData.last_name
          },
          feedback_type: feedbackType,
          content: feedback.comment || 'No comment provided',
          rating: feedback.rating || 0,
          helpful_count: feedback.helpful_count || 0,
          is_helpful: feedback.is_helpful || false,
          is_anonymous: !userData.username && !userData.first_name,
          created_at: feedback.created_at || new Date().toISOString(),
          is_read: feedback.is_read || false,
          priority: priority,
          // Champs originaux du modèle pour référence
          original_data: feedback
        };
      });
      
      // Trie par date (plus récent d'abord)
      transformedFeedbacks.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      // Calcule les statistiques
      const totalFeedbacks = transformedFeedbacks.length;
      const positiveCount = transformedFeedbacks.filter(f => f.feedback_type === 'positive').length;
      const negativeCount = transformedFeedbacks.filter(f => f.feedback_type === 'negative').length;
      const suggestionCount = transformedFeedbacks.filter(f => f.feedback_type === 'suggestion').length;
      
      const statsData = {
        total: totalFeedbacks,
        positive: positiveCount,
        negative: negativeCount,
        suggestions: suggestionCount,
        bugs: 0, // À adapter si tu as des rapports de bugs séparés
        unread: transformedFeedbacks.filter(f => !f.is_read).length,
        averageRating: totalFeedbacks > 0 
          ? transformedFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedbacks
          : 0,
        helpfulCount: transformedFeedbacks.reduce((sum, f) => sum + (f.helpful_count || 0), 0)
      };
      
      setFeedbacks(transformedFeedbacks);
      setStats(statsData);
      
    } catch (error) {
      // Ignore les erreurs d'annulation
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      
      console.error('Error fetching feedbacks:', error);
      
      if (isMounted.current) {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Failed to load feedbacks',
          severity: 'error'
        });
        
        // Fallback: données minimales si l'API échoue
        setFeedbacks([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const filterFeedbacks = () => {
    let filtered = [...feedbacks];
    
    // Applique le filtre de type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(f => f.feedback_type === activeFilter);
    }
    
    // Applique le filtre de recherche
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.sender?.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (f.sender?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (f.sender?.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (f.sender?.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredFeedbacks(filtered);
  };

  const getFeedbackTypeInfo = (type) => {
    switch(type) {
      case 'positive':
        return { 
          label: 'Positive', 
          icon: <ThumbUpIcon />, 
          color: '#10B981',
          bgColor: '#D1FAE5'
        };
      case 'negative':
        return { 
          label: 'Negative', 
          icon: <ThumbDownIcon />, 
          color: '#EF4444',
          bgColor: '#FEE2E2'
        };
      case 'suggestion':
        return { 
          label: 'Suggestion', 
          icon: <LightbulbIcon />, 
          color: '#F59E0B',
          bgColor: '#FEF3C7'
        };
      default:
        return { 
          label: 'Feedback', 
          icon: <ChatIcon />, 
          color: '#6366F1',
          bgColor: '#E0E7FF'
        };
    }
  };

  const getPriorityInfo = (priority) => {
    switch(priority) {
      case 'high':
        return { label: 'High', color: '#EF4444' };
      case 'medium':
        return { label: 'Medium', color: '#F59E0B' };
      case 'low':
        return { label: 'Low', color: '#10B981' };
      default:
        return { label: 'Low', color: '#10B981' };
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  const handleMarkAsHelpful = async (feedbackId) => {
    try {
      // Appel API pour marquer comme utile
      await dashboardAPI.markFeedbackHelpful(feedbackId);
      
      // Met à jour l'état local
      setFeedbacks(feedbacks.map(f => 
        f.id === feedbackId 
          ? { 
              ...f, 
              is_helpful: true,
              helpful_count: (f.helpful_count || 0) + 1 
            } 
          : f
      ));
      
      setSnackbar({
        open: true,
        message: 'Marked as helpful',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error marking feedback as helpful:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to mark as helpful',
        severity: 'error'
      });
    }
  };

  const handleMarkAsRead = async (feedbackId) => {
    try {
      // TODO: Implémenter l'API pour marquer comme lu
      setFeedbacks(feedbacks.map(f => 
        f.id === feedbackId ? { ...f, is_read: true } : f
      ));
      setSnackbar({
        open: true,
        message: 'Feedback marked as read',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark feedback as read',
        severity: 'error'
      });
    }
  };

  const handleReply = (feedbackId) => {
    setReplyDialog({
      open: true,
      feedbackId,
      content: ''
    });
  };

  const handleSendReply = async () => {
    try {
      // TODO: Implémenter l'API pour envoyer une réponse
      console.log('Sending reply to feedback:', replyDialog.feedbackId, replyDialog.content);
      setReplyDialog({ open: false, feedbackId: null, content: '' });
      setSnackbar({
        open: true,
        message: 'Reply sent successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send reply',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (feedbackId) => {
    try {
      // Appel API pour supprimer
      await dashboardAPI.deleteFeedback(feedbackId);
      
      setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
      setSnackbar({
        open: true,
        message: 'Feedback deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to delete feedback',
        severity: 'error'
      });
    }
  };

  const handleMarkAllAsRead = () => {
    setFeedbacks(feedbacks.map(f => ({ ...f, is_read: true })));
    setSnackbar({
      open: true,
      message: 'All feedbacks marked as read',
      severity: 'success'
    });
  };

  const statsCards = [
    {
      title: 'Total Feedback',
      value: stats.total,
      icon: <StarIcon />,
      color: '#6366F1',
      description: 'All feedback received'
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      icon: <FavoriteIcon />,
      color: '#EC4899',
      description: 'Average rating'
    },
    {
      title: 'Positive',
      value: stats.positive,
      icon: <ThumbUpIcon />,
      color: '#10B981',
      description: 'Positive feedback'
    },
    {
      title: 'Negative',
      value: stats.negative,
      icon: <ThumbDownIcon />,
      color: '#EF4444',
      description: 'Negative feedback'
    },
    {
      title: 'Suggestions',
      value: stats.suggestions,
      icon: <LightbulbIcon />,
      color: '#F59E0B',
      description: 'Feature suggestions'
    },
    {
      title: 'Helpful Marks',
      value: stats.helpfulCount,
      icon: <CheckIcon />,
      color: '#8B5CF6',
      description: 'Total helpful marks'
    }
  ];

  const filterTabs = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'positive', label: 'Positive', count: stats.positive },
    { value: 'negative', label: 'Negative', count: stats.negative },
    { value: 'suggestion', label: 'Suggestions', count: stats.suggestions }
  ];

  if (loading && feedbacks.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Loading Feedback...
        </Typography>
      </Box>
    );
  }

  return (
    <FeedbackContainer>
      <Container maxWidth="xl">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="600">
              Feedback & Reviews
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage user feedback and reviews
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<CheckIcon />}
              onClick={handleMarkAllAsRead}
              disabled={stats.unread === 0}
            >
              Mark All as Read
            </Button>
            <Button
              variant="contained"
              startIcon={<TrendingUpIcon />}
              onClick={fetchFeedbacks}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search feedback by content or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FilterIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Filter by:
                </Typography>
                <TextField
                  select
                  size="small"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                  <MenuItem value="suggestion">Suggestions</MenuItem>
                </TextField>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <StatsCard color={stat.color}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Avatar
                        sx={{
                          backgroundColor: `${stat.color}20`,
                          color: stat.color,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                    </Box>
                    <Box>
                      <Typography variant="h3" fontWeight="700">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {stat.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StatsCard>
            </Grid>
          ))}
        </Grid>

        {/* Filter Tabs */}
        <Paper sx={{ mb: 4, borderRadius: 2 }}>
          <StyledTabs
            value={activeFilter}
            onChange={(e, value) => setActiveFilter(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {filterTabs.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {tab.label}
                    <Chip
                      label={tab.count}
                      size="small"
                      sx={{ height: 20, fontSize: '0.75rem' }}
                    />
                  </Box>
                }
              />
            ))}
          </StyledTabs>
        </Paper>

        {/* Feedback List */}
        <Grid container spacing={3}>
          {filteredFeedbacks.length > 0 ? (
            filteredFeedbacks.map((feedback) => {
              const typeInfo = getFeedbackTypeInfo(feedback.feedback_type);
              const priorityInfo = getPriorityInfo(feedback.priority);
              const senderName = feedback.is_anonymous 
                ? 'Anonymous' 
                : feedback.sender?.username || 'Unknown User';
              
              return (
                <Grid item xs={12} key={feedback.id}>
                  <FeedbackCard elevation={2}>
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Badge
                              color="error"
                              variant="dot"
                              invisible={feedback.is_read}
                            >
                              <Avatar
                                sx={{
                                  backgroundColor: typeInfo.bgColor,
                                  color: typeInfo.color,
                                }}
                              >
                                {typeInfo.icon}
                              </Avatar>
                            </Badge>
                            <Box>
                              <Chip
                                label={typeInfo.label}
                                size="small"
                                sx={{
                                  backgroundColor: typeInfo.bgColor,
                                  color: typeInfo.color,
                                  fontWeight: 500,
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                {formatDate(feedback.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box display="flex" gap={1} alignItems="center">
                            <Chip
                              label={priorityInfo.label}
                              size="small"
                              sx={{
                                backgroundColor: `${priorityInfo.color}20`,
                                color: priorityInfo.color,
                                fontWeight: 500,
                              }}
                            />
                            {feedback.is_anonymous && (
                              <Chip
                                icon={<AnonymousIcon />}
                                label="Anonymous"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Sender Info and Rating */}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: feedback.is_anonymous ? 'grey.300' : 'primary.main',
                              }}
                            >
                              {feedback.is_anonymous ? (
                                <PersonIcon />
                              ) : (
                                feedback.sender?.avatar?.[0] || <PersonIcon />
                              )}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="500">
                                {senderName}
                              </Typography>
                              {!feedback.is_anonymous && feedback.sender?.email && (
                                <Typography variant="caption" color="text.secondary">
                                  {feedback.sender.email}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Rating
                              value={feedback.rating || 0}
                              readOnly
                              size="small"
                            />
                            <Chip
                              icon={<FavoriteIcon />}
                              label={feedback.helpful_count || 0}
                              size="small"
                              variant="outlined"
                              color={feedback.is_helpful ? "success" : "default"}
                            />
                          </Box>
                        </Box>

                        {/* Content */}
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {feedback.content}
                          </Typography>
                        </Paper>

                        {/* Actions */}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1}>
                            <Tooltip title={feedback.is_helpful ? "Already marked as helpful" : "Mark as helpful"}>
                              <IconButton
                                size="small"
                                onClick={() => handleMarkAsHelpful(feedback.id)}
                                disabled={feedback.is_helpful}
                                color={feedback.is_helpful ? "success" : "default"}
                              >
                                <FavoriteIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Mark as read">
                              <IconButton
                                size="small"
                                onClick={() => handleMarkAsRead(feedback.id)}
                                disabled={feedback.is_read}
                                color={feedback.is_read ? "default" : "primary"}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reply">
                              <IconButton
                                size="small"
                                onClick={() => handleReply(feedback.id)}
                                color="primary"
                              >
                                <ReplyIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          <Tooltip title="Delete feedback">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(feedback.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Stack>
                    </CardContent>
                  </FeedbackCard>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 8,
                  textAlign: 'center',
                  borderRadius: 2,
                }}
              >
                <StarIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Feedback Found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {searchTerm 
                    ? 'No feedback matches your search criteria'
                    : activeFilter !== 'all'
                      ? `No ${activeFilter} feedback available`
                      : 'You haven\'t received any feedback yet'}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Reply Dialog */}
        <Dialog
          open={replyDialog.open}
          onClose={() => setReplyDialog({ open: false, feedbackId: null, content: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reply to Feedback</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Your reply"
              fullWidth
              multiline
              rows={4}
              value={replyDialog.content}
              onChange={(e) => setReplyDialog({ ...replyDialog, content: e.target.value })}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setReplyDialog({ open: false, feedbackId: null, content: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              variant="contained"
              disabled={!replyDialog.content.trim()}
            >
              Send Reply
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </FeedbackContainer>
  );
};

export default FeedbackList;
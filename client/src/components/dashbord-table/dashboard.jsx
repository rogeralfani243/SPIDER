// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Avatar,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Divider,
  useTheme,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Report as ReportIcon,
  Comment as CommentIcon,
  Star as StarIcon,
  Groups as GroupsIcon,
  Create as CreateIcon,
  Email as EmailIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Notifications as ActivityIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  ThumbUp as ThumbUpIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  Cake as BirthdayIcon
} from '@mui/icons-material';
import {
  Language as LanguageIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import StatsCard from './StatsCard';
import ActivityFeed from './ActivityFeed';
import ProfileInfoCard from './ProfileInfoCard.jsx';
import ProfileStats from './ProfileStats.jsx';
import RecentPosts from './RecentPosts.jsx';
import DashboardMain from '../dashboard_main';
import RecentComments from './RecentComments.jsx';
import { profileAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import SettingsDashboard from './settings';
import ReportAccount from './ReportAccount.jsx';
import { useNavigate } from 'react-router-dom';
const DashboardContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
  paddingBottom: theme.spacing(4),
}));

const ProfileHeader = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  background: `linear-gradient(
  135deg,
  rgb(10, 10, 10),
  rgb(60, 10, 10),
  rgb(180, 20, 20),
  rgb(255, 0, 80)
); `,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius * 2,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url(/pattern.svg)',
    opacity: 0.1,
  }
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[4],
}));

const NavigationTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.95rem',
    minHeight: 48,
  },
}));

const StatsGrid = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const SectionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  flexDirection: 'column',
}));

const AchievementBadge = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '& .MuiChip-icon': {
    color: theme.palette.warning.main,
  }
}));

const Dashboard = () => {
  const theme = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
 const [localProfile, setLocalProfile] = useState();
    const location = useLocation();
  const tabLabels = [
    'Overview',
    'Activity',
    'Posts',
    'Comments',
    'Reports',
   // 'Statistics',
    'Settings'
  ];

  useEffect(() => {
    fetchProfileData();
  }, []);
 // EFFET POUR DÉTECTER SI ON DOIT OUVRIR L'ONGLET ACTIVITY
  useEffect(() => {
    // Vérifier si l'état de navigation contient openActivityTab
    if (location.state?.openActivityTab) {
      console.log('📢 Ouvrir automatiquement l\'onglet Activity');
      
      // Ouvrir l'onglet Activity (index 1)
      setActiveTab(1);
      
      // Optionnel: Faire défiler vers la section Activity après un court délai
      if (location.state?.scrollToActivity) {
        setTimeout(() => {
          const activitySection = document.getElementById('activity-section');
          if (activitySection) {
            activitySection.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 300);
      }
      
      // Nettoyer l'état de navigation pour éviter de rouvrir à chaque fois
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
const fetchProfileData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('Starting API calls...');
    
    const endpoints = [
      { name: 'profile', call: () => profileAPI.getProfileData() },
      { name: 'stats', call: () => profileAPI.getProfileStats() },
      { name: 'activity', call: () => profileAPI.getProfileActivity({ limit: 10 }) },
      { name: 'posts', call: () => profileAPI.getProfilePosts({ limit: 5 }) },
      { name: 'comments', call: () => profileAPI.getProfileComments({ limit: 5 }) },
    ];
    
    const results = {};
    for (const endpoint of endpoints) {
      try {
        console.log(`Fetching ${endpoint.name}...`);
        const response = await endpoint.call();
        results[endpoint.name] = response.data;
        console.log(`${endpoint.name} success:`, response.data);
      } catch (err) {
        console.error(`Error fetching ${endpoint.name}:`, err.response || err);
        results[endpoint.name] = null;
      }
    }
    
    // Traitement des résultats
    setProfileData(results.profile || {});
    setStats(results.stats || {});
    
    // Gérer les données d'activité
    const activityData = results.activity;
    if (activityData && activityData.activities) {
      setRecentActivity(activityData.activities);
    } else if (Array.isArray(activityData)) {
      setRecentActivity(activityData);
    } else {
      setRecentActivity([]);
    }
    
    // Gérer les posts
    const postsData = results.posts;
    if (postsData && postsData.posts) {
      setRecentPosts(postsData.posts);
    } else if (Array.isArray(postsData)) {
      setRecentPosts(postsData);
    } else {
      setRecentPosts([]);
    }
    
    // Gérer les commentaires
    const commentsData = results.comments;
    if (commentsData && commentsData.comments) {
      setRecentComments(commentsData.comments);
    } else if (Array.isArray(commentsData)) {
      setRecentComments(commentsData);
    } else {
      setRecentComments([]);
    }
    
    // Vérifier si toutes les données sont manquantes
    if (!results.profile && !results.stats && !results.activity && !results.posts && !results.comments) {
      setError('All API calls failed. Please check your network connection.');
    } else if (!results.profile) {
      setError('Failed to load profile data. Other data loaded.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    setError('Failed to load profile data. Please try again.');
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleEditProfile = () => {
    // Navigation vers l'édition du profil
    console.log('Edit profile');
  };

  if (loading && !refreshing) {
    return (
      <LoadingOverlay>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, color: theme.palette.primary.main }}>
          Loading Profile...
        </Typography>
      </LoadingOverlay>
    );
  }

  // Données sécurisées
  const safeProfile = profileData || {};
  const safeStats = stats || {};
  const user = safeProfile.user_info || {};
  const profile = safeProfile.profile || {};
  
  // Récupérer les statistiques de posts
  const postsStats = safeStats.posts || {};
  const commentsStats = safeStats.comments || {};
  const engagementStats = safeStats.engagement || {};
  const profileStats = safeStats.profile || {};

  // Statistiques du profil basées sur vos endpoints Django
  const profileStatsCards = [
    {
      title: 'Posts',
      value: postsStats.total || 0,
      icon: <CreateIcon />,
      color: '#4CAF50',
      trend: `${postsStats.this_week || 0} this week`,
      link: '#posts'
    },
    {
      title: 'Comments',
      value: commentsStats.total || 0,
      icon: <CommentIcon />,
      color: '#2196F3',
      trend: `${commentsStats.this_week || 0} this week`,
      link: '#comments'
    },
    {
      title: 'Today Posts',
      value: postsStats.today || 0,
      icon: <CalendarIcon />,
      color: '#FF9800',
      trend: 'Today',
      link: '#posts'
    },
    {
      title: 'Today Comments',
      value: commentsStats.today || 0,
      icon: <AccessTimeIcon />,
      color: '#9C27B0',
      trend: 'Today',
      link: '#comments'
    },
    {
      title: 'Rates Received',
      value: engagementStats.likes_received || 0,
      icon: <ThumbUpIcon />,
      color: '#E91E63',
      trend: 'Total Rates on your threads',
      link: '#likes'
    },

    {
      title: 'Profile Completion',
      value: `${profileStats.completion || 0}%`,
      icon: <BadgeIcon />,
      color: '#3F51B5',
      trend: 'Complete',
      link: '#profile'
    },
    {
      title: 'Account Age',
      value: safeStats.user?.account_age_days || 0,
      icon: <CalendarIcon />,
      color: '#FF5722',
      trend: 'days',
      link: '#account'
    },
  ];

  // Fonction utilitaire pour obtenir l'icône selon la plateforme (version agrandie)
  const getSocialIcon = (platform) => {
    const iconStyle = {
      fontSize: '2rem', // Taille augmentée
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'scale(1.1)',
      }
    };
    
    switch (platform) {
      case 'website': return <LanguageIcon sx={iconStyle} />;
      case 'github': return <GitHubIcon sx={iconStyle} />;
      case 'linkedin': return <LinkedInIcon sx={{ ...iconStyle, color: '#0077B5' }} />;
      case 'twitter': return <TwitterIcon sx={{ ...iconStyle, color: '#1DA1F2' }} />;
      case 'instagram': return <InstagramIcon sx={{ ...iconStyle, color: '#E4405F' }} />;
      case 'facebook': return <FacebookIcon sx={{ ...iconStyle, color: '#1877F2' }} />;
      case 'youtube': return <YouTubeIcon sx={{ ...iconStyle, color: '#FF0000' }} />;
      default: return <LinkIcon sx={iconStyle} />;
    }
  };
  
  // Fonction pour obtenir le label formaté de la plateforme
  const getPlatformLabel = (platform) => {
    const labels = {
      website: 'Website',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      twitter: 'Twitter',
      instagram: 'Instagram',
      facebook: 'Facebook',
      youtube: 'YouTube',
      other: 'Link'
    };
    return labels[platform] || platform;
  };

// Supprimez cette ligne :

// Modifiez la fonction getSocialLinksArray :
const getSocialLinksArray = () => {
  // Utilisez profile au lieu de localProfile
  if (!profile || !profile.social_links) return [];
  
  // Si social_links est déjà un tableau
  if (Array.isArray(profile.social_links)) {
    return profile.social_links;
  }
  
  // Si social_links est une chaîne JSON
  if (typeof profile.social_links === 'string') {
    try {
      const parsed = JSON.parse(profile.social_links);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing social_links JSON:', error);
      return [];
    }
  }
  
  return [];
};
  // Récupérer les liens sociaux en tant que tableau sûr
  const socialLinks = getSocialLinksArray();
  // Badges d'achèvement basés sur les données réelles
  const achievementBadges = [
    { 
      label: 'Active Poster', 
      icon: <CreateIcon />, 
      color: postsStats.total > 10 ? 'success' : 'default',
      condition: postsStats.total > 10
    },
    { 
      label: 'Top Commenter', 
      icon: <CommentIcon />, 
      color: commentsStats.total > 20 ? 'warning' : 'default',
      condition: commentsStats.total > 20
    },
    { 
      label: 'Engaged User', 
      icon: <ThumbUpIcon />, 
      color: engagementStats.likes_received > 50 ? 'primary' : 'default',
      condition: engagementStats.likes_received > 50
    },
    { 
      label: 'Profile Complete', 
      icon: <PersonIcon />, 
      color: profileStats.completion >= 100 ? 'success' : 'default',
      condition: profileStats.completion >= 100
    },
    { 
      label: 'This Week', 
      icon: <CalendarIcon />, 
      color: (postsStats.this_week > 0 || commentsStats.this_week > 0) ? 'info' : 'default',
      condition: postsStats.this_week > 0 || commentsStats.this_week > 0
    },
  ].filter(badge => badge.condition);
 
  const handleClickFeedbacksViewOnProfile = (profile) => {
    window.location.href = `/profile/${profile.id}`;
  };
  return (
      <>
      
    <DashboardContainer sx={{marginTop:'50px'}}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Profile Header */}
<ProfileHeader elevation={0}>
  <Box 
    display="flex" 
    flexDirection={{ xs: 'column', sm: 'row' }}
    justifyContent="space-between" 
    alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
    gap={{ xs: 3, sm: 0 }}
  >
    {/* Left section - Profile info */}
    <Box 
      display="flex" 
      flexDirection={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'center', sm: 'flex-start' }}
      gap={3}
      width={{ xs: '100%', sm: 'auto' }}
    >
      <Box position="relative" sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}>
        <ProfileAvatar
          src={profile.image_url || user.image || `/api/placeholder/120/120`}
          alt={user.username}
          sx={{
            width: { xs: 100, sm: 120, md: 140 },
            height: { xs: 100, sm: 120, md: 140 },
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
          }}
        >
          {!profile.image_url && user.username?.charAt(0).toUpperCase()}
        </ProfileAvatar>
        <Tooltip title="Edit Profile Picture">
        {/*
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        */}
        </Tooltip>
      </Box>
      
      <Box flex={1} width={{ xs: '100%', sm: 'auto' }}>
        {/* Name and status */}
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
          justifyContent={{ xs: 'center', sm: 'flex-start' }}
          gap={{ xs: 1, sm: 2 }}
          mb={{ xs: 2, sm: 1 }}
          textAlign={{ xs: 'center', sm: 'left' }}
        >
          <Typography 
            variant="h1" 
            fontWeight="700"
            sx={{
              fontSize: { 
                xs: '1.5rem',   // 24px sur mobile
                sm: '1.75rem',  // 28px sur tablette
                md: '2rem'  ,    // 32px sur desktop

              },
              color:'white',
              lineHeight: 1.2
            }}
          >
            {user.first_name || ''} {user.last_name || ''}
          </Typography>
          
    {/*
          <Chip 
            label="Premium" 
            size="small"
            sx={{ 
              alignSelf: { xs: 'center', sm: 'flex-start' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          />
    */}
        </Box>
        
        {/* Username */}
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          mb={2}
          textAlign={{ xs: 'center', sm: 'left' }}
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            opacity: 0.8,color:'white'
          }}
        >
          @{user.username}
        </Typography>
        
        {/* Profile details */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
          flexWrap="wrap"
          justifyContent={{ xs: 'center', sm: 'flex-start' }}
          sx={{ 
            '& > *': { 
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }
          }}
        >
          {profile.location && (
            <Box 
              display="flex" 
              alignItems="center"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              <LocationIcon fontSize="inherit" />
              <Typography variant="body2">
                {profile.location}
              </Typography>
            </Box>
          )}
          
           {/* SECTION DES LIENS SOCIAUX - VERSION ICÔNES SEULEMENT */}
                       {(socialLinks.length > 0 || profile.website) && (
                         <div className="social-links-icons-section">
                           <div className="social-icons-container">
                             {/* Afficher les liens sociaux du tableau */}
                             {socialLinks.map((link, index) => {
                               // S'assurer que link est un objet valide
                               if (!link || typeof link !== 'object' || !link.url) {
                                 console.warn('Invalid link object:', link);
                                 return null;
                               }
                               
                               const platform = link.platform || 'other';
                               const label = link.label || getPlatformLabel(platform);
                               
                               return (
                                 <Tooltip 
                                   key={index} 
                                   title={label} 
                                   placement="bottom"
                                   arrow
                                 >
                                   <IconButton
                                     component="a"
                                     href={link.url}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="social-icon-button"
                                     sx={{
                                       mx: 1,
                                       transition: 'all 0.3s ease',
                                       '&:hover': {
                                         transform: 'translateY(-3px)',
                                         backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                       }
                                     }}
                                   >
                                     {getSocialIcon(platform)}
                                   </IconButton>
                                 </Tooltip>
                               );
                             })}
                             
                             {/* Fallback pour l'ancien champ website (si pas déjà dans socialLinks) */}
                             {profile.website && !socialLinks.some(link => link.platform === 'website') && (
                               <Tooltip 
                                 title="Website" 
                                 placement="bottom"
                                 arrow
                               >
                                 <IconButton
                                   component="a"
                                   href={[profile].website}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="social-icon-button"
                                   sx={{
                                     mx: 1,
                                     transition: 'all 0.3s ease',
                                     '&:hover': {
                                       transform: 'translateY(-3px)',
                                       backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                     }
                                   }}
                                 >
                                   <LanguageIcon sx={{ fontSize: '2rem' }} />
                                 </IconButton>
                               </Tooltip>
                             )}
                           </div>
                         </div>
                       )}
          
          {profile.birth_date && (
            <Box 
              display="flex" 
              alignItems="center"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              <BirthdayIcon fontSize="inherit" />
              <Typography variant="body2">
                {new Date(profile.birth_date).toLocaleDateString()}
              </Typography>
            </Box>
          )}
          
          <Box 
            display="flex" 
            alignItems="center"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            <CalendarIcon fontSize="inherit" />
            <Typography variant="body2">
              Joined {user.date_joined ? formatDistanceToNow(new Date(user.date_joined), { addSuffix: true }) : 'recently'}
            </Typography>
          </Box>
          
          {user.last_login && (
            <Box 
              display="flex" 
              alignItems="center"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              <AccessTimeIcon fontSize="inherit" />
              <Typography variant="body2">
                Last active {formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
    
    {/* Right section - Actions */}
    <Stack 
      direction="row" 
      spacing={2} 
      alignItems="center"
      justifyContent={{ xs: 'center', sm: 'flex-end' }}
      width={{ xs: '100%', sm: 'auto' }}
      mt={{ xs: 2, sm: 0 }}
    >
      <ActionButton
        variant="contained"
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        disabled={refreshing}
        size="medium"
        sx={{
          minWidth: { xs: '140px', sm: 'auto' }
        }}
      >
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </ActionButton>
      
    
    </Stack>
  </Box>
  
  {/* Achievement Badges */}
  {/*
  {achievementBadges.length > 0 && (
    <Box sx={{ mt: 3, width: '100%' }}>
      <Typography 
        variant="subtitle2" 
        fontWeight="600" 
        sx={{ 
          mb: 1, 
          opacity: 0.9,
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        ACHIEVEMENTS
      </Typography>
      <Box 
        display="flex" 
        flexWrap="wrap"
        gap={1}
        justifyContent={{ xs: 'center', sm: 'flex-start' }}
      >
        {achievementBadges.map((badge, index) => (
          <AchievementBadge
            key={index}
            icon={badge.icon}
            label={badge.label}
            color={badge.color}
            variant="outlined"
            size="small"
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.3)', 
              color: 'white',
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          />
        ))}
      </Box>
    </Box>
  )}
  */}
</ProfileHeader>

        {/* Navigation Tabs */}
        <NavigationTabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabLabels.map((label, index) => (
            <Tab 
              key={index} 
              label={label} 
              sx={{ 
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                }
              }}
            />
          ))}
        </NavigationTabs>

        {/* Main Content */}
        {activeTab === 0 && (
          <>
            {/* Statistics Cards */}
            <StatsGrid container spacing={3}>
              {profileStatsCards.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <StatsCard {...stat} loading={refreshing} />
                </Grid>
              ))}
            </StatsGrid>

            {/* Profile Overview Grid */}
            <Grid container spacing={3}>
              {/* Left Column - Profile Info & Activity */}
              <Grid item xs={12} lg={8}>
                <Stack spacing={3}>
                  {/* Recent Activity */}
                  <SectionCard>
                    <CardHeader
                      title={
                        <Typography variant="h6" fontWeight="600">
                          Recent Activity
                        </Typography>
                      }
                      avatar={<ActivityIcon color="primary" />}
                      action={
                        <Button 
                          size="small" 
                          onClick={() => setActiveTab(1)}
                        >
                          View All
                        </Button>
                      }
                    />
                    <Divider />
                    <CardContent sx={{ p: 0 }}>
                      <ActivityFeed 
                        activities={Array.isArray(recentActivity) ? recentActivity.slice(0, 5) : []} 
                        loading={refreshing}
                        handleClickFeedbacksViewOnProfile={handleClickFeedbacksViewOnProfile}
                      />
                    </CardContent>
                  </SectionCard>

                  {/* Profile Information */}
                  <SectionCard>
                    <CardHeader
                      title={
                        <Typography variant="h6" fontWeight="600">
                          Profile Information
                        </Typography>
                      }
                      avatar={<PersonIcon color="primary" />}
                    />
                    <Divider />
                    <CardContent>
                      <ProfileInfoCard 
                        user={user}
                        profile={profile}
                        stats={safeStats}
                      />
                    </CardContent>
                  </SectionCard>
                </Stack>
              </Grid>

              {/* Right Column - Quick Stats & Recent Content */}
              <Grid item xs={12} lg={4}>
                <Stack spacing={3}>
                  {/* Engagement Stats */}
                  <SectionCard>
                    <CardHeader
                      title={
                        <Typography variant="h6" fontWeight="600">
                          Engagement Stats
                        </Typography>
                      }
                      avatar={<TrendingUpIcon color="success" />}
                    />
                    <Divider />
                    <CardContent>
                      <Stack spacing={2}>
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Post Engagement Rate
                            </Typography>
                            <Typography variant="body2" fontWeight="500">
                              {engagementStats.engagement_rate || 0}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={engagementStats.engagement_rate || 0}
                            color="primary"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Profile Completion
                            </Typography>
                            <Typography variant="body2" fontWeight="500">
                              {profileStats.completion || 0}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={profileStats.completion || 0}
                            color="secondary"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Post Activity
                            </Typography>
                            <Typography variant="body2" fontWeight="500">
                              {postsStats.this_week || 0} this week
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min((postsStats.this_week || 0) * 10, 100)}
                            color="info"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </SectionCard>

                  {/* Recent Posts Preview */}
                  <SectionCard>
                    <CardHeader
                      title={
                        <Typography variant="h6" fontWeight="600">
                          Recent Posts
                        </Typography>
                      }
                      avatar={<CreateIcon color="primary" />}
                      action={
                        <Button 
                          size="small" 
                          onClick={() => setActiveTab(2)}
                        >
                          View All
                        </Button>
                      }
                    />
                    <Divider />
                    <CardContent>
                      {recentPosts.length > 0 ? (
                        <Stack spacing={1}>
                          {recentPosts.slice(0, 3).map((post, index) => (
                            <Box key={post.id || index} sx={{ p: 1.5, borderBottom: '1px solid #eee' }}>
                              <Typography variant="body2" fontWeight="500" noWrap>
                                {post.title || post.content?.substring(0, 30) || 'Untitled Post'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                              </Typography>
                              <Box display="flex" justifyContent="space-between" mt={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                  {post.likes_count || post.likes || 0} likes
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {post.comments_count || 0} comments
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" align="center">
                          No posts yet
                        </Typography>
                      )}
                    </CardContent>
                  </SectionCard>

                  {/* Recent Comments Preview */}
                  <SectionCard>
                    <CardHeader
                      title={
                        <Typography variant="h6" fontWeight="600">
                          Recent Comments
                        </Typography>
                      }
                      avatar={<CommentIcon color="primary" />}
                      action={
                        <Button 
                          size="small" 
                          onClick={() => setActiveTab(3)}
                        >
                          View All
                        </Button>
                      }
                    />
                    <Divider />
                    <CardContent>
                      {recentComments.length > 0 ? (
                        <Stack spacing={1}>
                          {recentComments.slice(0, 3).map((comment, index) => (
                            <Box key={comment.id || index} sx={{ p: 1.5, borderBottom: '1px solid #eee' }}>
                              <Typography variant="body2" noWrap>
                                "{comment.content?.substring(0, 60) || 'No content'}..."
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                On: {comment.post_title || 'a post'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" align="center">
                          No comments yet
                        </Typography>
                      )}
                    </CardContent>
                  </SectionCard>
                </Stack>
              </Grid>
            </Grid>
          </>
        )}

        {activeTab === 1 && (
          <SectionCard  id="activity-section">
            <CardHeader
              title={
                <Typography variant="h5" fontWeight="600">
                  All Activity
                </Typography>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <ActivityFeed 
                activities={Array.isArray(recentActivity) ? recentActivity : []} 
                loading={refreshing}
                showAll={true}
                handleClickFeedbacksViewOnProfile= {() => window.location.href = `/profile/${profile.id}`}
              />
            </CardContent>
          </SectionCard>
        )}

        {activeTab === 2 && (
          <RecentPosts 
            posts={recentPosts} 
            total={profileData?.posts?.total || postsStats.total || 0}
          />
        )}
        
        {activeTab === 3 && (
          <RecentComments 
            comments={recentComments} 
            total={profileData?.comments?.total || commentsStats.total || 0}
          />
        )}
        {activeTab === 4 && (
  <SectionCard>
    <CardHeader
      title={
        <Typography variant="h5" fontWeight="600">
          My Reports
        </Typography>
      }
      subheader="Track your reported content and their status"
    />
    <Divider />
    <CardContent>
  <ReportAccount />
    </CardContent>
  </SectionCard>
)}
  {/*
        {activeTab === 5 && (
          <ProfileStats 
            stats={safeStats} 
            chartData={profileData?.charts || {}}
          />
        )}
        
  */}

{activeTab === 5 && (
  <SectionCard>
    <CardHeader
      title={
        <Typography variant="h5" fontWeight="600">
          Profile Settings
        </Typography>
      }
    />
    <CardContent>
      {/* Important: Passer les props nécessaires au SettingsDashboard */}
      <SettingsDashboard 
        onDeleteAccountClick={() => {
          // Forcer l'ouverture de la section delete account
          const event = new CustomEvent('open-delete-account');
          window.dispatchEvent(event);
        }}
      />
    </CardContent>
  </SectionCard>
)}


      </Container>

      {/* Snackbar for errors */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Refreshing overlay */}
      {refreshing && (
        <LoadingOverlay>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
            Updating profile data...
          </Typography>
        </LoadingOverlay>
      )}
    </DashboardContainer>
      </>
  );
};

export default Dashboard;
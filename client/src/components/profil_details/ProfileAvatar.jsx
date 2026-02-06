import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  Box, 
  Typography, 
  Chip, 
  Stack, 
  Tooltip, 
  Paper, 
  Grid, 
  LinearProgress,
  IconButton,
  Fade,
  Collapse
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import '../../styles/profil_avatar.css';
import useParamDrag from '../../utils/useDrag';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PublicIcon from '@mui/icons-material/Public';
import CategoryIcon from '@mui/icons-material/Category';
import FlagIcon from '@mui/icons-material/Flag';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import RateReviewIcon from '@mui/icons-material/RateReview';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import URL from '../../hooks/useUrl';
import Avatar from '@mui/material';
const ProfileAvatar = ({ profile, isTop100, top100Rank }) => {
  console.log('📸 Profile data in ProfileAvatar:', profile);
  
  const [rankings, setRankings] = useState(null);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showRankings, setShowRankings] = useState(true);
  
  const getInitials = (profile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    } else if (profile.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    } else if (profile.last_name) {
      return profile.last_name.charAt(0).toUpperCase();
    } else {
      return profile.username.substring(0, 2).toUpperCase();
    }
  };
  
  const blockParam = useParamDrag();
  
  const fetchRankings = async (profileId) => {
    if (!profileId) return;
    
    setLoadingRankings(true);
    try {
      const response = await fetch(`${URL}/api/rankings/profile/${profileId}/`);
      if (response.ok) {
        const data = await response.json();
        setRankings(data);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoadingRankings(false);
    }
  };
  
  useEffect(() => {
    if (profile?.id) {
      fetchRankings(profile.id);
    }
  }, [profile?.id]);
  
  const getAvatarColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  const openImageModal = (imageType) => {
    setSelectedImage(imageType);
    setImageModalOpen(true);
  };
  
  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    if (rank <= 10) return '#4CAF50';
    if (rank <= 50) return '#2196F3';
    if (rank <= 100) return '#9C27B0';
    return '#757575';
  };
  
  const formatRank = (rank) => {
    if (!rank) return 'N/A';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = rank % 100;
    return rank + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const getRankProgress = (rank, total) => {
    if (!rank || !total || total === 0) return 0;
    return Math.max(0, Math.min(100, ((total - rank + 1) / total) * 100));
  };

  return (
    <div className="profile-avatar-section">
      {/* Container pour image_bio avec les classements intégrés */}
      <div 
        className="profile-image-bio-container"
        style={{ position: 'relative', marginBottom: '2em' }}
      >
        {profile.image_bio ? (
          <>
            <img
             loading="lazy"
              src={profile.image_bio} 
              alt={`Profile of ${profile.first_name || profile.username}`}
              className="profile-image-bio"
              onClick={() => openImageModal('bio')}
              style={{ cursor: 'pointer' }}
               decoding="async"
            />
            
            {/* Overlay des classements en bas de l'image_bio */}
            {rankings && (
              <Fade in={showRankings}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    color: 'white',
                    padding: '20px 16px 8px',
                    paddingBottom:'3em',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px',
                    '@media(max-width:1000px)':{
                      paddingBottom:'7em'
                    }
                  }}
                >
                  <Grid container spacing={1}>
                    {/* Global Ranking - Toujours visible */}

                    
                    {/* Autres classements - Visible quand développé */}
                    <Collapse in={showRankings} timeout="auto">
                      <Grid item xs={12}>
                        <Box container  sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 1,
        mt: 1, 
 '@media(min-width:946px)':{ gridTemplateColumns: 'repeat(1, 1fr)',}
      }}>
                          {/* Category */}
                          {rankings.category?.rank && (
                            <Grid item xs={6}>
                              <Tooltip title={rankings.category.name}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CategoryIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                      Category
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={`#${formatRank(rankings.category.rank)}`}
                                    size="small"
                                    sx={{ 
                                      bgcolor: '#4CAF50',
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      height: 20,
                                        border:'none'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}
                          
                          {/* Country */}
                          {rankings.country?.rank && (
                            <Grid item xs={6}>
                              <Tooltip title={rankings.country.name}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FlagIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                      Country
                                    </Typography>
                                 
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.6rem',wordBreak:'keep-all',maxWidth:'80px' }}>
                      {rankings.country.name}
                    </Typography>
                                  </Box>
                                  <Chip
                                    label={`#${formatRank(rankings.country.rank)}`}
                                    size="small"
                                    sx={{ 
                                      bgcolor: '#2196F3',
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      height: 20,
                                      border:'none'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}
                          
                          {/* City */}
                          {rankings.city?.rank && (
                            <Grid item xs={6}>
                              <Tooltip title={rankings.city.name}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationCityIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                      City
                                    </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.6rem', wordBreak:'keep-all',maxWidth:'80px' }}>
                      {rankings.city.name}
                    </Typography>
                                  </Box>
                                  <Chip
                                    label={`#${formatRank(rankings.city.rank)}`}
                                    size="small"
                                    sx={{ 
                                      bgcolor: '#9C27B0',
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      height: 20,
                                        border:'none'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}
                          
                          {/* Badges */}
                          {rankings.badges && rankings.badges.length > 0 && (
                            <Grid item xs={6}>
                              <Tooltip title="Achievements">
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1,
                                  gap: 0.5
                                }}>
                                  <EmojiEventsIcon fontSize="small" />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                    {rankings.badges.length} badges
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}

                           {profile.username ? (
                            <Grid item xs={6}>
                              <Tooltip title="Achievements">
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1,
                                  gap: 0.5
                                }}>
                                  <PersonIcon  fontSize="small" />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                    @ {profile.username}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Grid>
                          ): null}
                        </Box>
                        
                                           </Grid>
                    </Collapse>
                    
                    {/* Bouton pour développer/réduire */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => setShowRankings(!showRankings)}
                          sx={{ 
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                          }}
                        >
                          {showRankings ? 
                            <KeyboardArrowUpIcon fontSize="small" /> : 
                            <KeyboardArrowDownIcon fontSize="small" />
                          }
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Fade>
            )}
          </>
        ) : (<>

             <img
              src={profile.image_bio} 
     className="profile-image-bio"
              onClick={() => openImageModal('bio')}
              style={{ cursor: 'pointer' , backgroundColor:'red'}}
              
            />
          {/* Overlay des classements en bas de l'image_bio */}
            {rankings && (
              <Fade in={showRankings}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8) 70%)',
                    color: 'white',
                    padding: '20px 16px 80px',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px',
                  }}
                >
                  <Grid container spacing={1}>
                    {/* Global Ranking - Toujours visible */}

                    
                    {/* Autres classements - Visible quand développé */}
                                   <Collapse in={showRankings} timeout="auto">
                      <Grid item xs={12}>
                        <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 1,
        mt: 1,
         '@media(min-width:946px)':{ gridTemplateColumns: 'repeat(1, 1fr)',}
   
      }}>
                          {/* Category */}
                          {rankings.category?.rank && (
                            <Grid item xs={6}>
                              <Tooltip title={rankings.category.name}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CategoryIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                      Category
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={`#${formatRank(rankings.category.rank)}`}
                                    size="small"
                                    sx={{ 
                                      bgcolor: '#4CAF50',
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      height: 20,
                                        border:'none'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}
                          
                          {/* Country */}
                          {rankings.country?.rank && (
                            <Grid item xs={6}>
                              <Tooltip title={rankings.country.name}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FlagIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                      Country
                                    </Typography>
                                 
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.6rem',wordBreak:'keep-all',maxWidth:'80px' }}>
                      {rankings.country.name}
                    </Typography>
                                  </Box>
                                  <Chip
                                    label={`#${formatRank(rankings.country.rank)}`}
                                    size="small"
                                    sx={{ 
                                      bgcolor: '#2196F3',
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      height: 20,
                                      border:'none'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}
                          
                          {/* City */}
                          {rankings.city?.rank && (
                            <Grid item xs={6}>
                              <Tooltip title={rankings.city.name}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationCityIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                      City
                                    </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.6rem', wordBreak:'keep-all',maxWidth:'80px' }}>
                      {rankings.city.name}
                    </Typography>
                                  </Box>
                                  <Chip
                                    label={`#${formatRank(rankings.city.rank)}`}
                                    size="small"
                                    sx={{ 
                                      bgcolor: '#9C27B0',
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      height: 20,
                                        border:'none'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}
                          
                          {/* Badges */}
                          {rankings.badges && rankings.badges.length > 0 && (
                            <Grid item xs={6}>
                              <Tooltip title="Achievements">
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1,
                                  gap: 0.5
                                }}>
                                  <EmojiEventsIcon fontSize="small" />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                    {rankings.badges.length} badges
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}


           {profile.username ? (
                            <Grid item xs={6}>
                              <Tooltip title="Achievements">
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  p: 1,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 1,
                                  gap: 0.5
                                }}>
                                  <PersonIcon  fontSize="small" />
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                    @ {profile.username}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Grid>
                          ): null}
                        </Box>
                        
                      
                      </Grid>
                    </Collapse>                    
                    {/* Bouton pour développer/réduire */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => setShowRankings(!showRankings)}
                          sx={{ 
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                          }}
                        >
                          {showRankings ? 
                            <KeyboardArrowUpIcon fontSize="small" /> : 
                            <KeyboardArrowDownIcon fontSize="small" />
                          }
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Fade>
            )}

        </>)}
      </div>
      
      {/* Modal pour l'image */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <div style={{ background: 'black' }}>
          <div className="modal-image-container">
            <img
              src={selectedImage === 'avatar' ? profile.image : profile.image_bio} 
              alt={`Profile of ${profile.first_name || profile.username}`}
              style={{
                userSelect: 'none',
                pointerEvents: 'none',
                width: '100%',
                height: 'auto',
              }}
              onContextMenu={(e) => e.preventDefault()}
              draggable="false"
            />
          </div>
        </div>
      </Dialog>
      
      {/* Section avatar et initiales */}
      <div className="avatar-content-wrapper">
        <div className="avatar-wrapper">
          {profile.image ? (
            <img 
              src={profile.image} 
              alt={`Profile of ${profile.first_name || profile.username}`}
              className="profile-detail-image"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.nextSibling;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
              style={{ cursor: 'pointer' }}
              onClick={() => openImageModal('avatar')}
            />
          ) : null}
          
          <div 
            className="profile-detail-initials"
            style={{ 
              backgroundColor: getAvatarColor(profile.first_name || profile.last_name || profile.username),
              display: profile.image ? 'none' : 'flex'
            }}
            {...blockParam}
          >
            {getInitials(profile)}
          </div>
        </div>

        {/* Badge Top 100 avec icône React */}
       
       
        {/* Chargement
        {loadingRankings && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
           .</Typography>
            <LinearProgress sx={{ mt: 1, width: 200, mx: 'auto' }} />
          </Box>
        )}
        */}
        
      </div>
    </div>
  );
};

export default ProfileAvatar;
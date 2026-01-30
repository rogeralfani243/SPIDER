// src/components/groups/GroupMainContent.jsx
import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Box,
  Typography,
  Button,
  Paper,
  AvatarGroup,
  Tooltip,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  Rule as RuleIcon,
  Message as MessageIcon,
  CalendarToday as CalendarIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Tag as TagIcon,
} from '@mui/icons-material';

const GroupMainContent = ({
  group,
  allMembers,
  isMember,
  isPublicGroup,
  showFullDescription,
  setShowFullDescription,
  getRatingDistribution,
  getMyFeedback,
  handleContactAdmin,
  setFeedbackDialogOpen,
  isAuthenticated,
  navigate,
  id,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const description = group?.description || '';
  const truncatedDescription = useMemo(() => {
    const maxLength = isSmallMobile ? 150 : isMobile ? 200 : 300;
    return description.length > maxLength && !showFullDescription 
      ? `${description.substring(0, maxLength)}...` 
      : description;
  }, [description, showFullDescription, isMobile, isSmallMobile]);

  const parsedTags = useMemo(() => {
    if (!group.tags) return [];
    
    if (Array.isArray(group.tags)) {
      return group.tags;
    }
    
    if (typeof group.tags === 'string') {
      try {
        const parsed = JSON.parse(group.tags);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        return group.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }
    
    return [];
  }, [group.tags]);

  return (
    <Card sx={{ 
      mb: 3, 
      borderRadius: { xs: 1, sm: 2 },
      boxShadow: { xs: 0, sm: 1 }
    }}>
      <CardContent sx={{ 
        p: { xs: 2, sm: 3 },
        '&:last-child': { pb: { xs: 2, sm: 3 } }
      }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} lg={8}>
            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                About this Group
              </Typography>
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  whiteSpace: 'pre-line',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: 1.6
                }}
              >
                {truncatedDescription}
                {description.length > (isSmallMobile ? 150 : isMobile ? 200 : 300) && (
                  <Button
                    size="small"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    sx={{ 
                      ml: 1,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      minWidth: 'auto'
                    }}
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </Typography>
            </Box>
            
            {/* Stats */}
            <StatsSection 
              group={group} 
              allMembers={allMembers} 
              isMobile={isMobile}
            />
            
            {/* Members Preview */}
            {allMembers.length > 0 && (
              <MembersPreviewSection 
                allMembers={allMembers} 
                isMember={isMember} 
                isPublicGroup={isPublicGroup}
                isMobile={isMobile}
              />
            )}
            
            {/* Tags */}
            {parsedTags.length > 0 && (
              <TagsSection tags={parsedTags} isMobile={isMobile} />
            )}
          </Grid>
          
          {/* Right Column - Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Rating Distribution */}
            <RatingDistributionSection 
              group={group} 
              getRatingDistribution={getRatingDistribution}
              getMyFeedback={getMyFeedback}
              setFeedbackDialogOpen={setFeedbackDialogOpen}
              isAuthenticated={isAuthenticated}
              navigate={navigate}
              id={id}
              isMember={isMember}
              isMobile={isMobile}
            />
            
            {/* Quick Info */}
            <QuickInfoSection 
              group={group} 
              isPublicGroup={isPublicGroup} 
              handleContactAdmin={handleContactAdmin}
              isMobile={isMobile}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Sous-composants avec props responsive

const StatsSection = ({ group, allMembers, isMobile }) => (
  <Paper elevation={0} sx={{ 
    p: { xs: 1.5, sm: 2 }, 
    mb: 3, 
    backgroundColor: 'grey.50', 
    borderRadius: 2 
  }}>
    <Grid container spacing={isMobile ? 1 : 2}>
      {/* Chaque stat box avec taille responsive */}
      {[
        { icon: <PeopleIcon />, value: allMembers.length || 0, label: 'Members', 
          sublabel: group.max_participants && `of ${group.max_participants} max`, color: 'primary.main' },
        { icon: <StarIcon />, value: (group.average_rating || 0).toFixed(1), label: 'Average Rating',
          sublabel: `(${group.total_reviews || 0} reviews)`, color: '#ffc107' },
        { icon: <LocationIcon />, value: group.location || 'Online', label: 'Location',
          sublabel: null, color: 'success.main' },
        { icon: group.requires_approval ? <LockIcon /> : <PublicIcon />, 
          value: group.requires_approval ? 'Approval Required' : 'Open Join', 
          label: 'Access', sublabel: null, 
          color: group.requires_approval ? 'warning.main' : 'success.main' },
      ].map((stat, index) => (
        <Grid item xs={6} sm={3} key={index}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ 
              fontSize: { xs: 24, sm: 32 }, 
              color: stat.color, 
              mb: 0.5,
              display: 'flex',
              justifyContent: 'center'
            }}>
              {stat.icon}
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold">
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stat.label}
            </Typography>
            {stat.sublabel && (
              <Typography variant="caption" display="block" color="text.secondary">
                {stat.sublabel}
              </Typography>
            )}
          </Box>
        </Grid>
      ))}
    </Grid>
  </Paper>
);

const MembersPreviewSection = ({ allMembers, isMember, isPublicGroup, isMobile }) => (
  <Paper elevation={0} sx={{ 
    p: { xs: 1.5, sm: 2 }, 
    mb: 3, 
    backgroundColor: 'grey.50', 
    borderRadius: 2 
  }}>
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mb: 2,
      flexDirection: { xs: 'column', sm: 'row' },
      alignItems: { xs: 'flex-start', sm: 'center' }
    }}>
      <Typography variant="subtitle2" color="text.secondary">
        MEMBERS PREVIEW
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: { xs: 0.5, sm: 0 } }}>
        {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
      </Typography>
    </Box>
    
    <AvatarGroup 
      max={isMobile ? 4 : 6}
      sx={{ 
        justifyContent: 'flex-start',
        '& .MuiAvatar-root': {
          width: { xs: 32, sm: 40 },
          height: { xs: 32, sm: 40 },
          fontSize: { xs: '0.75rem', sm: '1rem' }
        }
      }}
    >
      {allMembers.slice(0, 12).map((member) => (
        <Tooltip
          key={member.id || member.user?.id}
          title={`${member.user?.username || 'Unknown'} ${member.role === 'owner' || member.role === 'admin' ? `(${member.role})` : ''}`}
        >
          <Avatar
            src={member.user?.profile_image}
            sx={{ 
              border: member.role === 'owner' ? '2px solid #ff6b6b' :
                      member.role === 'admin' ? '2px solid #4ecdc4' : '2px solid white'
            }}
          >
            {(member.user?.username?.charAt(0) || '?').toUpperCase()}
          </Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
    
    {!isMember && isPublicGroup && (
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          mt: 1, 
          display: 'block',
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          lineHeight: 1.4
        }}
      >
        Join the group to see all {allMembers.length} members and access the chat.
      </Typography>
    )}
  </Paper>
);
const TagsSection = ({ tags, isMobile }) => {
  // DEBUG IMPORTANT
  console.log('🔍 TAGS SECTION - Input tags:', tags);
  console.log('🔍 TAGS SECTION - Type:', typeof tags);
  console.log('🔍 TAGS SECTION - Is array?', Array.isArray(tags));
  console.log('🔍 TAGS SECTION - Length:', Array.isArray(tags) ? tags.length : 'N/A');
  
  if (Array.isArray(tags)) {
    console.log('🔍 TAGS SECTION - First item:', tags[0]);
    console.log('🔍 TAGS SECTION - First item type:', typeof tags[0]);
    
    // Vérifier si le premier élément est encore une string JSON
    if (tags.length === 1 && typeof tags[0] === 'string' && tags[0].startsWith('[')) {
      console.log('⚠️ TAGS SECTION - First item looks like JSON string');
    }
  }

  // Fonction pour nettoyer définitivement
  const cleanTags = useMemo(() => {
    if (!tags) return [];
    
    console.log('🧹 Cleaning tags:', tags);
    
    // Si tags est un tableau
    if (Array.isArray(tags)) {
      const result = [];
      
      for (let i = 0; i < tags.length; i++) {
        const item = tags[i];
        console.log(`  Processing item ${i}:`, item, 'type:', typeof item);
        
        if (item === null || item === undefined) continue;
        
        // Convertir en string
        let itemStr = String(item).trim();
        
        // Si c'est encore une string JSON
        if (itemStr.startsWith('[') && itemStr.endsWith(']')) {
          console.log(`    Item ${i} looks like JSON, trying to parse`);
          try {
            const parsed = JSON.parse(itemStr);
            console.log(`    Parsed:`, parsed);
            
            if (Array.isArray(parsed)) {
              // Si c'est un tableau, ajouter tous ses éléments
              parsed.forEach(parsedItem => {
                if (parsedItem !== null && parsedItem !== undefined) {
                  const cleanItem = String(parsedItem).trim();
                  if (cleanItem) result.push(cleanItem);
                }
              });
            } else {
              // Si c'est un élément simple
              const cleanItem = String(parsed).trim();
              if (cleanItem) result.push(cleanItem);
            }
          } catch (error) {
            console.log(`    JSON parse failed, using as string`);
            // Enlever les crochets
            itemStr = itemStr.replace(/[\[\]]/g, '').trim();
            if (itemStr) result.push(itemStr);
          }
        } else {
          // String normale
          if (itemStr) result.push(itemStr);
        }
      }
      
      console.log('✅ Cleaned result:', result);
      return result;
    }
    
    // Si tags est une string
    if (typeof tags === 'string') {
      const str = tags.trim();
      console.log('🧹 Cleaning string:', str);
      
      // Essayer de parser comme JSON
      if (str.startsWith('[') && str.endsWith(']')) {
        try {
          const parsed = JSON.parse(str);
          console.log('✅ Parsed from JSON:', parsed);
          
          if (Array.isArray(parsed)) {
            return parsed.map(item => String(item).trim()).filter(item => item);
          }
          return [String(parsed).trim()];
        } catch (error) {
          console.log('❌ JSON parse failed');
        }
      }
      
      // Fallback: split par virgule
      const cleaned = str
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map(item => item.trim())
        .filter(item => item);
      
      console.log('✅ Cleaned with fallback:', cleaned);
      return cleaned;
    }
    
    return [];
  }, [tags]);

  console.log('🎯 Final tags to display:', cleanTags);

  if (cleanTags.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        TAGS ({cleanTags.length})
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {cleanTags.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            size={isMobile ? "small" : "medium"}
            icon={<TagIcon fontSize={isMobile ? "small" : "medium"} />}
            variant="outlined"
            sx={{ 
              borderRadius: 1,
              '& .MuiChip-label': {
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const RatingDistributionSection = ({ 
  group, 
  getRatingDistribution, 
  getMyFeedback, 
  setFeedbackDialogOpen,
  isAuthenticated,
  navigate,
  id,
  isMember,
  isMobile
}) => (
  <Paper variant="outlined" sx={{ 
    mb: 2, 
    borderRadius: 2,
    overflow: 'hidden'
  }}>
    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
      >
        Rating Distribution
      </Typography>
      
      {getRatingDistribution().map((item) => (
        <Box key={item.stars} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ minWidth: 30, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {item.stars}★
          </Typography>
          <LinearProgress
            variant="determinate"
            value={item.percentage}
            sx={{ 
              flexGrow: 1, 
              mx: 1,
              height: 6,
              borderRadius: 1,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#ffc107',
              }
            }}
          />
          <Typography variant="body2" sx={{ 
            minWidth: 30, 
            textAlign: 'right', 
            fontSize: { xs: '0.7rem', sm: '0.75rem' } 
          }}>
            {item.count}
          </Typography>
        </Box>
      ))}
      
      {group.total_reviews === 0 && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center" 
          sx={{ py: 2, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          No ratings yet
        </Typography>
      )}
      
      {/* Feedback Button */}
      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          if (!isAuthenticated) {
            navigate('/login', { state: { from: `/groups/${id}` } });
          } else if (!isMember) {
            alert('You must be a member to submit feedback.');
          } else {
            setFeedbackDialogOpen(true);
          }
        }}
        sx={{ 
          mt: 2,
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          py: { xs: 0.75, sm: 1 }
        }}
        disabled={!isMember}
      >
        {getMyFeedback() ? 'Update Your Review' : 'Write a Review'}
      </Button>
    </Box>
  </Paper>
);

const QuickInfoSection = ({ group, isPublicGroup, handleContactAdmin, isMobile }) => (
  <Paper variant="outlined" sx={{ borderRadius: 2 }}>
    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Typography 
        variant="subtitle2" 
        color="text.secondary" 
        gutterBottom
        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
      >
        GROUP INFO
      </Typography>
      
      {group.website && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WebsiteIcon fontSize="small" sx={{ 
            mr: 1, 
            color: 'text.secondary',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }} />
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            <a 
              href={group.website} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {group.website.replace(/^https?:\/\//, '')}
            </a>
          </Typography>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <RuleIcon fontSize="small" sx={{ 
          mr: 1, 
          color: 'text.secondary',
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }} />
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {group.requires_approval ? 'Approval required to join' : 'Open membership'}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CalendarIcon fontSize="small" sx={{ 
          mr: 1, 
          color: 'text.secondary',
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }} />
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Created {new Date(group.created_at).toLocaleDateString()}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar 
          src={group.created_by?.profile_image} 
          sx={{ 
            width: { xs: 32, sm: 40 }, 
            height: { xs: 32, sm: 40 }, 
            mr: 2,
            fontSize: { xs: '0.75rem', sm: '1rem' }
          }}
        >
          {(group.created_by?.username?.charAt(0) || '?').toUpperCase()}
        </Avatar>
        <Box>
          <Typography 
            variant="body2" 
            fontWeight="medium"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Created by {group.created_by?.username || 'Unknown'}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
          >
            {group.created_by?.email || ''}
          </Typography>
        </Box>
      </Box>
      
      {/* Contact Admin Button */}
      {isPublicGroup && group.created_by?.id && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<MessageIcon fontSize={isMobile ? "small" : "medium"} />}
          onClick={handleContactAdmin}
          sx={{ 
            mt: 2,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.5, sm: 0.75 }
          }}
        >
          Contact Admin
        </Button>
      )}
    </Box>
  </Paper>
);

export default GroupMainContent;
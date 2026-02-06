import React, { useState } from 'react';
import StaticStars from '../shared/StaticStars';
import LocationMap from './LocationMap';
import ProfileSocialStats from './ProfilSocial';
import '../../styles/profiles/profile_infos.css';
import { Helmet } from 'react-helmet-async';
import { 
  Tooltip, 
  IconButton,
  Snackbar,
  Alert 
} from '@mui/material';
import {
  Language as LanguageIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  Link as LinkIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import useParamDrag from '../../utils/useDrag';

// Icons 
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import InfoIcon from '@mui/icons-material/Info';
import CategoryIcon from '@mui/icons-material/Category';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import FlagIcon from '@mui/icons-material/Flag';
import MapIcon from '@mui/icons-material/Map';
import OpeningHoursWidget from './ProfileOpeningHours';

const ProfileInfo = ({ profile, mapCoordinates, mapLoading, mapError, onRetryGeocoding, currentUserId }) => {
  const [localProfile, setLocalProfile] = useState(profile);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // ✅ OPTIMISATION : Générer les métadonnées une fois
  const profileMetadata = React.useMemo(() => {
    const name = profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.username;

    const description = profile.bio
      ? profile.bio.substring(0, 160)
      : `View ${name}'s professional profile`;

    const image = profile.image || `${window.location.origin}/default-profile.jpg`;
    const url = window.location.href;
    
    const category = profile.category_name || '';
    const city = profile.city || '';
    const country = profile.country || '';
    const rating = profile.average_rating || 0;
    
    // Générer un texte de partage riche
    const shareText = [
      `🌟 ${name}`,
      category && `🏷️ ${category}`,
      city && `📍 ${city}`,
      country && `🌍 ${country}`,
      rating > 0 && `⭐ ${rating.toFixed(1)}/5.0`
    ].filter(Boolean).join(' | ');

    return {
      name,
      description,
      image,
      url,
      shareText,
      category,
      city,
      country,
      rating
    };
  }, [profile]);

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/profile/${localProfile.id}/`;
  };

  const generateRichShareText = () => {
    const name = localProfile.first_name && localProfile.last_name
      ? `${localProfile.first_name} ${localProfile.last_name}`
      : localProfile.username;

    const category = localProfile.category_name ? `🏷️ ${localProfile.category_name}` : '';
    const location = localProfile.city || localProfile.country ? 
      `📍 ${[localProfile.city, localProfile.country].filter(Boolean).join(', ')}` : '';
    const rating = localProfile.average_rating ? `⭐ ${localProfile.average_rating.toFixed(1)}/5.0` : '';
    
    return [
      `👤 ${name}`,
      category,
      location,
      rating,
      '👉 Check out this professional profile!'
    ].filter(Boolean).join('\n');
  };

  // Fonction principale de partage avec prévisualisation riche
  const handleShareProfile = async () => {
    const shareUrl = generateShareUrl();
    const richText = generateRichShareText();
    
    // Pour les médias sociaux qui supportent les prévisualisations
    const socialShareData = {
      title: `${profileMetadata.name} | Professional Profile`,
      text: richText,
      url: shareUrl,
    };

    // Pour le clipboard (copie simple)
    const clipboardText = `${richText}\n\n🔗 ${shareUrl}\n\n📸 ${profileMetadata.image}`;

    // Utiliser l'API Web Share si disponible (montrera la prévisualisation sur mobile)
    if (navigator.share) {
      try {
        // Ajouter des fichiers si l'API le supporte (pour l'image)
        if (navigator.canShare && localProfile.image) {
          try {
            const response = await fetch(localProfile.image);
            const blob = await response.blob();
            const file = new File([blob], 'profile-preview.jpg', { type: 'image/jpeg' });
            
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                ...socialShareData,
                files: [file]
              });
              showSnackbar('Profile shared with preview!', 'success');
              return;
            }
          } catch (error) {
            console.log("Sharing without image preview:", error);
          }
        }
        
        // Fallback: partager sans fichier
        await navigator.share(socialShareData);
        showSnackbar('Profile shared successfully!', 'success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
          fallbackShare(clipboardText);
        }
      }
    } else {
      // Fallback pour desktop et anciens navigateurs
      fallbackShare(clipboardText);
    }
  };

  // Fallback pour copier dans le clipboard
  const fallbackShare = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          showSnackbar('Profile info copied to clipboard!', 'success');
        })
        .catch(err => {
          console.error('Clipboard error:', err);
          legacyCopy(text);
        });
    } else {
      legacyCopy(text);
    }
  };

  // Méthode legacy pour copier
  const legacyCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showSnackbar('Profile info copied to clipboard!', 'success');
    } catch (err) {
      console.error('Legacy copy failed:', err);
      showSnackbar('Failed to copy profile info', 'error');
    }
    
    document.body.removeChild(textArea);
  };

  // Copier juste le lien (pour certaines plateformes)
  const copyProfileLink = () => {
    const shareUrl = generateShareUrl();
    const text = `${profileMetadata.name}'s Profile:\n${shareUrl}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          showSnackbar('Profile link copied!', 'success');
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          showSnackbar('Failed to copy link', 'error');
        });
    } else {
      fallbackShare(text);
    }
  };

  // Mettre à jour localProfile quand profile change
  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Fonction utilitaire pour obtenir l'icône selon la plateforme
  const getSocialIcon = (platform) => {
    const iconStyle = {
      fontSize: '2rem',
      transition: 'all 0.2s ease',
      '&:hover': { transform: 'scale(1.1)' }
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

  const getSocialLinksArray = () => {
    if (!localProfile || !localProfile.social_links) return [];
    
    if (Array.isArray(localProfile.social_links)) {
      return localProfile.social_links;
    }
    
    if (typeof localProfile.social_links === 'string') {
      try {
        const parsed = JSON.parse(localProfile.social_links);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    
    return [];
  };

  const blockDrag = useParamDrag();

  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleFollowUpdate = (updateData) => {
    setLocalProfile(prev => ({
      ...prev,
      followers_count: updateData.followers_count || prev.followers_count,
      following_count: updateData.following_count || prev.following_count
    }));
  };

  if (!localProfile) {
    return <div>Loading profile information...</div>;
  }

  const hasContactData = localProfile.address || localProfile.city || localProfile.state || localProfile.zip_code || localProfile.country || localProfile.location || localProfile.website;

  const socialLinks = getSocialLinksArray();

  return (
    <>
      <Helmet>
        {/* SEO et métadonnées Open Graph pour une belle prévisualisation */}
        <title>{profileMetadata.name}</title>
        <meta name="description" content={profileMetadata.description} />

        {/* Open Graph - ESSENTIEL pour Facebook, LinkedIn, WhatsApp, etc. */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={profileMetadata.name} />
        <meta property="og:description" content={profileMetadata.description} />
        <meta property="og:image" content={profileMetadata.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`Profile picture of ${profileMetadata.name}`} />
        <meta property="og:url" content={profileMetadata.url} />
        
        {/* Informations supplémentaires pour les cartes enrichies */}
        <meta property="profile:first_name" content={profile.first_name || ''} />
        <meta property="profile:last_name" content={profile.last_name || ''} />
        <meta property="profile:username" content={profile.username} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={profileMetadata.name} />
        <meta name="twitter:description" content={profileMetadata.description} />
        <meta name="twitter:image" content={profileMetadata.image} />
        <meta name="twitter:image:alt" content={`Profile of ${profileMetadata.name}`} />
        
        {/* Schema.org pour Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": profileMetadata.name,
            "description": profileMetadata.description,
            "image": profileMetadata.image,
            "url": profileMetadata.url,
            ...(profile.category_name && { "jobTitle": profile.category_name }),
            ...(profile.city && { "address": { "@type": "PostalAddress", "addressLocality": profile.city } }),
            ...(profile.country && { "nationality": profile.country }),
            ...(profile.average_rating && { "aggregateRating": { "@type": "AggregateRating", "ratingValue": profile.average_rating } })
          })}
        </script>
      </Helmet>

      <div className="profile-info-section" {...blockDrag}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h1 className="profile-name-infos" translate='no'>
            {localProfile.first_name && localProfile.last_name 
              ? `${localProfile.first_name} ${localProfile.last_name}`
              : localProfile.username
            }
          </h1>
          
          {/* Bouton de partage amélioré */}
          <Tooltip title="Share this profile with preview" arrow>
            <IconButton
              onClick={handleShareProfile}
              onContextMenu={(e) => {
                e.preventDefault();
                copyProfileLink();
              }}
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1565c0',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                },
                transition: 'all 0.2s ease',
                width: 48,
                height: 48,
              }}
            >
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </div>

        {/* Section statistiques sociales */}
        <div className="social-stats-integrated">
          <ProfileSocialStats 
            profile={localProfile} 
            currentUserId={currentUserId}
            onFollowUpdate={handleFollowUpdate}
          />
        </div>

        <div className="profile-details">
          {localProfile.bio && (
            <div className="detail-section">
              <h3 className="section-titles-bio">
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                About
              </h3>
              <p className="profile-bio">{localProfile.bio}</p>
            </div>
          )}

          {hasContactData && (
            <div className="detail-section">
              <div className="detail-section-h3">
                <h3 className="section-titles-bio">
                  <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                  Contacts
                </h3>
              </div>

              <div className="contact-info">
                {/* Liens sociaux */}
                {(socialLinks.length >= 0 || localProfile.website) && (
                  <div className="social-links-icons-section">
                    <div className="social-icons-container">
                      <OpeningHoursWidget 
                        profile={localProfile}
                        currentUserId={currentUserId}
                      />
                      
                      {socialLinks.map((link, index) => {
                        if (!link || typeof link !== 'object' || !link.url) return null;
                        
                        const platform = link.platform || 'other';
                        const label = link.label || getPlatformLabel(platform);
                        
                        return (
                          <Tooltip key={index} title={label} arrow>
                            <IconButton
                              component="a"
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
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
                      
                      {localProfile.website && !socialLinks.some(link => link.platform === 'website') && (
                        <Tooltip title="Website" arrow>
                          <IconButton
                            component="a"
                            href={localProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
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
              </div>

              {/* Carte de localisation */}
              <div className="location-map-section">
                <LocationMap 
                  profile={localProfile}
                  coordinates={mapCoordinates}
                  loading={mapLoading}
                  error={mapError}
                  onRetry={onRetryGeocoding}
                />
              </div>
            </div>
          )}

          {localProfile.category_name && (
            <div className="detail-section">
              <h3 className="section-titles-bio">
                <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                Category
              </h3>
              <div className="category-badge large">
                {localProfile.category_name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProfileInfo;
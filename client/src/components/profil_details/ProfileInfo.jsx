import React, { useState } from 'react';
import StaticStars from '../shared/StaticStars';
import LocationMap from './LocationMap';
import ProfileSocialStats from './ProfilSocial';
import '../../styles/profiles/profile_infos.css';
import { Helmet } from 'react-helmet-async';
import { Tooltip, IconButton } from '@mui/material';
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
//Icons 
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
  // ✅ ÉTAT LOCAL pour les counts qui se mettent à jour immédiatement
  const [localProfile, setLocalProfile] = useState(profile);
    // ✅ ÉTAT LOCAL pour les counts qui se mettent à jour immédiatement
 const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
   // Fonction pour générer le lien de partage avec métadonnées
    const name =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.username;

  const description =
    profile.bio
      ? profile.bio.substring(0, 160)
      : `View ${name}'s professional profile`;

  const image =
    profile.image ||
    `${window.location.origin}/default-profile.jpg`;

  const url = window.location.href;
   const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/profile/${localProfile.id}/`;
  };
  const blockDrag = useParamDrag()
  // Fonction pour générer le texte de partage avec métadonnées
const generateShareText = () => {
  const name =
    localProfile.first_name && localProfile.last_name
      ? `${localProfile.first_name} ${localProfile.last_name}`
      : localProfile.username;

  const parts = [
    name,
    localProfile.category_name,
    localProfile.city,
    localProfile.country,
  ].filter(Boolean);

  return parts.join(' • ');
};


  // Fonction principale de partage utilisant l'API Web Share
  const handleShareProfile = async () => {
    const shareUrl = generateShareUrl();
    const shareText = generateShareText();
    
    // Préparer les données de partage
    const shareData = {
      title: `${localProfile.first_name || localProfile.username}'s Profile`,
      text: shareText,
      url: shareUrl,
    };
    
    // Ajouter l'image si disponible (pour les appareils qui le supportent)
    if (localProfile.image && navigator.canShare && navigator.canShare({ files: [] })) {
      try {
        // Télécharger l'image pour la partager
        const response = await fetch(localProfile.image);
        const blob = await response.blob();
        const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
        
        shareData.files = [file];
      } catch (error) {
        console.log("Couldn't share image, sharing without it:", error);
      }
    }
    
    // Utiliser l'API Web Share si disponible
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showSnackbar('Profile shared successfully!', 'success');
      } catch (error) {
        // L'utilisateur a annulé le partage
        if (error.name !== 'AbortError') {
          showSnackbar('Failed to share profile', 'error');
        }
      }
    } else {
      // Fallback: copier le lien dans le presse-papier
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n🔗 ${shareUrl}`);
        showSnackbar('Profile info copied to clipboard!', 'success');
      } catch (error) {
        // Fallback pour anciens navigateurs
        const textArea = document.createElement('textarea');
        textArea.value = `${shareText}\n\n🔗 ${shareUrl}`;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSnackbar('Profile info copied to clipboard!', 'success');
      }
    }
  };

  // Copier juste le lien (alternative)
  const copyProfileLink = () => {
    const shareUrl = generateShareUrl();
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showSnackbar('Profile link copied!', 'success');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        showSnackbar('Failed to copy link', 'error');
      });
  };

  // Mettre à jour localProfile quand profile change
  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);
  // Fonction pour afficher les notifications
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Fonction pour fermer le menu de partage
  const closeShareMenu = () => {
    setShareMenuOpen(false);
  };
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

  // Fonction pour obtenir les liens sociaux en tant que tableau
  const getSocialLinksArray = () => {
    if (!localProfile || !localProfile.social_links) return [];
    
    // Si social_links est déjà un tableau
    if (Array.isArray(localProfile.social_links)) {
      return localProfile.social_links;
    }
    
    // Si social_links est une chaîne JSON
    if (typeof localProfile.social_links === 'string') {
      try {
        const parsed = JSON.parse(localProfile.social_links);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing social_links JSON:', error);
        return [];
      }
    }
    
    // Si social_links est undefined/null ou autre type
    return [];
  };

  // Mettre à jour localProfile quand profile change
  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  // ✅ FONCTION pour mettre à jour les counts après un follow/unfollow
  const handleFollowUpdate = (updateData) => {
    console.log('🔄 Updating profile counts:', updateData);
    
    setLocalProfile(prev => ({
      ...prev,
      followers_count: updateData.followers_count || prev.followers_count,
      following_count: updateData.following_count || prev.following_count
    }));
  };

  // Vérifier que profile existe avant de l'utiliser
  if (!localProfile) {
    return <div>Loading profile information...</div>;
  }

  const renderFullAddress = (localProfile) => {
    const addressParts = [];
    if (localProfile.address) addressParts.push(localProfile.address);
    if (localProfile.city) addressParts.push(localProfile.city);
    if (localProfile.state) addressParts.push(localProfile.state);
    if (localProfile.zip_code) addressParts.push(localProfile.zip_code);
    if (localProfile.country) addressParts.push(localProfile.country);
    
    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }
    
    return localProfile.location || 'Location not specified';
  };

  const renderAddressDetails = (localProfile) => {
    const details = [];
    
    if (localProfile.address) {
      details.push(
        <div key="address" className="address-detail">
          <span className="address-label">Address:</span>
          <span className="address-value">{localProfile.address}</span>
        </div>
      );
    }
    
    if (localProfile.city || localProfile.state || localProfile.zip_code) {
      const cityStateZip = [];
      if (localProfile.city) cityStateZip.push(localProfile.city);
      if (localProfile.state) cityStateZip.push(localProfile.state);
      if (localProfile.zip_code) cityStateZip.push(localProfile.zip_code);
      
      details.push(
        <div key="city-state" className="address-detail">
          <span className="address-label">City/State:</span>
          <span className="address-value">{cityStateZip.join(', ')}</span>
        </div>
      );
    }
    
    if (localProfile.country) {
      details.push(
        <div key="country" className="address-detail">
          <span className="address-label">Country:</span>
          <span className="address-value">{localProfile.country}</span>
        </div>
      );
    }
    
    return details.length > 0 ? details : null;
  };

  const hasContactData = localProfile.address || localProfile.city || localProfile.state || localProfile.zip_code || localProfile.country || localProfile.location || localProfile.website;
    const handleHoursUpdate = (updatedHours) => {
    // Mettre à jour l'état local si nécessaire
    console.log('Hours updated:', updatedHours);
  };

  // Récupérer les liens sociaux en tant que tableau sûr
  const socialLinks = getSocialLinksArray();

  return (
     <>
        <Helmet>
        {/* SEO */}
        <title>{name}</title>
        <meta name="description" content={description} />

        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={name} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={url} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={name} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Helmet>
    <div className="profile-info-section" {...blockDrag}>
      <h1 className="profile-name-infos" translate='no'>
        {localProfile.first_name && localProfile.last_name 
          ? `${localProfile.first_name} ${localProfile.last_name}`
          : localProfile.username
        }
      </h1>
  
      {/* ✅ SECTION STATISTIQUES SOCIALES AVEC CALLBACK */}
      <div className="social-stats-integrated">
        <ProfileSocialStats 
          profile={localProfile} 
          currentUserId={currentUserId}
          onFollowUpdate={handleFollowUpdate} // ✅ Passez la callback
        />
      </div>

      <div className="profile-details"       >
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
               <div className="share-buttons-container">
          <Tooltip title="Share profile" arrow>
            <IconButton
              onClick={handleShareProfile}
              sx={{
               backgroundColor: '#f1f1f193',
          
                marginLeft:'2px',
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                  transform: 'scale(1.05)',
                 
                },
                transition: 'all 0.2s ease',
                width: 44,
                height: 44,
              }}
            >
           
              <ShareIcon />
            </IconButton>
          </Tooltip>
          </div>  
            </div> 
 
            <div className="contact-info">
                                 
      
              {/* SECTION DES LIENS SOCIAUX - VERSION ICÔNES SEULEMENT */}
              {(socialLinks.length >= 0 || localProfile.website) && (
                <div className="social-links-icons-section">
                  <div className="social-icons-container">
     <OpeningHoursWidget 
          profile={localProfile}
          currentUserId={currentUserId}
          onHoursUpdate={handleHoursUpdate}
        />
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
                    {localProfile.website && !socialLinks.some(link => link.platform === 'website') && (
                      <Tooltip 
                        title="Website" 
                        placement="bottom"
                        arrow
                      >
                        <IconButton
                          component="a"
                          href={localProfile.website}
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
            </div>

            <div className="location-map-section">
              <div className="map-section-header">
               
              </div>
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
     </>
  );
};

export default ProfileInfo;
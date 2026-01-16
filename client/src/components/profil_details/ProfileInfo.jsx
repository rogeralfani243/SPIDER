import React, { useState } from 'react';
import StaticStars from '../shared/StaticStars';
import LocationMap from './LocationMap';
import ProfileSocialStats from './ProfilSocial';
import '../../styles/profiles/profile_infos.css';
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
} from '@mui/icons-material';
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

const ProfileInfo = ({ profile, mapCoordinates, mapLoading, mapError, onRetryGeocoding, currentUserId }) => {
  // ✅ ÉTAT LOCAL pour les counts qui se mettent à jour immédiatement
  const [localProfile, setLocalProfile] = useState(profile);
  
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
  
  // Récupérer les liens sociaux en tant que tableau sûr
  const socialLinks = getSocialLinksArray();

  return (
    <div className="profile-info-section">
      <h1 className="profile-name-infos">
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
            <h3 className="section-titles-bio">
              <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
              Contact & Location
            </h3>
            
            <div className="contact-info">
              {(localProfile.address || localProfile.city || localProfile.state || localProfile.zip_code || localProfile.country || localProfile.location) && (
                <div className="contact-item">
                  <span className="contact-icon">
                    <LocationOnIcon sx={{ fontSize: '1.2rem', color: '#666' }} />
                  </span>
                  <div className="address-container">
                    <div className="full-address">
                      {renderFullAddress(localProfile)}
                    </div>
                    {renderAddressDetails(localProfile) && (
                      <div className="address-details">
                        {renderAddressDetails(localProfile)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* SECTION DES LIENS SOCIAUX - VERSION ICÔNES SEULEMENT */}
              {(socialLinks.length > 0 || localProfile.website) && (
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
                <MapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                <span>Location Map</span>
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
  );
};

export default ProfileInfo;
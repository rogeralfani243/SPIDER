import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Typography,
  Badge
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { certificationService } from '../../services/certificationService';

const CertificationDisplay = ({
  profileId,
  certificationsData = null,
  position = 'relative',
  placement = 'bottom-right',
  showChips = true,
  size = 'medium',
  showAllInitially = false,
  onCertificationClick = null
}) => {
  const [certifications, setCertifications] = useState(certificationsData);
  const [loading, setLoading] = useState(false);
  const [showAllCertifications, setShowAllCertifications] = useState(showAllInitially);
  
  // Récupérer les certifications si un profileId est fourni
  useEffect(() => {
    const fetchCertifications = async () => {
      if (profileId && !certificationsData) {
        setLoading(true);
        try {
          const data = await certificationService.getProfileCertifications(profileId);
          setCertifications(data);
        } catch (error) {
          console.error('Error fetching certifications:', error);
          setCertifications({
            certifications: [],
            summary: {
              total: 0,
              has_premium: false,
              has_fire: false,
              has_verified: false,
              has_influencer: false
            }
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchCertifications();
  }, [profileId, certificationsData]);
  
  // Définir les tailles selon la prop size
  const getSizes = () => {
    switch(size) {
      case 'small':
        return { main: 24, secondary: 20, icon: 14, badge: 16 };
      case 'large':
        return { main: 40, secondary: 32, icon: 22, badge: 20 };
      case 'medium':
      default:
        return { main: 32, secondary: 28, icon: 18, badge: 20 };
    }
  };
  
  const sizes = getSizes();
  
  // Fonction pour obtenir toutes les certifications actives
  const getAllActiveCertifications = () => {
    if (!certifications?.summary) return [];
    
    const { has_premium, has_verified, has_fire, has_influencer } = certifications.summary;
    const activeCerts = [];
    
    if (has_premium) {
      activeCerts.push({
        type: 'premium',
        icon: <StarIcon />,
        color: '#FFD700',
        tooltip: 'Abonnement Premium',
        priority: 1
      });
    }
    
    if (has_verified) {
      activeCerts.push({
        type: 'verified',
        icon: <VerifiedIcon />,
        color: '#1DA1F2',
        tooltip: 'Profil Vérifié',
        priority: 2
      });
    }
    
    if (has_influencer) {
      activeCerts.push({
        type: 'influencer',
        icon: <TrendingUpIcon />,
        color: '#9C27B0',
        tooltip: 'Influenceur',
        priority: 3
      });
    }
    
    if (has_fire) {
      activeCerts.push({
        type: 'fire',
        icon: <WhatshotIcon />,
        color: '#FF5722',
        tooltip: 'Utilisateur Très Actif',
        priority: 4
      });
    }
    
    // Trier par priorité
    return activeCerts.sort((a, b) => a.priority - b.priority);
  };
  
  // Obtenir la certification principale
  const getMainCertification = () => {
    const allCerts = getAllActiveCertifications();
    return allCerts.length > 0 ? allCerts[0] : null;
  };
  
  // Obtenir les certifications secondaires
  const getSecondaryCertifications = () => {
    const allCerts = getAllActiveCertifications();
    return allCerts.length > 1 ? allCerts.slice(1) : [];
  };
  
  const mainCertification = getMainCertification();
  const secondaryCertifications = getSecondaryCertifications();
  const hasMultipleCertifications = getAllActiveCertifications().length > 1;
  const allCertifications = getAllActiveCertifications();
  
  // Définir le style de positionnement
  const getPositionStyle = () => {
    switch(placement) {
      case 'top-right':
        return { top: -10, right: -10 };
      case 'top-left':
        return { top: -10, left: -10 };
      case 'bottom-left':
        return { bottom: -10, left: -10 };
      case 'bottom-right':
      default:
        return { bottom: -10, right: -10 };
    }
  };
  
  const positionStyle = getPositionStyle();
  
  // Gérer le clic sur une certification
  const handleCertificationClick = (cert) => {
    if (onCertificationClick) {
      onCertificationClick(cert);
    }
  };
  
  if (loading) {
    return (
      <Box
        sx={{
          position,
          ...positionStyle,
          zIndex: 10
        }}
      >
        <Box
          sx={{
            width: sizes.main,
            height: sizes.main,
            borderRadius: '50%',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Box>
    );
  }
  
  if (allCertifications.length === 0) {
    return null;
  }
  
  return (
    <Box
      sx={{
        position,
        ...positionStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: placement.includes('right') ? 'flex-end' : 'flex-start',
        gap: 0.5,
        zIndex: 10
      }}
    >
      {/* Certification principale */}
      {mainCertification && (
        <Tooltip title={mainCertification.tooltip}>
          <Box
            sx={{
              width: sizes.main,
              height: sizes.main,
              borderRadius: '50%',
              backgroundColor: mainCertification.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              border: `none`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              cursor: onCertificationClick ? 'pointer' : 'default',
              transition: 'transform 0.2s',
              '&:hover': onCertificationClick ? {
                transform: 'scale(1.1)'
              } : {}
            }}
            onClick={() => handleCertificationClick(mainCertification)}
          >
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {React.cloneElement(mainCertification.icon, {
                sx: { fontSize: sizes.icon }
              })}
            </Box>
          </Box>
        </Tooltip>
      )}
      
      {/* Badge pour indiquer qu'il y a d'autres certifications */}
      {hasMultipleCertifications && !showAllCertifications && (
        <Tooltip title={`${secondaryCertifications.length} certification(s) supplémentaire(s)`}>
          <Box
            sx={{
              width: sizes.badge,
              height: sizes.badge,
              borderRadius: '50%',
              backgroundColor: '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              border: `${Math.max(1, sizes.badge / 10)}px solid white`,
              boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              fontSize: sizes.badge * 0.35,
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#888'
              }
            }}
            onClick={() => setShowAllCertifications(!showAllCertifications)}
          >
            +{secondaryCertifications.length}
          </Box>
        </Tooltip>
      )}
      
      {/* Autres certifications (affichées quand on clique sur le badge) */}
      <Collapse in={showAllCertifications && hasMultipleCertifications} timeout="auto">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            mt: 0.5,
            alignItems: placement.includes('right') ? 'flex-end' : 'flex-start'
          }}
        >
          {secondaryCertifications.map((cert, index) => (
            <Tooltip key={cert.type} title={cert.tooltip}>
              <Box
                sx={{
                  width: sizes.secondary,
                  height: sizes.secondary,
                  borderRadius: '50%',
                  backgroundColor: cert.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  border: `${Math.max(2, sizes.secondary / 10)}px solid white`,
                  boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
                  cursor: onCertificationClick ? 'pointer' : 'default',
                  transition: 'transform 0.2s',
                  '&:hover': onCertificationClick ? {
                    transform: 'scale(1.1)'
                  } : {}
                }}
                onClick={() => handleCertificationClick(cert)}
              >
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {React.cloneElement(cert.icon, {
                    sx: { fontSize: sizes.icon * 0.9 }
                  })}
                </Box>
              </Box>
            </Tooltip>
          ))}
          
          {/* Bouton pour fermer l'affichage des certifications */}
          {showAllCertifications && (
            <Tooltip title="Réduire">
              <IconButton
                size="small"
                sx={{
                  width: sizes.badge,
                  height: sizes.badge,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  color: '#666',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.2)'
                  }
                }}
                onClick={() => setShowAllCertifications(false)}
              >
                <KeyboardArrowUpIcon sx={{ fontSize: sizes.badge * 0.6 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Collapse>
      
      {/* Affichage horizontal des certifications (chips) */}
      {showChips && allCertifications.length > 0 && (
        <Box sx={{ 
          mt: 1, 
          display: 'flex', 
          justifyContent: placement.includes('right') ? 'flex-end' : 'flex-start',
          gap: 0.5,
          flexWrap: 'wrap',
          maxWidth: '100%'
        }}>
          {allCertifications.map((cert, index) => (
            <Tooltip key={cert.type} title={cert.tooltip}>
              <Chip
                icon={React.cloneElement(cert.icon, { sx: { fontSize: 14 } })}
                label={cert.type.charAt(0).toUpperCase() + cert.type.slice(1)}
                size="small"
                sx={{
                  backgroundColor: `${cert.color}20`,
                  color: cert.color,
                  border: `1px solid ${cert.color}40`,
                  fontWeight: 'medium',
                  fontSize: '0.7rem',
                  cursor: onCertificationClick ? 'pointer' : 'default',
                  '&:hover': onCertificationClick ? {
                    backgroundColor: `${cert.color}30`
                  } : {}
                }}
                onClick={() => handleCertificationClick(cert)}
              />
            </Tooltip>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CertificationDisplay;
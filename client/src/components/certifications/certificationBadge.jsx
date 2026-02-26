// components/CertificationBadge.jsx
import React from 'react';
import { Tooltip, Box, Badge as MuiBadge } from '@mui/material';
import { 
  Verified as VerifiedIcon,
  Whatshot as FireIcon,
  Star as PremiumIcon,
  StarBorder as PremiumOutlineIcon,
  WhatshotOutlined as FireOutlineIcon,
  VerifiedOutlined as VerifiedOutlineIcon
} from '@mui/icons-material';

const CertificationBadge = ({ 
  type, 
  size = 'medium', 
  tooltip = true,
  outlined = false 
}) => {
  const getCertificationInfo = (type) => {
    const certifications = {
      verified: {
        icon: outlined ? VerifiedOutlineIcon : VerifiedIcon,
        color: '#1DA1F2', // Bleu Twitter-like
        title: 'Vérifié',
        tooltipText: 'Identité vérifiée par pièce officielle'
      },
      fire: {
        icon: outlined ? FireOutlineIcon : FireIcon,
        color: '#FF5722', // Orange/rouge
        title: 'Fire',
        tooltipText: 'Utilisateur très actif et engagé'
      },
      premium: {
        icon: outlined ? PremiumOutlineIcon : PremiumIcon,
        color: '#FFD700', // Or
        title: 'Premium',
        tooltipText: 'Abonnement premium actif'
      }
    };
    
    return certifications[type] || {
      icon: null,
      color: '#000000',
      title: type,
      tooltipText: ''
    };
  };

  const certInfo = getCertificationInfo(type);
  const IconComponent = certInfo.icon;
  
  const sizes = {
    small: { size: 16, badge: 24 },
    medium: { size: 24, badge: 32 },
    large: { size: 32, badge: 40 },
    xlarge: { size: 48, badge: 56 }
  };
  
  const { size: iconSize, badge: badgeSize } = sizes[size] || sizes.medium;

  const badgeContent = (
    <MuiBadge
      sx={{
        backgroundColor: certInfo.color,
        color: 'white',
        borderRadius: '50%',
        width: badgeSize,
        height: badgeSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 2px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        border: outlined ? `2px solid ${certInfo.color}` : 'none',
        '&:hover': {
          transform: 'scale(1.1)',
          transition: 'transform 0.2s ease-in-out'
        }
      }}
    >
      {IconComponent && (
        <IconComponent sx={{ 
          fontSize: iconSize,
          color: outlined ? certInfo.color : 'white'
        }} />
      )}
    </MuiBadge>
  );

  if (tooltip && certInfo.tooltipText) {
    return (
      <Tooltip 
        title={certInfo.tooltipText} 
        arrow
        placement="top"
      >
        {badgeContent}
      </Tooltip>
    );
  }

  return badgeContent;
};

export default CertificationBadge;
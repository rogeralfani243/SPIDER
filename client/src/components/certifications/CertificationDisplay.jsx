// components/CertificationDisplay.jsx
import React from 'react';
import { Box, Stack, Typography, Tooltip, Chip, Badge as MuiBadge } from '@mui/material';
import CertificationBadge from './certificationBadge';
import { EmojiEvents } from '@mui/icons-material';

const CertificationDisplay = ({ 
  profile, 
  showCount = true,
  size = 'medium',
  maxDisplay = 3,
  showTooltip = true
}) => {
  // Récupérer les certifications depuis le profil
  // Vérifier si certifications est un tableau ou un objet
  const certifications = profile?.certifications || [];
  
  // Si certifications est un objet avec une propriété "certifications"
  const certsArray = Array.isArray(certifications) 
    ? certifications 
    : (Array.isArray(certifications?.certifications) ? certifications.certifications : []);
  
  // Vérifier si le profil a certaines certifications
  const hasPremium = profile?.has_premium || certsArray.some(c => c.type === 'premium' || c.certification_type?.name === 'premium');
  const hasFire = profile?.has_fire || certsArray.some(c => c.type === 'fire' || c.certification_type?.name === 'fire');
  const hasVerified = profile?.has_verified || certsArray.some(c => c.type === 'verified' || c.certification_type?.name === 'verified');
  
  // Compter le nombre total
  const totalCertifications = [
    hasPremium,
    hasFire,
    hasVerified
  ].filter(Boolean).length;
  
  // Si aucune certification
  if (totalCertifications === 0) {
    return null;
  }

  // Fonction pour obtenir l'ordre d'affichage
  const getCertificationsToDisplay = () => {
    const certs = [];
    
    if (hasPremium) certs.push({ type: 'premium', priority: 1 });
    if (hasVerified) certs.push({ type: 'verified', priority: 2 });
    if (hasFire) certs.push({ type: 'fire', priority: 3 });
    
    return certs
      .sort((a, b) => a.priority - b.priority)
      .slice(0, maxDisplay);
  };

  const certificationsToDisplay = getCertificationsToDisplay();
  const hasMore = totalCertifications > maxDisplay;

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: 0.5,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      {/* Badge avec compteur */}
      {showCount && totalCertifications > 0 && (
        <Tooltip title={`${totalCertifications} certification(s)`}>
          <Chip
            icon={<EmojiEvents />}
            label={totalCertifications}
            size="small"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              mr: 0.5,
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
        </Tooltip>
      )}
      
      {/* Badges de certification */}
      <Stack direction="row" spacing={0.5}>
        {certificationsToDisplay.map((cert, index) => (
          <CertificationBadge
            key={`${cert.type}-${index}`}
            type={cert.type}
            size={size}
            tooltip={showTooltip}
          />
        ))}
        
        {/* Indicateur de certifications supplémentaires */}
        {hasMore && (
          <Tooltip title={`${totalCertifications - maxDisplay} certification(s) supplémentaire(s)`}>
            <Chip
              label={`+${totalCertifications - maxDisplay}`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                bgcolor: 'grey.300'
              }}
            />
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};

export default CertificationDisplay;
// src/contexts/LanguageSelector.jsx
import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
  Translate as TranslateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useLanguage } from './LanguageContext';

const LanguageSelector = ({ compact = false }) => {
  const { language, changeLanguage, supportedLanguages, googleTranslateReady } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (langCode) => {
    setLoading(true);
    
    try {
      await changeLanguage(langCode);
      setShowSuccess(true);
      
      // Afficher un message de succès
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  // Forcer la détection de Google Translate
  const forceGoogleTranslateDetection = () => {
    if (window.google && window.google.translate) {
      // Simuler un clic sur le widget Google Translate
      const translateButton = document.querySelector('.goog-te-menu-value');
      if (translateButton) {
        translateButton.click();
      }
    }
  };

  if (compact) {
    return (
      <>
        <Tooltip title="Change language">
          <IconButton
            onClick={handleClick}
            sx={{
              color: 'inherit',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
              borderRadius: '8px',
              padding: '8px',
              position: 'relative',
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <>
                <LanguageIcon />
                {!googleTranslateReady && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 8,
                      height: 8,
                      backgroundColor: 'warning.main',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </>
            )}
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              width: 220,
              maxHeight: 400,
              mt: 1,
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Select Language
            </Typography>
            {!googleTranslateReady && (
              <Typography variant="caption" color="warning.main">
                Translation service loading...
              </Typography>
            )}
          </Box>

          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {Object.entries(supportedLanguages).map(([code, lang]) => (
              <MenuItem
                key={code}
                onClick={() => handleLanguageChange(code)}
                disabled={loading}
                selected={language === code}
                sx={{
                  py: 1.5,
                  backgroundColor: language === code ? 'action.selected' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography sx={{ fontSize: '1.2rem' }}>
                    {lang.flag}
                  </Typography>
                </ListItemIcon>
                <ListItemText 
                  primary={lang.nativeName} 
                  secondary={lang.name}
                />
                {language === code && !loading && (
                  <CheckIcon fontSize="small" color="primary" />
                )}
                {loading && language === code && (
                  <CircularProgress size={16} />
                )}
              </MenuItem>
            ))}
          </Box>

          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
            <MenuItem
              onClick={forceGoogleTranslateDetection}
              sx={{
                py: 1,
                fontSize: '0.875rem',
                color: 'primary.main',
              }}
            >
              <TranslateIcon fontSize="small" sx={{ mr: 1 }} />
              Use Google Translate
            </MenuItem>
          </Box>
        </Menu>

        <Snackbar
          open={showSuccess}
          autoHideDuration={3000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            Language changed to {supportedLanguages[language]?.nativeName}
          </Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
          border: '1px solid',
          borderColor: 'divider',
          minWidth: 150,
        }}
      >
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <>
            <LanguageIcon />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {supportedLanguages[language]?.nativeName || 'English'}
            </Typography>
          </>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 280,
            maxHeight: 500,
            mt: 1,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            Language Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Page will be translated using Google Translate
          </Typography>
        </Box>

        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {Object.entries(supportedLanguages).map(([code, lang]) => (
            <MenuItem
              key={code}
              onClick={() => handleLanguageChange(code)}
              disabled={loading}
              selected={language === code}
              sx={{
                py: 1.5,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                backgroundColor: language === code ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Typography sx={{ fontSize: '1.5rem', width: 40 }}>
                {lang.flag}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {lang.nativeName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lang.name}
                </Typography>
              </Box>
              {language === code && !loading && (
                <CheckIcon color="primary" />
              )}
              {loading && language === code && (
                <CircularProgress size={20} />
              )}
            </MenuItem>
          ))}
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary">
            Translation powered by Google Translate. Page will refresh after selection.
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
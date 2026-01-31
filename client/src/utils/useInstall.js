// src/hooks/usePWAInstall.js
import React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
  Backdrop
} from '@mui/material';
import {
  InstallDesktop,
  Smartphone,
  Close,
  Android,
  Apple,
  GetApp,
  Download
} from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';

  // Detect if it's a mobile device
  const detectMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  // Detect if the app is installed in standalone mode (PWA)
  const detectStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://')
    );
  };

  // Function to show the install modal
  const showInstallModal = () => {
    setShowInstallPrompt(true);
  };

  // Function to install the PWA
  const installPWA = async () => {
    if (!deferredPrompt) return false;
    
    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      // Reset the prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      
      // Store in localStorage that the user has seen the prompt
      localStorage.setItem('pwaPromptShown', Date.now().toString());
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  // Function to close the modal
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    // Store dismissal time to not show too often
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };

  useEffect(() => {
    const isMobileDevice = detectMobile();
    setIsMobile(isMobileDevice);
    
    const isStandaloneApp = detectStandalone();
    setIsStandalone(isStandaloneApp);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 beforeinstallprompt event fired');
      // Prevent the default prompt
      e.preventDefault();
      // Save the event for later
      setDeferredPrompt(e);
      
      // Check if we should show the prompt automatically
      if (isMobileDevice && !isStandaloneApp) {
        const lastDismissed = localStorage.getItem('pwaPromptDismissed');
        const lastShown = localStorage.getItem('pwaPromptShown');
        
        // Don't show if user dismissed recently (within last 7 days)
        if (lastDismissed) {
          const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          if (parseInt(lastDismissed) > oneWeekAgo) {
            return;
          }
        }
        
        // Don't show if already shown recently (within last 30 days)
        if (lastShown) {
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          if (parseInt(lastShown) > thirtyDaysAgo) {
            return;
          }
        }
        
        // Show after a delay (3 seconds)
        const timer = setTimeout(() => {
          setShowInstallPrompt(true);
          localStorage.setItem('pwaPromptShown', Date.now().toString());
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('📱 PWA installed successfully');
      setIsStandalone(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // PWA install modal component using Material UI
  const InstallPromptModal = () => {
    if (!showInstallPrompt || !isMobile || isStandalone) return null;

    return (
      <>
        <Backdrop
          open={showInstallPrompt}
          sx={{
            zIndex: theme.zIndex.modal - 1,
            backdropFilter: 'blur(4px)',
          }}
        />
        <Dialog
          open={showInstallPrompt}
          onClose={dismissInstallPrompt}
          TransitionComponent={Transition}
          fullScreen={fullScreen}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: fullScreen ? 0 : 2,
              overflow: 'hidden',
              background: isDarkMode 
                ? 'linear-gradient(145deg, #1a237e 0%, #311b92 100%)' 
                : 'linear-gradient(145deg, #3f51b5 0%, #673ab7 100%)',
              color: 'white',
            }
          }}
          sx={{
            '& .MuiDialog-container': {
              backdropFilter: 'blur(8px)',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Smartphone sx={{ fontSize: 28 }} />
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                Install App
              </Typography>
            </Box>
            <IconButton
              onClick={dismissInstallPrompt}
              sx={{ color: 'white' }}
              size="small"
            >
              <Close />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 2 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                mb: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                <GetApp sx={{ fontSize: 40, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Enhanced Mobile Experience
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    Install our Progressive Web App for better performance
                  </Typography>
                </Box>
              </Box>
              
              <List dense sx={{ py: 0 }}>
                {[
                  { icon: '⚡', text: 'Faster loading times' },
                  { icon: '📱', text: 'Home screen access' },
                  { icon: '🔔', text: 'Push notifications' },
                  { icon: '📶', text: 'Offline functionality' },
                  { icon: '🔒', text: 'Enhanced security' }
                ].map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        sx: { opacity: 0.9 }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, fontWeight: 500 }}>
              Installation Guide:
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: fullScreen ? 'column' : 'row',
              gap: 2,
              mb: 3 
            }}>
              <Paper 
                elevation={0}
                sx={{ 
                  flex: 1,
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  <Apple />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    iOS
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.8, lineHeight: 1.4 }}>
                  1. Tap the Share button (⎋)<br />
                  2. Select "Add to Home Screen"<br />
                  3. Tap "Add" in the top-right
                </Typography>
              </Paper>
              
              <Paper 
                elevation={0}
                sx={{ 
                  flex: 1,
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  <Android />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Android
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.8, lineHeight: 1.4 }}>
                  1. Tap the menu (⋮)<br />
                  2. Select "Install app" or "Add to Home Screen"<br />
                  3. Confirm the installation
                </Typography>
              </Paper>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ 
            px: 3, 
            pb: 3, 
            pt: 0,
            flexDirection: fullScreen ? 'column' : 'row',
            gap: fullScreen ? 1 : 0
          }}>
            <Button
              variant="outlined"
              onClick={dismissInstallPrompt}
              fullWidth={fullScreen}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  background: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              Maybe Later
            </Button>
            
            <Button
              variant="contained"
              onClick={installPWA}
              startIcon={<Download />}
              fullWidth={fullScreen}
              sx={{
                background: 'linear-gradient(90deg, #4CAF50 0%, #2E7D32 100%)',
                color: 'white',
                fontWeight: 600,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(90deg, #43A047 0%, #1B5E20 100%)',
                  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
                }
              }}
            >
              Install Now
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  };

  // Install banner component for non-intrusive prompting
  const InstallBanner = ({ position = 'bottom' }) => {
    if (!isMobile || isStandalone || !deferredPrompt) return null;

    return (
      <Fade in={!showInstallPrompt}>
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            [position]: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 600,
            width: '90%',
            zIndex: theme.zIndex.snackbar,
            p: 2,
            borderRadius: 2,
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}
        >
          <InstallDesktop color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Install our app for better experience
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Get faster access and offline functionality
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={dismissInstallPrompt}
              sx={{ minWidth: 'auto' }}
            >
              Dismiss
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={installPWA}
              startIcon={<GetApp />}
            >
              Install
            </Button>
          </Box>
        </Paper>
      </Fade>
    );
  };

  return {
    isStandalone,
    isMobile,
    showInstallPrompt,
    installPWA,
    dismissInstallPrompt,
    showInstallModal,
    InstallPromptModal,
    InstallBanner,
    deferredPrompt: !!deferredPrompt,
    canInstall: !!deferredPrompt && isMobile && !isStandalone,
  };
};

export default usePWAInstall;
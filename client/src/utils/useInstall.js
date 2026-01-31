// src/hooks/usePWAInstall.js
import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  InstallDesktop,
  PhoneAndroid,
  PhoneIphone,
  Close,
  Download,
  CheckCircle,
  Share,
  Home,
} from '@mui/icons-material';

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Détecter si c'est un appareil mobile
  const detectMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  // Détecter si l'app est installée en mode standalone (PWA)
  const detectStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://')
    );
  };

  // Fonction pour montrer le prompt d'installation
  const showInstallModal = () => {
    setShowInstallPrompt(true);
  };

  // Fonction pour installer la PWA
  const installPWA = async () => {
    if (!deferredPrompt) {
      // Si pas de deferredPrompt, on montre juste les instructions
      setShowInstallPrompt(true);
      return false;
    }
    
    try {
      setIsInstalling(true);
      // Afficher le prompt d'installation
      deferredPrompt.prompt();
      
      // Attendre que l'utilisateur réponde
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      // Réinitialiser le prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      setIsInstalling(false);
      
      // Stocker dans localStorage que l'utilisateur a vu le prompt
      localStorage.setItem('pwaPromptShown', Date.now().toString());
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error installing PWA:', error);
      setIsInstalling(false);
      return false;
    }
  };

  // Fonction pour fermer le modal
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setIsInstalling(false);
    // Stocker le moment du dismiss pour ne pas montrer trop souvent
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };

  useEffect(() => {
    const isMobileDevice = detectMobile();
    setIsMobile(isMobileDevice);
    
    const isStandaloneApp = detectStandalone();
    setIsStandalone(isStandaloneApp);

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 beforeinstallprompt event fired');
      // Empêcher le prompt automatique
      e.preventDefault();
      // Sauvegarder l'event pour plus tard
      setDeferredPrompt(e);
      
      // Vérifier si on doit montrer le prompt automatiquement
      if (isMobileDevice && !isStandaloneApp) {
        const lastDismissed = localStorage.getItem('pwaPromptDismissed');
        const lastShown = localStorage.getItem('pwaPromptShown');
        
        // Ne pas montrer si l'utilisateur a dismiss récemment (dans les 7 derniers jours)
        if (lastDismissed) {
          const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          if (parseInt(lastDismissed) > oneWeekAgo) {
            return;
          }
        }
        
        // Ne pas montrer si déjà montré récemment (dans les 30 jours)
        if (lastShown) {
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          if (parseInt(lastShown) > thirtyDaysAgo) {
            return;
          }
        }
        
        // Montrer après un délai (5 secondes)
        const timer = setTimeout(() => {
          setShowInstallPrompt(true);
          localStorage.setItem('pwaPromptShown', Date.now().toString());
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    };

    // Écouter si l'app est installée
    const handleAppInstalled = () => {
      console.log('📱 PWA installed successfully');
      setIsStandalone(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setIsInstalling(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Composant modal pour l'installation PWA
  const InstallPromptModal = () => (
    <Dialog
      open={showInstallPrompt && isMobile && !isStandalone}
      onClose={dismissInstallPrompt}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      aria-labelledby="pwa-install-dialog"
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          m: fullScreen ? 0 : 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <InstallDesktop />
          <Typography variant="h6" component="span">
            Installer l'application
          </Typography>
        </Box>
        <IconButton
          onClick={dismissInstallPrompt}
          sx={{ color: 'primary.contrastText' }}
          size="small"
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Download sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>
          
          <Typography variant="h5" gutterBottom fontWeight="medium">
            Améliorez votre expérience
          </Typography>
          
          <Typography color="text.secondary" paragraph>
            Installez notre application pour un accès plus rapide, 
            une meilleure performance et l'utilisation hors connexion.
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            <CheckCircle sx={{ mr: 1, color: 'success.main', verticalAlign: 'middle' }} />
            Avantages de l'installation
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Download color="primary" />
              </ListItemIcon>
              <ListItemText primary="Accès rapide depuis l'écran d'accueil" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Download color="primary" />
              </ListItemIcon>
              <ListItemText primary="Fonctionnement hors connexion" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Download color="primary" />
              </ListItemIcon>
              <ListItemText primary="Notifications push" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Download color="primary" />
              </ListItemIcon>
              <ListItemText primary="Expérience plein écran" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Instructions d'installation
          </Typography>
          
          <Box display="flex" flexDirection={fullScreen ? 'column' : 'row'} gap={2} mb={2}>
            <Box flex={1}>
              <Chip
                icon={<PhoneIphone />}
                label="iOS"
                color="info"
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Share fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="1. Cliquez sur l'icône Partager" 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Home fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="2. Sélectionnez 'Sur l'écran d'accueil'" 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </Box>
            
            <Box flex={1}>
              <Chip
                icon={<PhoneAndroid />}
                label="Android"
                color="success"
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Download fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="1. Cliquez sur 'Installer l'application'" 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Home fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="2. Ou 'Ajouter à l'écran d'accueil'" 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </Box>
          </Box>
          
          <Box
            sx={{
              bgcolor: 'warning.light',
              p: 2,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'warning.main',
            }}
          >
            <Typography variant="body2" color="warning.dark">
              <strong>Remarque :</strong> Selon votre navigateur, les instructions peuvent légèrement varier.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0, flexDirection: fullScreen ? 'column' : 'row', gap: 1 }}>
        <Button
          onClick={dismissInstallPrompt}
          variant="outlined"
          fullWidth={fullScreen}
          sx={{ minWidth: fullScreen ? '100%' : 120 }}
        >
          Plus tard
        </Button>
        
        {deferredPrompt ? (
          <Button
            onClick={installPWA}
            variant="contained"
            color="primary"
            fullWidth={fullScreen}
            disabled={isInstalling}
            startIcon={isInstalling ? null : <Download />}
            sx={{ minWidth: fullScreen ? '100%' : 120 }}
          >
            {isInstalling ? 'Installation en cours...' : 'Installer maintenant'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            fullWidth={fullScreen}
            onClick={() => window.location.reload()}
            sx={{ minWidth: fullScreen ? '100%' : 180 }}
          >
            Actualiser pour voir l'option
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  return {
    isStandalone,
    isMobile,
    showInstallPrompt,
    installPWA,
    dismissInstallPrompt,
    showInstallModal,
    InstallPromptModal,
    deferredPrompt: !!deferredPrompt,
    // Composant bouton d'installation
    InstallButton: ({ variant = 'contained', color = 'primary', sx = {} }) => (
      <Button
        variant={variant}
        color={color}
        onClick={showInstallModal}
        startIcon={<Download />}
        disabled={isStandalone}
        sx={sx}
      >
        {isStandalone ? 'Déjà installée' : 'Installer l\'app'}
      </Button>
    ),
    // Badge pour indiquer l'état d'installation
    InstallStatusBadge: () => (
      <Chip
        icon={isStandalone ? <CheckCircle /> : <Download />}
        label={isStandalone ? 'App installée' : 'Installation disponible'}
        color={isStandalone ? 'success' : 'primary'}
        variant="outlined"
        size="small"
      />
    ),
  };
};

export default usePWAInstall;
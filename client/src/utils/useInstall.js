// src/hooks/usePWAInstall.js
import { useState, useEffect } from 'react';

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

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
    if (!deferredPrompt) return false;
    
    try {
      // Afficher le prompt d'installation
      deferredPrompt.prompt();
      
      // Attendre que l'utilisateur réponde
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      // Réinitialiser le prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      
      // Stocker dans localStorage que l'utilisateur a vu le prompt
      localStorage.setItem('pwaPromptShown', Date.now().toString());
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  // Fonction pour fermer le modal
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
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
        
        // Montrer après un délai (3 secondes)
        const timer = setTimeout(() => {
          setShowInstallPrompt(true);
          localStorage.setItem('pwaPromptShown', Date.now().toString());
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    };

    // Écouter si l'app est installée
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

  // Composant modal pour l'installation PWA
  const InstallPromptModal = () => {
    if (!showInstallPrompt || !isMobile || isStandalone) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: '16px',
            color: '#333',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span>📱</span> Installer l'application
          </h3>
          
          <p style={{
            color: '#666',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}>
            Pour une meilleure expérience, installez l'application sur votre téléphone. 
            Vous aurez un accès plus rapide et pourrez utiliser toutes les fonctionnalités 
            même hors connexion.
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <button
              onClick={installPWA}
              style={{
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056CC'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007AFF'}
            >
              📥 Installer l'application
            </button>
            
            <button
              onClick={dismissInstallPrompt}
              style={{
                backgroundColor: 'transparent',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Plus tard
            </button>
          </div>
          
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #eee',
            fontSize: '12px',
            color: '#999',
          }}>
            <p style={{ margin: 0 }}>
              <strong>Pour installer :</strong><br />
              • <strong>iOS :</strong> Cliquez sur "Partager" puis "Sur l'écran d'accueil"<br />
              • <strong>Android :</strong> Cliquez sur "Installer l'application" ou "Ajouter à l'écran d'accueil"
            </p>
          </div>
        </div>
      </div>
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
    deferredPrompt: !!deferredPrompt,
  };
};

export default usePWAInstall;
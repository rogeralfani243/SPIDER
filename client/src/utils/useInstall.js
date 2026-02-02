// src/hooks/usePWAInstall.js
import { useState, useEffect } from 'react';
import { 
  FiSmartphone, 
  FiDownload, 
  FiShare2, 
  FiHome,
  FiX,
  FiInfo
} from 'react-icons/fi';
import { 
  MdOutlineInstallDesktop,
  MdOutlineInstallMobile 
} from 'react-icons/md';

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Detect mobile devices
  const detectMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  // Detect if app is installed as standalone PWA
  const detectStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://')
    );
  };

  // Function to show install modal
  const showInstallModal = () => {
    setShowInstallPrompt(true);
  };

  // Function to install PWA
  const installPWA = async () => {
    if (!deferredPrompt) return false;
    
    try {
      // Show install prompt
      deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      // Reset prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      
      // Store in localStorage that user has seen the prompt
      localStorage.setItem('pwaPromptShown', Date.now().toString());
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  // Function to close modal
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    // Store dismissal timestamp to avoid showing too frequently
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };

  useEffect(() => {
    const isMobileDevice = detectMobile();
    setIsMobile(isMobileDevice);
    
    const isStandaloneApp = detectStandalone();
    setIsStandalone(isStandaloneApp);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      // Prevent default prompt
      e.preventDefault();
      // Save event for later use
      setDeferredPrompt(e);
      
      // Check if we should show prompt automatically
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
        
        // Don't show if shown recently (within last 30 days)
        if (lastShown) {
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          if (parseInt(lastShown) > thirtyDaysAgo) {
            return;
          }
        }
        
        // Show after delay (3 seconds)
        const timer = setTimeout(() => {
          setShowInstallPrompt(true);
          localStorage.setItem('pwaPromptShown', Date.now().toString());
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
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

  // Modal component for PWA installation
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
          position: 'relative',
        }}>
          {/* Close button */}
          <button
            onClick={dismissInstallPrompt}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#999',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => e.target.style.color = '#333'}
            onMouseOut={(e) => e.target.style.color = '#999'}
          >
            <FiX />
          </button>
          
          <h3 style={{
            marginTop: 0,
            marginBottom: '16px',
            color: '#333',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <FiSmartphone style={{ fontSize: '24px' }} />
            Install App
          </h3>
          
          <p style={{
            color: '#666',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}>
            For a better experience, install the app on your phone. 
            You'll have faster access and can use all features even when offline.
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056CC'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007AFF'}
            >
              <MdOutlineInstallMobile style={{ fontSize: '20px' }} />
              Install App
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <FiX style={{ fontSize: '18px' }} />
              Later
            </button>
          </div>
          
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #eee',
            fontSize: '12px',
            color: '#999',
          }}>
            <p style={{ 
              margin: 0, 
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FiInfo style={{ fontSize: '14px' }} />
              <strong>How to install:</strong>
            </p>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
            }}>
              <li style={{ 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FiShare2 style={{ fontSize: '12px' }} />
                <strong>iOS:</strong> Click "Share" then "Add to Home Screen"
              </li>
              <li style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <MdOutlineInstallDesktop style={{ fontSize: '12px' }} />
                <strong>Android:</strong> Click "Install App" or "Add to Home Screen"
              </li>
            </ul>
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
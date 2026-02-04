import { useState, useEffect, useRef } from 'react';

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const promptTimerRef = useRef(null);

  // -------- Helpers --------

  const detectMobile = () =>
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );

  const detectIOS = () =>
    /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const detectStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith('android-app://');

  // -------- Actions --------

  const installPWA = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      localStorage.setItem('pwaPromptShown', Date.now().toString());

      return outcome === 'accepted';
    } catch {
      return false;
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };

  const showInstallModal = () => {
    setShowInstallPrompt(true);
  };

  // -------- Effects --------

  useEffect(() => {
    setIsMobile(detectMobile());
    setIsStandalone(detectStandalone());

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      if (!detectMobile() || detectStandalone()) return;

      const lastDismissed = localStorage.getItem('pwaPromptDismissed');
      const lastShown = localStorage.getItem('pwaPromptShown');

      const now = Date.now();

      if (lastDismissed && now - lastDismissed < 7 * 24 * 60 * 60 * 1000) return;
      if (lastShown && now - lastShown < 30 * 24 * 60 * 60 * 1000) return;

      promptTimerRef.current = setTimeout(() => {
        setShowInstallPrompt(true);
        localStorage.setItem('pwaPromptShown', now.toString());
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (promptTimerRef.current) {
        clearTimeout(promptTimerRef.current);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // -------- UI --------

  const InstallPromptModal = () => {
    if (!showInstallPrompt || isStandalone || !isMobile) return null;

    const isIOS = detectIOS();

    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <h3 style={titleStyle}>📱 Installer l’application</h3>

          <p style={textStyle}>
            Installez l’application pour un accès plus rapide et une meilleure
            expérience.
          </p>

          {!isIOS && deferredPrompt && (
            <button style={primaryBtn} onClick={installPWA}>
              📥 Installer l’application
            </button>
          )}

          {isIOS && (
            <p style={iosHint}>
              Sur iPhone :<br />
              <strong>Partager</strong> → <strong>Sur l’écran d’accueil</strong>
            </p>
          )}

          <button style={secondaryBtn} onClick={dismissInstallPrompt}>
            Plus tard
          </button>
        </div>
      </div>
    );
  };

  return {
    isStandalone,
    isMobile,
    deferredPrompt: !!deferredPrompt,
    showInstallPrompt,
    showInstallModal,
    installPWA,
    dismissInstallPrompt,
    InstallPromptModal,
  };
};

export default usePWAInstall;

/* ---------- Styles ---------- */

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const modalStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  maxWidth: 380,
  width: '100%',
  textAlign: 'center',
};

const titleStyle = {
  marginBottom: 12,
};

const textStyle = {
  color: '#666',
  marginBottom: 20,
};

const iosHint = {
  background: '#f5f5f5',
  padding: 12,
  borderRadius: 10,
  fontSize: 14,
  marginBottom: 16,
};

const primaryBtn = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  background: '#792301ff',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
  marginBottom: 10,
  cursor: 'pointer',
};

const secondaryBtn = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  background: 'transparent',
  border: '1px solid #ddd',
  cursor: 'pointer',
};

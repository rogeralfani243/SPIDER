import { useEffect, useState } from 'react';

const isMobile = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const isIOS = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent);

const isPWAInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  document.referrer.startsWith('android-app://');

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
    });
  }, []);

  useEffect(() => {
    if (!isMobile() || isInstalled) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isInstalled]);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  return {
    showBanner,
    installApp,
    isIOS: isIOS(),
    hasPrompt: !!deferredPrompt,
    isInstalled,
    closeBanner: () => setShowBanner(false),
  };
};


export default usePWAInstall;

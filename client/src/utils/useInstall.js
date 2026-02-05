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

  useEffect(() => {
    if (!isMobile() || isPWAInstalled()) return;

    setShowBanner(true);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

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
    closeBanner: () => setShowBanner(false),
  };
};

export default usePWAInstall;

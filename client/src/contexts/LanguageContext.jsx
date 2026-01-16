// src/contexts/LanguageContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

// Liste des langues supportées
const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', nativeName: 'English', flag: '🇺🇸', googleCode: 'en' },
  'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷', googleCode: 'fr' },
  'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', googleCode: 'es' },
  'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', googleCode: 'de' },
  'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', googleCode: 'it' },
  'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', googleCode: 'pt' },
  'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', googleCode: 'ar', rtl: true },
  'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳', googleCode: 'zh-CN' },
  'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', googleCode: 'ja' },
  'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', googleCode: 'ru' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', googleCode: 'hi' },
  'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', googleCode: 'ko' },
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const getInitialLanguage = () => {
    const saved = localStorage.getItem('appLanguage');
    if (saved && SUPPORTED_LANGUAGES[saved]) {
      return saved;
    }
    
    const browserLang = navigator.language.split('-')[0];
    return SUPPORTED_LANGUAGES[browserLang] ? browserLang : 'en';
  };

  const [language, setLanguage] = useState(getInitialLanguage());
  const [direction, setDirection] = useState('ltr');
  const [googleTranslateReady, setGoogleTranslateReady] = useState(false);

  // Initialiser Google Translate
  const initGoogleTranslate = useCallback(() => {
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      setGoogleTranslateReady(true);
      return true;
    }
    
    // Si Google Translate n'est pas chargé, le charger
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }
    
    return false;
  }, []);

  // Fonction pour changer la langue via Google Translate
  const changeLanguage = useCallback((langCode) => {
    if (!SUPPORTED_LANGUAGES[langCode]) {
      console.warn(`Language ${langCode} not supported`);
      return;
    }
    
    // Sauvegarder la langue
    setLanguage(langCode);
    localStorage.setItem('appLanguage', langCode);
    
    // Mettre à jour la direction
    const isRTL = SUPPORTED_LANGUAGES[langCode]?.rtl || false;
    if (isRTL) {
      setDirection('rtl');
      document.documentElement.dir = 'rtl';
    } else {
      setDirection('ltr');
      document.documentElement.dir = 'ltr';
    }
    
    // Mettre à jour l'attribut lang
    document.documentElement.lang = langCode;
    
    // Utiliser Google Translate pour changer la langue
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      try {
        const googleLangCode = SUPPORTED_LANGUAGES[langCode].googleCode;
        
        // Méthode 1: Utiliser l'API Google Translate
        const translateElement = document.querySelector('.goog-te-combo');
        if (translateElement) {
          translateElement.value = googleLangCode;
          translateElement.dispatchEvent(new Event('change'));
        }
        
        // Méthode 2: Rediriger via l'iframe Google
        const iframe = document.querySelector('.goog-te-menu-frame');
        if (iframe) {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const select = iframeDoc.querySelector('.goog-te-combo');
          if (select) {
            select.value = googleLangCode;
            select.dispatchEvent(new Event('change'));
          }
        }
        
        // Méthode 3: Forcer le changement via cookie
        document.cookie = `googtrans=/auto/${googleLangCode}; path=/; expires=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()}`;
        
        console.log(`🌐 Language changed to: ${langCode} (Google: ${googleLangCode})`);
        
        // Recharger pour appliquer les changements
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } catch (error) {
        console.error('Error changing language with Google Translate:', error);
        // Fallback: recharger la page
        window.location.reload();
      }
    } else {
      // Si Google Translate n'est pas disponible, juste recharger
      window.location.reload();
    }
  }, []);

  // Activer la traduction navigateur
  const enableBrowserTranslation = useCallback(() => {
    // Activer pour tout le document
    document.documentElement.setAttribute('translate', 'yes');
    
    // Activer pour les éléments communs
    const selectors = 'p, span, div:not(.no-translate), h1, h2, h3, h4, h5, h6, button, a, li, td, th, label, input[placeholder], textarea';
    
    setTimeout(() => {
      const elements = document.querySelectorAll(selectors);
      elements.forEach(el => {
        if (!el.classList.contains('no-translate') && !el.hasAttribute('translate')) {
          el.setAttribute('translate', 'yes');
        }
      });
    }, 1000);
  }, []);

  // Synchroniser au chargement
  useEffect(() => {
    // Initialiser Google Translate
    const isReady = initGoogleTranslate();
    
    // Appliquer la langue
    const isRTL = SUPPORTED_LANGUAGES[language]?.rtl || false;
    if (isRTL) {
      setDirection('rtl');
      document.documentElement.dir = 'rtl';
    }
    
    document.documentElement.lang = language;
    
    // Activer la traduction
    enableBrowserTranslation();
    
    // Vérifier périodiquement si Google Translate est prêt
    if (!isReady) {
      const interval = setInterval(() => {
        if (window.google && window.google.translate) {
          setGoogleTranslateReady(true);
          clearInterval(interval);
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [language, enableBrowserTranslation, initGoogleTranslate]);

  const value = {
    language,
    changeLanguage,
    direction,
    supportedLanguages: SUPPORTED_LANGUAGES,
    enableBrowserTranslation,
    googleTranslateReady,
    isRTL: direction === 'rtl',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
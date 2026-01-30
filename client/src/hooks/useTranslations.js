// hooks/useBrowserTranslation.js - VERSION ULTRA SIMPLE
import { useState, useEffect } from 'react';

const useTranslations = () => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        // 1. Détecter la langue
        const browserLang = navigator.language || navigator.userLanguage || 'en';
        const langCode = browserLang.split('-')[0];
        
        // 2. Configurer le HTML pour la traduction automatique
        const html = document.documentElement;
        html.lang = langCode;
        html.setAttribute('translate', 'yes');
        
        // 3. Informer l'utilisateur
        console.log(`🌍 Browser auto-translation enabled for: ${langCode}`);
        
        setLanguage(langCode);
        
        // 4. Nettoyage
        return () => {
            // Optionnel: Retirer l'attribut si nécessaire
            // html.removeAttribute('translate');
        };
    }, []);

    // Fonction pour empêcher la traduction sur des éléments spécifiques
    const disableTranslation = (element) => {
        if (element && element.setAttribute) {
            element.setAttribute('translate', 'no');
            element.setAttribute('data-no-translate', 'true');
        }
    };

    // Fonction pour activer la traduction sur des éléments spécifiques
    const enableTranslation = (element) => {
        if (element && element.setAttribute) {
            element.setAttribute('translate', 'yes');
            element.removeAttribute('data-no-translate');
        }
    };

    return {
        language,
        disableTranslation,
        enableTranslation,
        // Objet config pour les attributs HTML
        config: {
            translate: 'yes',
            lang: language
        }
    };
};

export default useTranslations;
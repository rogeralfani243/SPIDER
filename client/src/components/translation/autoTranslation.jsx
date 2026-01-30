// components/SimpleTranslateWrapper.jsx
import React, { useEffect } from 'react';

const AutoTranslateWrapper = ({ children }) => {
  useEffect(() => {
    // La méthode la plus sûre : laisser le navigateur gérer la traduction
    // sans aucune manipulation directe du DOM
    
    // 1. Définir la langue sur l'élément HTML
    const html = document.documentElement;
    const lang = navigator.language.split('-')[0];
    html.lang = lang;
    
    // 2. Activer la traduction (le navigateur le gérera automatiquement)
    // Chrome/Edge montreront l'icône de traduction automatiquement
    
    // 3. Ajouter un bouton manuel optionnel (sans interférer avec React)

    
    // Attendre que React ait rendu le contenu
    
 
  }, []);

  return <>{children}</>;
};

export default AutoTranslateWrapper;
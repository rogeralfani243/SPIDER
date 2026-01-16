// hooks/useScrollPreservation.js
import { useEffect, useRef } from 'react';

export const useScrollPreservation = (dependencies = []) => {
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Récupérer la position sauvegardée
    const savedScrollPosition = localStorage.getItem('scrollPosition');
    
    if (savedScrollPosition && !hasLoaded.current) {
      // Restaurer après un court délai pour permettre au DOM de se charger
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition, 10));
        localStorage.removeItem('scrollPosition'); // Nettoyer
      }, 100);
      
      hasLoaded.current = true;
    }

    // Sauvegarder la position avant déchargement
    const saveScrollPosition = () => {
      localStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', saveScrollPosition);
    
    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
      // Sauvegarder aussi sur changement de route
      localStorage.setItem('scrollPosition', window.scrollY.toString());
    };
  }, dependencies);
};
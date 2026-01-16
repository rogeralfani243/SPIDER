// src/components/security/SecurityInterceptor.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SecurityViolationPage from './SecurityInterceptorPage';

// Service de sécurité pour suivre les violations
class SecurityService {
  constructor() {
    this.violations = [];
    this.maxViolations = 5;
    this.resetTime = 5 * 60 * 1000; // 5 minutes
    this.blockedIPs = new Set();
  }

  // Vérifier si une route nécessite des permissions spéciales
  isRestrictedRoute(path) {
    const restrictedPatterns = [
//      /\/groups\/\d+\/admin/,        // Panneau admin groupe
      /\/admin\/.*/,               // Toutes les routes admin
      /\/settings\/security/,        // Paramètres de sécurité
      /\/api\/.*\/admin/,            // API admin
      /\/users\/\d+\/edit/,          // Édition utilisateur
      /\/database\/.*/,              // Accès base de données
      /\/server\/.*/,                // Infos serveur
      /\/config\/.*/,                // Configuration
      /\/logs\/.*/,                  // Logs système
    ];
    
    return restrictedPatterns.some(pattern => pattern.test(path));
  }

  // Enregistrer une violation
  logViolation(userId, path, reason) {
    const violation = {
      userId,
      path,
      reason,
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
    };

    this.violations.push(violation);
    
    // Garder seulement les dernières violations
    if (this.violations.length > 50) {
      this.violations = this.violations.slice(-50);
    }

    // Sauvegarder dans localStorage pour persistance
    this.saveViolations();
    
    // Bloquer l'IP si trop de violations
    if (this.getViolationCount(userId, this.getClientIP()) > this.maxViolations) {
      this.blockedIPs.add(this.getClientIP());
      setTimeout(() => {
        this.blockedIPs.delete(this.getClientIP());
      }, this.resetTime);
    }

    // Envoyer une notification au serveur (si connecté)
    this.reportToServer(violation);
    
    return violation;
  }

  // Obtenir le nombre de violations pour un utilisateur/IP
  getViolationCount(userId, ip) {
    const fiveMinutesAgo = new Date(Date.now() - this.resetTime);
    return this.violations.filter(v => 
      (v.userId === userId || v.ip === ip) && 
      new Date(v.timestamp) > fiveMinutesAgo
    ).length;
  }

  // Vérifier si l'utilisateur/IP est bloqué
  isBlocked(userId, ip) {
    return this.blockedIPs.has(ip) || this.getViolationCount(userId, ip) > this.maxViolations;
  }

  // Obtenir l'IP client (simplifié pour le frontend)
  getClientIP() {
    // Note: En production, utilisez un service d'IP réelle
    return 'client-' + Math.random().toString(36).substr(2, 9);
  }

  // Sauvegarder les violations
  saveViolations() {
    try {
      localStorage.setItem('security_violations', JSON.stringify(this.violations));
    } catch (error) {
      console.error('Failed to save security violations:', error);
    }
  }

  // Charger les violations
  loadViolations() {
    try {
      const saved = localStorage.getItem('security_violations');
      if (saved) {
        this.violations = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load security violations:', error);
    }
  }

  // Reporter au serveur (simulé)
  async reportToServer(violation) {
    try {
      // Envoyer l'information au backend pour logging
      await fetch('/api/security/log-violation/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(violation),
      });
    } catch (error) {
      console.error('Failed to report violation to server:', error);
    }
  }

  // Obtenir les statistiques de sécurité
  getSecurityStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysViolations = this.violations.filter(
      v => new Date(v.timestamp) >= today
    );
    
    const userViolations = {};
    todaysViolations.forEach(v => {
      userViolations[v.userId] = (userViolations[v.userId] || 0) + 1;
    });

    return {
      totalViolations: this.violations.length,
      todaysViolations: todaysViolations.length,
      uniqueUsers: Object.keys(userViolations).length,
      blockedIPs: this.blockedIPs.size,
    };
  }

  // Réinitialiser les violations (pour les tests)
  reset() {
    this.violations = [];
    this.blockedIPs.clear();
    localStorage.removeItem('security_violations');
  }
}

// Instance globale du service de sécurité
export const securityService = new SecurityService();

// Hook personnalisé pour vérifier les permissions
export const useSecurity = () => {
  const [userPermissions, setUserPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        if (!token) {
          setUserPermissions({ isAuthenticated: false });
          setIsLoading(false);
          return;
        }

        // Charger les permissions depuis le serveur
        const response = await fetch('/api/auth/permissions/', {
          headers: {
            'Authorization': `Token ${token}`,
          },
        });

        if (response.ok) {
          const permissions = await response.json();
          setUserPermissions({
            isAuthenticated: true,
            ...permissions,
          });
        } else {
          setUserPermissions({ isAuthenticated: false });
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        setUserPermissions({ isAuthenticated: false });
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Vérifier une permission spécifique
  const hasPermission = (permission) => {
    if (!userPermissions.isAuthenticated) return false;
    return userPermissions[permission] === true;
  };

  // Vérifier si l'utilisateur est admin
  const isAdmin = () => {
    return hasPermission('is_admin') || hasPermission('is_superuser');
  };

  // Vérifier si l'utilisateur est le créateur d'une ressource
  const isCreator = (resourceCreatorId) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id === resourceCreatorId;
  };

  return {
    userPermissions,
    isLoading,
    hasPermission,
    isAdmin,
    isCreator,
  };
};

// Composant Intercepteur de sécurité
const SecurityInterceptor = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [securityAlert, setSecurityAlert] = useState(null);
  const { userPermissions, isLoading } = useSecurity();

  useEffect(() => {
    // Charger les violations sauvegardées
    securityService.loadViolations();

    // Vérifier les permissions pour la route actuelle
    const checkRouteSecurity = async () => {
      if (isLoading) return;

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const path = location.pathname;

      // Vérifier si la route est restreinte
      if (securityService.isRestrictedRoute(path)) {
        // Vérifier si l'utilisateur a les permissions nécessaires
        if (!userPermissions.isAuthenticated) {
          const violation = securityService.logViolation(
            user.id || 'anonymous',
            path,
            'Unauthenticated access attempt to restricted route'
          );
          
          setSecurityAlert({
            type: 'unauthorized',
            violation,
            path,
          });
          return;
        }

        // Vérifier les permissions spécifiques selon la route
        if (path.includes('/admin') && !userPermissions.is_admin) {
          const violation = securityService.logViolation(
            user.id,
            path,
            'Non-admin user attempted to access admin panel'
          );
          
          setSecurityAlert({
            type: 'insufficient_permissions',
            violation,
            path,
          });
        }
      }

      // Vérifier si l'utilisateur/IP est bloqué
      if (securityService.isBlocked(user.id, securityService.getClientIP())) {
        const violation = securityService.logViolation(
          user.id,
          path,
          'Blocked user/IP attempted access'
        );
        
        setSecurityAlert({
          type: 'blocked',
          violation,
          path,
        });
      }
    };

    checkRouteSecurity();
  }, [location, userPermissions, isLoading]);

  // Si une alerte de sécurité est détectée, afficher la page de violation
  if (securityAlert) {
    return (
      <SecurityViolationPage
        violation={securityAlert.violation}
        violationType={securityAlert.type}
        onContinue={() => {
          setSecurityAlert(null);
          navigate('/');
        }}
      />
    );
  }

  // Sinon, afficher le contenu normal
  return children;
};

export default SecurityInterceptor;
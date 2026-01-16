import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import { useAuth } from './hooks/useAuth.js';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { WebSocketProvider } from './hooks/messaging/webSocketContext.js';
import SecurityInterceptor from './components/messaging/securtity/SecurityInterceptor.jsx';
import AppRoutes from './components/app/AppRoutes';
import AppLayout from './components/app/AppLayout.jsx';
import NotificationContainer from './components/notifications/NotificationContainer';
import DashboardMain from './components/dashboard_main';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './contexts/LanguageSelector.jsx'

// Composant wrapper pour la langue
const AppContent = ({ children, isAuthenticated, user, onLogin, onLogout, loading }) => {
  const { enableBrowserTranslation } = useLanguage();
  
  useEffect(() => {
    // Activer la traduction navigateur
    enableBrowserTranslation();
  }, [enableBrowserTranslation]);

  if (loading) {
    return <AppLayout.LoadingScreen />;
  }

  return (
    <div className="App">
      {isAuthenticated && (
        <div className='profile-dashboard'>
          <DashboardMain className='dashboard-main' />
        </div>
      )}
      
      {/* Sélecteur de langue */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        backgroundColor: 'white',
        padding: '5px',
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      }}>
        <LanguageSelector compact />
      </div>
      
      {children}
      <NotificationContainer />
      <SecurityBadge />
    </div>
  );
};

function App() {
  const { user, loading, login, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    // Configuration du charset UTF-8
    configureCharset();
  }, []);

  useEffect(() => {
    console.log('🔐 Auth state changed:', { isAuthenticated, user: user?.username });
  }, [isAuthenticated, user]);

  const configureCharset = () => {
    // La langue sera gérée par LanguageContext
    document.documentElement.dir = 'ltr';
    
    const metaCharset = document.querySelector('meta[charset]');
    if (metaCharset) {
      metaCharset.setAttribute('charset', 'UTF-8');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('charset', 'UTF-8');
      document.head.appendChild(meta);
    }
    
    const metaContentType = document.querySelector('meta[http-equiv="Content-Type"]');
    if (!metaContentType) {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Type');
      meta.setAttribute('content', 'text/html; charset=UTF-8');
      document.head.appendChild(meta);
    }
  };

  const handleLogin = async (loginData) => {
    console.log('🔐 Login attempt with username:', loginData.username);
    return await login(loginData.username, loginData.password);
  };

  const handleLogout = () => {
    console.log('🛡️ User logout:', user?.username);
    logout();
  };

  return (
    <LanguageProvider>
      <NotificationProvider>
        <Router>
          <SecurityInterceptor>
            <AppContent
              isAuthenticated={isAuthenticated}
              user={user}
              onLogin={handleLogin}
              onLogout={handleLogout}
              loading={loading}
            >
              <AppRoutes 
                isAuthenticated={isAuthenticated}
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
            </AppContent>
          </SecurityInterceptor>
        </Router>
      </NotificationProvider>
    </LanguageProvider>
  );
}

const SecurityBadge = () => (
  <div style={{
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    fontSize: '10px',
    opacity: 0.7,
    zIndex: 1000,
  }}>
    🛡️ Security System Active
  </div>
);

export default App;
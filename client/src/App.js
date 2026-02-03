// App.js
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
import { Box } from 'lucide-react';
import DashboardMain from './components/dashboard_main';
import AutoTranslateWrapper from './components/translation/autoTranslation.jsx';
import useAutoTranslate from './hooks/useTranslations';
import useTranslations from './hooks/useTranslations';
import usePWAInstall from './utils/useInstall.js';
import appLogger from './AppLogger.js'; // Importez le nouveau logger

function App() {
  const { InstallPromptModal } = usePWAInstall();
  const { translateText, language } = useAutoTranslate();
  const { user, loading, login, logout, isAuthenticated, verifyAndLogin } = useAuth();
  
  useTranslations();

  useEffect(() => {
    configureCharset();
  }, []);

  useEffect(() => {
    // Log la langue détectée (seulement en développement)
    appLogger.debug(`Langue du navigateur détectée: ${language}`);
  }, [isAuthenticated, user, language]);

  const configureCharset = () => {
    // ... votre code existant ...
    appLogger.debug('Charset configured'); // Seulement en dev
  };

  const handleLogin = async (loginData) => {
    if (loginData.token) {
      // Traduire le message de succès
      const successMessage = await translateText('Email verification success');
      appLogger.success(successMessage); // Seulement en dev
      
      if (loginData.user) {
        localStorage.setItem('user', JSON.stringify(loginData.user));
      }
      
      if (verifyAndLogin) {
        return await verifyAndLogin(loginData.token, loginData.user);
      }
      
      return { success: true, user: loginData.user };
    } else {
      return await login(loginData.username, loginData.password);
    }
  };

  const handleLogout = () => {
    appLogger.info('User logout', user?.username); // Seulement en dev
    logout();
  };

  if (loading) {
    appLogger.debug('App loading...'); // Seulement en dev
    return <AppLayout.LoadingScreen />;
  }
  
  appLogger.debug('App rendering', { isAuthenticated, user: user?.username }); // Seulement en dev

  return (
    <NotificationProvider>
      <Router>
        <SecurityInterceptor>
          <AutoTranslateWrapper>
            <div className="App">
              {isAuthenticated && (
                <div className='profile-dashboard'>
                  <DashboardMain className='dashboard-main' />
                </div>
              )}
              
              <AppRoutes 
                isAuthenticated={isAuthenticated}
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <InstallPromptModal />
              <NotificationContainer />
            </div>
          </AutoTranslateWrapper>
        </SecurityInterceptor>
      </Router>
    </NotificationProvider>
  );
}

export default App;
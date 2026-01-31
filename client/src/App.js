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
import { appLogger } from './utils/logger';
import AutoTranslateWrapper from './components/translation/autoTranslation.jsx';
import useAutoTranslate from './hooks/useTranslations';
import useTranslations from './hooks/useTranslations';
import usePWAInstall from './utils/usePWAInstall';
function App() {
  const { InstallPromptModal } = usePWAInstall();
  const { translateText, language } = useAutoTranslate(); // Ajoutez ce hook
  const { user, loading, login, logout, isAuthenticated, verifyAndLogin } = useAuth();
  useTranslations();
  useEffect(() => {
    configureCharset();
  }, []);

  useEffect(() => {
    // Log la langue détectée
    appLogger.debug(`Langue du navigateur détectée: ${language}`);
  }, [isAuthenticated, user, language]);

  const configureCharset = () => {
    // ... votre code existant ...
     appLogger.debug('Charset configured');
  };

  const handleLogin = async (loginData) => {
    if (loginData.token) {
      // Traduire le message de succès
      const successMessage = await translateText('Email verification success');
      appLogger.success(successMessage);
      
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
    appLogger.info('User logout', user?.username);
    logout();
  };

  if (loading) {
    appLogger.debug('App loading...');
    return <AppLayout.LoadingScreen />;
  }
  
  appLogger.debug('App rendering', { isAuthenticated, user: user?.username });

  return (
    <NotificationProvider>
      <Router>
        <SecurityInterceptor>
          {/* Enveloppez votre application avec le traducteur automatique */}
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
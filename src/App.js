import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import { useAuth } from './useAuth.js';
import { NotificationProvider } from '../client/src/contexts/NotificationContext.jsx';
import { WebSocketProvider } from './hooks/messaging/webSocketContext.js';
import SecurityInterceptor from '../client/src/components/messaging/securtity/SecurityInterceptor.jsx';
import AppRoutes from '../client/src/components/app/AppRoutes';
import AppLayout from '../client/src/components/app/AppLayout.jsx';
import NotificationContainer from '../client/src/components/notifications/NotificationContainer';
import { Box } from 'lucide-react';
import DashboardMain from '../client/src/components/dashboard_main';

function App() {
  const { user, loading, login, logout, isAuthenticated, verifyAndLogin } = useAuth();

  useEffect(() => {
    configureCharset();
  }, []);

  useEffect(() => {
    console.log('🔐 Auth state changed:', { isAuthenticated, user: user?.username });
  }, [isAuthenticated, user]);

  const configureCharset = () => {
    // ... votre code existant ...
  };

  // Modifiez cette fonction pour accepter aussi la vérification
  const handleLogin = async (loginData) => {
    console.log('🔐 Login attempt with data:', loginData);
    
    if (loginData.token) {
      // C'est une vérification d'email, pas un login normal
      console.log('✅ Email verification success, token received');
      
      // Stocker le token et les infos utilisateur
      if (loginData.user) {
        localStorage.setItem('user', JSON.stringify(loginData.user));
      }
      
      // Mettre à jour l'état d'authentification
      if (verifyAndLogin) {
        return await verifyAndLogin(loginData.token, loginData.user);
      }
      
      return { success: true, user: loginData.user };
    } else {
      // C'est un login normal
      return await login(loginData.username, loginData.password);
    }
  };

  const handleLogout = () => {
    console.log('🛡️ User logout:', user?.username);
    logout();
  };

  if (loading) {
    return <AppLayout.LoadingScreen />;
  }

  return (
    <NotificationProvider>
      <Router>
        <SecurityInterceptor>
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
            
            <NotificationContainer />
          </div>
        </SecurityInterceptor>
      </Router>
    </NotificationProvider>
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
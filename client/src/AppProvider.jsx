import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import ProfilDetail from './components/profile/ProfilDetail.jsx'
import Main from './components/home.jsx';
import Login from './components/Login.jsx';
import DashboardMain from './components/dashboard_main.jsx';
import UserProfileBar from './components/profile/UserProfilBar.jsx';
import { useAuth } from './hooks/useAuth.js';
import ProfileModif from './components/profile/ProfilModif.jsx';
import CategoryProfiles from './components/profile/CategoryProfiles.jsx'
import PostDetail from './components/posts/PostDetail.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import NotificationContainer from './components/notifications/NotificationContainer';
import PostCreate from './components/create_post/PostCreate.jsx';
import PostList from './components/posts/main_post/PostList.jsx';
import AudioPlayerPage from './components/posts/media_section/AudioPlayerPage.jsx';
import EditPost from './components/posts/EditPost.jsx';
import SoftwareCategory from './components/posts/main_post/category/SoftwareCategory.jsx'
import { WebSocketProvider } from './hooks/messaging/webSocketContext.js';
import GroupExplorePage from './components/messaging/GroupExplorerPage.jsx';
import GroupDetailPage from './components/messaging/Groups/GroupDetailPage.jsx';
import GroupCreatePage from './components/messaging/Groups/GroupCreatePage.jsx';
import GroupEditPage from './components/messaging/Groups/GroupEditPage.jsx';
import GroupAdminPanel from './components/messaging/Groups/GroupAdminPanel.jsx';
import GroupPermissionGuard from './components/messaging/securtity/GroupPermissionGuard.jsx'
import MyReport from './components/reports/reportList.jsx';
import SearchPage from './components/search-main/SearchPage.jsx'
import Dashboard from './components/dashbord-table/dashboard.jsx';
// 🛡️ Import du système de sécurité
import SecurityInterceptor, { 
  securityService, 
  useSecurity 
} from './components/messaging/securtity/SecurityInterceptor.jsx';
import SecurityViolationPage from './components/messaging/securtity/SecurityInterceptorPage.jsx';
import SecurityLogsPage from './components/messaging/securtity/SecurityLogsPage.jsx';
import PolicyPage from './components/policy/policy.jsx'
//Pages
import Messaging from './pages/Messaging.jsx'
import Faq from './components/faq/Faq.jsx'
// 🛡️ Protected Route avec vérification de sécurité
function PrivateRoute({ children, requireAdmin = false, requireCreator = false }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { userPermissions, isLoading: securityLoading } = useSecurity();

  if (authLoading || securityLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔒 Verifying permissions...
      </div>
    );
  }

  // Vérifier l'authentification
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier les permissions admin si requises
  if (requireAdmin && !userPermissions.is_admin) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    securityService.logViolation(
      user.id,
      window.location.pathname,
      'Non-admin user attempted to access admin-only route'
    );
    return <Navigate to="/security/violation" replace />;
  }

  return children;
}

// 🛡️ Public Route avec vérification de sécurité
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔒 Security check...
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

// 🛡️ Composant pour les routes admin
function AdminRoute({ children }) {
  return <PrivateRoute requireAdmin={true}>{children}</PrivateRoute>;
}

// 🛡️ Composant pour les routes créateur
function CreatorRoute({ children, resourceCreatorId }) {
  const { isCreator } = useSecurity();
  
  if (!isCreator(resourceCreatorId)) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    securityService.logViolation(
      user.id,
      window.location.pathname,
      'Non-creator user attempted to access creator-only resource'
    );
    return <Navigate to="/security/violation" replace />;
  }
  
  return children;
}

function ProviderApp() {
  const { user, loading, login, logout, isAuthenticated } = useAuth();
 useEffect(() => {
    // Forcer le charset UTF-8
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    
    const metaCharset = document.querySelector('meta[charset]');
    if (metaCharset) {
      metaCharset.setAttribute('charset', 'UTF-8');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('charset', 'UTF-8');
      document.head.appendChild(meta);
    }
    
    // Ajouter un meta pour le content-type
    const metaContentType = document.querySelector('meta[http-equiv="Content-Type"]');
    if (!metaContentType) {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Type');
      meta.setAttribute('content', 'text/html; charset=UTF-8');
      document.head.appendChild(meta);
    }
  }, []);
  useEffect(() => {
    console.log('🔐 Auth state changed:', { isAuthenticated, user: user?.username });
    
    // Initialiser le service de sécurité au chargement
    securityService.loadViolations();
    
    // Logger le démarrage de session
    if (isAuthenticated && user) {
      console.log('🛡️ Security system initialized for user:', user.username);
    }
  }, [isAuthenticated, user]);

  const handleLogin = async (loginData) => {
    console.log('🔐 Login attempt with username:', loginData.username);
    
    const result = await login(loginData.username, loginData.password);
    
    if (result.success) {
      console.log('✅ Login successful in App.js');
      // Reset les violations après un login réussi
      securityService.loadViolations();
    } else {
      console.error('❌ Login failed in App.js:', result.error);
    }
    
    return result;
  };

  const handleLogout = () => {
    // Logger la déconnexion
    if (user) {
      console.log('🛡️ User logout:', user.username);
    }
    
    // Logout via useAuth
    logout();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
          <div>Loading security system...</div>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <Router>
        {/* 🛡️ Intercepteur de sécurité global */}
        <SecurityInterceptor>
          <div className="App">
            <Routes>
              {/* Public Route - Only accessible when NOT authenticated */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login onLogin={handleLogin} />
                  </PublicRoute>
                } 
              />

              {/* 🛡️ Routes de sécurité */}
              <Route 
                path="/security/violation" 
                element={
                  <SecurityViolationPage 
                    onContinue={() => window.location.href = '/'}
                  />
                } 
              />
              
              <Route 
                path="/security/logs" 
                element={
                  <AdminRoute>
                    <SecurityLogsPage />
                  </AdminRoute>
                } 
              />

              {/* Protected Routes - Only accessible when authenticated */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <di>
                          <div className='profile-dashboard'>
                                 <DashboardMain className='dashboard-main' onLogout={handleLogout}  />
                               </div>
                      <main >
                        <UserProfileBar />
                      </main>
                    </di>
                  </PrivateRoute>
                }
              />
      {/* Route for Policy */}
              <Route path="policy/" element={
             
                  <PolicyPage />
      
              } />
              {/* Route for Policy */}
              <Route path="faq/" element={
             
                  <Faq />
      
              } />
              {/* Route for Messaging */}
              <Route path="message" element={
                <PrivateRoute>
                  <Messaging />
                </PrivateRoute>
              } />
              
              <Route path="message/:conversationId" element={
                <PrivateRoute>
                  <Messaging />
                </PrivateRoute>
              } />

              <Route path="/profiles/category/:categoryId" element={
                <PrivateRoute>
                  <CategoryProfiles />
                </PrivateRoute>
              } />
              
              <Route path="/profile/:profileId" element={
                <PrivateRoute>
                  <ProfilDetail />
                </PrivateRoute>
              } />
              
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfileModif onClose={() => window.history.back()} />
                  </PrivateRoute>
                }
              />

              <Route 
                path="/profile/:profileId/followers" 
                element={
                  <PrivateRoute>
                    <ProfilDetail />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/profile/:profileId/following" 
                element={
                  <PrivateRoute>
                    <ProfilDetail />
                  </PrivateRoute>
                } 
              />
                
              <Route 
                path="/create-post" 
                element={
                  <PrivateRoute>
                    <PostCreate />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/user/:userId/posts/:postId" 
                element={
                  <PrivateRoute>
                    <PostDetail />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/audio-player/:mediaId"
                element={
                  <PrivateRoute>
                    <AudioPlayerPage />
                  </PrivateRoute>
                } 
              />
              
              <Route path="/audio-player" element={
                <PrivateRoute>
                  <AudioPlayerPage />
                </PrivateRoute>
              } />
              
              <Route 
                path="/posts" 
                element={
                  <PrivateRoute>
                    <PostList />
                  </PrivateRoute>
                } 
              />
              
              <Route path='/posts/edit/:postId' element={
                <PrivateRoute>
                  <EditPost />
                </PrivateRoute>
              } />

              {/* Group Links */}
              <Route path='/groups' element={
                <PrivateRoute>
                  <GroupExplorePage />
                </PrivateRoute>
              } />
              
              <Route path='/groups/:id' element={
                <PrivateRoute>
                  <GroupDetailPage />
                </PrivateRoute>
              } />
              
              <Route path='/groups/create' element={
                <PrivateRoute>
                  <GroupCreatePage />
                </PrivateRoute>
              } />
              
              <Route path='/groups/:id/edit' element={
                <PrivateRoute>
                  <GroupEditPage />
                </PrivateRoute>
              } />
               <Route path='/search' element={
                <PrivateRoute>
                  <SearchPage />
                </PrivateRoute>
              } />
              <Route path='/dashboard' element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              {/* 🛡️ Group Admin Panel avec vérification automatique */}
              <Route path='/groups/:groupId/admin' element={
                <PrivateRoute>
              <GroupPermissionGuard requireAdmin={true}>
                    <GroupAdminPanel />
              </GroupPermissionGuard>
                </PrivateRoute>
              } />

              {/* Category link */}
              <Route path='/posts/software' element={
                <PrivateRoute>
                  <SoftwareCategory />
                </PrivateRoute>
              } />

              {/* 🛡️ Routes Admin Globales */}
              <Route path='/admin/report' element={
                <AdminRoute>
                  <div>Admin Dashboard</div>
                </AdminRoute>
              } />
               <Route path='/report' element={
          <PrivateRoute>
                    <MyReport/>
                </PrivateRoute>
            
          
              } />
                {/* 🛡️ Routes Admin Globales */}
              <Route path='/admin/dashboard' element={
                <AdminRoute>
                  <div>Admin Dashboard</div>
                </AdminRoute>
              } />
              
              <Route path='/admin/users' element={
                <AdminRoute>
                  <div>User Management</div>
                </AdminRoute>
              } />
              
              <Route path='/admin/settings' element={
                <AdminRoute>
                  <div>System Settings</div>
                </AdminRoute>
              } />

              {/* Redirect unknown routes */}
              <Route 
                path="*" 
                element={
                  <Navigate to={isAuthenticated ? "/" : "/login"} replace /> 
                } 
              />
            </Routes>
            
            <NotificationContainer />
            
            {/* 🛡️ Badge de sécurité dans le footer (optionnel) */}
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
          </div>
        </SecurityInterceptor>
      </Router>
    </NotificationProvider>
  );
}

export default ProviderApp;
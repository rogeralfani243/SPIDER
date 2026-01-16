import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute.jsx';
import PublicRoute from './PublicRoute.jsx';
import AdminRoute from './AdminRoute.jsx';

// Import des pages
import Login from '../Login.jsx';
import DashboardMain from '../dashboard_main.jsx';
import UserProfileBar from '../profile/UserProfilBar.jsx';
import PolicyPage from '../policy/policy.jsx';
import Faq from '../faq/Faq.jsx';
import Messaging from '../../pages/Messaging.jsx';
import CategoryProfiles from '../profile/CategoryProfiles.jsx';
import ProfilDetail from '../profile/ProfilDetail.jsx';
import ProfileModif from '../profile/ProfilModif.jsx';
import PostCreate from '../create_post/PostCreate.jsx';
import PostDetail from '../posts/PostDetail.jsx';
import AudioPlayerPage from '../posts/media_section/AudioPlayerPage.jsx';
import PostList from '../posts/main_post/PostList.jsx';
import EditPost from '../posts/EditPost.jsx';
import GroupExplorePage from '../messaging/GroupExplorerPage.jsx';
import GroupDetailPage from '../messaging/Groups/GroupDetailPage.jsx';
import GroupCreatePage from '../messaging/Groups/GroupCreatePage.jsx';
import GroupEditPage from '../messaging/Groups/GroupEditPage.jsx';
import GroupAdminPanel from '../messaging/Groups/GroupAdminPanel.jsx';
import SearchPage from '../search-main/SearchPage.jsx';
import Dashboard from '../dashbord-table/dashboard.jsx';
import MyReport from '../reports/reportList.jsx';
import SoftwareCategory from '../posts/main_post/category/SoftwareCategory.jsx';
import SecurityViolationPage from '../messaging/securtity/SecurityInterceptorPage.jsx';
import SecurityLogsPage from '../messaging/securtity/SecurityLogsPage.jsx';
import NotificationContainer from '../notifications/NotificationContainer';
import GroupPermissionGuard from '../messaging/securtity/GroupPermissionGuard.jsx';

const AppRoutes = ({ isAuthenticated, user, onLogin, onLogout }) => {
  return (
    <>
      <Routes>
        {/* Public Routes */}

        <Route 
          path="/login" 
          element={
            <PublicRoute isAuthenticated={isAuthenticated}>
              <Login onLogin={onLogin} />
            </PublicRoute>
          } 
        />

        {/* Security Routes */}
        <Route 
          path="/security/violation" 
          element={<SecurityViolationPage onContinue={() => window.location.href = '/'} />} 
        />
        
        <Route 
          path="/security/logs" 
          element={
            <AdminRoute>
              <SecurityLogsPage />
            </AdminRoute>
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <div>
                <div className='profile-dashboard'>
                  <DashboardMain className='dashboard-main' onLogout={onLogout} />
                </div>
                <main>
                  <UserProfileBar />
                </main>
              </div>
            </PrivateRoute>
          }
        />

        {/* Public Pages */}
        <Route path="policy/" element={<PolicyPage />} />
        <Route path="faq/" element={<Faq />} />

        {/* Messaging Routes */}
        <Route path="message" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <Messaging />
          </PrivateRoute>
        } />
        
        <Route path="message/:conversationId" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <Messaging />
          </PrivateRoute>
        } />

        {/* Profile Routes */}
        <Route path="/profiles/category/:categoryId" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <CategoryProfiles />
          </PrivateRoute>
        } />
        
        <Route path="/profile/:profileId" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <ProfilDetail />
          </PrivateRoute>
        } />
        
        <Route path="/profile" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <ProfileModif onClose={() => window.history.back()} />
          </PrivateRoute>
        } />

        {/* Post Routes */}
        <Route path="/create-post" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <PostCreate />
          </PrivateRoute>
        } />
        
        <Route path="/user/:userId/posts/:postId" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <PostDetail />
          </PrivateRoute>
        } />
        
        <Route path="/audio-player/:mediaId" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <AudioPlayerPage />
          </PrivateRoute>
        } />
        
        <Route path="/audio-player" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <AudioPlayerPage />
          </PrivateRoute>
        } />
        
        <Route path="/posts" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <PostList />
          </PrivateRoute>
        } />
        
        <Route path="/posts/edit/:postId" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <EditPost />
          </PrivateRoute>
        } />

        {/* Group Routes */}
        <Route path="/groups" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <GroupExplorePage />
          </PrivateRoute>
        } />
        
        <Route path="/groups/:id" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <GroupDetailPage />
          </PrivateRoute>
        } />
        
        <Route path="/groups/create" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <GroupCreatePage />
          </PrivateRoute>
        } />
        
        <Route path="/groups/:id/edit" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <GroupEditPage />
          </PrivateRoute>
        } />

        {/* Search and Dashboard */}
        <Route path="/search" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <SearchPage />
          </PrivateRoute>
        } />
        
        <Route path="/dashboard" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <Dashboard />
          </PrivateRoute>
        } />

        {/* Group Admin Panel */}
        <Route path="/groups/:groupId/admin" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <GroupPermissionGuard requireAdmin={true}>
              <GroupAdminPanel />
            </GroupPermissionGuard>
          </PrivateRoute>
        } />

        {/* Category Routes */}
        <Route path="/posts/software" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <SoftwareCategory />
          </PrivateRoute>
        } />

        {/* Report Routes */}
        <Route path="/report" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <MyReport />
          </PrivateRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <div>Admin Dashboard</div>
          </AdminRoute>
        } />
        
        <Route path="/admin/users" element={
          <AdminRoute>
            <div>User Management</div>
          </AdminRoute>
        } />
        
        <Route path="/admin/settings" element={
          <AdminRoute>
            <div>System Settings</div>
          </AdminRoute>
        } />

        {/* Redirect unknown routes */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} 
        />
      </Routes>
      
      <NotificationContainer />
   
    </>
  );
};
export default AppRoutes;
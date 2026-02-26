// src/components/dashboard-admin/dashboardAdmin.jsx
import React, { useState, useEffect } from 'react';
import AdminLayout from './Tabs/AdminLayout';
import DashboardView from './Tabs/DashboardView';
import UsersView from './Tabs/UsersView';
import PostsView from './Tabs/PostsView';
import ReportsView from './Tabs/ReportsView';
import CertificationsView from './Tabs/CertificationsView';
import PaymentsView from './Tabs/PaymentsView';
import CommentsView from './Tabs/CommentsView'; // NOUVEAU
import { useAdminData } from '../../hooks/useAdminData.js';
import GroupsView from './Tabs/GroupsView';
const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    loading,
    stats,
    users,
    reports,
    posts,
    certifications,
    payments,
    fetchDashboardStats,
    fetchUsers,
    fetchReports,
    fetchPosts,
    fetchCertifications,
    fetchPayments,
    searchAdmin,
    showSnackbar,
    snackbar
  } = useAdminData();

  // Initial load
  useEffect(() => {
    fetchDashboardStats();
    fetchUsers();
    fetchReports();
    fetchPosts();
    fetchCertifications();
    fetchPayments();
  }, []);

  // Load data based on current view
  useEffect(() => {
    switch (currentView) {
      case 'dashboard':
        fetchDashboardStats();
        break;
      case 'users':
        fetchUsers(searchQuery);
        break;
      case 'posts':
        fetchPosts(searchQuery);
        break;
      case 'reports':
        fetchReports(searchQuery);
        break;
      case 'certifications':
        fetchCertifications(searchQuery);
        break;
      case 'payments':
        fetchPayments(searchQuery);
        break;
      case 'comments': // NOUVEAU
        // Les commentaires sont gérés directement dans CommentsView avec useAdminApi
        break;
      case 'groups': // NOUVEAU
         break;
    }
  }, [currentView, searchQuery]);

  const handleGlobalSearch = async () => {
    if (searchQuery.length < 2) return;
    await searchAdmin(searchQuery, currentView);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView stats={stats} />;
      case 'users':
        return <UsersView users={users} loading={loading} />;
      case 'posts':
        return <PostsView posts={posts} loading={loading} />;
      case 'reports':
        return <ReportsView reports={reports} loading={loading} />;
      case 'certifications':
        return <CertificationsView certifications={certifications} loading={loading} />;
      case 'payments':
        return <PaymentsView payments={payments} loading={loading} />;
      case 'comments': // NOUVEAU
        return <CommentsView searchQuery={searchQuery} />;

        case 'groups': // NOUVEAU
          return <GroupsView searchQuery={searchQuery} />;
      default:
        return <DashboardView stats={stats} />;
    }
  };

  return (
    <AdminLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onSearch={handleGlobalSearch}
      stats={stats}
      snackbar={snackbar}
      onCloseSnackbar={() => showSnackbar('', 'success', false)}
    >
      {renderView()}
    </AdminLayout>
  );
};

export default AdminDashboard;
// src/components/dashboard-admin/hooks/useAdminData.js
import { useState, useCallback } from 'react';
import useAdminApi from './useAdminApi';

export const useAdminData = () => {
  const adminApi = useAdminApi();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = useCallback((message, severity = 'success', open = true) => {
    setSnackbar({ open, message, severity });
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();
      if (response.status === 'success') {
        setStats(response.data);
      } else {
        showSnackbar(response.message || 'Error loading stats', 'error');
      }
    } catch (error) {
      showSnackbar('Error loading dashboard stats', 'error');
    } finally {
      setLoading(false);
    }
  }, [adminApi, showSnackbar]);

  const fetchUsers = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const response = await adminApi.getUsersList({ search });
      setUsers(response.data?.data || []);
    } catch (error) {
      showSnackbar('Error loading users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [adminApi, showSnackbar]);

  const fetchReports = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const response = await adminApi.getReportsList({ search });
      setReports(response.data?.reports || []);
    } catch (error) {
      showSnackbar('Error loading reports', 'error');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [adminApi, showSnackbar]);

  const fetchPosts = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const response = await adminApi.getPostsList({ search });
      setPosts(response.data?.data || []);
    } catch (error) {
      showSnackbar('Error loading posts', 'error');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [adminApi, showSnackbar]);

  const fetchCertifications = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const response = await adminApi.getCertificationsList({ search });
      setCertifications(response.data?.certifications || []);
    } catch (error) {
      showSnackbar('Error loading certifications', 'error');
      setCertifications([]);
    } finally {
      setLoading(false);
    }
  }, [adminApi, showSnackbar]);

  const fetchPayments = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const response = await adminApi.getPaymentsList({ search });
      setPayments(response.data?.data || []);
    } catch (error) {
      showSnackbar('Error loading payments', 'error');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [adminApi, showSnackbar]);

  const searchAdmin = useCallback(async (query, currentView) => {
    try {
      const response = await adminApi.searchAdmin(query);
      
      switch (currentView) {
        case 'users':
          setUsers(response.data?.users || []);
          break;
        case 'posts':
          setPosts(response.data?.posts || []);
          break;
        case 'reports':
          setReports(response.data?.reports || []);
          break;
        case 'certifications':
          setCertifications(response.data?.certifications || []);
          break;
        case 'payments':
          setPayments(response.data?.payments || []);
          break;
        default:
          break;
      }
    } catch (error) {
      showSnackbar('Search failed', 'error');
    }
  }, [adminApi, showSnackbar]);

  return {
    loading,
    stats,
    users,
    reports,
    posts,
    certifications,
    payments,
    snackbar,
    fetchDashboardStats,
    fetchUsers,
    fetchReports,
    fetchPosts,
    fetchCertifications,
    fetchPayments,
    searchAdmin,
    showSnackbar,
  };
};
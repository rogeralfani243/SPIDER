// src/components/dashboard-admin/Tabs/comments/hooks/useCommentsData.js
import { useState, useCallback } from 'react';

export const useCommentsData = ({
  api,
  page,
  filters,
  activeTab,
  showSnackbar,
  selectedComments,
  setSelectedComments,
  setSelectAll
}) => {
  const [comments, setComments] = useState([]);
  const [commentsStats, setCommentsStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0
  });
  const [localSearch, setLocalSearch] = useState('');

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: 20,
        ...filters
      };
      
      if (activeTab === 1) params.is_hidden = 'true';
      else if (activeTab === 2) params.is_spam = 'true';
      else if (activeTab === 3) params.has_media = 'true';
      
      const response = await api.getCommentsList(params);
      
      if (response?.status === 'success') {
        setComments(response.data || []);
        if (response.pagination) setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      showSnackbar(error.message || 'Error loading comments', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, page, filters, activeTab, showSnackbar]);

  const loadCommentsStats = useCallback(async () => {
    try {
      const response = await api.getCommentsStats();
      if (response?.status === 'success') {
        setCommentsStats(response.data);
      }
    } catch (error) {
      console.error('Error loading comments stats:', error);
    }
  }, [api]);

  // src/components/dashboard-admin/Tabs/comments/hooks/useCommentsData.js

const handleSearch = useCallback(async (query) => {
  if (query.length >= 1) {
    setLoading(true);
    try {
      // ✅ Utiliser getCommentsList avec paramètre search au lieu de searchComments
      const params = {
        page,
        page_size: 20,
        search: query,  // Le backend doit accepter ce paramètre
        ...filters
      };
      
      // Appliquer les filtres d'onglet
      if (activeTab === 1) params.is_hidden = 'true';
      else if (activeTab === 2) params.is_spam = 'true';
      else if (activeTab === 3) params.has_media = 'true';
      
      const response = await api.getCommentsList(params);
      
      if (response?.status === 'success') {
        setComments(response.data || []);
        if (response.pagination) setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error searching comments:', error);
      showSnackbar(error.message || 'Error searching comments', 'error');
    } finally {
      setLoading(false);
    }
  } else if (query.length === 0) {
    loadComments();
  }
}, [api, page, filters, activeTab, loadComments, showSnackbar]);

  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      const response = await api.deleteComment(commentId);
      if (response?.status === 'success') {
        showSnackbar('Comment deleted successfully', 'success');
        loadComments();
        loadCommentsStats();
        return true;
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showSnackbar(error.message || 'Error deleting comment', 'error');
      return false;
    }
  }, [api, loadComments, loadCommentsStats, showSnackbar]);

  const handleToggleHide = useCallback(async (commentId) => {
    try {
      const response = await api.toggleHideComment(commentId);
      if (response?.status === 'success') {
        showSnackbar(response.message || 'Comment visibility toggled', 'success');
        loadComments();
        loadCommentsStats();
      }
    } catch (error) {
      console.error('Error toggling hide:', error);
      showSnackbar(error.message || 'Error toggling visibility', 'error');
    }
  }, [api, loadComments, loadCommentsStats, showSnackbar]);

  const handleToggleSpam = useCallback(async (commentId) => {
    try {
      const response = await api.toggleSpamComment(commentId);
      if (response?.status === 'success') {
        showSnackbar(response.message || 'Comment spam status toggled', 'success');
        loadComments();
        loadCommentsStats();
      }
    } catch (error) {
      console.error('Error toggling spam:', error);
      showSnackbar(error.message || 'Error toggling spam status', 'error');
    }
  }, [api, loadComments, loadCommentsStats, showSnackbar]);

  const handleTogglePin = useCallback(async (commentId) => {
    try {
      const response = await api.togglePinComment(commentId);
      if (response?.status === 'success') {
        showSnackbar(response.message || 'Comment pin status toggled', 'success');
        loadComments();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      showSnackbar(error.message || 'Error toggling pin status', 'error');
    }
  }, [api, loadComments, showSnackbar]);

  const handleBulkDelete = useCallback(async (commentIds) => {
    if (commentIds.length === 0) return;
    
    try {
      const response = await api.bulkDeleteComments(commentIds);
      if (response?.status === 'success') {
        showSnackbar(response.message || `${commentIds.length} comments deleted`, 'success');
        setSelectedComments([]);
        setSelectAll(false);
        loadComments();
        loadCommentsStats();
      }
    } catch (error) {
      console.error('Error bulk deleting comments:', error);
      showSnackbar(error.message || 'Error deleting comments', 'error');
    }
  }, [api, loadComments, loadCommentsStats, showSnackbar, setSelectedComments, setSelectAll]);

  return {
    comments,
    commentsStats,
    loading,
    pagination,
    localSearch,
    setLocalSearch,
    loadComments,
    loadCommentsStats,
    handleSearch,
    handleDeleteComment,
    handleToggleHide,
    handleToggleSpam,
    handleTogglePin,
    handleBulkDelete
  };
};
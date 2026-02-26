// src/components/dashboard-admin/Tabs/CommentsView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Box,Alert } from '@mui/material';
import useAdminApi from '../../../hooks/useAdminApi';

// Imports des sous-composants
import CommentsAnalyticsTab from './comments/Graphiq';
import CommentsHeader from './comments/CommentsHeader';
import CommentsStatsCards from './comments/CommentsStatsCards';
import CommentsTabs from './comments/CommentsTabs';
import CommentsFilters from './comments/CommentsFilters';
import CommentsTable from './comments/CommentsTable';
import CommentsPagination from './comments/CommentsPagination';
import DeleteCommentDialog from './comments/CommentsDialogs/DeleteCommentDialog';
import CommentDetailDialog from './comments/CommentsDialogs/CommentDetailDialog';
import { useSnackbar } from './comments/hooks/useSnackbar';
import { useCommentsData } from './comments/hooks/useCommentsData.js';
import ActionMenu from './comments/CommentsMenus/ActionMenu.jsx';
const CommentsView = ({ searchQuery: globalSearchQuery }) => {
  const api = useAdminApi();
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  
  // States
  const [selectedComments, setSelectedComments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filters, setFilters] = useState({
    is_hidden: '',
    is_spam: '',
    has_media: '',
    ordering: '-created_at'
  });
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [commentDetailOpen, setCommentDetailOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedCommentForAction, setSelectedCommentForAction] = useState(null);

  // Custom hook pour les données
  const {
    comments,
    commentsStats,
    loading,
    pagination,
    loadComments,
    loadCommentsStats,
    loadCommentsAnalytics,
    handleSearch,
    handleDeleteComment,
    handleToggleHide,
    handleToggleSpam,
    handleTogglePin,
    handleBulkDelete,
    localSearch,
    setLocalSearch
  } = useCommentsData({
    api,
    page,
    filters,
    activeTab,
    showSnackbar,
    selectedComments,
    setSelectedComments,
    setSelectAll
  });

  // Load data
  useEffect(() => {
    loadComments();
    loadCommentsStats();
  }, [page, filters, activeTab]);

  useEffect(() => {
    if (globalSearchQuery) {
      handleSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const handleSelectAll = (event) => {
    setSelectAll(event.target.checked);
    if (event.target.checked) {
      setSelectedComments(comments.map(c => c.id));
    } else {
      setSelectedComments([]);
    }
  };

  const handleSelectComment = (commentId) => {
    setSelectedComments(prev => {
      if (prev.includes(commentId)) {
        return prev.filter(id => id !== commentId);
      } else {
        return [...prev, commentId];
      }
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      is_hidden: '',
      is_spam: '',
      has_media: '',
      ordering: '-created_at'
    });
    setActiveTab(0);
    setPage(1);
    setLocalSearch('');
  };

  const handleViewDetail = (commentId) => {
    setSelectedCommentId(commentId);
    setCommentDetailOpen(true);
  };

  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (commentToDelete) {
      await handleDeleteComment(commentToDelete.id);
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const handleActionMenuOpen = (event, comment) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedCommentForAction(comment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedCommentForAction(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Snackbar */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity} 
          sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
          onClose={closeSnackbar}
        >
          {snackbar.message}
        </Alert>
      )}

      {/* Header avec titre et boutons */}
      <CommentsHeader 
        totalComments={commentsStats?.total?.comments}
        selectedCount={selectedComments.length}
        onBulkDelete={() => handleBulkDelete(selectedComments)}
        onRefresh={() => {
          loadComments();
          loadCommentsStats();
        }}
      />

      {/* Cartes de statistiques */}
      <CommentsStatsCards stats={commentsStats} />

      {/* Onglets */}
      <CommentsTabs 
        activeTab={activeTab}
        onTabChange={(v) => { setActiveTab(v); setPage(1); }}
        hiddenCount={commentsStats?.status?.hidden}
        spamCount={commentsStats?.status?.spam}
      />

      {/* Barre de filtres */}
      <CommentsFilters
        localSearch={localSearch}
        onSearchChange={setLocalSearch}
        onSearchSubmit={() => handleSearch(localSearch)}
        onClearSearch={() => {
          setLocalSearch('');
          loadComments();
        }}
        ordering={filters.ordering}
        onOrderingChange={(value) => handleFilterChange('ordering', value)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Tableau des commentaires */}
      {activeTab === 4 ? (
  <CommentsAnalyticsTab />
) : (
      <CommentsTable
        comments={comments}
        loading={loading}
        selectedComments={selectedComments}
        selectAll={selectAll}
        onSelectAll={handleSelectAll}
        onSelectComment={handleSelectComment}
        onViewDetail={handleViewDetail}
        onTogglePin={handleTogglePin}
        onToggleHide={handleToggleHide}
        onToggleSpam={handleToggleSpam}
        onDeleteClick={handleDeleteClick}
        onActionMenuOpen={handleActionMenuOpen}
      /> )}

      {/* Pagination */}
      <CommentsPagination
        page={page}
        totalPages={pagination.total_pages}
        onPageChange={setPage}
      />

      {/* Menu d'actions contextuel */}
      <ActionMenu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        comment={selectedCommentForAction}
        onTogglePin={handleTogglePin}
        onToggleHide={handleToggleHide}
        onToggleSpam={handleToggleSpam}
        onDeleteClick={handleDeleteClick}
        onViewInContext={() => {
          if (selectedCommentForAction) {
            window.location.href = `/user/${selectedCommentForAction.user_id}/posts/${selectedCommentForAction.post_id}?comment=${selectedCommentForAction.id}`
          }
          handleActionMenuClose();
        }}
      />

      {/* Dialogue de suppression */}
      <DeleteCommentDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        comment={commentToDelete}
      />

      {/* Dialogue de détail */}
      {selectedCommentId && (
        <CommentDetailDialog
          open={commentDetailOpen}
          onClose={() => {
            setCommentDetailOpen(false);
            setSelectedCommentId(null);
          }}
          commentId={selectedCommentId}
          onCommentUpdated={() => {
            loadComments();
            loadCommentsStats();
          }}
        />
      )}
    </Box>
  );
};

export default CommentsView;
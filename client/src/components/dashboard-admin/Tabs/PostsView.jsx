// src/components/dashboard-admin/components/Views/PostsView.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Skeleton,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  BarChart as BarChartIcon,
  ListAlt as ListIcon
} from '@mui/icons-material';
import { useAdminData } from '../../../hooks/useAdminData';
import PostsHeader from './posts/PostsHeader.jsx';
import PostsFilters from './posts/PostsFilters.jsx';
import PostsStats from './posts/PostsStats.jsx';
import PostsTable from './posts/PostsTable.jsx';
import PostsAnalyticsView from './posts/PostGrapiq'; // Import the analytics component
import PostDetailsDialog from './posts/PostDetailsDialog.jsx';
import PostMediaDialog from './posts/PostMediaDialog.jsx';
import PostFullscreenMedia from './posts/PostFullscreenMedia.jsx';
import DeletePostDialog from './posts/DeletePostDialog.jsx';
import useAdminApi from '../../../hooks/useAdminApi';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`posts-tabpanel-${index}`}
      aria-labelledby={`posts-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PostsView = ({ posts: initialPosts, loading }) => {
  const { fetchPosts, showSnackbar } = useAdminData();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [fullscreenMediaOpen, setFullscreenMediaOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0); // State for active tab
  const { deletePost: deletePostApi } = useAdminApi();
  const initializedRef = useRef(false);

  // Initialize posts only once
  useEffect(() => {
    if (initialPosts && !initializedRef.current) {
      setPosts(initialPosts);
      setFilteredPosts(initialPosts);
      initializedRef.current = true;
    }
  }, [initialPosts]);

  // Refresh posts
  const handleRefresh = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Open post details
  const handleViewDetails = useCallback((post) => {
    setSelectedPost(post);
    setDetailDialogOpen(true);
  }, []);

  // Open post media
  const handleOpenMedia = useCallback((post) => {
    setSelectedPost(post);
    setMediaDialogOpen(true);
  }, []);

  // Open fullscreen media
  const handleOpenFullscreenMedia = useCallback((index) => {
    setSelectedMediaIndex(index);
    setFullscreenMediaOpen(true);
  }, []);

  // Delete post
  const handleDeletePost = useCallback(async () => {
    if (!selectedPost) return;
    
    try {
      await deletePostApi(selectedPost.id);
      showSnackbar('Post deleted successfully', 'success');
      
      // Update lists
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setFilteredPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setDeleteDialogOpen(false);
      setSelectedPost(null);
    } catch (error) {
      showSnackbar(`Error deleting post: ${error.message}`, 'error');
    }
  }, [selectedPost, deletePostApi, showSnackbar]);

  // Confirm deletion
  const confirmDelete = useCallback((post) => {
    setSelectedPost(post);
    setDeleteDialogOpen(true);
  }, []);

  // Go to post
  const handleGoToPost = useCallback(() => {
    if (!selectedPost) return;
    const url = `/user/${selectedPost.user_id}/posts/${selectedPost.id}`;
    window.open(url, '_blank');
  }, [selectedPost]);

  // Handle filters
  const handleFilterChange = useCallback((filtered) => {
    setFilteredPosts(filtered);
  }, []);

  if (loading && posts.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <>
      {/* Header - Always visible */}
      <PostsHeader
        postCount={filteredPosts.length}
        boostedCount={posts.filter(p => p.is_boosted).length}
        onRefresh={handleRefresh}
        onCreatePost={() => showSnackbar('Create post feature coming soon', 'info')}
      />

      {/* Tabs Navigation */}
      <Paper sx={{ mt: 3, borderRadius: 1 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="posts view tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '0.95rem',
              fontWeight: 500
            }
          }}
        >
          <Tab 
            icon={<ListIcon />} 
            iconPosition="start" 
            label="Posts List" 
            id="posts-tab-0"
            aria-controls="posts-tabpanel-0"
          />
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label="Analytics" 
            id="posts-tab-1"
            aria-controls="posts-tabpanel-1"
          />
        </Tabs>

        {/* Posts List Tab */}
        <TabPanel value={activeTab} index={0}>
          <PostsFilters
            posts={posts}
            onFilterChange={handleFilterChange}
          />

          <PostsStats posts={posts} />

          <PostsTable
            posts={filteredPosts}
            onViewDetails={handleViewDetails}
            onOpenMedia={handleOpenMedia}
            onGoToPost={(post) => {
              setSelectedPost(post);
              handleGoToPost();
            }}
            onDelete={confirmDelete}
          />
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <PostsAnalyticsView />
        </TabPanel>
      </Paper>

      {/* Dialogs - Always accessible from both tabs */}
      {selectedPost && (
        <>
          <PostDetailsDialog
            open={detailDialogOpen}
            post={selectedPost}
            onClose={() => setDetailDialogOpen(false)}
            onDelete={() => confirmDelete(selectedPost)}
            onViewPost={handleGoToPost}
            onOpenMedia={() => handleOpenMedia(selectedPost)}
          />

          <PostMediaDialog
            open={mediaDialogOpen}
            post={selectedPost}
            onClose={() => setMediaDialogOpen(false)}
            onOpenFullscreen={handleOpenFullscreenMedia}
          />

          <PostFullscreenMedia
            open={fullscreenMediaOpen}
            post={selectedPost}
            mediaIndex={selectedMediaIndex}
            onClose={() => setFullscreenMediaOpen(false)}
          />

          <DeletePostDialog
            open={deleteDialogOpen}
            post={selectedPost}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={handleDeletePost}
          />
        </>
      )}
    </>
  );
};

export default PostsView;
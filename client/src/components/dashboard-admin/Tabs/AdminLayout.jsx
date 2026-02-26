import React,{useState} from 'react';
import {
  Box, CircularProgress, Snackbar, Alert,
  useTheme, useMediaQuery
} from '@mui/material';
import AppBar from './AppBar';
import Sidebar from './SideBar';
import SpeedDialActions from './SpeedDialActions';

const AdminLayout = ({
  children,
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  onSearch,
  stats,
  snackbar,
  onCloseSnackbar,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={onSearch}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        currentView={currentView}
        setCurrentView={setCurrentView}
        stats={stats}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          mt: 8
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          children
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={onCloseSnackbar}
      >
        <Alert
          onClose={onCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <SpeedDialActions />
    </Box>
  );
};

export default AdminLayout;
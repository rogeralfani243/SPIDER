// src/components/dashboard-admin/Tabs/AppBar.jsx
import React, { useState } from 'react';
import {
  AppBar as MuiAppBar, Toolbar, IconButton,
  Typography, TextField, InputAdornment,
  Tooltip, Badge, Avatar, Box, Menu,
  MenuItem, Divider, ListItemIcon, Zoom,
  Chip,Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const AppBar = ({
  sidebarOpen,
  setSidebarOpen,
  searchQuery,
  setSearchQuery,
  onSearch,
  currentView,
  onRefresh,
  user,
  notifications = []
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Couleurs du thème
  const themeGradient = 'linear-gradient(135deg, rgb(10, 10, 10), rgb(60, 10, 10), rgb(180, 20, 20), rgb(255, 0, 80))';
  const brightRed = 'rgb(255, 0, 80)';
  const accentRed = 'rgb(180, 20, 20)';

  const formattedView = currentView 
    ? currentView.charAt(0).toUpperCase() + currentView.slice(1)
    : 'Dashboard';

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const getViewIcon = () => {
    switch (currentView) {
      case 'dashboard': return '📊';
      case 'users': return '👥';
      case 'posts': return '📝';
      case 'reports': return '⚠️';
      case 'certifications': return '✅';
      case 'payments': return '💰';
      case 'comments': return '💬';
      case 'groups': return '👪';
      case 'settings': return '⚙️';
      default: return '📌';
    }
  };

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: themeGradient,
        backgroundSize: '200% 200%',
        animation: 'gradientShift 8s ease infinite',
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        borderBottom: `1px solid ${brightRed}60`,
      }}
    >
      <Toolbar sx={{ minHeight: '70px !important' }}>
        {/* Menu Button */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          sx={{
            mr: 2,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: 'rgba(255,255,255,0.2)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s',
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'white',
              color: brightRed,
              width: 40,
              height: 40,
              boxShadow: '0 4px 12px rgba(255,0,80,0.3)',
            }}
          >
            <DashboardIcon />
          </Avatar>
          
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 800, 
                letterSpacing: '1px',
                lineHeight: 1.2,
              }}
            >
              SPIDER ADMIN
            </Typography>

          </Box>
        </Box>

        {/* Search Bar */}
        <TextField
          size="small"
          placeholder="Search users, posts, reports..."
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  sx={{ color: 'white' }}
                >
                  ✕
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              width: searchFocused ? 400 : 300,
              transition: 'all 0.3s',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.15)',
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255,255,255,0.5)',
                opacity: 1,
              },
            },
          }}
          sx={{ mr: 2 }}
        />

        {/* Quick Actions */}
{/*
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Advanced Filters" TransitionComponent={Zoom}>
            <IconButton 
              color="inherit"
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export Data" TransitionComponent={Zoom}>
            <IconButton 
              color="inherit"
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh" TransitionComponent={Zoom}>
            <IconButton 
              color="inherit"
              onClick={onRefresh}
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Divider 
            orientation="vertical" 
            flexItem 
            sx={{ 
              mx: 1, 
              bgcolor: 'rgba(255,255,255,0.2)' 
            }} 
          />
          {/* Notifications 
          <Tooltip title="Notifications" TransitionComponent={Zoom}>
            <IconButton
              color="inherit"
              onClick={handleNotificationOpen}
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Badge
                badgeContent={unreadNotifications}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: brightRed,
                    color: 'white',
                    fontWeight: 700,
                  },
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu 
          <Tooltip title="Account" TransitionComponent={Zoom}>
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                ml: 1,
                p: 0.5,
                border: `2px solid ${brightRed}60`,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: brightRed,
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Avatar
                alt={user?.name || 'Admin'}
                src={user?.avatar}
                sx={{
                  width: 35,
                  height: 35,
                  bgcolor: accentRed,
                }}
              >
                {user?.name?.[0] || 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
*/}
      </Toolbar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 360,
            maxHeight: 480,
            bgcolor: 'rgb(20,20,20)',
            border: `1px solid ${brightRed}40`,
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              whiteSpace: 'normal',
            },
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${brightRed}40` }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
            Notifications
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            You have {unreadNotifications} unread notifications
          </Typography>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 5).map((notification, index) => (
            <MenuItem
              key={index}
              onClick={handleMenuClose}
              sx={{
                py: 1.5,
                borderBottom: index < notifications.length - 1 ? `1px solid ${brightRed}20` : 'none',
                '&:hover': {
                  bgcolor: `${brightRed}20`,
                },
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" sx={{ color: brightRed, display: 'block', mt: 0.5 }}>
                  {notification.time}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}

        <Box sx={{ p: 1, borderTop: `1px solid ${brightRed}40` }}>
          <Button
            fullWidth
            sx={{
              color: brightRed,
              '&:hover': {
                bgcolor: `${brightRed}20`,
              },
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 240,
            bgcolor: 'rgb(20,20,20)',
            border: `1px solid ${brightRed}40`,
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
            {user?.name || 'Admin User'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {user?.email || 'admin@spider.com'}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: `${brightRed}40` }} />
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <Typography sx={{ color: 'white' }}>Profile</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Typography sx={{ color: 'white' }}>Settings</Typography>
        </MenuItem>
        <Divider sx={{ borderColor: `${brightRed}40` }} />
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon sx={{ color: brightRed }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography sx={{ color: brightRed }}>Logout</Typography>
        </MenuItem>
      </Menu>
    </MuiAppBar>
  );
};

export default AppBar;
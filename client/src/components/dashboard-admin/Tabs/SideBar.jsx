// src/components/dashboard-admin/Tabs/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Divider, Box, Typography, Avatar, Badge,
  IconButton, Collapse, Tooltip, Zoom
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Report as ReportIcon,
  VerifiedUser as VerifiedUserIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Comment as CommentIcon,
  Group as GroupIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  PostAdd as PostAddIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const Sidebar = ({
  open,
  onClose,
  isMobile,
  currentView,
  setCurrentView,
  stats
}) => {
  const [expanded, setExpanded] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  // Couleurs du thème
  const themeGradient = 'linear-gradient(135deg, rgb(10, 10, 10), rgb(60, 10, 10), rgb(180, 20, 20), rgb(255, 0, 80))';
  const darkRed = 'rgb(60, 10, 10)';
  const brightRed = 'rgb(255, 0, 80)';
  const accentRed = 'rgb(180, 20, 20)';

  // Navigation items avec sous-menus
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <DashboardIcon />,
      badge: stats?.overview?.alerts || 0
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: <PeopleIcon />,
      badge: stats?.overview?.new_users || 0,
      subItems: [
        { id: 'users-list', label: 'All Users' },
        { id: 'users-active', label: 'Active Users' },
        { id: 'users-banned', label: 'Banned Users' }
      ]
    },
    { 
      id: 'posts', 
      label: 'Posts', 
      icon: <ArticleIcon />,
      badge: stats?.overview?.pending_posts || 0,
      subItems: [
        { id: 'posts-all', label: 'All Posts' },
        { id: 'posts-pending', label: 'Pending Review' },
        { id: 'posts-reported', label: 'Reported' }
      ]
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: <ReportIcon />,
      badge: stats?.overview?.total_reports || 0,
      color: '#EF4444'
    },
    { 
      id: 'certifications', 
      label: 'Certifications', 
      icon: <VerifiedUserIcon />,
      badge: stats?.certifications?.pending || 0
    },
    { 
      id: 'payments', 
      label: 'Payments', 
      icon: <PaymentIcon />,
      badge: stats?.payments?.pending || 0
    },
    { 
      id: 'comments', 
      label: 'Comments', 
      icon: <CommentIcon />,
      badge: stats?.comments?.pending || 0
    },
    { 
      id: 'groups', 
      label: 'Groups', 
      icon: <GroupIcon />,
      badge: stats?.groups?.join_requests || 0
    },
  ];

  const bottomNavItems = [
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> }
  ];

  // Gestion du redimensionnement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const drawerWidth = collapsed ? 80 : sidebarWidth;

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          mt: 8,
          background: 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(60,10,10,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          borderRight: `1px solid ${accentRed}40`,
          transition: collapsed ? 'width 0.2s ease' : 'none',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255,255,255,0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: brightRed,
            borderRadius: '4px',
          },
        },
      }}
    >
      {/* Header avec gradient */}
      <Box
        sx={{
          p: collapsed ? 1 : 3,
          pb: collapsed ? 1 : 2,
          background: themeGradient,
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
          '@keyframes gradientShift': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)',
            pointerEvents: 'none',
          }
        }}
      >
        {!collapsed ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    color: 'white',
                    letterSpacing: '1px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  SPIDER
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  Admin Panel
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Collapse Menu" placement="right" TransitionComponent={Zoom}>
              <IconButton
                onClick={toggleCollapse}
                sx={{
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'white',
                color: brightRed,
                width: 48,
                height: 48,
                boxShadow: '0 4px 12px rgba(255,0,80,0.3)',
              }}
            >
              <DashboardIcon />
            </Avatar>
            <Tooltip title="Expand Menu" placement="right" TransitionComponent={Zoom}>
              <IconButton
                onClick={toggleCollapse}
                sx={{
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Resize Handle (uniquement sur desktop) */}
      {!isMobile && !collapsed && (
        <Box
          onMouseDown={handleResizeStart}
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            cursor: 'ew-resize',
            '&:hover': {
              bgcolor: `${brightRed}80`,
              boxShadow: `0 0 8px ${brightRed}`,
            },
            transition: 'all 0.2s',
            zIndex: 1200,
          }}
        />
      )}

      {/* Navigation principale */}
      <List sx={{ pt: 2, px: collapsed ? 1 : 2 }}>
        {navItems.map((item) => (
          <Box key={item.id}>
            <Tooltip
              title={collapsed ? item.label : ''}
              placement="right"
              TransitionComponent={Zoom}
            >
              <ListItem
                button
                selected={currentView === item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (item.subItems) {
                    handleExpand(item.id);
                  }
                  if (isMobile) onClose();
                }}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  px: collapsed ? 1.5 : 2,
                  py: 1.2,
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    bgcolor: brightRed,
                    transform: currentView === item.id ? 'scaleY(1)' : 'scaleY(0)',
                    transition: 'transform 0.2s',
                  },
                  '&:hover': {
                    bgcolor: `${darkRed}80`,
                    '&::before': {
                      transform: 'scaleY(0.6)',
                    },
                  },
                  '&.Mui-selected': {
                    bgcolor: `${brightRed}20`,
                    border: `1px solid ${brightRed}40`,
                    '&:hover': {
                      bgcolor: `${brightRed}30`,
                    },
                    '& .MuiListItemIcon-root': {
                      color: brightRed,
                    },
                    '& .MuiListItemText-primary': {
                      color: 'white',
                      fontWeight: 700,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: currentView === item.id ? brightRed : 'rgba(255,255,255,0.7)',
                    minWidth: collapsed ? 'auto' : 40,
                    mr: collapsed ? 0 : 2,
                    transition: 'color 0.2s',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                
                {!collapsed && (
                  <>
                    <ListItemText
                      primary={item.label}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: currentView === item.id ? 'white' : 'rgba(255,255,255,0.8)',
                          fontSize: '0.95rem',
                          fontWeight: currentView === item.id ? 700 : 500,
                        },
                      }}
                    />
                    
                    {item.badge > 0 && (
                      <Badge
                        badgeContent={item.badge}
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: brightRed,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          },
                        }}
                      />
                    )}
                    
              
                  </>
                )}
              </ListItem>
            </Tooltip>

         
          </Box>
        ))}
      </List>

      <Divider sx={{ 
        my: 2, 
        borderColor: `${accentRed}40`,
        mx: collapsed ? 1 : 2 
      }} />

      {/* Navigation du bas */}
      <List sx={{ px: collapsed ? 1 : 2 }}>
        {bottomNavItems.map((item) => (
          <Tooltip
            key={item.id}
            title={collapsed ? item.label : ''}
            placement="right"
            TransitionComponent={Zoom}
          >
            <ListItem
              button
              selected={currentView === item.id}
              onClick={() => {
                setCurrentView(item.id);
                if (isMobile) onClose();
              }}
              sx={{
                borderRadius: 2,
                px: collapsed ? 1.5 : 2,
                py: 1.2,
                '&.Mui-selected': {
                  bgcolor: `${brightRed}20`,
                  border: `1px solid ${brightRed}40`,
                  '& .MuiListItemIcon-root': {
                    color: brightRed,
                  },
                },
                '&:hover': {
                  bgcolor: `${darkRed}80`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: currentView === item.id ? brightRed : 'rgba(255,255,255,0.7)',
                  minWidth: collapsed ? 'auto' : 40,
                  mr: collapsed ? 0 : 2,
                }}
              >
                {item.icon}
              </ListItemIcon>
              
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: currentView === item.id ? 'white' : 'rgba(255,255,255,0.8)',
                    },
                  }}
                />
              )}
            </ListItem>
          </Tooltip>
        ))}
      </List>

      {/* Quick Stats */}
      {!collapsed && stats?.overview && (
        <Box sx={{ 
          mt: 'auto', 
          p: 2,
          background: `linear-gradient(135deg, ${darkRed}80, ${accentRed}60)`,
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${brightRed}40`,
        }}>
          <Typography
            variant="overline"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 700,
              letterSpacing: '1px',
              fontSize: '0.7rem',
            }}
          >
            Quick Stats
          </Typography>
          
          <Box sx={{ mt: 1 }}>
            <StatItem
              icon={<PersonIcon />}
              label="Users"
              value={stats.overview.total_users || 0}
              trend={stats.overview.user_growth || 0}
            />
            <StatItem
              icon={<PostAddIcon />}
              label="Posts"
              value={stats.overview.total_posts || 0}
              trend={stats.overview.post_growth || 0}
            />
            <StatItem
              icon={<WarningIcon />}
              label="Reports"
              value={stats.overview.total_reports || 0}
              color="#EF4444"
            />
            <StatItem
              icon={<MoneyIcon />}
              label="Revenue"
              value={`$${(stats.overview.total_revenue || 0).toFixed(2)}`}
              trend={stats.overview.revenue_growth || 0}
              isCurrency
            />
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

// Composant de statistique
const StatItem = ({ icon, label, value, trend, color = 'white', isCurrency }) => {
  const brightRed = 'rgb(255, 0, 80)';
  const isPositive = trend > 0;
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      py: 0.5,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {icon}
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {label}:
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 700 }}>
          {value}
        </Typography>
        {trend !== undefined && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: isPositive ? '#10B981' : '#EF4444'
          }}>
            {isPositive ? (
              <TrendingUpIcon sx={{ fontSize: 14 }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 14 }} />
            )}
            <Typography variant="caption" sx={{ 
              color: isPositive ? '#10B981' : '#EF4444',
              fontWeight: 600,
              ml: 0.3
            }}>
              {isPositive ? '+' : ''}{trend}%
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
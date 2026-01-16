// src/components/messaging/Groups/GroupAdminPanel/styles.js
import { styled, alpha } from '@mui/material/styles';
import { 
  Card, 
  Box, 
  Chip, 
  Tabs, 
  ListItem,
  ListItemAvatar as MuiListItemAvatar,
  ListItemText as MuiListItemText 
} from '@mui/material';

export const ModernCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2.5),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
  },
}));
const BgprimaryColor= ` linear-gradient(
  135deg,
  rgb(10, 10, 10),
  rgb(60, 10, 10),
  rgb(180, 20, 20),
  rgb(255, 0, 80)
)`
export const GradientHeader = styled(Box)(({ theme }) => ({
  background:BgprimaryColor,
  color: 'white',
  borderRadius: theme.spacing(2.5, 2.5, 0, 0),
  padding: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
  },
}));

export const ProfessionalBadge = styled(Chip)(({ theme }) => ({
  background: BgprimaryColor,
  color: 'white',
  fontWeight: 600,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  '& .MuiChip-icon': {
    color: 'white',
  },
}));

export const StatCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: BgprimaryColor
  },
}));

export const AdminTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.95rem',
    padding: theme.spacing(2, 3),
    minHeight: 'auto',
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
  },
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: '3px 3px 0 0',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  },
}));

export const MemberListItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  transition: 'all 0.2s ease',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.03),
    transform: 'translateX(4px)',
    borderColor: alpha(theme.palette.primary.main, 0.2),
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
}));

// Styles personnalisés pour ListItemAvatar
export const ListItemAvatar = styled(MuiListItemAvatar)(({ theme }) => ({
  '& .MuiAvatar-root': {
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
}));

// Styles personnalisés pour ListItemText
export const ListItemText = styled(MuiListItemText)(({ theme }) => ({
  '& .MuiListItemText-primary': {
    fontWeight: 500,
    color: theme.palette.text.primary,
  },
  '& .MuiListItemText-secondary': {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
}));
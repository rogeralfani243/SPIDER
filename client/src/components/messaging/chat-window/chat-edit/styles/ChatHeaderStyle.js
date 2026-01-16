// src/components/messaging/ChatHeaderStyles.js
const ChatHeaderStyles = {
  // Container principal
  headerContainer: {
    p: 2,
    borderBottom: 1,
    borderColor: 'divider',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    bgcolor: 'background.paper',
    minHeight: 72,
  },

  // Avatar de groupe
  groupAvatar: (hasPhoto) => ({
    width: 44,
    height: 44,
    bgcolor: hasPhoto ? undefined : 'primary.main',
    color: hasPhoto ? undefined : 'white',
    fontSize: hasPhoto ? undefined : '1.2rem',
    fontWeight: 'bold',
  }),

  // Avatar individuel
  individualAvatar: (hasPhoto) => ({
    cursor: 'pointer',
    width: 44,
    height: 44,
    bgcolor: hasPhoto ? undefined : 'primary.main',
  }),

  // Badge d'icône de groupe
  groupBadgeIcon: {
    fontSize: 16,
    color: 'primary.main',
    bgcolor: 'white',
    borderRadius: '50%',
    p: 0.5,
  },

  // Badge d'état en ligne
  onlineBadge: {
    '& .MuiBadge-badge': {
      backgroundColor: (isOnline) => isOnline ? '#44b700' : '#bdbdbd',
      color: (isOnline) => isOnline ? '#44b700' : '#bdbdbd',
      boxShadow: '0 0 0 2px white',
      width: 12,
      height: 12,
      borderRadius: '50%',
      '&::after': (isOnline) => isOnline ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      } : {},
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0,
      },
    },
  },
  offlineBadge: {
    '& .MuiBadge-badge': {
      backgroundColor: (isOnline) => isOnline ? '#171817ff' : '#bdbdbd',
      color: (isOnline) => isOnline ? '#171817ff' : '#bdbdbd',
      boxShadow: '0 0 0 2px white',
      width: 12,
      height: 12,
      borderRadius: '50%',
      '&::after': (isOnline) => isOnline ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      } : {},
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0,
      },
    },
  },

  // Titre principal
  displayName: {
    fontWeight: 600,
    maxWidth:'500px',
    overflow:'hidden',
    maxHeight:'65px',
    wordBreak:'break-all',
   
  },

  // Texte de statut
  statusText: (isGroup, isOnline) => ({
    fontWeight: isGroup || isOnline ? 500 : 400,
  }),

  // Icône de statut de groupe
  groupStatusIcon: {
    fontSize: 14,
    color: 'primary.main',
  },

  // Icône de statut de chargement
  loadingStatusIcon: {
    fontSize: 12,
    color: 'text.disabled',
  },

  // Icône de statut en ligne
  onlineStatusIcon: {
    fontSize: 12,
    color: '#44b700',
  },

  // Icône de statut hors ligne
  offlineStatusIcon: {
    fontSize: 12,
    color: 'text.secondary',
  },

  // Menu item avec couleur d'erreur
  errorMenuItem: {
    color: 'error.main',
  },

  // Texte avec couleur warning
  warningText: {
    color: 'warning.main',
  },
};

export default ChatHeaderStyles;
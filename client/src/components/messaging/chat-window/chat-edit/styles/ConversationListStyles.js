// src/components/messaging/ConversationListStyles.js
const ConversationListStyles = {
  // Container principal
  container: {
    height: '100%',
    display: 'flex',
    width:'100%',
    flexDirection: 'column',
      '@media (max-width: 760px)': {
    maxWidth: 'auto',
    width:'100%' // Réduit sur mobile
  },
  },

  // Barre de recherche
  searchField: {
    mb: 2
  },

  // Liste des conversations
  list: {
    flexGrow: 1,
    overflow: 'auto'
  },

  // Élément de liste individuel
  listItem: (isSelected) => ({
    borderRadius: 1,
    mb: 0.5,
    backgroundColor: isSelected ? 'action.selected' : 'transparent',
    '&:hover': {
      backgroundColor: 'action.hover',
    },
  }),

  // Avatar pour les groupes
  groupAvatar: {
    bgcolor: 'primary.main',
  },

  // Badge d'état en ligne - RENDU EN OBJET SIMPLE
  onlineBadgeContainer: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Style pour le badge en ligne
  getOnlineBadgeStyle: (isOnline) => ({
    width: 14,
    height: 14,
    bgcolor: isOnline ? '#44b700' : 'transparent',
    borderRadius: '50%',
    border: isOnline ? '2px solid white' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),

  // Point intérieur du badge
  getOnlineDotStyle: (isOnline) => ({
    width: 8,
    height: 8,
    bgcolor: isOnline ? '#44b700' : '#797979ff',
    borderRadius: '50%',
  }),

  // Badge de type de groupe
  groupTypeBadge: {
    ml: 1,
    height: 20,
    fontSize: '0.65rem'
  },

  // Statut en ligne (texte)
  onlineStatusChip: {
    ml: 1,
    height: 20,
    fontSize: '0.65rem'
  },

  // Dernière fois vu
  lastSeenText: {
    ml: 1,
    fontSize: '0.65rem',
    paddingRight: '1em'
  },

  // Nombre de membres
  membersCount: {
    ml: 1
  },

  // Timestamp
  timestamp: {
    fontSize: '0.6em'
  },

  // Nom d'affichage
getDisplayNameStyle: (unreadCount) => ({
  fontWeight: unreadCount > 0 ? 'bold' : 'normal',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1, // Prend l'espace disponible
  minWidth: 0, // Important pour que text-overflow fonctionne avec flex
  maxWidth: '100%', // S'adapte au conteneur
  marginRight: '5px',
    '@media (max-width: 1060px)': {
    maxWidth: '700px', // Réduit sur mobile
  },
  '@media (max-width: 760px)': {
    maxWidth: '250px', // Réduit sur mobile
  },
  
  '@media (max-width: 480px)': {
    maxWidth: 'auto', 
    width:'100%'// Encore plus petit sur très petits écrans
  },
}),

  // Aperçu du dernier message
  getLastMessagePreviewStyle: (unreadCount) => ({
    fontWeight: unreadCount > 0 ? 'medium' : 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center'
  }),

  // Icône de groupe dans l'aperçu
  groupIcon: {
    mr: 0.5,
    fontSize: '0.9rem'
  },

  // Icône de statut
  getStatusIconStyle: (isOnline) => ({
    fontSize: 12,
    color: isOnline ? '#44b700' : 'text.secondary',
    ml: 0.5
  }),

  // État de chargement
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    p: 3
  },

  // Message vide
  emptyMessage: {
    textAlign: 'center',
    p: 3
  }
};

export default ConversationListStyles;
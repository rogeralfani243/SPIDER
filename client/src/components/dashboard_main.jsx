// DashboardMain.jsx - AJOUTEZ CES IMPORTS
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Ajoutez useNavigate
import IconDropdown from "./navDropdown";
import SearchResults from './search-main/searchResult';// Ajoutez cette ligne
import ProfileIcon from "./profile/ProfilMainIcon";
import { conversationAPI } from '../hooks/messaging/messagingApi';
import { profileAPI } from './services/api';
import '../styles/dashboardMain.css';

// SVG Icons for dashboard
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const GroupsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const PostsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <circle cx="8" cy="14" r="1"></circle>
    <circle cx="12" cy="14" r="1"></circle>
    <circle cx="16" cy="14" r="1"></circle>
    <line x1="8" y1="18" x2="12" y2="18"></line>
    <line x1="16" y1="18" x2="16" y2="18"></line>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const NotificationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const NewPostIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const links = {
  profile: "/dashboard",
  home: "/",
  messages: "/message",
  groups: "/groups",
  posts: "/posts",
  notifications: "/notifications",
  newPost: "/create-post",
  //settings: "/settings",
};


export default function DashboardMain() {
  const location = useLocation();
  const navigate = useNavigate(); // Ajoutez useNavigate
  const [searchActive, setSearchActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false); // Nouvel état pour les résultats
  const [searchQuery, setSearchQuery] = useState(''); // État pour la requête de recherche
 const [notificationsCount, setNotificationsCount] = useState(0); // Initialisé à 0
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Screen size detection - gardez votre code existant
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
 


  // Fonction pour gérer la recherche
  const handleSearch = (query, type = 'all') => {
    if (query.trim()) {
      setSearchQuery(query);
      setShowSearchResults(true);
      // Naviguer vers la page de résultats
      navigate(`/search?q=${encodeURIComponent(query)}&type=${type}`);
    }
  };

  // Fonction pour fermer les résultats de recherche
  const closeSearchResults = () => {
    setShowSearchResults(false);
    setSearchQuery('');
    setSearchActive(false);
  };

  // Fonction pour le composant SearchBar
  const handleSearchSubmit = (query, type = 'all')  => {
    if (query.trim()) {
      setSearchQuery(query);
      
      // Naviguer vers la page de recherche
      navigate(`/search?q=${encodeURIComponent(query)}&type=${type}`);
      // Fermer le menu mobile si ouvert
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      
      // Sur mobile, fermer l'overlay de recherche
      if (isMobile) {
        setSearchActive(false);
      }
    }
  };
  // Gérer la touche Escape pour fermer les résultats
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showSearchResults) {
        closeSearchResults();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSearchResults]);

  // Masquer les résultats quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      const searchContainer = document.querySelector('.search-container, .mobile-search-container');
      const resultsContainer = document.querySelector('.search-results-page');
      
      if (showSearchResults && 
          searchContainer && 
          !searchContainer.contains(e.target) &&
          resultsContainer && 
          !resultsContainer.contains(e.target)) {
        closeSearchResults();
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchResults]);
  // FONCTION POUR RÉCUPÉRER LES NOTIFICATIONS NON LUES
  // FONCTION POUR RÉCUPÉRER LES NOTIFICATIONS NON LUES
  const fetchUnreadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      
      // 1. Récupérer toutes les activités comme dans le Dashboard de profil
      const response = await profileAPI.getProfileActivity({ limit: 100 }); // Récupérer plus pour être sûr
      
      // 2. Extraire les activités de la réponse (selon la structure de votre API)
      let allActivities = [];
      
      if (response.data && response.data.activities) {
        // Format: { activities: [...] }
        allActivities = response.data.activities;
      } else if (Array.isArray(response.data)) {
        // Format: [...]
        allActivities = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        // Format: { results: [...] }
        allActivities = response.data.results;
      } else {
        allActivities = [];
      }
      
      console.log('📊 Activités récupérées:', allActivities.length);
      
      // 3. Récupérer les IDs des activités déjà lues
      const viewedActivities = JSON.parse(localStorage.getItem('viewedActivities') || '[]');
      
      // 4. Filtrer pour obtenir les activités non lues
      const unreadActivities = allActivities.filter(activity => {
        // Vérifier si l'activité a un ID et n'est pas dans la liste des lues
        return activity.id && !viewedActivities.includes(activity.id);
      });
      
      // 5. Mettre à jour le compteur
      setNotificationsCount(unreadActivities.length);
      
      console.log(`📊 Notifications non lues: ${unreadActivities.length}/${allActivities.length}`);
      
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des notifications:', err);
      console.error('Détails de l\'erreur:', err.response?.data || err.message);
      setError('Impossible de charger les notifications');
    } finally {
      setLoadingNotifications(false);
    }
  };

  
  // FONCTION POUR CLIQUE SUR LES NOTIFICATIONS
  const handleNotificationsClick = () => {
    setShowSearchResults(false);
    
    // Naviguer vers le dashboard avec un état pour ouvrir l'onglet Activity
    navigate('/dashboard/', {
      state: { 
        openActivityTab: true,
        scrollToActivity: true
      }
    });
    
    // Optionnel: Marquer toutes les notifications comme lues
    // markAllNotificationsAsRead();
  };

// Fonction pour récupérer le nombre total de messages non lus
  const fetchUnreadMessagesCount = async () => {
    try {
      setLoadingMessages(true);
      setError(null);
      
      // Utiliser l'API de conversations pour récupérer toutes les conversations
      const response = await conversationAPI.getConversations();
      const conversations = response.data || [];
      
      // Calculer le total des messages non lus
      const totalUnread = conversations.reduce((total, conversation) => {
        // Vérifier si la conversation a un champ unread_count
        if (conversation.unread_count !== undefined) {
          return total + (conversation.unread_count || 0);
        }
        
        // Sinon, chercher d'autres champs possibles
        const unreadCount = 
          conversation.unread_messages || 
          conversation.unread || 
          conversation.new_messages || 
          0;
        
        return total + unreadCount;
      }, 0);
      
      setUnreadMessages(totalUnread);
      return totalUnread;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des messages non lus:', error);
      setError('Impossible de charger les messages non lus');
      // Garder la valeur précédente en cas d'erreur
      return unreadMessages;
    } finally {
      setLoadingMessages(false);
    }
  };

  // Récupérer les messages non lus au montage du composant
  useEffect(() => {
    fetchUnreadMessagesCount();
     fetchUnreadNotifications();
    // Optionnel: Rafraîchir périodiquement (toutes les 30 secondes)
    const intervalId = setInterval(() => {
      fetchUnreadMessagesCount();
    }, 3000); // 30 secondes
    
    // Optionnel: Rafraîchir quand l'utilisateur revient sur la page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadMessagesCount();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Nettoyage
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  // AJOUTEZ UNE FONCTION POUR GÉRER LE CHANGEMENT DE RECHERCHE
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    
    // Optionnel: naviguer en temps réel (si vous voulez)
    // if (query.trim()) {
    //   navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
    // }
  };

  return (
    <>
      <div className="dashboard-main">
        {/* Logo and mobile menu */}
        <div className="dashboard-left-section">
          {isMobile && (
            <button 
              className="mobile-menu-toggles"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <MenuIcon />
            </button>
          )}
          
          <div className="dashboard-logo">
            <Link to="/" className="logo-link" onClick={() => setShowSearchResults(false)}>
              <span className="logo-text">SPIDER</span>
            </Link>
          </div>
        </div>

        {/* Main navigation - visible on desktop, hidden on mobile */}
        {!isMobile && (
          <nav className="dashboard-nav">
            <ul className="nav-list">
              {[
                { id: 'home', path: '/', label: 'Home', icon: <HomeIcon /> },
                { id: 'messages', path: '/message', label: 'Messages', icon: <MessageIcon /> },
                { id: 'groups', path: '/groups', label: 'Groups', icon: <GroupsIcon /> },
                { id: 'threads', path: '/posts', label: 'Threads', icon: <PostsIcon /> },
              ].map((item) => (
                <li key={item.id} className="nav-item">
                  <Link 
                    to={item.path} 
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => setShowSearchResults(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.id === 'messages' && unreadMessages > 0 && (
                      <span className="notification-badge">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Search bar - desktop version */}
        {!isMobile && (
          <div className={`dashboard-search ${searchActive ? 'search-active' : ''}`}>
            <div className="search-container"      onClick={() => 
                       navigate('/search?q=WI&type=all/')
                ///setSearchActive(!searchActive)
                }>
    
              {/* MODIFIEZ VOTRE SearchBar POUR SUPPORTER LES PROPS */}
               <SearchIcon />
            </div>
          </div>
        )}

        {/* User actions - compact version on mobile */}
        <div className="dashboard-actions">
          {/* Mobile message button (visible only on mobile) */}
          {isMobile && (
            <Link to={links.messages} className="mobile-message-btn" onClick={() => setShowSearchResults(false)}>
              <MessageIcon />
              {unreadMessages > 0 && (
                <span className="message-indicator">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Link>
          )}

          {/* Mobile search button */}
          {isMobile && (
            <button 
              className="mobile-search-toggle-mob"
              onClick={() => 
                       navigate('/search?q=WI&type=all/')
                ///setSearchActive(!searchActive)
                }
              aria-label="Search"
            >
              <SearchIcon />
            </button>
          )}

          {/* New Post button - desktop version */}
          {!isMobile && (
            <Link to={links.newPost} className="new-post-btn" onClick={() => setShowSearchResults(false)}>
              <NewPostIcon />
              <span>New Thread</span>
            </Link>
          )}

          {/* Notifications */}
           <Link 
            to='/dashboard/'
            className="notification-btn" 
             onClick={(e) => {
            e.preventDefault(); // Empêcher le comportement par défaut du lien
            handleNotificationsClick();
          }}
          >
            <NotificationIcon />
            {loadingNotifications ? (
              <span className="notification-loading">...</span>
            ) : notificationsCount > 0 && (
              <span className="notification-indicator">
                {notificationsCount > 99 ? '99+' : notificationsCount}
              </span>
            )}
          </Link>

          {/* Settings icon in dashboard for mobile (replaces hamburger) */}
          {isMobile && (
            <div className="mobile-settings-btn">
              <IconDropdown />
            </div>
          )}

          {/* User dropdown menu - desktop version */}
          {!isMobile && (
            <div className="user-menu">
              <IconDropdown />
            </div>
          )}

          {/* Profile avatar */}
          <div className="profile-avatar">
            <ProfileIcon link={links.profile} onClick={() => setShowSearchResults(false)} />
          </div>
        </div>

        {/* Mobile search overlay */}
        {isMobile && searchActive && (
          <div className="mobile-search-overlay">
            <div className="mobile-search-container">
              <div className="search-header">
                <button 
                  className="close-search"
                  onClick={() => {
                  //  setSearchActive(false);
                 //   setShowSearchResults(false);
                navigate('/search?q=WI&type=all/')
                  }}
                  aria-label="Close search"
                >
                  &times;
                </button>
                <div className="mobile-search-input">
                  <SearchIcon  />
                 
                </div>
              </div>
              
              {/* Afficher les résultats directement dans l'overlay mobile */}
              {showSearchResults && searchQuery && (
                <div className="mobile-search-results">
                  <SearchResults />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

     
      {/* Mobile menu */}
      {isMobile && isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <button 
                className="close-mobile-menu"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                &times;
              </button>
            </div>
            
            <nav className="mobile-nav">
              <ul className="mobile-nav-list">
                {[
                  { id: 'home', path: '/', label: 'Home', icon: <HomeIcon /> },
                  { id: 'messages', path: '/message', label: 'Messages', icon: <MessageIcon /> },
                  { id: 'groups', path: '/groups', label: 'Groups', icon: <GroupsIcon /> },
                  { id: 'Threads', path: '/posts', label: 'Threads', icon: <PostsIcon /> },
                  { id: 'newPost', path: '/create-post', label: 'New Thread', icon: <NewPostIcon /> },
              //    { id: 'notifications', path: '/dashboard/', label: 'Notifications', icon: <NotificationIcon /> },
               //   { id: 'settings', path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
                ].map((item) => (
                  <li key={item.id} className="mobile-nav-item">
                    <Link 
                      to={item.path} 
                      className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setShowSearchResults(false);
                       
                      }}
                      
                    >
                      <span className="mobile-nav-icon">{item.icon}</span>
                      <span className="mobile-nav-label">{item.label}</span>
                      {item.id === 'messages' && unreadMessages > 0 && (
                        <span className="mobile-notification-badge">
                          {unreadMessages > 99 ? '99+' : unreadMessages}
                        </span>
                      )}
                      {/* item.id === 'notifications' && notificationsCount > 0 && (
                        <span className="mobile-notification-badge" >
                          {notificationsCount > 99 ? '99+' : notificationsCount}
                        </span>
                      ) */}
                    </Link>
                  </li>
                ))}
                
                {/* Lien vers le profil */}
                <li className="mobile-nav-item">
                  <Link 
                    to={links.profile} 
                    className="mobile-nav-link" 
                    onClick={() => {
                      navigate('/dashboard/')
                    }}
                  >
                    <span className="mobile-nav-icon">
                      <ProfileIcon link={links.profile} small />
                    </span>
                    <span className="mobile-nav-label">My Dashboard</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
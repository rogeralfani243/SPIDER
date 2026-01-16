// components/SettingsDashboard/SettingsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
    FaHistory, FaVolumeUp, FaClock, FaTrashAlt, FaCookieBite, FaGavel,
  FaCog, FaUserEdit, FaUser, FaBell, FaShieldAlt, FaCrown, FaFileInvoice,
  FaPalette, FaGlobe, FaQuestionCircle, FaExclamationTriangle, 
  FaKey, FaChartBar, FaFileAlt, FaLock, FaCreditCard, 
  FaUsers, FaDatabase, FaSync, FaDownload, FaEye, FaEyeSlash,
  FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationCircle,
  FaArrowLeft
} from 'react-icons/fa';
import { MdNotifications, MdSecurity, MdPrivacyTip, MdLanguage } from 'react-icons/md';
import { RiAccountCircleLine, RiGlobalLine } from 'react-icons/ri';
import '../../styles/dashboard-table/settings.css';
import API_URL from '../../hooks/useApiUrl';
import { useAuth } from '../../contexts/AuthContext';
import DeleteAccountSection from './DeleteAccountPage';
import PasswordChangeTab from './PasswordChange';

// Sections de configuration
const SETTINGS_SECTIONS = [
 {/*} {
    id: 'account',
    title: 'Account Settings',
    icon: RiAccountCircleLine,
    description: 'Manage your account information and preferences',
    items: [
      {
        id: 'profile',
        label: 'Profile Information',
        icon: FaUser,
        description: 'Update your personal information, profile picture, and bio',
        type: 'link',
        action: '/profile/edit',
        badge: 'Updated 2 days ago'
      },
      {
        id: 'email',
        label: 'Email & Notifications',
        icon: MdNotifications,
        description: 'Manage email preferences and notification settings',
        type: 'toggle',
        value: true,
        action: 'toggle-email-notifications'
      },
      {
        id: 'privacy',
        label: 'Privacy Settings',
        icon: MdPrivacyTip,
        description: 'Control who can see your content and activity',
        type: 'link',
        action: '/settings/privacy',
        status: 'active'
      },
      {
        id: 'connected',
        label: 'Connected Accounts',
        icon: FaUsers,
        description: 'Manage linked social media and third-party accounts',
        type: 'link',
        action: '/settings/connected-accounts',
        count: 3
      }
    ]
  }, */
  
    id: 'security',
    title: 'Security',
    icon: MdSecurity,
    description: 'Protect your account and manage access',
    items: [
      {
        id: 'password',
        label: 'Change Password',
        icon: FaKey,
        description: 'Update your password regularly for security',
        type: 'action',
        action: 'open-password-change',
        status: 'secure'
     /*
        { id: '2fa',
        label: 'Two-Factor Authentication',
        icon: FaLock,
        description: 'Add an extra layer of security to your account',
        type: 'toggle',
        value: false,
        action: 'toggle-2fa',
        badge: 'Recommended'
      },
      {
        id: 'sessions',
        label: 'Active Sessions',
        icon: FaSync,
        description: 'View and manage devices logged into your account',
        type: 'link',
        action: '/security/sessions',
        count: 2
      },
      {
        id: 'login-history',
        label: 'Login History',
        icon: FaHistory,
        description: 'Review recent account access and locations',
        type: 'link',
        action: '/security/login-history'
      }
    ]
  }, 
  {
    id: 'preferences',
    title: 'Preferences',
    icon: FaPalette,
    description: 'Customize your experience',
    items: [
      {
        id: 'theme',
        label: 'Theme',
        icon: FaPalette,
        description: 'Choose between light and dark mode',
        type: 'select',
        value: 'light',
        options: ['light', 'dark', 'auto'],
        action: 'change-theme'
      },
      {
        id: 'language',
        label: 'Language & Region',
        icon: MdLanguage,
        description: 'Set your preferred language and regional format',
        type: 'link',
        action: '/settings/language',
        value: 'English (US)'
      },
      {
        id: 'timezone',
        label: 'Timezone',
        icon: RiGlobalLine,
        description: 'Set your local timezone for accurate timestamps',
        type: 'select',
        value: 'UTC+1',
        options: ['UTC', 'UTC+1', 'UTC+2', 'UTC-5', 'UTC-8'],
        action: 'change-timezone'
      },
      {
        id: 'content',
        label: 'Content Preferences',
        icon: FaEye,
        description: 'Control what type of content you see',
        type: 'link',
        action: '/settings/content'
      */}
    ]

 /* {
    id: 'notifications',
    title: 'Notifications',
    icon: FaBell,
    description: 'Manage how and when you receive notifications',
    items: [
      {
        id: 'push',
        label: 'Push Notifications',
        icon: FaBell,
        description: 'Receive notifications on your device',
        type: 'toggle',
        value: true,
        action: 'toggle-push-notifications'
      },
      {
        id: 'email-notif',
        label: 'Email Notifications',
        icon: FaFileAlt,
        description: 'Get notifications via email',
        type: 'toggle',
        value: true,
        action: 'toggle-email-notifications'
      },
      {
        id: 'sounds',
        label: 'Notification Sounds',
        icon: FaVolumeUp,
        description: 'Enable or disable notification sounds',
        type: 'toggle',
        value: false,
        action: 'toggle-notification-sounds'
      },
      {
        id: 'frequency',
        label: 'Notification Frequency',
        icon: FaClock,
        description: 'How often you receive notifications',
        type: 'select',
        value: 'realtime',
        options: ['realtime', 'hourly', 'daily', 'weekly'],
        action: 'change-notification-frequency'
      }
    ]
 */ },
  {
    id: 'data',
    title: 'Data & Privacy',
    icon: FaDatabase,
    description: 'Manage your data and privacy settings',
    items: [
      
      {
        id: 'delete-account',
        label: 'Delete Account',
        icon: FaTrashAlt,
        description: 'Permanently delete your account and all data',
        type: 'action',
        action: 'open-delete-account',
        warning: true
    
      /*
      {
        id: 'export',
        label: 'Export Data',
        icon: FaDownload,
        description: 'Download a copy of your data',
        type: 'action',
        action: 'export-data',
        badge: 'Available'
      },
      {
        id: 'cookies',
        label: 'Cookie Preferences',
        icon: FaCookieBite,
        description: 'Manage cookie settings',
        type: 'link',
        action: '/settings/cookies'
      },
      {
        id: 'gdpr',
        label: 'GDPR Rights',
        icon: FaGavel,
        description: 'Exercise your data protection rights',
        type: 'link',
        action: '/settings/gdpr'
      */}
    ]

 /* {
    id: 'billing',
    title: 'Billing & Subscription',
    icon: FaCreditCard,
    description: 'Manage your subscription and billing information',
    items: [
      {
        id: 'plan',
        label: 'Current Plan',
        icon: FaCrown,
        description: 'View and upgrade your subscription plan',
        type: 'link',
        action: '/billing/plan',
        value: 'Premium',
        badge: 'Active'
      },
      {
        id: 'payment',
        label: 'Payment Methods',
        icon: FaCreditCard,
        description: 'Manage your saved payment methods',
        type: 'link',
        action: '/billing/payment-methods',
        count: 2
      },
      {
        id: 'invoices',
        label: 'Invoices & Receipts',
        icon: FaFileInvoice,
        description: 'View your billing history',
        type: 'link',
        action: '/billing/invoices'
      },
      {
        id: 'cancel',
        label: 'Cancel Subscription',
        icon: FaTimesCircle,
        description: 'Cancel your subscription at any time',
        type: 'action',
        action: 'cancel-subscription',
        warning: true
      }
    ]
  */}
];

const SettingsDashboard = () => {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState({});
  const [activeSection, setActiveSection] = useState('account');
  const [activeView, setActiveView] = useState('main'); // 'main', 'password-change', 'delete-account'

  // Charger les paramètres utilisateur
  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/user/settings/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        // Initialiser les valeurs par défaut
        const defaultSettings = {};
        SETTINGS_SECTIONS.forEach(section => {
          section.items.forEach(item => {
            if (data[item.id] !== undefined) {
              defaultSettings[item.id] = data[item.id];
            } else if (item.type === 'toggle') {
              defaultSettings[item.id] = item.value;
            } else if (item.type === 'select') {
              defaultSettings[item.id] = item.value;
            }
          });
        });
        
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (itemId, newValue) => {
    try {
      setSaveStatus(prev => ({ ...prev, [itemId]: 'saving' }));
      
      const response = await fetch(`${API_URL}/api/user/settings/${itemId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: newValue })
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, [itemId]: newValue }));
        setSaveStatus(prev => ({ ...prev, [itemId]: 'saved' }));
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [itemId]: null }));
        }, 2000);
      } else {
        throw new Error('Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      setSaveStatus(prev => ({ ...prev, [itemId]: 'error' }));
    }
  };

  const handleSelectChange = async (itemId, newValue) => {
    try {
      setSaveStatus(prev => ({ ...prev, [itemId]: 'saving' }));
      
      const response = await fetch(`${API_URL}/api/user/settings/${itemId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: newValue })
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, [itemId]: newValue }));
        setSaveStatus(prev => ({ ...prev, [itemId]: 'saved' }));
        
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [itemId]: null }));
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      setSaveStatus(prev => ({ ...prev, [itemId]: 'error' }));
    }
  };

  const handleAction = async (action, item) => {
    console.log('Action triggered:', action, 'for item:', item);
    
    switch(action) {
      case 'open-delete-account':
        console.log('Opening delete account section...');
        setActiveView('delete-account');
        setActiveSection('data');
        break;
      case 'open-password-change':
        console.log('Opening password change tab...');
        setActiveView('password-change');
        setActiveSection('security');
        break;
      case 'change-password':
        setActiveView('password-change');
        setActiveSection('security');
        break;
      case 'export-data':
        handleExportData();
        break;
      case 'toggle-2fa':
        window.location.href = '/security/2fa';
        break;
      case 'cancel-subscription':
        window.location.href = '/billing/cancel';
        break;
      default:
        console.log(`Action: ${action} for item:`, item);
        break;
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/export-data/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getButtonText = (action, itemId) => {
    if (itemId === 'delete-account') return 'Delete';
    if (itemId === 'password') return 'Change';
    if (action.includes('change')) return 'Change';
    if (action.includes('export')) return 'Export';
    if (action.includes('cancel')) return 'Cancel';
    return 'Action';
  };

  const renderSettingItem = (item) => {
    const status = saveStatus[item.id];
    const currentValue = settings[item.id] !== undefined ? settings[item.id] : item.value;

    return (
      <div 
        key={item.id} 
        className={`settings-item ${item.warning ? 'warning' : ''}`}
        onClick={() => {
          if (item.type === 'link') {
            window.location.href = item.action;
          }
        }}
      >
        <div className="settings-item-header">
          <div className="settings-item-icon">
            <item.icon />
          </div>
          <div className="settings-item-info">
            <h4 className="settings-item-title">
              {item.label}
              {item.count && (
                <span className="item-count">{item.count}</span>
              )}
              {item.badge && (
                <span className={`item-badge ${item.badge === 'Recommended' ? 'recommended' : ''}`}>
                  {item.badge}
                </span>
              )}
            </h4>
            <p className="settings-item-description">{item.description}</p>
            {item.value && item.type === 'link' && (
              <span className="settings-item-value">{item.value}</span>
            )}
          </div>
        </div>

        <div className="settings-item-controls">
          {status === 'saving' && (
            <span className="status-saving">Saving...</span>
          )}
          {status === 'saved' && (
            <span className="status-saved">
              <FaCheckCircle /> Saved
            </span>
          )}
          {status === 'error' && (
            <span className="status-error">
              <FaTimesCircle /> Error
            </span>
          )}

          {item.type === 'toggle' && (
            <div className="toggle-switch">
              <input
                type="checkbox"
                id={`toggle-${item.id}`}
                checked={currentValue}
                onChange={(e) => handleToggle(item.id, e.target.checked)}
                disabled={status === 'saving'}
              />
              <label htmlFor={`toggle-${item.id}`} className="toggle-slider"></label>
            </div>
          )}

          {item.type === 'select' && (
            <select
              className="settings-select"
              value={currentValue}
              onChange={(e) => handleSelectChange(item.id, e.target.value)}
              disabled={status === 'saving'}
            >
              {item.options.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          )}

          {item.type === 'action' && (
            <button
              className={`settings-action-btn ${item.warning ? 'warning' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Button clicked for item:', item.id, item.action);
                handleAction(item.action, item);
              }}
              disabled={status === 'saving'}
            >
              {item.id === 'delete-account' ? (
                <>
                  <FaTrashAlt /> {getButtonText(item.action, item.id)}
                </>
              ) : item.id === 'password' ? (
                <>
                  <FaKey /> {getButtonText(item.action, item.id)}
                </> 
              ) : (
                getButtonText(item.action, item.id)
              )}
            </button>
          )}

          {item.type === 'link' && (
            <span className="settings-link-arrow">→</span>
          )}
        </div>
      </div>
    );
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    setActiveView('main'); // Retour à la vue principale quand on change de section
  };

  const renderMainContent = () => {
    if (activeView === 'delete-account' && activeSection === 'data') {
      return (
        <div className="special-view-container">
          <button 
            className="back-button"
            onClick={() => setActiveView('main')}
          >
            <FaArrowLeft /> Back to Data & Privacy
          </button>
          <DeleteAccountSection
            isOpen={true}
            onClose={() => setActiveView('main')}
          />
        </div>
      );
    }

    if (activeView === 'password-change' && activeSection === 'security') {
      return (
        <div className="special-view-container">
          <button 
            className="back-button"
            onClick={() => setActiveView('main')}
          >
            <FaArrowLeft /> Back to Security Settings
          </button>
          <PasswordChangeTab onSuccess={() => setActiveView('main')} />
        </div>
      );
    }

    // Vue principale - Afficher la section active normale
    const currentSection = SETTINGS_SECTIONS.find(s => s.id === activeSection);
    if (!currentSection) return <h3 className='settings-null'>Choose one item on the list</h3>;

    return (
      <div className="settings-section active">
        <div className="section-header">
          <div className="section-icon">
            <currentSection.icon />
          </div>
          <div>
            <h2 className="section-title-set">{currentSection.title}</h2>
            <p className="section-description">{currentSection.description}</p>
          </div>
        </div>

        <div className="settings-grid">
          {currentSection.items.map(item => renderSettingItem(item))}
        </div>

        {currentSection.id === 'security' && (
          <div className="security-tips">
            <div className="tip-header">
              <FaInfoCircle />
              <h4>Security Tips</h4>
            </div>
            <ul className="tip-list">
              <li>• Enable Two-Factor Authentication for extra security</li>
              <li>• Use a strong, unique password</li>
              <li>• Regularly review active sessions</li>
              <li>• Be cautious of phishing attempts</li>
            </ul>
          </div>
        )}

       {/* 
        {currentSection.id === 'data' && (
          <div className="data-usage">
            <h4>Data Usage</h4>
            <div className="usage-stats">
              <div className="usage-item">
                <span className="usage-label">Storage Used</span>
                <div className="usage-bar">
                  <div className="usage-fill" style={{ width: '45%' }}></div>
                </div>
                <span className="usage-value">4.5 GB / 10 GB</span>
              </div>
              <div className="usage-item">
                <span className="usage-label">Bandwidth This Month</span>
                <div className="usage-bar">
                  <div className="usage-fill" style={{ width: '30%' }}></div>
                </div>
                <span className="usage-value">3 GB / 10 GB</span>
              </div>
            </div>
          </div>
        )}
       */}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-dashboard">
      <div className="settings-header">
        <h1 className="settings-title">
          <FaCog className="settings-title-icon" />
          Settings
        </h1>
        <p className="settings-subtitle">
          Manage your account preferences and security settings
        </p>
      </div>

      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar">
          <div className="sidebar-user-info">
            <div className="user-avatar">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={user.username} />
              ) : (
                <div className="avatar-placeholder">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-details">
              <h3>{user?.username || 'User'}</h3>
              <p>{user?.email || ''}</p>
          {/*
              <span className="user-status">Premium Member</span>
          */}
            </div>
          </div>

          <nav className="sidebar-nav">
            {SETTINGS_SECTIONS.map(section => (
              <button
                key={section.id}
                className={`sidebar-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => handleSectionChange(section.id)}
              >
                <section.icon className="nav-icon" />
                <span>{section.title}</span>
                {section.items.some(item => item.count) && (
                  <span className="nav-badge">
                    {section.items.reduce((acc, item) => acc + (item.count || 0), 0)}
                  </span>
                )}
              </button>
            ))}
          </nav>
{/*

          <div className="sidebar-footer">
            <div className="security-status">
              <div className="security-score">
                <div className="score-circle">
                  <span>85%</span>
                </div>
                <div className="score-info">
                  <h4>Security Score</h4>
                  <p>Good • Last checked today</p>
                </div>
              </div>
              <button className="improve-btn">
                Improve Security
              </button>
            </div>
          </div>
*/}
        </div>

        {/* Main Content */}
        <div className="settings-main" >
          {renderMainContent()}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="settings-footer">
        <div className="quick-actions">
         {/*
          <button 
            className="quick-action-btn"
            onClick={handleExportData}
          >
            <FaDownload /> Export All Settings
          </button>
          <button className="quick-action-btn">
            <FaSync /> Reset to Defaults
          </button>
          <button className="quick-action-btn warning">
            <FaTimesCircle /> Deactivate Account
          </button>
         */}
        </div>
        <div className="settings-version">
          <span>Settings Version: 2.1.4</span>
          <span>Last Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsDashboard;
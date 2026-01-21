// components/auth/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import ForgotPassword from './security-auth/ForgotPassword';
import Register from './security-auth/Register';
import { 
  FaKey, 
  FaUser, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaSpinner,
  FaUserPlus,
  FaCheckCircle
} from 'react-icons/fa';

// Configuration API
const API_BASE_URL = 'https://spider-app-d4d82ba4f1c1.herokuapp.com';

// Création d'une instance Axios configurée
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // IMPORTANT: false pour Django Token Authentication
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Reset when switching modes
  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setDebugInfo('');
    setLoginData({ username: '', password: '' });
  };

  // Handle login
  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Test CORS avant de se connecter
  const testCorsConnection = async () => {
    try {
      setDebugInfo('Test CORS en cours...');
      
      const response = await fetch(`${API_BASE_URL}/accounts/auth/login/`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        }
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin'),
        'Access-Control-Allow-Methods': response.headers.get('access-control-allow-methods'),
        'Access-Control-Allow-Headers': response.headers.get('access-control-allow-headers'),
      };
      
      console.log('CORS Test Result:', {
        status: response.status,
        headers: corsHeaders
      });
      
      if (response.status === 200) {
        setDebugInfo('✅ CORS configuré correctement');
        return true;
      } else {
        setDebugInfo('⚠️ CORS peut avoir des problèmes');
        return false;
      }
      
    } catch (error) {
      console.error('CORS test failed:', error);
      setDebugInfo('❌ Erreur lors du test CORS');
      return false;
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setDebugInfo('');

    try {
      console.log('Attempting login for:', loginData.username);
      console.log('Frontend origin:', window.location.origin);
      
      // Test CORS d'abord
      await testCorsConnection();
      
      setDebugInfo('Connexion au backend en cours...');
      
      const response = await api.post('/accounts/auth/login/', {
        username: loginData.username.trim(),
        password: loginData.password
      });
      
      console.log('Login successful:', response.data);
      
      if (response.data.token) {
        // Save authentication data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user || { username: loginData.username }));
        
        // Configure Axios defaults
        axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
        api.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
        
        setSuccess('Connexion réussie! Redirection...');
        setDebugInfo('✅ Authentification réussie');
        
        // Call parent login handler
        if (onLogin && typeof onLogin === 'function') {
          setTimeout(() => {
            onLogin({
              token: response.data.token,
              user: response.data.user
            });
          }, 1000);
        }
        
      } else {
        throw new Error('Token non reçu du serveur');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error) => {
    console.error('Login error details:', error);
    
    if (error.response) {
      // Le serveur a répondu avec un statut d'erreur
      const { status, data } = error.response;
      
      if (status === 400) {
        if (data.non_field_errors) {
          setError(`Erreur: ${Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : data.non_field_errors}`);
        } else if (data.username) {
          setError(`Nom d'utilisateur: ${Array.isArray(data.username) ? data.username.join(', ') : data.username}`);
        } else if (data.password) {
          setError(`Mot de passe: ${Array.isArray(data.password) ? data.password.join(', ') : data.password}`);
        } else {
          setError('Données de connexion invalides');
        }
      } else if (status === 401) {
        setError('Identifiants incorrects');
      } else if (status === 403) {
        setError('Accès refusé');
      } else if (status === 404) {
        setError('Endpoint non trouvé');
      } else if (status === 500) {
        setError('Erreur serveur interne');
      } else {
        setError(`Erreur ${status}: ${JSON.stringify(data)}`);
      }
      
    } else if (error.code === 'ERR_NETWORK') {
      setError(`
        ERREUR CORS/RÉSEAU:
        
        Impossible de joindre le serveur backend.
        
        Vérifiez:
        1. Le backend Django est-il démarré sur Heroku?
        2. La configuration CORS est-elle correcte dans Django?
        3. Testez avec cette commande:
        
        curl -X OPTIONS ${API_BASE_URL}/accounts/auth/login/ \\
          -H "Origin: ${window.location.origin}" \\
          -v
        
        Si vous ne voyez pas "Access-Control-Allow-Origin" dans la réponse,
        vérifiez la configuration CORS dans Django.
      `);
      
    } else if (error.request) {
      setError('Le serveur ne répond pas. Vérifiez votre connexion internet.');
    } else {
      setError('Erreur inattendue: ' + error.message);
    }
  };

  // Render different modes
  const renderMode = () => {
    switch (mode) {
      case 'register':
        return (
          <Register
            onLogin={onLogin}
            onSwitchToLogin={() => switchMode('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPassword
            onBackToLogin={() => switchMode('login')}
          />
        );
      default:
        return renderLogin();
    }
  };

  // Render login form
  const renderLogin = () => (
    <div className="auth-page">
      {/* Côté gauche - Présentation */}
      <div className="auth-presentation">
        <div className="decorative-element decorative-1"></div>
        <div className="decorative-element decorative-2"></div>
        <div className="decorative-element decorative-3"></div>
        
        <div className="presentation-content">
          <div className="logo-container">
            <div className="logo-icon">
              🕷️
            </div>
            <div className="app-name">Spider</div>
          </div>
          
          <p className="app-tagline">
            Secure access to your digital workspace. Manage with confidence.
          </p>
          
          <ul className="features-list">
            <li>
              <span className="feature-icon">🔐</span>
              <span>Enterprise-grade security protocols</span>
            </li>
            <li>
              <span className="feature-icon">⚡</span>
              <span>Lightning-fast performance & reliability</span>
            </li>
            <li>
              <span className="feature-icon">🔒</span>
              <span>Military-grade end-to-end encryption</span>
            </li>
            <li>
              <span className="feature-icon">🌍</span>
              <span>Global accessibility from any device</span>
            </li>
            <li>
              <span className="feature-icon">📈</span>
              <span>Real-time analytics and insights</span>
            </li>
            <li>
              <span className="feature-icon">🛡️</span>
              <span>Advanced threat protection</span>
            </li>
          </ul>
          
          <div className="testimonial">
            <p>"Spider has revolutionized how we manage our digital infrastructure."</p>
            <div className="testimonial-author">
              <span className="author-name">Alex Morgan</span>
              <span className="author-title">CTO, TechCorp Inc.</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Côté droit - Formulaire de connexion */}
      <div className="auth-container">
        <div className="auth-content">
          <div className="form-header-password">
            <h2 className="form-title">
              <FaUser style={{ color: 'var(--spider-red)' }} /> Sign in to Spider
            </h2>
            <p className="form-subtitle">
              Welcome back! Please enter your credentials to continue.
            </p>
          </div>
          
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <FaUser /> Username or Email Address
              </label>
              <div className="input-container">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={loginData.username}
                  onChange={handleLoginChange}
                  required
                  disabled={loading}
                  className="form-input"
                  placeholder="Enter your username or email"
                  autoFocus
                />
                <div className="input-border"></div>
              </div>
              <div className="input-hint">
                Enter the email or username associated with your account
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <FaLock /> Password
              </label>
              <div className="input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                  disabled={loading}
                  className="form-input"
                  placeholder="Enter your password"
                />
                <div className="input-border"></div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <FaEyeSlash style={{ color: 'var(--spider-red)' }} />
                  ) : (
                    <FaEye style={{ color: 'var(--grey-500)' }} />
                  )}
                </button>
              </div>
              <div className="input-hint">
                Minimum 8 characters with letters and numbers
              </div>
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  className="checkbox"
                  disabled={loading}
                />
                <label htmlFor="remember" className="checkbox-label">
                  Remember me on this device
                </label>
              </div>
              
              <div className="forgot-password-link">
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="forgot-button"
                  disabled={loading}
                >
                  <FaKey /> Forgot your password?
                </button>
              </div>
            </div>
            
            {/* Messages d'erreur et succès */}
            {error && (
              <div className="alert error-message" role="alert">
                <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <div className="alert-content">
                  <strong className="alert-title">Authentication Error</strong>
                  <p className="alert-text" style={{ whiteSpace: 'pre-line' }}>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="alert success-message">
                <FaCheckCircle className="alert-icon" style={{ color: 'var(--success)' }} />
                <div className="alert-content">
                  <strong className="alert-title">Success</strong>
                  <p className="alert-text">{success}</p>
                </div>
              </div>
            )}
            
            {debugInfo && (
              <div className="debug-info" style={{
                fontSize: '12px',
                color: '#666',
                backgroundColor: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
                margin: '10px 0'
              }}>
                <strong>Debug:</strong> {debugInfo}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="primary-button"
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" /> Authenticating...
                </>
              ) : (
                <>
                  <FaLock style={{ fontSize: '18px' }} /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="switch-container">
            <p className="switch-text">
              Don't have an account?
            </p>
            <button
              onClick={() => switchMode('register')}
              className="secondary-button"
              disabled={loading}
            >
              <FaUserPlus style={{ fontSize: '18px' }} /> Create new account
            </button>
          </div>
          
          <div className="legal-links">
            <a href="/policy" className="legal-link">Privacy Policy</a>
            <span className="legal-separator">•</span>
            <a href="/policy" className="legal-link">Terms of Service</a>
            <span className="legal-separator">•</span>
            <a href="/faq" className="legal-link">Help Center</a>
          </div>
          
          {/* Information de debug (visible seulement en développement) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-panel" style={{
              marginTop: '20px',
              padding: '10px',
              backgroundColor: '#f0f0f0',
              borderRadius: '5px',
              fontSize: '12px'
            }}>
              <strong>Debug Info:</strong>
              <p>Frontend: {window.location.origin}</p>
              <p>Backend: {API_BASE_URL}</p>
              <p>Mode: {mode}</p>
              <button 
                onClick={testCorsConnection}
                style={{ marginTop: '5px', padding: '5px' }}
              >
                Test CORS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return renderMode();
};

export default Login;
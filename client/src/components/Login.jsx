// components/auth/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import API_URL from '../hooks/useApiUrl';
import ForgotPassword from './security-auth/ForgotPassword';
import Register from './security-auth/Register';
import { 
  FaKey, 
  FaUser, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaSpinner,
  FaTimes,

  FaUserPlus,
  FaCheckCircle
} from 'react-icons/fa';
import handleSupportClick from '../hooks/useSupport';
const getCsrfToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot-password'
  
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

axios.defaults.headers.get['Accepts'] = 'application/json';
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset when switching modes
  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting login for:', loginData.username);
      
      const response = await axios.post(
        `${API_URL}/accounts/auth/login/`, 
        {
          username: loginData.username.trim(),
          password: loginData.password
        },
        {
        headers: [
          {'Content-Type': 'application/json'},
{          'X-CSRFToken': getCsrfToken()},
                  { "Access-Control-Allow-Origin": '*' },
          { "Access-Control-Allow-Headers": 'Origin, X-Requested-With, Content-Type, Accept '},
          { "Access-Control-Allow-Methods": "POST, GET, PUT, OPTIONS, DELETE" },
        
        ]
        }
      );
      
      console.log('Login successful:', response.data);
      
      // Save authentication data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Configure Axios defaults
      axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
      axios.defaults.headers.common['X-CSRFToken'] = getCsrfToken();
      
      // Call parent login handler
      if (onLogin && typeof onLogin === 'function') {
        await onLogin({
          username: loginData.username,
          password: loginData.password
        });
      } else {
        console.warn('onLogin prop is not a function');
      }
      
      console.log('Login completed successfully');
      
    } catch (error) {
      console.error('Login error:', error);
      handleAuthError(error, 'login');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error, type) => {
    console.error(`${type} error details:`, error);
    
    if (error.response?.data) {
      const errors = error.response.data;
      
      if (typeof errors === 'object') {
        if (errors.error) {
          setError(errors.error);
        } else if (errors.username) {
          setError(`Username: ${Array.isArray(errors.username) ? errors.username.join(', ') : errors.username}`);
        } else if (errors.password) {
          setError(`Password: ${Array.isArray(errors.password) ? errors.password.join(', ') : errors.password}`);
        } else if (errors.non_field_errors) {
          setError(Array.isArray(errors.non_field_errors) ? errors.non_field_errors.join(', ') : errors.non_field_errors);
        } else if (errors.detail) {
          setError(errors.detail);
        } else {
          const errorMessages = Object.values(errors).flat();
          setError(Array.isArray(errorMessages) ? errorMessages.join(', ') : errorMessages);
        }
      } else if (typeof errors === 'string') {
        setError(errors);
      } else {
        setError('Login failed');
      }
    } else if (error.message && error.message.includes('Network Error')) {
      setError('Network error: Cannot reach server. Please check your connection.');
    } else if (error.message) {
      setError(error.message);
    } else {
      setError('Login failed. Please try again.');
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
// Dans votre Login.js - renderLogin complet
const renderLogin = () => (
  <div className="auth-page">
    {/* Côté gauche - Présentation comme Google */}
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
          
          {error && (
            <div className="alert error-message" role="alert">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <div className="alert-content">
                <strong className="alert-title">Authentication Error</strong>
                <p className="alert-text">{error}</p>
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
             {/*
          <div className="divider">
            <span className="divider-text">or continue with</span>
          </div>
   
          
          <div className="social-login">
            <button type="button" className="social-button" disabled={loading}>
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" className="social-button" disabled={loading}>
              <svg className="social-icon" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </button>
          </div>
      */}
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
      </div>
    </div>
  </div>
);

  return renderMode();
};

export default Login;
// RegistrationWithVerification.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaEnvelope, 
  FaUser, 
  FaLock, 
  FaCheckCircle, 
  FaTimes, 
  FaRedo,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaRocket,
  FaUsers,
  FaGlobe,
  FaChartLine,
  FaKey
} from 'react-icons/fa';
import axios from 'axios';
import API_URL from '../../hooks/useApiUrl';
import '../../styles/auth/register.css';

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

const Register = ({ onLogin, onSwitchToLogin }) => {
  const [step, setStep] = useState(1); // 1: Register, 2: Verify, 3: Success
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: ''
  });
  const [verificationData, setVerificationData] = useState({
    email: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Compte à rebours
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Vérifier la force du mot de passe
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password);
    } else {
      setPasswordStrength(0);
      setPasswordCriteria({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      });
    }
  }, [formData.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleVerificationChange = (e) => {
    setVerificationData({
      ...verificationData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

const checkPasswordStrength = (password) => {
  // Compter les lettres (minuscules et majuscules)
  const letterCount = (password.match(/[a-zA-Z]/g) || []).length;
  
  // Compter les chiffres
  const numberCount = (password.match(/[0-9]/g) || []).length;
  
  // Compter les caractères spéciaux
  const specialCharCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
  
  const criteria = {
    letters: letterCount >= 3,
    numbers: numberCount >= 3,
    specials: specialCharCount >= 2,
    length: password.length >= 8
  };
  
  setPasswordCriteria(criteria);
  
  // Calculer la force : au moins 50% si un critère est rempli, 100% si tous sont remplis
  const met = Object.values(criteria).filter(Boolean).length;
  setPasswordStrength((met / 4) * 100);
};

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return '#f44336';
    if (passwordStrength < 70) return '#ff9800';
    return '#4caf50';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'No password';
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Username, email and password are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (passwordStrength < 40) {
      setError('Please choose a stronger password');
      setLoading(false);
      return;
    }
  if (!passwordCriteria.letters || !passwordCriteria.numbers || !passwordCriteria.specials) {
    setError('Password must contain at least 3 letters, 3 numbers, and 2 special characters');
    setLoading(false);
    return;
  }

  if (passwordStrength < 100) {
    setError('Please choose a stronger password');
    setLoading(false);
    return;
  }
    try {
      const response = await axios.post(
        `${API_URL}/accounts/auth/register/`,
        {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          first_name: formData.first_name.trim() || '',
          last_name: formData.last_name.trim() || ''
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          }
        }
      );

      setSuccess('Account created successfully! Check your email for verification.');
      setRegisteredEmail(formData.email);
      setVerificationData({
        email: formData.email,
        code: ''
      });
      setStep(2);
      setCountdown(900); // 15 minutes pour la démo
      
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

const handleVerify = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  if (!verificationData.code || verificationData.code.length !== 6) {
    setError('Please enter the complete 6-digit verification code');
    setLoading(false);
    return;
  }

  try {
    console.log('🔐 Verifying code for:', verificationData.email);
    
    const response = await axios.post(
      `${API_URL}/accounts/auth/verify-email/`,
      {
        email: verificationData.email,
        code: verificationData.code
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        }
      }
    );

    console.log('✅ Verification response:', response.data);
    
    if (!response.data.token) {
      console.error('❌ NO TOKEN IN RESPONSE!');
      setError('No authentication token received');
      setLoading(false);
      return;
    }
    
    // Stocker IMMÉDIATEMENT les données d'authentification
    localStorage.setItem('token', response.data.token);
    axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
    
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    // Appeler onLogin IMMÉDIATEMENT (sans délai)
    if (onLogin) {
      console.log('🚀 Calling onLogin immediately...');
      const loginResult = onLogin({
        token: response.data.token,
        user: response.data.user || {
          username: formData.username,
          email: formData.email
        }
      });
      
      console.log('🔑 Login callback result:', loginResult);
    }
    
    // Afficher le succès et rediriger rapidement
    setSuccess('Email verified successfully! Your account is now active.');
    setStep(3);
    
    // Redirection automatique après 1 seconde (pas 3)
    setTimeout(() => {
      console.log('📍 Redirecting to dashboard...');
      
      // Forcer la navigation vers le dashboard
      if (window.location.pathname !== '/dashboard') {
        window.location.href = '/dashboard';
      }
    }, 1000); // Réduit à 1 seconde
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    console.error('❌ Error response:', error.response?.data);
    handleError(error);
  } finally {
    setLoading(false);
  }
};

  const handleResendCode = async () => {
    if (countdown > 0 && countdown > 14 * 60) {
      setError('Please wait before requesting a new code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_URL}/accounts/auth/resend-verification/`,
        {
          email: verificationData.email
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          }
        }
      );

      setSuccess('New verification code sent to your email');
      setCountdown(900);
      
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/api/auth/cancel-registration/`,
        {
          email: verificationData.email
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          }
        }
      );

      // Réinitialiser
      setStep(1);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        first_name: '',
        last_name: ''
      });
      setVerificationData({ email: '', code: '' });
      setRegisteredEmail('');
      setCountdown(0);
      onSwitchToLogin();
      
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error) => {
    console.error('API Error:', error);
    
    if (error.response?.data) {
      const errors = error.response.data;
      if (typeof errors === 'object') {
        if (errors.error) {
          setError(errors.error);
        } else if (errors.username) {
          setError(`Username: ${Array.isArray(errors.username) ? errors.username.join(', ') : errors.username}`);
        } else if (errors.email) {
          setError(`Email: ${Array.isArray(errors.email) ? errors.email.join(', ') : errors.email}`);
        } else if (errors.password) {
          setError(`Password: ${Array.isArray(errors.password) ? errors.password.join(', ') : errors.password}`);
        } else if (errors.detail) {
          setError(errors.detail);
        } else {
          const errorMessages = Object.values(errors).flat();
          setError(Array.isArray(errorMessages) ? errorMessages.join(', ') : errorMessages);
        }
      } else if (typeof errors === 'string') {
        setError(errors);
      } else {
        setError('Registration failed. Please try again.');
      }
    } else if (error.message.includes('Network Error')) {
      setError('Network error: Cannot reach server. Please check your connection.');
    } else if (error.message) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Create Your Spider Account';
      case 2: return 'Verify Your Email';
      case 3: return 'Welcome to Spider!';
      default: return 'Registration';
    }
  };

  return (
    <div className="auth-page">
      {/* Côté gauche - Présentation */}
      <div className="auth-presentation">
        <div className="decorative-element decorative-1"></div>
        <div className="decorative-element decorative-2"></div>
        <div className="decorative-element decorative-3"></div>
        
        <div className="presentation-content">
          <div className="logo-container">
            <div className="logo-icon">
              🕸️
            </div>
            <div className="app-name">Spider</div>
          </div>
          
          <p className="app-tagline">
            Join thousands of professionals who trust Spider for their digital workspace.
          </p>
          
          <div className="benefits-section">
            <h3 className="benefits-title">
              <FaRocket /> Why Join Spider?
            </h3>
            
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">
                  <FaShieldAlt />
                </div>
                <div className="benefit-content">
                  <h4>Enterprise Security</h4>
                  <p>Military-grade encryption and advanced threat protection</p>
                </div>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">
                  <FaChartLine />
                </div>
                <div className="benefit-content">
                  <h4>Powerful Analytics</h4>
                  <p>Real-time insights and data-driven decision making</p>
                </div>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">
                  <FaUsers />
                </div>
                <div className="benefit-content">
                  <h4>Team Collaboration</h4>
                  <p>Seamless teamwork with advanced sharing controls</p>
                </div>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">
                  <FaGlobe />
                </div>
                <div className="benefit-content">
                  <h4>Global Access</h4>
                  <p>Access your workspace from anywhere, on any device</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="testimonials">
            <div className="testimonial-card">
              <p className="testimonial-text">
                "Spider transformed how our team collaborates. The security features are unmatched."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">SM</div>
                <div className="author-info">
                  <div className="author-name">Sarah Miller</div>
                  <div className="author-role">CTO, TechSolutions Inc.</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Côté droit - Formulaire */}
      <div className="auth-container">
        <div className="auth-content">
          <button 
            onClick={onSwitchToLogin}
            className="back-button-register"
            disabled={loading}
          >
            <FaArrowLeft /> Back to Login
          </button>
          
          <div className="form-header-password">
            <h2 className="form-title">
              {step === 1 && <FaUser />}
              {step === 2 && <FaEnvelope />}
              {step === 3 && <FaCheckCircle />}
              {' '}{getStepTitle()}
            </h2>
            <p className="form-subtitle">
              {step === 1 && 'Create your account to access the full Spider platform'}
              {step === 2 && 'Verify your email address to complete registration'}
              {step === 3 && 'Your account is ready! Welcome to the Spider community'}
            </p>
          </div>
          
          {/* Indicateur d'étapes */}
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-circle">
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="step-label">Account Info</span>
            </div>
            
            <div className="step-line"></div>
            
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-circle">
                {step > 2 ? '✓' : '2'}
              </div>
              <span className="step-label">Verify Email</span>
            </div>
            
            <div className="step-line"></div>
            
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <span className="step-label">Complete</span>
            </div>
          </div>
          
          {/* Étape 1: Inscription */}
          {step === 1 && (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="first_name" className="form-label">
                    <FaUser /> First Name
                  </label>
                  <div className="input-container">
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="form-input"
                      placeholder="First name (optional)"
                      autoFocus
                    />
                    <div className="input-border"></div>
                  </div>
                </div>
                
                <div className="form-group half">
                  <label htmlFor="last_name" className="form-label">
                    <FaUser /> Last Name
                  </label>
                  <div className="input-container">
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="form-input"
                      placeholder="Last name (optional)"
                    />
                    <div className="input-border"></div>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  <FaUser /> Username *
                </label>
                <div className="input-container">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="form-input"
                    placeholder="Choose a unique username"
                  />
                  <div className="input-border"></div>
                </div>
                <div className="input-hint">
                  This will be your unique identifier on the platform
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <FaEnvelope /> Email Address *
                </label>
                <div className="input-container">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="form-input"
                    placeholder="Enter your professional email"
                  />
                  <div className="input-border"></div>
                </div>
                <div className="input-hint">
                  We'll send a verification code to this address
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <FaLock /> Create Password *
                </label>
                <div className="input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="form-input"
                    placeholder="Create a strong password"
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
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* Indicateur de force */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-meter">
                      <div 
                        className="strength-bar"
                        style={{
                          width: `${passwordStrength}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }}
                      />
                    </div>
                    <div className="strength-text">
                      Strength: <strong style={{ color: getPasswordStrengthColor() }}>
                        {getPasswordStrengthText()}
                      </strong>
                    </div>
                  </div>
                )}
                
                {/* Critères */}
                <div className="password-criteria">
                  <h6>Password Requirements:</h6>
                  <ul>
                    <li className={passwordCriteria.length ? 'met' : ''}>
                      <span className="criteria-icon">
                        {passwordCriteria.length ? '✓' : '○'}
                      </span>
                      At least 8 characters
                    </li>
                    <li className={passwordCriteria.uppercase ? 'met' : ''}>
                      <span className="criteria-icon">
                        {passwordCriteria.uppercase ? '✓' : '○'}
                      </span>
                      One uppercase letter
                    </li>
                    <li className={passwordCriteria.lowercase ? 'met' : ''}>
                      <span className="criteria-icon">
                        {passwordCriteria.lowercase ? '✓' : '○'}
                      </span>
                      One lowercase letter
                    </li>
                    <li className={passwordCriteria.number ? 'met' : ''}>
                      <span className="criteria-icon">
                        {passwordCriteria.number ? '✓' : '○'}
                      </span>
                      One number
                    </li>
                    <li className={passwordCriteria.special ? 'met' : ''}>
                      <span className="criteria-icon">
                        {passwordCriteria.special ? '✓' : '○'}
                      </span>
                      One special character
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirm_password" className="form-label">
                  <FaLock /> Confirm Password *
                </label>
                <div className="input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="form-input"
                    placeholder="Confirm your password"
                  />
                  <div className="input-border"></div>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {formData.confirm_password && formData.password !== formData.confirm_password && (
                  <div className="password-match-error">
                    <FaTimes /> Passwords do not match
                  </div>
                )}
                
                {formData.confirm_password && formData.password === formData.confirm_password && formData.password.length >= 8 && (
                  <div className="password-match-success">
                    <FaCheckCircle /> Passwords match
                  </div>
                )}
              </div>
              
              <div className="terms-agreement">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  disabled={loading}
                  className="checkbox"
                />
                <label htmlFor="terms" className="checkbox-label">
                  I agree to the <a href="/policy" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                </label>
              </div>
              
              {error && (
                <div className="alert error-message" role="alert">
                  <FaTimes className="alert-icon" />
                  <div className="alert-content">
                    <strong className="alert-title">Registration Error</strong>
                    <p className="alert-text">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="alert success-message">
                  <FaCheckCircle className="alert-icon" />
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
                    <FaCheckCircle className="spinner" /> Creating Account...
                  </>
                ) : (
                  <>
                    <FaRocket /> Create Spider Account
                  </>
                )}
              </button>
              
              <div className="login-redirect">
                <p className="redirect-text">
                  Already have an account?
                </p>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="secondary-button"
                  disabled={loading}
                >
                  <FaUser /> Sign In Instead
                </button>
              </div>
            </form>
          )}
          
          {/* Étape 2: Vérification */}
          {step === 2 && (
            <div className="verification-container">
              <div className="verification-header">
                <FaEnvelope className="verification-icon-large" />
                <h3 className="verification-title">Email Verification Required</h3>
                <p className="verification-subtitle">
                  We've sent a 6-digit code to: <strong>{registeredEmail}</strong>
                </p>
              </div>
              
              <form onSubmit={handleVerify} className="auth-form">
                <div className="form-group">
                  <label className="form-label">
                    <FaKey /> Verification Code
                  </label>
                  <div className="code-input-container">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        className={`code-input ${verificationData.code[index] ? 'filled' : ''}`}
                        value={verificationData.code[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value) {
                            const newCode = verificationData.code.split('');
                            newCode[index] = value;
                            setVerificationData({
                              ...verificationData,
                              code: newCode.join('').slice(0, 6)
                            });
                            setError('');
                            
                            if (index < 5 && e.target.nextSibling) {
                              e.target.nextSibling.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !verificationData.code[index] && index > 0) {
                            e.target.previousSibling.focus();
                          }
                        }}
                        disabled={loading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  
                  <div className="code-actions">
                    {countdown > 0 && (
                      <div className="countdown-timer">
                        ⏱️ Code expires in: <strong>{formatTime(countdown)}</strong>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="resend-button"
                      disabled={loading || countdown > 14 * 60}
                    >
                      <FaRedo /> Send New Code
                    </button>
                  </div>
                </div>
                
                <div className="verification-help">
                  <h4 className="help-title">
                    <FaShieldAlt /> Security Tips:
                  </h4>
                  <ul className="help-list">
                    <li>Check your spam folder if you don't see the email</li>
                    <li>Never share your verification code with anyone</li>
                    <li>Codes expire after 15 minutes for security</li>
                    <li>Contact support if you encounter issues</li>
                  </ul>
                </div>
                
                {error && (
                  <div className="alert error-message" role="alert">
                    <FaTimes className="alert-icon" />
                    <div className="alert-content">
                      <strong className="alert-title">Verification Error</strong>
                      <p className="alert-text">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="alert success-message">
                    <FaCheckCircle className="alert-icon" />
                    <div className="alert-content">
                      <strong className="alert-title">Success</strong>
                      <p className="alert-text">{success}</p>
                    </div>
                  </div>
                )}
                
                <div className="verification-actions">
                  <button 
                    type="submit" 
                    disabled={loading || verificationData.code.length !== 6}
                    className="primary-button verify-button"
                  >
                    {loading ? (
                      <>
                        <FaCheckCircle className="spinner" /> Verifying...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> Verify & Continue
                      </>
                    )}
                  </button>
                  
                  <div className="secondary-actions">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="secondary-button"
                      disabled={loading}
                    >
                      <FaArrowLeft /> Back to Registration
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCancelRegistration}
                      className="secondary-button danger"
                      disabled={loading}
                    >
                      <FaTimes /> Cancel Registration
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
          
          {/* Étape 3: Succès */}
          {step === 3 && (
            <div className="success-container">
              <div className="success-animation">
                <FaCheckCircle className="success-icon-large" />
                <div className="success-rings">
                  <div className="ring ring-1"></div>
                  <div className="ring ring-2"></div>
                  <div className="ring ring-3"></div>
                </div>
              </div>
              
              <div className="success-content">
                <h3 className="success-title">
                  Welcome to Spider!
                </h3>
                
                <p className="success-message-large">
                  Your account has been successfully created and verified.
                </p>
                
                <div className="account-details">
                  <div className="detail-item">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{formData.username}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{formData.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value status-active">Active ✓</span>
                  </div>
                </div>
                
                <div className="next-steps">
                  <h4 className="next-steps-title">What's Next?</h4>
                  <ul className="next-steps-list">
                    <li>Check your email for the welcome guide</li>
                    <li>Complete your profile setup</li>
                    <li>Explore the dashboard features</li>
                    <li>Join our community forum</li>
                  </ul>
                </div>
                
                <div className="loading-indicator">
                  <div className="spinner-large"></div>
                  <p className="redirecting-text">
                    Redirecting to your dashboard...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
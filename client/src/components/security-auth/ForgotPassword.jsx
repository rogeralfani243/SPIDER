// components/auth/ForgotPassword.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/auth/forget-password.css';
import API_URL from '../../hooks/useApiUrl';
import { 
  FaKey, 
  FaEnvelope, 
  FaEye, 
  FaEyeSlash, 
  FaArrowLeft,
  FaCheckCircle,
  FaRedo,
  FaSpinner,
  FaLock,
  FaShieldAlt,
  FaTimes,
  FaUser
} from 'react-icons/fa';
import handleSupportClick from '../../hooks/useSupport';
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

const ForgotPassword = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: reset password
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
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
    if (formData.new_password) {
      checkPasswordStrength(formData.new_password);
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
  }, [formData.new_password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const checkPasswordStrength = (password) => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    setPasswordCriteria(criteria);
    
    // Calculer la force (0-100)
    const met = Object.values(criteria).filter(Boolean).length;
    setPasswordStrength((met / 5) * 100);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return '#f44336'; // Red
    if (passwordStrength < 70) return '#ff9800'; // Orange
    return '#4caf50'; // Green
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'No password';
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (step === 1) {
        // Validation de l'email
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          setError('Please enter a valid email address');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          `${API_URL}/api/account/request-password-reset-code/`,
          { email: formData.email },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCsrfToken(),
            }
          }
        );

        setSuccess('A 6-digit verification code has been sent to your email address.');
        setStep(2);
        setCountdown(900); // 15 minutes en secondes

      } else if (step === 2) {
        // Validation du code
        if (formData.code.length !== 6) {
          setError('Please enter the complete 6-digit code');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          `${API_URL}/api/account/verify-password-reset-code/`,
          {
            email: formData.email,
            code: formData.code
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCsrfToken(),
            }
          }
        );

        setSuccess('Code verified successfully! You can now set your new password.');
        setStep(3);

      } else if (step === 3) {
        // Validation du mot de passe
        if (formData.new_password !== formData.confirm_password) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (formData.new_password.length < 8) {
          setError('Password must be at least 8 characters long');
          setLoading(false);
          return;
        }

        if (passwordStrength < 40) {
          setError('Please choose a stronger password');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          `${API_URL}/api/account/reset-password/`,
          {
            email: formData.email,
            code: formData.code,
            new_password: formData.new_password,
            confirm_password: formData.confirm_password
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCsrfToken(),
            }
          }
        );

        setSuccess('Password reset successfully! Redirecting to login...');
        
        // Réinitialiser et revenir au login après 3 secondes
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error) => {
    if (error.response?.data) {
      const errors = error.response.data;
      if (typeof errors === 'object') {
        if (errors.error) {
          setError(errors.error);
        } else if (errors.email) {
          setError(`Email: ${Array.isArray(errors.email) ? errors.email.join(', ') : errors.email}`);
        } else if (errors.code) {
          setError(`Code: ${Array.isArray(errors.code) ? errors.code.join(', ') : errors.code}`);
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
        setError('Password reset failed');
      }
    } else if (error.message.includes('Network Error')) {
      setError('Network error: Cannot reach server. Please check your connection.');
    } else if (error.message) {
      setError(error.message);
    } else {
      setError('Password reset failed. Please try again.');
    }
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        `${API_URL}/api/account/request-password-reset-code/`,
        { email: formData.email },
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
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Reset Your Password';
      case 2: return 'Verify Your Identity';
      case 3: return 'Create New Password';
      default: return 'Reset Password';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Enter your email address to receive a password reset link';
      case 2: return 'Enter the 6-digit code sent to your email address';
      case 3: return 'Create a strong, secure password for your account';
      default: return '';
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
              <FaShieldAlt style={{ fontSize: '40px' }} />
            </div>
            <div className="app-name">Spider Security</div>
          </div>
          
          <p className="app-tagline">
            Advanced security protocols to protect your digital identity and data.
          </p>
          
          <div className="security-features">
            <h3 className="security-title">
              <FaShieldAlt /> Security Features
            </h3>
            <ul className="features-list">
              <li>
                <span className="feature-icon">🔐</span>
                <div className="feature-text">
                  <strong>Two-Factor Authentication</strong>
                  <span>Enhanced account protection</span>
                </div>
              </li>
              <li>
                <span className="feature-icon">📧</span>
                <div className="feature-text">
                  <strong>Email Verification</strong>
                  <span>Secure identity confirmation</span>
                </div>
              </li>
              <li>
                <span className="feature-icon">🔒</span>
                <div className="feature-text">
                  <strong>End-to-End Encryption</strong>
                  <span>Your data stays private</span>
                </div>
              </li>
              <li>
                <span className="feature-icon">⏱️</span>
                <div className="feature-text">
                  <strong>Time-Limited Codes</strong>
                  <span>Expires for added security</span>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="security-tips">
            <h4 className="tips-title">Security Tips:</h4>
            <ul className="tips-list" >
              <li>Never share your verification codes</li>
              <li>Use a unique, strong password</li>
              <li>Enable 2FA for extra security</li>
              <li>Check for suspicious activity regularly</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Côté droit - Formulaire */}
      <div className="auth-container">
        <div className="auth-content">
          <button 
            onClick={onBackToLogin}
            className="back-button-register"
            disabled={loading}
          >
            <FaArrowLeft /> Back to Login
          </button>
          
          <div className="form-header-password">
            <h2 className="form-title">
              <FaKey /> {getStepTitle()}
            </h2>
            <p className="form-subtitle">
              {getStepDescription()}
            </p>
          </div>
          
          <div className="step-indicator">
            {[1, 2, 3].map((stepNum) => (
              <div 
                key={stepNum} 
                className={`step ${step === stepNum ? 'active' : step > stepNum ? 'completed' : ''}`}
              >
                <div className="step-circle">
                  {step > stepNum ? '✓' : stepNum}
                </div>
                <span className="step-label">
                  {stepNum === 1 ? 'Verify Email' : stepNum === 2 ? 'Enter Code' : 'New Password'}
                </span>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Étape 1: Email */}
            {step === 1 && (
              <div className="step-content">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <FaEnvelope /> Your Email Address
                  </label>
                  <div className="input-container">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="form-input"
                      placeholder="Enter your registered email address"
                      autoFocus
                    />
                    <div className="input-border"></div>
                  </div>
                  <div className="input-hint">
                    We'll send a secure verification code to this address
                  </div>
                </div>
                
                <div className="security-note">
                  <FaShieldAlt className="security-note-icon" />
                  <p>
                    Your email is used only for verification and won't be shared with third parties.
                  </p>
                </div>
              </div>
            )}

            {/* Étape 2: Code de vérification */}
            {step === 2 && (
              <div className="step-content">
                <div className="verification-notice">
                  <FaCheckCircle className="verification-icon" />
                  <p className="verification-text">
                    We sent a 6-digit verification code to:
                    <br />
                    <strong>{formData.email}</strong>
                  </p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="code" className="form-label">
                    <FaKey /> Verification Code
                  </label>
                  <div className="code-input-container">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        className={`code-input ${formData.code[index] ? 'filled' : ''}`}
                        value={formData.code[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value) {
                            const newCode = formData.code.split('');
                            newCode[index] = value;
                            setFormData({
                              ...formData,
                              code: newCode.join('').slice(0, 6)
                            });
                            setError('');
                            
                            // Auto-focus next input
                            if (index < 5 && e.target.nextSibling) {
                              e.target.nextSibling.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !formData.code[index] && index > 0) {
                            e.target.previousSibling.focus();
                          }
                        }}
                        disabled={loading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  
                  <div className="code-info">
                    <div className="countdown-container">
                      {countdown > 0 && (
                        <div className="countdown-timer">
                          ⏱️ Code expires in: <strong>{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</strong>
                        </div>
                      )}
                      {countdown === 0 && (
                        <div className="countdown-expired">
                          ⚠️ Code has expired
                        </div>
                      )}
                    </div>
                    
                    <div className="resend-section">
                      <p className="resend-text">
                        Didn't receive the code?
                      </p>
                      <button
                        type="button"
                        onClick={resendCode}
                        className="resend-button"
                        disabled={loading || countdown > 0}
                      >
                        <FaRedo /> Send New Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Étape 3: Nouveau mot de passe */}
            {step === 3 && (
              <div className="step-content">
                <div className="verification-notice success">
                  <FaCheckCircle className="verification-icon" />
                  <p className="verification-text">
                    Email verified successfully! Now create your new password.
                  </p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="new_password" className="form-label">
                    <FaLock /> New Password
                  </label>
                  <div className="input-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="new_password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="form-input"
                      placeholder="Create a strong password"
                      autoFocus
                    />
                    <div className="input-border"></div>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex="-1"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                      disabled={loading}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  
                  {/* Indicateur de force du mot de passe */}
                  {formData.new_password && (
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
                  
                  {/* Critères du mot de passe */}
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
                        One uppercase letter (A-Z)
                      </li>
                      <li className={passwordCriteria.lowercase ? 'met' : ''}>
                        <span className="criteria-icon">
                          {passwordCriteria.lowercase ? '✓' : '○'}
                        </span>
                        One lowercase letter (a-z)
                      </li>
                      <li className={passwordCriteria.number ? 'met' : ''}>
                        <span className="criteria-icon">
                          {passwordCriteria.number ? '✓' : '○'}
                        </span>
                        One number (0-9)
                      </li>
                      <li className={passwordCriteria.special ? 'met' : ''}>
                        <span className="criteria-icon">
                          {passwordCriteria.special ? '✓' : '○'}
                        </span>
                        One special character (!@#$%^&*)
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm_password" className="form-label">
                    <FaLock /> Confirm New Password
                  </label>
                  <div className="input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm_password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="form-input"
                      placeholder="Confirm your new password"
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
                  
                  {formData.confirm_password && formData.new_password !== formData.confirm_password && (
                    <div className="password-match-error">
                      <FaTimes /> Passwords do not match
                    </div>
                  )}
                  
                  {formData.confirm_password && formData.new_password === formData.confirm_password && formData.new_password.length >= 8 && (
                    <div className="password-match-success">
                      <FaCheckCircle /> Passwords match
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="alert error-message" role="alert">
                <FaTimes className="alert-icon" />
                <div className="alert-content">
                  <strong className="alert-title">Security Alert</strong>
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
                  <FaSpinner className="spinner" /> Processing...
                </>
              ) : step === 1 ? (
                <>
                  <FaEnvelope /> Send Verification Code
                </>
              ) : step === 2 ? (
                <>
                  <FaCheckCircle /> Verify & Continue
                </>
              ) : (
                <>
                  <FaLock /> Reset Password
                </>
              )}
            </button>
            
            <div className="step-navigation">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="secondary-button outline"
                  disabled={loading}
                >
                  <FaArrowLeft /> Back
                </button>
              )}
              
              {step === 2 && countdown > 0 && (
                <button
                  type="button"
                  onClick={resendCode}
                  className="secondary-button"
                  disabled={loading || countdown > 0}
                >
                  <FaRedo /> Resend Code
                </button>
              )}
            </div>
          </form>
          
          <div className="security-footer">
            <div className="security-warning">
              <FaShieldAlt className="warning-icon" />
              <p>
                <strong>Security Notice:</strong> This password reset process is secure and encrypted.
                Never share your verification codes with anyone.
              </p>
            </div>
            
            <div className="support-link">
              Need help? <a onClick={handleSupportClick}>Contact Security Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
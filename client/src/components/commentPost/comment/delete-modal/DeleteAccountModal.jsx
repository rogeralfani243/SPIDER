import React, { useState, useEffect } from 'react';
import { 
  FaExclamationCircle, 
  FaTimes, 
  FaEnvelope, 
  FaCheckCircle,
  FaRedo,
  FaTrashAlt,
  FaKey
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
const DeleteAccountModal = ({ 
  isOpen, 
  onClose, 
  user,
  onDeleteAccount,
  onRequestCode,
  onVerifyCode,
  onSupportClick
}) => {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: confirmation
  const [emailCode, setEmailCode] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Reset modal when closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmailCode('');
      setConfirmationText('');
      setError('');
      setIsLoading(false);
      setCountdown(0);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRequestCode = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await onRequestCode();
      setStep(2);
      setCountdown(900); // 15 minutes
    } catch (err) {
      setError(err.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (emailCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await onVerifyCode(emailCode);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmationText || confirmationText.toLowerCase() !== 'delete my account') {
      setError('Please type exactly "delete my account" to confirm');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await onDeleteAccount(confirmationText);
      // La fermeture et redirection sont gérées par le parent
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <FaExclamationCircle className="modal-icon danger" />
          <h3>Delete Your Account</h3>
          <button 
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Step Indicator */}
          <div className="step-indicator">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className={`step ${step === stepNum ? 'active' : step > stepNum ? 'completed' : ''}`}>
                {stepNum}
                <span className="step-label">
                  {stepNum === 1 ? 'Verify' : stepNum === 2 ? 'Code' : 'Confirm'}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Email Verification */}
          {step === 1 && (
            <div className="step-content">
              <div className="warning-section">
                <p className="warning-text">
                  ⚠️ <strong>Security Verification Required</strong>
                </p>
                <p>
                  We need to verify your identity before you can delete your account.
                </p>
                <ul className="warning-list">
                  <li>We will send a 6-digit code to: <strong>{user?.email}</strong></li>
                  <li>The code will expire in 15 minutes</li>
                  <li>You must enter this code to proceed</li>
                </ul>
              </div>
              
              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleRequestCode}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <FaEnvelope /> Send Verification Code
                    </>
                  )}
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Code Verification */}
          {step === 2 && (
            <div className="step-content">
              <div className="email-verification-section">
                <div className="verification-header">
                  <FaEnvelope className="verification-icon" />
                  <h4>Enter Verification Code</h4>
                </div>
                
                <p>
                  A 6-digit code has been sent to: <strong>{user?.email}</strong>
                </p>
                
                {countdown > 0 && (
                  <div className="countdown">
                    Code expires in: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </div>
                )}
                
                <div className="code-input-container">
                  <input
                    type="text"
                    className="code-input"
                    value={emailCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setEmailCode(value);
                      setError('');
                    }}
                    placeholder="Enter 6-digit code"
                    autoFocus
                    disabled={isLoading}
                  />
                  <div className="code-hint">
                    Enter the 6-digit code from your email
                  </div>
                </div>
                
                <div className="verification-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleVerifyCode}
                    disabled={isLoading || emailCode.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> Verify Code
                      </>
                    )}
                  </button>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setStep(1);
                      setEmailCode('');
                      setError('');
                    }}
                    disabled={isLoading}
                  >
                    <FaTimes /> Back
                  </button>
                  
                  <button
                    className="btn btn-outline"
                    onClick={handleRequestCode}
                    disabled={isLoading || countdown > 0}
                  >
                    <FaRedo /> Resend Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {step === 3 && (
            <div className="step-content">
              <div className="warning-section">
                <p className="warning-text">
                  ⚠️ <strong>Final Confirmation Required</strong>
                </p>
                <p>
                  Your identity has been verified. This is your final chance to cancel.
                </p>
                <ul className="warning-list">
                  <li>All your data will be permanently deleted</li>
                  <li>This action cannot be undone</li>
                  <li>You will lose access to all your content</li>
                </ul>
              </div>
              
              <div className="confirmation-section">
                <p>
                  To permanently delete your account, type <strong>"delete my account"</strong> below:
                </p>
                <div className="confirmation-input-container">
                  <input
                    type="text"
                    className={`confirmation-input ${error ? 'error' : ''}`}
                    value={confirmationText}
                    onChange={(e) => {
                      setConfirmationText(e.target.value);
                      setError('');
                    }}
                    placeholder='Type "delete my account" here'
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="action-buttons">
                <button
                  className="btn btn-danger btn-delete"
                  onClick={handleDelete}
                  disabled={isLoading || confirmationText.toLowerCase() !== 'delete my account'}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Deleting Account...
                    </>
                  ) : (
                    <>
                      <FaTrashAlt /> Permanently Delete Account
                    </>
                  )}
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  <FaTimes /> Cancel Deletion
                </button>
                
                <button
                  className="btn btn-outline"
                  onClick={() => setStep(2)}
                  disabled={isLoading}
                >
                  <FaKey /> Back to Verification
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <FaExclamationCircle /> {error}
            </div>
          )}

          {/* Support Info */}
          <div className="additional-info">
            <p className="support-link">
              Having trouble? <Link onClick={onSupportClick}>Contact Support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
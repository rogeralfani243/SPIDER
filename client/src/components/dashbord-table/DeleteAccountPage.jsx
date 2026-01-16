// components/SettingsDashboard/DeleteAccountSection.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaExclamationCircle, 
  FaTimes, 
  FaEnvelope, 
  FaCheckCircle,
  FaRedo,
  FaTrashAlt,
  FaKey,
  FaArrowLeft,
  FaShieldAlt,
  FaDatabase,
  FaUserSlash,
  FaClock,
  FaQuestionCircle
} from 'react-icons/fa';
import { MdWarning, MdDeleteForever } from 'react-icons/md';
 import '../../styles/dashboard-table/delete-account.css'
import { useAuth } from '../../contexts/AuthContext';
import { useAccountService } from '../hooks/useAccountService';

const DeleteAccountSection = ({ isOpen, onClose }) => {
  const { user, token, logout } = useAuth();
  
  // Utiliser votre hook existant useAccountService
  const { 
    requestDeletionCode,
    verifyDeletionCode,
    deleteAccount,
    isVerified,
    loading: apiLoading,
    error: apiError,
    clearError,
    resetVerification
  } = useAccountService();
  
  const [step, setStep] = useState(1); // 1: warning, 2: email, 3: code, 4: confirmation
  const [emailCode, setEmailCode] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [localVerification, setLocalVerification] = useState(false);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Reset state when component closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmailCode('');
      setConfirmationText('');
      setError('');
      setIsLoading(false);
      setCountdown(0);
      clearError();
      resetVerification();
      setLocalVerification(false);
    }
  }, [isOpen, clearError, resetVerification]);

  // Synchroniser avec le hook
  useEffect(() => {
    if (isVerified) {
      setLocalVerification(true);
      setStep(4); // Aller directement à l'étape de confirmation
    }
  }, [isVerified]);

  // Fonction pour demander un code de suppression
  const handleRequestCode = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('📧 Requesting deletion code...');
      await requestDeletionCode();
      console.log('✅ Code requested successfully');
      
      setStep(3); // Passer à l'étape du code
      setCountdown(900); // 15 minutes (900 secondes)
      
    } catch (err) {
      const errorMessage = apiError?.error || 'Failed to send verification code';
      setError(errorMessage);
      console.error('❌ Error requesting code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour vérifier le code
  const handleVerifyCode = async (code) => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔐 Verifying code:', code);
      await verifyDeletionCode(code);
      console.log('✅ Code verified successfully');
      
      setLocalVerification(true);
      setStep(4); // Étape de confirmation finale
      
    } catch (err) {
      const errorMessage = apiError?.error || 'Invalid verification code';
      setError(errorMessage);
      console.error('❌ Error verifying code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour supprimer le compte
  const handleDeleteAccount = async () => {
    if (!confirmationText || confirmationText.toLowerCase() !== 'delete my account') {
      setError('Please type exactly "delete my account" to confirm');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🗑️ Deleting account...');
      const result = await deleteAccount(confirmationText);
      console.log('✅ Account deletion result:', result);
      
      // Succès - déconnexion et redirection
      if (result.success) {
        logout();
        setTimeout(() => {
          window.location.href = '/?message=account_deleted';
        }, 1000);
      } else {
        throw new Error(result.message || 'Failed to delete account');
      }
      
    } catch (err) {
      const errorMessage = apiError?.error || err.message || 'Failed to delete account';
      setError(errorMessage);
      console.error('❌ Error deleting account:', err);
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      clearError();
    }
  };

  // Gestion de la confirmation finale
  const handleFinalConfirmation = async () => {
    if (!confirmationText || confirmationText.toLowerCase() !== 'delete my account') {
      setError('Please type exactly "delete my account" to confirm');
      return;
    }
    
    try {
      await handleDeleteAccount();
    } catch (err) {
      // L'erreur est déjà gérée dans handleDeleteAccount
    }
  };

  // Gestion de la fermeture avec annulation
  const handleCancelWithConfirmation = () => {
    if (step > 1) {
      if (window.confirm('Are you sure you want to cancel the deletion process?')) {
        clearError();
        resetVerification();
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Combine les chargements
  const combinedLoading = isLoading || apiLoading;

  if (!isOpen) return null;

  return (
    <div className="delete-account-section">
      <div className="delete-section-header">
        <div className="header-left">
          <MdDeleteForever className="header-icon" />
          <div>
            <h3>Delete Account</h3>
            <p className="header-subtitle">
              Step {step} of 4 • Permanently delete your account
            </p>
          </div>
        </div>
        <button 
          className="btn btn-secondary btn-close"
          onClick={handleCancelWithConfirmation}
          disabled={combinedLoading}
        >
          <FaTimes /> Close
        </button>
      </div>

      <div className="delete-section-content">
        {/* Étape 1: Warning */}
        {step === 1 && (
          <div className="warning-step">
            <div className="warning-alert">
              <MdWarning className="warning-icon" />
              <h4>⚠️ Important Warning</h4>
            </div>
            
            <p className="warning-text">
              Deleting your account is <strong>permanent</strong> and cannot be undone.
              All your data will be erased immediately.
            </p>

            <div className="warning-list">
              <p><strong>What will be deleted:</strong></p>
              <ul>
                <li>Your profile and personal information</li>
                <li>All your posts and comments</li>
                <li>Uploaded media files</li>
                <li>Account settings and preferences</li>
                <li>Activity history</li>
              </ul>
            </div>

            <div className="warning-actions">
              <button
                className="btn btn-danger"
                onClick={() => setStep(2)}
                disabled={combinedLoading}
              >
                I Understand, Continue
              </button>
              
              <button
                className="btn btn-outline"
                onClick={handleCancelWithConfirmation}
                disabled={combinedLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Étape 2: Email Verification */}
        {step === 2 && (
          <div className="verification-step">
            <div className="verification-header">
              <FaEnvelope className="verification-icon" />
              <h4>Verify Your Identity</h4>
            </div>
            
            <p>
              We'll send a 6-digit code to your email address:
              <strong> {user?.email}</strong>
            </p>
            
            <p className="verification-note">
              The code will expire in 15 minutes. Check your spam folder if you don't see it.
            </p>

            <div className="verification-actions">
              <button
                className="btn btn-primary"
                onClick={handleRequestCode}
                disabled={combinedLoading}
              >
                {combinedLoading ? (
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
                className="btn btn-outline"
                onClick={handleBack}
                disabled={combinedLoading}
              >
                <FaArrowLeft /> Back
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Code Verification */}
        {step === 3 && (
          <div className="code-step">
            <div className="code-header">
              <FaKey className="code-icon" />
              <h4>Enter Verification Code</h4>
            </div>
            
            <p>
              Enter the 6-digit code sent to:
              <strong> {user?.email}</strong>
            </p>
            
            {countdown > 0 && (
              <div className="countdown">
                Code expires in: {formatTime(countdown)}
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
                  clearError();
                }}
                placeholder="Enter 6-digit code"
                autoFocus
                disabled={combinedLoading}
              />
            </div>

            <div className="code-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleVerifyCode(emailCode)}
                disabled={combinedLoading || emailCode.length !== 6}
              >
                {combinedLoading ? (
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
              
              <div className="secondary-actions">
                <button
                  className="btn btn-outline"
                  onClick={handleBack}
                  disabled={combinedLoading}
                >
                  <FaArrowLeft /> Back
                </button>
                
                <button
                  className="btn btn-text"
                  onClick={handleRequestCode}
                  disabled={combinedLoading || countdown > 300}
                >
                  <FaRedo /> Resend Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Étape 4: Final Confirmation */}
        {step === 4 && (
          <div className="confirmation-step">
            <div className="confirmation-header">
              <MdDeleteForever className="confirmation-icon" />
              <h4>Final Confirmation</h4>
            </div>
            
            <div className="final-warning">
              <FaExclamationCircle className="warning-icon" />
              <p>This is your last chance to cancel. This action cannot be undone.</p>
            </div>

            <div className="confirmation-instructions">
              <p>
                To confirm deletion, type <strong>"delete my account"</strong> below:
              </p>
              
              <input
                type="text"
                className={`confirmation-input ${error ? 'error' : ''}`}
                value={confirmationText}
                onChange={(e) => {
                  setConfirmationText(e.target.value);
                  setError('');
                  clearError();
                }}
                placeholder='Type "delete my account" exactly as shown'
                autoFocus
                disabled={combinedLoading}
              />
            </div>

            <div className="confirmation-actions">
              <button
                className="btn btn-danger btn-delete"
                onClick={handleFinalConfirmation}
                disabled={combinedLoading || confirmationText.toLowerCase() !== 'delete my account'}
              >
                {combinedLoading ? (
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
              
              <div className="secondary-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelWithConfirmation}
                  disabled={combinedLoading}
                >
                  Cancel Deletion
                </button>
                
                <button
                  className="btn btn-outline"
                  onClick={handleBack}
                  disabled={combinedLoading}
                >
                  <FaKey /> Back to Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message d'erreur API */}
        {apiError && (
          <div className="api-error-message">
            <FaExclamationCircle /> {apiError.error || 'An error occurred'}
          </div>
        )}

        {/* Message d'erreur de validation */}
        {error && !apiError && (
          <div className="error-message">
            <FaExclamationCircle /> {error}
          </div>
        )}

        {/* Support Info */}
        <div className="support-note">
          <FaQuestionCircle />
          <span>Having trouble? <a href="/support">Contact Support</a></span>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountSection;
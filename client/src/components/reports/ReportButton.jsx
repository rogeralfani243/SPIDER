// src/components/reports/ReportButton.jsx
import React, { useState, useEffect } from 'react';
import { reportApi } from '../services/api';
import ReportModal from './reportModal';
import { FaFlag } from 'react-icons/fa';
import QuickReportModal from './QuickReportModal';
import FeedbackIcons from '../feedback/icons/FeedbackIcons';
import '../../styles/report/report-btn.css';
const ReportButton = ({ 
  contentType, 
  contentId, 
  contentAuthorId,
  contentObject = null,
  variant = 'outline',
  size = 'sm',
  className = '',
  onReported,
  showIcon = true,
  showText = true
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    // Récupérer l'utilisateur courant
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    setCurrentUser(user);
  }, []);
  
  useEffect(() => {
    // Vérifier si déjà signalé
    const checkIfReported = async () => {
      if (!currentUser || currentUser.id === contentAuthorId) return;
      
      try {
        const response = await reportApi.checkReport(contentType, contentId);
        setAlreadyReported(response.data.exists);
      } catch (error) {
        console.error('Error to verify your report:', error);
      }
    };
    
    checkIfReported();
  }, [contentType, contentId, contentAuthorId, currentUser]);
  
  // Ne pas afficher si utilisateur est l'auteur
  if (currentUser && currentUser.id === contentAuthorId) {
    return null;
  }
  
  const handleQuickReport = async (reportType) => {
    try {
      setIsLoading(true);
      await reportApi.quickReport({
        content_type: contentType,
        content_id: contentId,
        report_type: reportType
      });
      
      setAlreadyReported(true);
      setShowQuickModal(false);
      
      if (onReported) {
        onReported();
      }
      
      // Notification
alert('Report sent successfully');
} catch (error) {
  console.error('Quick report error:', error);
  alert('Error while sending the report');
} finally {
  setIsLoading(false);
}
};

  
  const handleFullReportSuccess = () => {
    setAlreadyReported(true);
    setShowReportModal(false);
    if (onReported) {
      onReported();
    }
  };
  
  const getButtonVariant = () => {
    if (alreadyReported) return 'secondary';
    return variant === 'outline' ? 'outline-danger' : 'danger';
  };
  
  const getButtonText = () => {
    if (alreadyReported) return 'Reported';
    return 'report';
  };
  
  return (
    <>
      <button
        className={`btn btn-${getButtonVariant()} btn-${size} ${className}`}
        onClick={() => setShowQuickModal(true)}
        disabled={isLoading || alreadyReported}
        title={alreadyReported ? "already reported" : "report "}
      >
        {isLoading ? (
          <span className="spinner-border spinner-border-sm me-1"></span>
        ) : showIcon && (
  <FeedbackIcons.Report />
        )}
        
    <FaFlag className="menu-icon-btn" />   {getButtonText()}
      </button>
      
      {showQuickModal && (
        <QuickReportModal
          contentType={contentType}
          contentId={contentId}
          onClose={() => setShowQuickModal(false)}
          onQuickReport={handleQuickReport}
          onFullReport={() => {
            setShowQuickModal(false);
            setShowReportModal(true);
          }}
        />
      )}
      
      {showReportModal && (
        <ReportModal
          contentType={contentType}
          contentId={contentId}
          contentObject={contentObject}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleFullReportSuccess}
        />
      )}
    </>
  );
};

export default ReportButton;
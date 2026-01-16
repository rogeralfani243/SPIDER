// src/components/reports/QuickReportModal.jsx
import React, { useState } from 'react';
import { REPORT_TYPES } from './reportConstant';
import '../../styles/report/report-modal-quick.css';

const QuickReportModal = ({ 
  contentType,
  contentId,
  onClose,
  onQuickReport,
  onFullReport
}) => {
  const [selectedType, setSelectedType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Options rapides pour signalement (les plus courantes)
  const quickOptions = REPORT_TYPES.filter(type => 
    ['spam', 'inappropriate', 'harassment', 'hate_speech', 'copyright', 'false_info','nudity_content'].includes(type.value)
  ).map(type => ({
    ...type,
    description: getDescriptionForType(type.value)
  }));

  function getDescriptionForType(type) {
const descriptions = {
  spam: 'Unsolicited content, advertising, or repetitive posts',
  inappropriate: 'Content that violates community guidelines',
  nudity_content: 'Sexually explicit content, nudity, or pornographic material',
  harassment: 'Threatening, abusive, or intimidating behavior',
  hate_speech: 'Discriminatory language targeting groups or individuals',
  copyright: 'Unauthorized use of copyrighted material',
  false_info: 'Misleading or factually incorrect information'
};

    return descriptions[type] || 'Violates community guidelines';
  }

  const handleSubmit = async () => {
    if (!selectedType) {
      alert('Please select a report reason');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onQuickReport(selectedType);
    } catch (error) {
      console.error('Error in quick report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && selectedType && !isSubmitting) {
      handleSubmit();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedType, isSubmitting]);

  return (
    <div 
      className="quick-report-modal-overlay"
      tabIndex="-1" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-report-title"
    >
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="quick-report-modal-content">
          <div className="quick-report-modal-header">
            <h5 
              className="quick-report-modal-title" 
              id="quick-report-title"
            >
              <i className="bi bi-flag-fill"></i>
              Quick Report
            </h5>
            <button 
              type="button" 
              className="quick-report-modal-close" 
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
            ></button>
          </div>
          
          <div className="quick-report-modal-body">
            <div className="p-3 pb-0">
              <p className="quick-report-modal-description">
                Select the main reason for your report. You can provide more details next.
              </p>
              
              <div className="quick-report-options-list">
                {quickOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`quick-report-option ${selectedType === option.value ? 'active' : ''}`}
                    onClick={() => setSelectedType(option.value)}
                    disabled={isSubmitting}
                  >
                    <div className="d-flex align-items-center w-100">
                      <div className="quick-report-option-icon">
                        <i className={`bi ${
                          option.value === 'spam' ? 'bi-megaphone' :
                          option.value === 'inappropriate' ? 'bi-eye-slash' :
                          option.value === 'harassment' ? 'bi-exclamation-triangle' :
                          option.value === 'hate_speech' ? 'bi-slash-circle' :
                          option.value === 'copyright' ? 'bi-c-circle' :
                           option.value === 'nudity_content' ? 'bi-c-circle' :
                          'bi-question-circle'
                        }`}></i>
                      </div>
                      <div className="quick-report-option-content">
                        <div className="quick-report-option-title">
                          <strong>{option.label}</strong>
                          {selectedType === option.value && (
                            <i className="bi bi-check-lg quick-report-check-icon"></i>
                          )}
                        </div>
                        <small className="quick-report-option-description">
                          {option.description}
                        </small>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="quick-report-more-details">
              <button 
                type="button"
                className="quick-report-more-details-btn"
                onClick={onFullReport}
                disabled={isSubmitting}
              >
                <i className="bi bi-pencil me-1"></i>
                I want to provide more details
              </button>
            </div>
          </div>
          
          <div className="quick-report-modal-footer">
            <button 
              type="button" 
              className="quick-report-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="quick-report-submit-btn"
              onClick={handleSubmit}
              disabled={!selectedType || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="quick-report-spinner me-2"></span>
                  Reporting...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-1"></i>
                  Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickReportModal;
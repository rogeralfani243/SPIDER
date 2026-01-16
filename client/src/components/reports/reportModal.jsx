// src/components/reports/ReportModal.jsx
import React, { useState } from 'react';
import { reportApi } from '../services/api';
import { REPORT_TYPES } from './reportConstant';
import '../../styles/report/report-modal.css';

const ReportModal = ({ 
  contentType,
  contentId,
  contentObject = null,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    report_type: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const prepareReportData = () => {
    const data = {
      report_type: formData.report_type,
      status: 'pending',
    };
    
    if (formData.reason) {
      data.reason = formData.reason;
    }
    
    if (contentObject) {
      switch (contentType) {
        case 'message':
          data.message = contentObject.id;
          break;
        case 'post':
          data.post = contentObject.id;
          break;
        case 'comment':
          data.comment = contentObject.id;
          break;
        case 'profile':
          data.profile = contentObject.id;
          break;
        case 'feedback':
          data.feedback = contentObject.id;
          break;
        default:
          console.warn(`Unknown content type: ${contentType}`);
      }
    }
    
    return data;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };
  
// Dans votre handleSubmit de ReportModal.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.report_type) {
    setError('Please select a report type');
    return;
  }
  
  setIsSubmitting(true);
  setError('');
  
  try {
    // IMPORTANT: Inclure content_type et content_id
    const reportData = {
      content_type: contentType,  // <-- Doit être présent
      content_id: contentId,      // <-- Doit être présent
      report_type: formData.report_type,
      reason: formData.reason || '',
      status: 'pending',
    };
    
    console.log('📤 Sending data:', reportData); // Pour debug
    
    // Si vous avez un contentObject, utilisez-le pour déterminer content_type et content_id
    if (contentObject) {
      // Déterminez le type de contenu et son ID
      switch (contentType) {
        case 'message':
          reportData.content_type = 'message';
          reportData.content_id = contentObject.id;
          reportData.message = contentObject.id; // ForeignKey optionnel
          break;
        case 'post':
          reportData.content_type = 'post';
          reportData.content_id = contentObject.id;
          reportData.post = contentObject.id;
          break;
        case 'comment':
          reportData.content_type = 'comment';
          reportData.content_id = contentObject.id;
          reportData.comment = contentObject.id;
          break;
        case 'profile':
          reportData.content_type = 'profile';
          reportData.content_id = contentObject.id;
          reportData.profile = contentObject.id;
          break;
        case 'feedback':
          reportData.content_type = 'feedback';
          reportData.content_id = contentObject.id;
          reportData.feedback = contentObject.id;
          break;
        default:
          console.warn(`Unknown content type: ${contentType}`);
      }
    }
    
    // Assurez-vous que content_id est un nombre
    if (reportData.content_id) {
      reportData.content_id = Number(reportData.content_id);
    }
    
    console.log('📦 Final data to send:', reportData);
    
    const response = await reportApi.createReport(reportData);
    
    console.log('✅ Success:', response.data);
    
    onSuccess();
    onClose();
    alert('Report submitted successfully.');
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    
    setError(
      err.response?.data?.error || 
      err.response?.data?.detail || 
      'An error occurred. Please try again.'
    );
  } finally {
    setIsSubmitting(false);
  }
};
  
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };
  
  return (
    <div 
      className="report-modal-overlay"
      tabIndex="-1"
      onClick={handleClose}
    >
      <div 
        className="report-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-modal-content">
          <div className="report-modal-header">
            <h5 className="report-modal-title">
              <i className="bi bi-flag"></i>
              Report Content
            </h5>
            <button 
              type="button" 
              className="report-modal-close" 
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close"
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="report-modal-body">
              {error && (
                <div className="report-modal-alert" role="alert">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle"></i>
                      <span>{error}</span>
                    </div>
                    <button 
                      type="button" 
                      className="report-modal-alert-close" 
                      onClick={() => setError('')}
                      aria-label="Close"
                    ></button>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="report_type" className="report-modal-label">
                  Report Type <span className="report-modal-required">*</span>
                </label>
                <select
                  id="report_type"
                  className={`report-modal-select ${error && !formData.report_type ? 'is-invalid' : ''}`}
                  name="report_type"
                  value={formData.report_type}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Choose a reason...</option>
                  {REPORT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="report-modal-helper">
                  Select the main reason for your report
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="reason" className="report-modal-label">
                  Detailed Description
                  <span className="text-muted fw-normal"> (optional)</span>
                </label>
                <textarea
                  id="reason"
                  className="report-modal-textarea"
                  name="reason"
                  rows="4"
                  placeholder="Please provide additional details about this report. 
Example: This content contains discriminatory language because...
Your detailed description helps us take appropriate action."
                  value={formData.reason}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  maxLength="500"
                />
                <div className="d-flex justify-content-between mt-2">
                  <div className="report-modal-helper">
                    Your report is anonymous to the content author
                  </div>
                  <div className={`report-modal-char-count ${formData.reason.length === 500 ? 'warning' : ''}`}>
                    {formData.reason.length}/500 characters
                  </div>
                </div>
              </div>
              
              <div className="report-modal-info">
                <div className="d-flex">
                  <i className="bi bi-info-circle"></i>
                  <div>
                    <strong>Important Information</strong>
                    <ul className="mb-0 mt-2">
                      <li>Our team will review your report within 24-48 hours</li>
                      <li>Abusive reporting may result in penalties</li>
                      <li>You will be notified when the report is processed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="report-modal-footer">
              <button 
                type="button" 
                className="report-modal-cancel-btn"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="report-modal-submit-btn"
                disabled={isSubmitting || !formData.report_type}
              >
                {isSubmitting ? (
                  <>
                    <span className="report-modal-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send"></i>
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
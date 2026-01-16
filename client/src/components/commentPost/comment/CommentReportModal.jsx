import React from 'react';
import { FaTimes } from 'react-icons/fa';
import '../../../styles/comment_post/comment_report.css';


const CommentReportModal = ({
  showReportModal,
  setShowReportModal,
  reportReason,
  setReportReason,
  isReporting,
  handleReportSubmit,
  reportModalRef
}) => {
  if (!showReportModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
      <div ref={reportModalRef} className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Comment</h3>
          <button 
            className="close-btn" 
            onClick={() => setShowReportModal(false)}
            disabled={isReporting}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p>Why are you reporting this comment?</p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Please provide details..."
            rows="4"
            maxLength="500"
            disabled={isReporting}
          />
          <div className="character-count">
            {reportReason.length}/500 characters
          </div>
        </div>
        
        <div className="modal-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setShowReportModal(false)}
            disabled={isReporting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="report-submit-btn"
            onClick={handleReportSubmit}
            disabled={isReporting || !reportReason.trim()}
          >
            {isReporting ? (
              <>
                <div className="spinner"></div>
                Reporting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentReportModal;
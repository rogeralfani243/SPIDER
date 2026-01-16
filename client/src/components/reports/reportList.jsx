// src/components/reports/MyReports.jsx
import React, { useState, useEffect, useRef } from 'react';
import { reportApi } from '../services/api';
import { REPORT_TYPES, REPORT_STATUS } from './reportConstant';
import '../../styles/report/report-list.css';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  useEffect(() => {
    loadMyReports();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const loadMyReports = async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('New request started');
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await reportApi.getMyReports({
        signal: abortControllerRef.current.signal
      });
      
      console.log('Reports response:', response.data);
      
      // Handle different response formats
      if (response.data.results) {
        setReports(response.data.results);
      } else if (Array.isArray(response.data)) {
        setReports(response.data);
      } else if (response.data.reports) {
        setReports(response.data.reports);
      } else {
        setReports([]);
      }
      
    } catch (error) {
      // Ignore cancellation errors
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Request was cancelled:', error.message);
        return;
      }
      
      console.error('Error loading reports:', error);
      
      // Try fallback endpoint if main one fails
      if (error.response?.status === 404 || error.response?.status === 500) {
        try {
          console.log('Trying fallback endpoint...');
          const fallbackResponse = await reportApi.getSimpleMyReports();
          
          if (fallbackResponse.data.reports) {
            setReports(fallbackResponse.data.reports);
          } else {
            setError('Failed to load reports. Please try again later.');
          }
        } catch (fallbackError) {
          setError('Could not load your reports. The service might be temporarily unavailable.');
        }
      } else {
        setError(error.response?.data?.error || 'Failed to load your reports');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };
  
  const getStatusBadge = (status) => {
    const statusInfo = Object.values(REPORT_STATUS).find(s => s.value === status);
    if (!statusInfo) {
      // Default styling for unknown status
      return (
        <span className="badge bg-secondary">
          {status || 'Unknown'}
        </span>
      );
    }
    
    return (
      <span className={`badge bg-${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };
  
  const getReportTypeInfo = (reportType) => {
    return REPORT_TYPES.find(t => t.value === reportType) || {
      label: reportType,
      color: 'secondary',
      icon: 'bi-flag'
    };
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  const getContentTypeDisplay = (contentType) => {
    const typeMap = {
      'post': 'Post',
      'comment': 'Comment',
      'message': 'Message',
      'profile': 'Profile',
      'feedback': 'Feedback',
    };
    return typeMap[contentType] || contentType;
  };

  if (isLoading && reports.length === 0) {
    return (
      <div className="my-reports-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your reports...</p>
      </div>
    );
  }

  if (error && reports.length === 0) {
    return (
      <div className="my-reports-error">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>Error Loading Reports</strong>
          <p className="mb-0 mt-2">{error}</p>
          <button 
            className="btn btn-outline-danger btn-sm mt-3"
            onClick={loadMyReports}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Retrying...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Try Again
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-reports-container">
      <div className="my-reports-header">
        <h2>
          <i className="bi bi-flag me-2"></i>
          My Reports
        </h2>
        <div className="my-reports-stats">
          {reports.length > 0 && (
            <span className="badge bg-info">
              {reports.length} report{reports.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="my-reports-empty">
          <div className="text-center py-5">
            <i className="bi bi-flag display-1 text-muted mb-3"></i>
            <h4>No Reports Yet</h4>
            <p className="text-muted mb-4">
              When you report content, it will appear here for tracking.
            </p>
            <div className="text-muted small">
              <i className="bi bi-info-circle me-1"></i>
              Your reports are anonymous and help keep our community safe
            </div>
          </div>
        </div>
      ) : (
        <div className="my-reports-list">
          <div className="list-group">
            {reports.map(report => {
              const reportTypeInfo = getReportTypeInfo(report.report_type);
              
              return (
                <div key={report.id} className="my-report-item">
                  <div className="my-report-header">
                    <div className="my-report-meta">
                      <div className="my-report-id">
                        <span className="text-muted">#</span>{report.id}
                      </div>
                      <div className="my-report-type">
                        <span className={`badge bg-${reportTypeInfo.color}`}>
                          <i className={`bi ${reportTypeInfo.icon || 'bi-flag'} me-1`}></i>
                          {reportTypeInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className="my-report-status">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>

                  <div className="my-report-content">
                    <div className="my-report-details">
                      <div className="my-report-detail">
                        <span className="text-muted">Content Type:</span>
                        <strong>{getContentTypeDisplay(report.content_type)}</strong>
                        <small className="text-muted ms-2">(ID: {report.content_id})</small>
                      </div>
                      
                      <div className="my-report-detail">
                        <span className="text-muted">Submitted:</span>
                        {formatDate(report.created_at)}
                      </div>
                      
                      {report.updated_at && report.updated_at !== report.created_at && (
                        <div className="my-report-detail">
                          <span className="text-muted">Last Updated:</span>
                          {formatDate(report.updated_at)}
                        </div>
                      )}
                    </div>

                    {report.reason && (
                      <div className="my-report-reason">
                        <div className="my-report-label">
                          <i className="bi bi-chat-left-text me-1"></i>
                          Your Comment
                        </div>
                        <div className="my-report-text">
                          {report.reason}
                        </div>
                      </div>
                    )}

                    {report.reviewed_at && (
                      <div className="my-report-moderation">
                        <div className="my-report-moderation-header">
                          <div>
                            <i className="bi bi-shield-check text-success me-1"></i>
                            <strong>Moderator Response</strong>
                          </div>
                          <small className="text-muted">
                            Reviewed: {formatDate(report.reviewed_at)}
                          </small>
                        </div>
                        
                        {report.moderator_notes && (
                          <div className="my-report-moderation-notes">
                            <div className="my-report-label">Notes:</div>
                            <div className="my-report-text">{report.moderator_notes}</div>
                          </div>
                        )}
                        
                        {report.action_taken && (
                          <div className="my-report-action">
                            <div className="my-report-label">
                              <i className="bi bi-check-circle text-success me-1"></i>
                              Action Taken:
                            </div>
                            <div className="my-report-text text-success">
                              {report.action_taken}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="my-reports-footer mt-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                <i className="bi bi-info-circle me-1"></i>
                Reports are typically reviewed within 24-48 hours
              </div>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={loadMyReports}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReports;
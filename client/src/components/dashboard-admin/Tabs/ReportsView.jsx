// src/components/dashboard-admin/components/Views/ReportsView.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Snackbar, Alert, Tabs, Tab
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  ListAlt as ListIcon
} from '@mui/icons-material';
import MuiAlert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import useAdminApi from '../../../hooks/useAdminApi';
import FiltersSection from './ReportsView/FiltersSection.jsx';
import ReportsTable from './ReportsView/ReportsTable.jsx';
import QuickActionsMenu from './ReportsView/QuickActionsMenu.jsx';
import ReportDetailsDialog from './ReportsView/ReportDetailsDialog.jsx';
import ActionDialog from './ReportsView/ActionDialog.jsx';
import ContactDialog from './ReportsView/ContactDialog.jsx';
import EmailDialog from './ReportsView/EmailDialog.jsx';
import ReportsAnalyticsView from './ReportsView/ReportsAnalyticsView.jsx';

// Import des icônes utilisées dans le composant principal
import {
  Message as MessageIcon,
  Article as ArticleIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  ThumbUp as FeedbackIcon,
  Chat as ChatIcon,
  Warning as WarnIcon
} from '@mui/icons-material';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ReportsView = () => {
  const adminApi = useAdminApi();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState(0);
  
  // State for reports list
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    report_type: '',
    date_from: '',
    date_to: ''
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [reportDetails, setReportDetails] = useState(null);
  const [detailsTab, setDetailsTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [contactMessage, setContactMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('Warning regarding reported content');
  const [emailBody, setEmailBody] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [actionError, setActionError] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'under_review': 'info',
      'resolved': 'success',
      'dismissed': 'default'
    };
    return colors[status] || 'default';
  };

  const getContentTypeIcon = (type) => {
    const icons = {
      'message': <MessageIcon fontSize="small" />,
      'post': <ArticleIcon fontSize="small" />,
      'comment': <CommentIcon fontSize="small" />,
      'profile': <PersonIcon fontSize="small" />,
      'feedback': <FeedbackIcon fontSize="small" />,
      'conversation': <ChatIcon fontSize="small" />
    };
    return icons[type] || <WarnIcon fontSize="small" />;
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    loadReports();
  }, [forceRefresh]);

  const loadReports = async (params = {}) => {
    try {
      const queryParams = {};
      
      if (filters.status) queryParams.status = filters.status;
      if (filters.report_type) queryParams.report_type = filters.report_type;
      if (filters.date_from) queryParams.date_from = filters.date_from;
      if (filters.date_to) queryParams.date_to = filters.date_to;
      
      queryParams.page = params.page || page + 1;
      queryParams.page_size = params.page_size || rowsPerPage;
      
      Object.assign(queryParams, params);
      
      const response = await adminApi.getReportsList(queryParams);
      
      if (response.status === 'success') {
        setReports(response.data?.reports || []);
        
        if (response.data?.pagination) {
          setPaginationInfo({
            currentPage: response.data.pagination.current_page || 1,
            totalPages: response.data.pagination.total_pages || 1,
            totalItems: response.data.pagination.total_items || (response.data?.reports || []).length
          });
          setTotalCount(response.data.pagination.total_items || (response.data?.reports || []).length);
        } else {
          setTotalCount((response.data?.reports || []).length);
        }
      } else {
        showSnackbar(response.message || 'Failed to load reports', 'error');
        setReports([]);
      }
      
    } catch (error) {
      console.error('Error loading reports:', error);
      showSnackbar('Error loading reports', 'error');
      setReports([]);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = async () => {
    try {
      setPage(0);
      
      const params = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.report_type) params.report_type = filters.report_type;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      
      params.page = 1;
      params.page_size = rowsPerPage;
      
      await loadReports(params);
      
      showSnackbar('Filters applied successfully', 'success');
      
    } catch (error) {
      console.error('Filter error:', error);
      showSnackbar('Error applying filters', 'error');
    }
  };

  const clearFilters = async () => {
    setFilters({
      status: '',
      report_type: '',
      date_from: '',
      date_to: ''
    });
    setPage(0);
    await loadReports({ page: 1, page_size: rowsPerPage });
    showSnackbar('Filters cleared', 'info');
  };

  const handleRefresh = async () => {
    setForceRefresh(prev => prev + 1);
    showSnackbar('Reports refreshed', 'success');
  };

  const handleViewDetails = async (report) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
    
    try {
      const response = await adminApi.getReportDetail(report.id);
      
      if (response.status === 'success') {
        setReportDetails(response.data);
      } else {
        showSnackbar(response.message || 'Failed to load report details', 'error');
      }
    } catch (error) {
      showSnackbar('Error loading report details', 'error');
    }
  };

  const handleTakeAction = (report) => {
    setSelectedReport(report);
    setActionDialogOpen(true);
  };

  const handleActionMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleActionMenuClose = () => {
    setAnchorEl(null);
  };

  const executeAction = async (action, notes = '', additionalData = {}) => {
    if (!selectedReport) return;

    setActionError(null);
    
    console.log('Executing action:', action, 'on report:', selectedReport.id);
    
    try {
      const requestData = {
        action: action,
        notes: notes || '',
        ...additionalData
      };
      
      console.log('Sending data:', requestData);
      
      const response = await adminApi.updateReportStatus(
        selectedReport.id, 
        requestData
      );
      
      console.log('Response:', response);
      
      if (response.status === 'success') {
        showSnackbar(response.message || 'Action completed successfully', 'success');
        
        setForceRefresh(prev => prev + 1);
        
        setActionDialogOpen(false);
        setDetailDialogOpen(false);
        setContactDialogOpen(false);
        setEmailDialogOpen(false);
        handleActionMenuClose();
        
        setContactMessage('');
        setEmailBody('');
        setEmailSubject('Warning regarding reported content');
      } else {
        setActionError(response.message || 'Action failed');
        showSnackbar(response.message || 'Action failed', 'error');
      }
    } catch (error) {
      console.error('Action error:', error);
      
      let errorMessage = 'Error executing action';
      
      if (error.response?.data) {
        console.log('Error response data:', error.response.data);
        errorMessage = error.response.data.message || error.response.data.detail || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setActionError(errorMessage);
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleContactUser = (report) => {
    setSelectedReport(report);
    setContactDialogOpen(true);
    setContactMessage(`Your content has been reported and reviewed by our moderation team. Please review our community guidelines. Report #${report.id}`);
  };

  const sendContactMessage = async () => {
    if (!selectedReport || !contactMessage.trim()) return;

    try {
      await executeAction(
        'send_email', 
        `Warning email sent to user`,
        {
          email_message: contactMessage,
          email_subject: `Warning regarding Report #${selectedReport.id}`
        }
      );
    } catch (error) {
      // Error already handled in executeAction
    }
  };

  const handleSendEmail = (report) => {
    setSelectedReport(report);
    setEmailDialogOpen(true);
    setEmailSubject(`Regarding Report #${report.id} - ${report.report_type_display || report.report_type}`);
    setEmailBody(`Dear User,\n\nRegarding the report about your content (Report #${report.id}):\n\nYour content has been reported by other users and reviewed by our moderation team.\n\nPlease review our community guidelines to ensure your future contributions comply with our policies.\n\nIf you believe this is a mistake, please contact our support team.\n\nBest regards,\nThe Moderation Team`);
  };

  const sendEmail = async () => {
    if (!selectedReport || !emailBody.trim() || !emailSubject.trim()) return;

    try {
      await executeAction(
        'send_email', 
        `Custom email sent to user`,
        {
          email_message: emailBody,
          email_subject: emailSubject
        }
      );
    } catch (error) {
      // Error already handled in executeAction
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;

    try {
      await executeAction('delete_report', 'Report deleted by admin');
    } catch (error) {
      // Error already handled in executeAction
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    loadReports({ page: newPage + 1, page_size: rowsPerPage });
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    
    loadReports({ page: 1, page_size: newRowsPerPage });
  };

  const exportReports = async () => {
    try {
      const response = await adminApi.exportData('reports', 'csv');
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSnackbar('Reports exported successfully', 'success');
    } catch (error) {
      showSnackbar('Error exporting reports', 'error');
    }
  };

  const isLoading = adminApi.loading;

  return (
    <>
      {/* Header - Always visible */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Reports Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportReports}
            disabled={activeTab === 1 || reports.length === 0 || isLoading}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Tabs Navigation */}
      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="reports view tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3
            }
          }}
        >
          <Tab 
            icon={<ListIcon />} 
            iconPosition="start" 
            label="Reports List" 
            id="reports-tab-0"
            aria-controls="reports-tabpanel-0"
          />
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label="Analytics" 
            id="reports-tab-1"
            aria-controls="reports-tabpanel-1"
          />
        </Tabs>

        {/* Reports List Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <FiltersSection
              filters={filters}
              handleFilterChange={handleFilterChange}
              applyFilters={applyFilters}
              clearFilters={clearFilters}
              isLoading={isLoading}
            />

            {actionError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                <Typography variant="body2">{actionError}</Typography>
              </Alert>
            )}

            <ReportsTable
              reports={reports}
              isLoading={isLoading}
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              handleViewDetails={handleViewDetails}
              handleActionMenuOpen={handleActionMenuOpen}
              handleChangePage={handleChangePage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              getContentTypeIcon={getContentTypeIcon}
              getStatusColor={getStatusColor}
            />
          </Box>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <ReportsAnalyticsView />
        </TabPanel>
      </Paper>

      {/* Dialogs - Always accessible from both tabs */}
      <QuickActionsMenu
        anchorEl={anchorEl}
        handleActionMenuClose={handleActionMenuClose}
        handleTakeAction={handleTakeAction}
        executeAction={executeAction}
        handleContactUser={handleContactUser}
        handleSendEmail={handleSendEmail}
        handleDeleteReport={handleDeleteReport}
        selectedReport={selectedReport}
      />

      <ReportDetailsDialog
        detailDialogOpen={detailDialogOpen}
        setDetailDialogOpen={setDetailDialogOpen}
        selectedReport={selectedReport}
        reportDetails={reportDetails}
        isLoading={isLoading}
        activeTab={detailsTab}
        setActiveTab={setDetailsTab}
        getStatusColor={getStatusColor}
        setActionDialogOpen={setActionDialogOpen}
      />

      <ActionDialog
        actionDialogOpen={actionDialogOpen}
        setActionDialogOpen={setActionDialogOpen}
        selectedReport={selectedReport}
        executeAction={executeAction}
        isLoading={isLoading}
        setContactDialogOpen={setContactDialogOpen}
        setEmailDialogOpen={setEmailDialogOpen}
      />

      <ContactDialog
        contactDialogOpen={contactDialogOpen}
        setContactDialogOpen={setContactDialogOpen}
        selectedReport={selectedReport}
        contactMessage={contactMessage}
        setContactMessage={setContactMessage}
        sendContactMessage={sendContactMessage}
        isLoading={isLoading}
      />

      <EmailDialog
        emailDialogOpen={emailDialogOpen}
        setEmailDialogOpen={setEmailDialogOpen}
        selectedReport={selectedReport}
        emailSubject={emailSubject}
        setEmailSubject={setEmailSubject}
        emailBody={emailBody}
        setEmailBody={setEmailBody}
        sendEmail={sendEmail}
        isLoading={isLoading}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReportsView;
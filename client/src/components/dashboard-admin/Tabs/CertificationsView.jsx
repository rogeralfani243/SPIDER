// src/components/dashboard-admin/components/Views/CertificationsView.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Button } from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  BarChart as BarChartIcon,
  ListAlt as ListIcon
} from '@mui/icons-material';
import { useAdminData } from '../../../hooks/useAdminData';
import useAdminApi from '../../../hooks/useAdminApi';
import CertificationAnalyticsView from './certifications/CertificationAnalytics';
import CertificationsHeader from './certifications/CertificationsHeader';
import CertificationsList from './certifications/CertificationsList.jsx';
import CertificationDialogs from './certifications/CertificationDialogs.jsx';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`certifications-tabpanel-${index}`}
      aria-labelledby={`certifications-tab-${index}`}
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

const CertificationsView = ({ certifications: initialCerts, loading }) => {
  const { fetchCertifications, showSnackbar } = useAdminData();
  const { updateCertification, deleteCertification } = useAdminApi();
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Certifications state
  const [certifications, setCertifications] = useState(initialCerts || []);
  const [filteredCerts, setFilteredCerts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
    premium: 0,
    verified: 0,
    fire: 0
  });

  // Initialize certifications
  useEffect(() => {
    if (initialCerts) {
      setCertifications(initialCerts);
      setFilteredCerts(initialCerts);
      calculateStats(initialCerts);
    }
  }, [initialCerts]);

  // Calculate statistics
  const calculateStats = (certs) => {
    const total = certs.length;
    const active = certs.filter(c => c.status === 'active').length;
    const pending = certs.filter(c => c.status === 'pending').length;
    const expired = certs.filter(c => c.status === 'expired').length;
    const premium = certs.filter(c => c.certification_type?.name === 'premium').length;
    const verified = certs.filter(c => c.certification_type?.name === 'verified').length;
    const fire = certs.filter(c => c.certification_type?.name === 'fire').length;

    setStats({ total, active, pending, expired, premium, verified, fire });
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...certifications];

    if (filters.type) {
      filtered = filtered.filter(c => 
        c.certification_type?.name === filters.type
      );
    }

    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.user?.username?.toLowerCase().includes(searchLower) ||
        c.user?.email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCerts(filtered);
    setPage(0);
  }, [certifications, filters]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = async () => {
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      const response = await fetchCertifications(params);
      setCertifications(response || []);
      showSnackbar('Filters applied successfully', 'success');
    } catch (error) {
      showSnackbar('Error applying filters', 'error');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ type: '', status: '', search: '' });
    fetchCertifications();
    showSnackbar('Filters cleared', 'info');
  };

  // Refresh data
  const handleRefresh = async () => {
    await fetchCertifications();
    showSnackbar('Certifications refreshed', 'success');
  };

  // View details
  const handleViewDetails = (cert) => {
    setSelectedCert(cert);
    setDetailsDialogOpen(true);
  };

  // Edit certification
  const handleEdit = (cert) => {
    setSelectedCert(cert);
    setEditFormData({
      id: cert.id,
      status: cert.status || 'pending',
      expires_at: cert.expires_at ? cert.expires_at.split('T')[0] : '',
      activity_score: cert.activity_score || 0,
      verification_method: cert.verification_method || 'automatic',
      moderator_notes: cert.moderator_notes || ''
    });
    setEditDialogOpen(true);
  };

  // Handle edit form change
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Save certification
  const handleSaveCertification = async () => {
    try {
      await updateCertification(selectedCert.id, editFormData);
      showSnackbar('Certification updated successfully', 'success');
      setEditDialogOpen(false);
      await fetchCertifications();
    } catch (error) {
      showSnackbar('Error updating certification', 'error');
    }
  };

  // Revoke certification
  const handleRevoke = async (cert) => {
    if (window.confirm(`Are you sure you want to revoke ${cert.user?.username}'s ${cert.certification_type?.name} certification?`)) {
      try {
        await updateCertification(cert.id, { status: 'revoked' });
        showSnackbar('Certification revoked successfully', 'success');
        await fetchCertifications();
      } catch (error) {
        showSnackbar('Error revoking certification', 'error');
      }
    }
  };

  // Activate certification
  const handleActivate = async (cert) => {
    try {
      await updateCertification(cert.id, { status: 'active' });
      showSnackbar('Certification activated successfully', 'success');
      await fetchCertifications();
    } catch (error) {
      showSnackbar('Error activating certification', 'error');
    }
  };

  // Delete certification
  const handleDelete = async (cert) => {
    if (window.confirm(`Permanently delete certification for ${cert.user?.username}? This cannot be undone.`)) {
      try {
        await deleteCertification(cert.id);
        showSnackbar('Certification deleted', 'success');
        await fetchCertifications();
      } catch (error) {
        showSnackbar('Error deleting certification', 'error');
      }
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      <CertificationsHeader 
        activeTab={activeTab}
        filteredCertsCount={filteredCerts.length}
        onRefresh={handleRefresh}
        onClearFilters={clearFilters}
      />

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            bgcolor: 'white',
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#4F46E5'
              }
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#4F46E5',
              height: 3
            }
          }}
        >
          <Tab 
            icon={<ListIcon />} 
            iconPosition="start" 
            label="Certifications List" 
          />
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label="Analytics" 
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <CertificationsList
            stats={stats}
            filters={filters}
            filteredCerts={filteredCerts}
            page={page}
            rowsPerPage={rowsPerPage}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFilters}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onActivate={handleActivate}
            onRevoke={handleRevoke}
            onDelete={handleDelete}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <CertificationAnalyticsView />
        </TabPanel>
      </Paper>

      <CertificationDialogs
        detailsDialogOpen={detailsDialogOpen}
        editDialogOpen={editDialogOpen}
        selectedCert={selectedCert}
        editFormData={editFormData}
        onCloseDetails={() => setDetailsDialogOpen(false)}
        onCloseEdit={() => setEditDialogOpen(false)}
        onEditFormChange={handleEditFormChange}
        onSaveCertification={handleSaveCertification}
        onEditFromDetails={handleEdit}
      />
    </>
  );
};

export default CertificationsView;
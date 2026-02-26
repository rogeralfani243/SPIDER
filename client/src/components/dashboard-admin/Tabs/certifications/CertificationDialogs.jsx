// src/components/dashboard-admin/components/Views/certifications/CertificationDialogs.jsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Avatar, Chip, Grid, Paper,
  Divider, Button, IconButton, TextField, FormControl,
  InputLabel, Select, MenuItem, alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  VerifiedUser as VerifiedIcon,
  Star as StarIcon,
  Whatshot as FireIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

// Utility functions (reused from CertificationsList)
const getCertIcon = (type) => {
  switch (type) {
    case 'premium': return <StarIcon fontSize="small" />;
    case 'verified': return <VerifiedIcon fontSize="small" />;
    case 'fire': return <FireIcon fontSize="small" />;
    case 'influencer': return <VerifiedIcon fontSize="small" />;
    default: return <VerifiedIcon fontSize="small" />;
  }
};

const getCertColor = (type) => {
  switch (type) {
    case 'premium': return '#FFD700';
    case 'verified': return '#1DA1F2';
    case 'fire': return '#FF5722';
    case 'influencer': return '#9C27B0';
    default: return '#9E9E9E';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'expired': return 'error';
    case 'revoked': return 'default';
    default: return 'default';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'active': return <CheckCircleIcon fontSize="small" />;
    case 'pending': return <ScheduleIcon fontSize="small" />;
    case 'expired': return <CancelIcon fontSize="small" />;
    case 'revoked': return <CancelIcon fontSize="small" />;
    default: return <ScheduleIcon fontSize="small" />;
  }
};

// Details Dialog Component
const DetailsDialog = ({ open, cert, onClose, onEdit }) => {
  if (!cert) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
        <Avatar 
          sx={{ 
            bgcolor: alpha(getCertColor(cert.certification_type?.name), 0.2),
            color: getCertColor(cert.certification_type?.name),
            width: 48, 
            height: 48 
          }}
        >
          {getCertIcon(cert.certification_type?.name)}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Certification Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {cert.id}
          </Typography>
        </Box>
        <IconButton sx={{ ml: 'auto' }} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              User Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar 
                  src={cert.user?.profile?.image || ''}
                  sx={{ width: 56, height: 56 }}
                >
                  {cert.user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{cert.user?.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cert.user?.email}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">User ID</Typography>
                  <Typography variant="body2" fontWeight={600}>#{cert.user?.id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Location</Typography>
                  <Typography variant="body2">
                    {cert.user?.profile?.city || ''} 
                    {cert.user?.profile?.country && `, ${cert.user?.profile?.country}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Joined</Typography>
                  <Typography variant="body2">
                    {cert.user?.date_joined ? new Date(cert.user.date_joined).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Certification Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(getCertColor(cert.certification_type?.name), 0.2),
                    color: getCertColor(cert.certification_type?.name),
                    width: 48, 
                    height: 48 
                  }}
                >
                  {getCertIcon(cert.certification_type?.name)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {cert.certification_type?.name || 'Unknown'}
                  </Typography>
                  <Chip 
                    label={cert.status || 'pending'}
                    color={getStatusColor(cert.status)}
                    size="small"
                    icon={getStatusIcon(cert.status)}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Issued Date</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {cert.created_at ? new Date(cert.created_at).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Expiration Date</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {cert.expires_at ? new Date(cert.expires_at).toLocaleDateString() : 'Never'}
                  </Typography>
                </Box>
                {cert.days_remaining !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Days Remaining</Typography>
                    <Chip 
                      label={`${cert.days_remaining} days`}
                      size="small"
                      color={cert.days_remaining < 30 ? 'warning' : 'success'}
                      sx={{ height: 24 }}
                    />
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Activity Score</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {cert.activity_score || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Verification Method</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {cert.verification_method || 'automatic'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {cert.moderator_notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Moderator Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                <Typography variant="body2">
                  {cert.moderator_notes}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button 
          variant="contained"
          onClick={() => {
            onClose();
            onEdit(cert);
          }}
          sx={{ bgcolor: '#4F46E5' }}
        >
          Edit Certification
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Edit Dialog Component
const EditDialog = ({ open, cert, formData, onClose, onFormChange, onSave }) => {
  if (!cert) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>
          Edit Certification
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {cert.user?.username} - {cert.certification_type?.name}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={onFormChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="revoked">Revoked</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Expiration Date"
              name="expires_at"
              type="date"
              value={formData.expires_at}
              onChange={onFormChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Activity Score"
              name="activity_score"
              type="number"
              value={formData.activity_score}
              onChange={onFormChange}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Verification Method</InputLabel>
              <Select
                name="verification_method"
                value={formData.verification_method}
                onChange={onFormChange}
                label="Verification Method"
              >
                <MenuItem value="automatic">Automatic</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
                <MenuItem value="document">Document Verification</MenuItem>
                <MenuItem value="admin">Admin Approval</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Moderator Notes"
              name="moderator_notes"
              value={formData.moderator_notes}
              onChange={onFormChange}
              multiline
              rows={3}
              placeholder="Add notes about this certification..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={onSave}
          startIcon={<SaveIcon />}
          sx={{ bgcolor: '#4F46E5' }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Component
const CertificationDialogs = ({
  detailsDialogOpen,
  editDialogOpen,
  selectedCert,
  editFormData,
  onCloseDetails,
  onCloseEdit,
  onEditFormChange,
  onSaveCertification,
  onEditFromDetails
}) => {
  return (
    <>
      <DetailsDialog
        open={detailsDialogOpen}
        cert={selectedCert}
        onClose={onCloseDetails}
        onEdit={onEditFromDetails}
      />
      
      <EditDialog
        open={editDialogOpen}
        cert={selectedCert}
        formData={editFormData}
        onClose={onCloseEdit}
        onFormChange={onEditFormChange}
        onSave={onSaveCertification}
      />
    </>
  );
};

export default CertificationDialogs;
// components/VerificationTab.jsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  CircularProgress,
  TextField,
  MenuItem,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  PhotoCamera as CameraIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { certificationService } from '../../services/certificationService';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
}));

const UploadArea = styled(Paper)(({ theme, hasError }) => ({
  padding: theme.spacing(3),
  border: `2px dashed ${hasError ? theme.palette.error.main : theme.palette.divider}`,
  borderRadius: 12,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: hasError ? alpha(theme.palette.error.main, 0.04) : 'transparent',
  '&:hover': {
    borderColor: hasError ? theme.palette.error.main : theme.palette.primary.main,
    backgroundColor: hasError 
      ? alpha(theme.palette.error.main, 0.08)
      : alpha(theme.palette.primary.main, 0.04),
  },
}));

const DocumentPreview = ({ file, onRemove }) => {
  const isImage = file?.type?.startsWith('image/');
  
  return (
    <Box sx={{ position: 'relative', mt: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        {isImage ? (
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
          />
        ) : (
          <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" noWrap>
            {file.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
        </Box>
        <IconButton size="small" onClick={onRemove} color="error">
          <CloseIcon />
        </IconButton>
      </Paper>
    </Box>
  );
};

const VerificationTab = ({ 
  verificationStatus, 
  loading, 
  setLoading, 
  showMessage,
  updateVerificationStatus 
}) => {
  const [idFormData, setIdFormData] = useState({
    id_type: 'passport',
    id_number: '',
    document_front: null,
    document_back: null,
    selfie_with_id: null,
    additional_notes: ''
  });
  const [errors, setErrors] = useState({});
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const steps = ['Select ID Type', 'Upload Documents', 'Review & Submit'];
  const [activeStep, setActiveStep] = useState(0);

  const validationRules = {
    id_number: (value) => {
      if (!value.trim()) return 'ID number is required';
      if (value.length < 5) return 'ID number must be at least 5 characters';
      return null;
    },
    document_front: (file) => {
      if (!file) return 'Front document is required';
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) return 'File size must be less than 5MB';
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return 'Only JPG, PNG, and PDF files are allowed';
      }
      return null;
    },
    selfie_with_id: (file) => {
      if (!file) return 'Selfie with ID is required';
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) return 'File size must be less than 5MB';
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        return 'Only JPG and PNG images are allowed';
      }
      return null;
    }
  };

  const validateField = (name, value) => {
    const rule = validationRules[name];
    return rule ? rule(value) : null;
  };

  const handleFileUpload = async (file, field) => {
    setUploadProgress(prev => ({ ...prev, [field]: 0 }));
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev[field] + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          return { ...prev, [field]: 100 };
        }
        return { ...prev, [field]: newProgress };
      });
    }, 100);

    // In a real app, you would upload to your server here
    // await uploadToServer(file);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(prev => ({ ...prev, [field]: null }));
    }, 1000);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const error = validateField(field, file);
      setErrors(prev => ({ ...prev, [field]: error }));
      
      if (!error) {
        setIdFormData(prev => ({ ...prev, [field]: file }));
        handleFileUpload(file, field);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setIdFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRemoveFile = (field) => {
    setIdFormData(prev => ({ ...prev, [field]: null }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleNext = () => {
    const currentStepErrors = {};
    
    if (activeStep === 0) {
      currentStepErrors.id_number = validateField('id_number', idFormData.id_number);
    } else if (activeStep === 1) {
      currentStepErrors.document_front = validateField('document_front', idFormData.document_front);
      currentStepErrors.selfie_with_id = validateField('selfie_with_id', idFormData.selfie_with_id);
    }

    const hasErrors = Object.values(currentStepErrors).some(error => error);
    
    if (!hasErrors) {
      setActiveStep((prevStep) => prevStep + 1);
    } else {
      setErrors(prev => ({ ...prev, ...currentStepErrors }));
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    Object.keys(idFormData).forEach(key => {
      if (idFormData[key]) {
        formData.append(key, idFormData[key]);
      }
    });
    
    try {
      const response = await certificationService.requestVerification(formData);
      showMessage('success', '✅ ID verification request submitted successfully!');
      updateVerificationStatus(response.data.request);
      setIdFormData({
        id_type: 'passport',
        id_number: '',
        document_front: null,
        document_back: null,
        selfie_with_id: null,
        additional_notes: ''
      });
      setActiveStep(0);
      setErrors({});
    } catch (error) {
      showMessage('error', 'Error: ' + (error.response?.data?.message || 'Submission failed'));
    } finally {
      setLoading(false);
    }
  };
// components/VerificationTab.jsx
// ... imports et autres composants ...

const renderStepContent = () => {
  switch (activeStep) {
    case 0:
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="ID Type"
              name="id_type"
              value={idFormData.id_type}
              onChange={handleInputChange}
              required
              helperText="Select the type of identification document"
            >
              <MenuItem value="passport">Passport</MenuItem>
              <MenuItem value="national_id">National ID Card</MenuItem>
              <MenuItem value="driver_license">Driver's License</MenuItem>
              <MenuItem value="residence_permit">Residence Permit</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ID Number"
              name="id_number"
              value={idFormData.id_number}
              onChange={handleInputChange}
              required
              error={!!errors.id_number}
              helperText={errors.id_number || "Enter your official ID number"}
              placeholder="e.g., AB1234567"
            />
          </Grid>
        </Grid>
      );
    
    case 1:
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                For security reasons, all documents must be clear, readable, and unaltered.
                Maximum file size: 5MB per file.
              </Typography>
            </Alert>
          </Grid>

          <Grid item xs={12} md={6}>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, 'document_front')}
              id="front-doc"
              style={{ display: 'none' }}
            />
            <label htmlFor="front-doc">
              <UploadArea hasError={!!errors.document_front}>
                <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {idFormData.document_front ? '✓ Front Document Uploaded' : 'Upload Front of ID *'}
                </Typography>
                {errors.document_front && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.document_front}
                  </Typography>
                )}
              </UploadArea>
            </label>
            {idFormData.document_front && (
              <DocumentPreview
                file={idFormData.document_front}
                onRemove={() => handleRemoveFile('document_front')}
              />
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'selfie_with_id')}
              id="selfie"
              style={{ display: 'none' }}
            />
            <label htmlFor="selfie">
              <UploadArea hasError={!!errors.selfie_with_id}>
                <CameraIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {idFormData.selfie_with_id ? '✓ Selfie Uploaded' : 'Upload Selfie with ID *'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hold your ID next to your face
                </Typography>
                {errors.selfie_with_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.selfie_with_id}
                  </Typography>
                )}
              </UploadArea>
            </label>
            {idFormData.selfie_with_id && (
              <DocumentPreview
                file={idFormData.selfie_with_id}
                onRemove={() => handleRemoveFile('selfie_with_id')}
              />
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, 'document_back')}
              id="back-doc"
              style={{ display: 'none' }}
            />
            <label htmlFor="back-doc">
              <UploadArea>
                <DescriptionIcon sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {idFormData.document_back ? '✓ Back Document Uploaded' : 'Upload Back of ID (Optional)'}
                </Typography>
              </UploadArea>
            </label>
            {idFormData.document_back && (
              <DocumentPreview
                file={idFormData.document_back}
                onRemove={() => handleRemoveFile('document_back')}
              />
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<HelpIcon />}
              onClick={() => setShowGuidelines(true)}
              sx={{ height: '100%', py: 3 }}
            >
              View Upload Guidelines
            </Button>
          </Grid>
        </Grid>
      );
    
    case 2:
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                All required information has been provided. Review your submission below.
              </Typography>
            </Alert>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Submission Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    ID Type
                  </Typography>
                  <Typography variant="body1">
                    {idFormData.id_type.toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    ID Number
                  </Typography>
                  <Typography variant="body1">
                    {idFormData.id_number}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Front Document
                  </Typography>
                  <Typography variant="body1">
                    {idFormData.document_front ? '✓ Uploaded' : '✗ Missing'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Selfie with ID
                  </Typography>
                  <Typography variant="body1">
                    {idFormData.selfie_with_id ? '✓ Uploaded' : '✗ Missing'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Notes (Optional)"
              name="additional_notes"
              value={idFormData.additional_notes}
              onChange={handleInputChange}
              placeholder="Add any additional information or context..."
            />
          </Grid>
        </Grid>
      );
    
    default:
      return null;
  }
};

  if (verificationStatus) {
    return (
      <StyledCard>
        <CardHeader
          avatar={
            <Box sx={{ bgcolor: 'primary.main', color: '#fff', p: 2, borderRadius: 2 }}>
              <VerifiedIcon />
            </Box>
          }
          title={<Typography variant="h5" fontWeight="bold">Verification Status</Typography>}
          subheader="Your ID verification request status"
        />
        <CardContent>
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Verification Details
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={verificationStatus.status.toUpperCase()}
                color={
                  verificationStatus.status === 'approved' ? 'success' :
                  verificationStatus.status === 'rejected' ? 'error' : 'warning'
                }
                sx={{ fontWeight: 'bold', mb: 2 }}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Request ID
                </Typography>
                <Typography variant="body1">
                  #{verificationStatus.id}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Submitted
                </Typography>
                <Typography variant="body1">
                  {new Date(verificationStatus.submitted_at).toLocaleDateString()}
                </Typography>
              </Grid>
              {verificationStatus.reviewed_at && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Reviewed
                    </Typography>
                    <Typography variant="body1">
                      {new Date(verificationStatus.reviewed_at).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Reviewed By
                    </Typography>
                    <Typography variant="body1">
                      {verificationStatus.reviewed_by?.username || 'Administrator'}
                    </Typography>
                  </Grid>
                </>
              )}
              {verificationStatus.rejection_reason && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Reason for rejection:</strong> {verificationStatus.rejection_reason}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>

          <Button
            fullWidth
            variant="contained"
            onClick={() => updateVerificationStatus(null)}
            sx={{ py: 1.5 }}
          >
            Submit New Verification Request
          </Button>
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <StyledCard>
      <CardHeader
        avatar={
          <Box sx={{ bgcolor: 'primary.main', color: '#fff', p: 2, borderRadius: 2 }}>
            <VerifiedIcon />
          </Box>
        }
        title={<Typography variant="h5" fontWeight="bold">ID Verification</Typography>}
        subheader="Complete identity verification for enhanced trust"
        action={
          <IconButton onClick={() => setShowGuidelines(true)}>
            <HelpIcon />
          </IconButton>
        }
      />
      <CardContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box component="form" onSubmit={handleSubmitVerification}>
          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              >
                {loading ? 'Submitting...' : 'Submit Verification'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>

      {/* Guidelines Dialog */}
      <Dialog 
        open={showGuidelines} 
        onClose={() => setShowGuidelines(false)}
        maxWidth="md"
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            📋 Document Upload Guidelines
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="warning">
                For security and compliance reasons, please ensure all documents meet these requirements:
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                ✅ Accepted Documents
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Passport (valid)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="National ID Card" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Driver's License" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Residence Permit" />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                📄 File Requirements
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Maximum file size: 5MB" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Accepted formats: JPG, PNG, PDF" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="All text must be clear and readable" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="No watermarks or edits" />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                📸 Selfie Requirements
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Hold your ID next to your face"
                    secondary="Both your face and ID must be clearly visible"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Good lighting"
                    secondary="Ensure there's enough light to see details clearly"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="No filters or edits"
                    secondary="Natural appearance only"
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Processing Time:</strong> Verification requests are typically processed within 2-3 business days. 
                  You'll receive an email notification once your verification is complete.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGuidelines(false)} color="primary">
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </StyledCard>
  );
};

export default VerificationTab;
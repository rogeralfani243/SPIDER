// src/components/dashboard-admin/components/Views/ReportsView/ReportDetailsDialog.jsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, CircularProgress, Tabs, Tab, Grid,
  Card, CardContent, CardActions, Typography,
  Stack, Chip, Avatar, Alert, List, ListItem,
  ListItemIcon, ListItemText
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const ReportDetailsDialog = ({
  detailDialogOpen,
  setDetailDialogOpen,
  selectedReport,
  reportDetails,
  isLoading,
  activeTab,
  setActiveTab,
  getStatusColor,
  setActionDialogOpen
}) => {
  return (
    <Dialog
      open={detailDialogOpen}
      onClose={() => setDetailDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Report Details #{selectedReport?.id}
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : reportDetails ? (
          <Box>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
              <Tab label="Report Info" />
              <Tab label="Content" />
              <Tab label="Actions History" />
            </Tabs>
            
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Report Information
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Type</Typography>
                          <Typography>{reportDetails.report?.report_type_display || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Status</Typography>
                          <Chip
                            label={reportDetails.report?.status_display || 'N/A'}
                            color={getStatusColor(reportDetails.report?.status)}
                            size="small"
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Reason</Typography>
                          <Typography>{reportDetails.report?.reason || 'No reason provided'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Moderator Notes</Typography>
                          <Typography>{reportDetails.report?.moderator_notes || 'No notes'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Action Taken</Typography>
                          <Typography>{reportDetails.report?.action_taken || 'No action taken yet'}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Reporter
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar>
                          {reportDetails.report?.reporter?.username?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="medium">
                            {reportDetails.report?.reporter?.username || 'Anonymous'}
                          </Typography>
                          {reportDetails.report?.reporter?.email && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {reportDetails.report.reporter.email}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            Reported on {reportDetails.report?.created_at ? new Date(reportDetails.report.created_at).toLocaleString() : 'N/A'}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<PersonIcon />}>
                        View Profile
                      </Button>
                      <Button size="small" startIcon={<EmailIcon />}>
                        Contact Reporter
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            )}
            
            {activeTab === 1 && reportDetails.content && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Reported Content
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    This content has been reported as inappropriate
                  </Alert>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {typeof reportDetails.content === 'object' 
                        ? JSON.stringify(reportDetails.content, null, 2)
                        : reportDetails.content}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 2 && reportDetails.actions_history && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Actions History
                  </Typography>
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {reportDetails.actions_history.length > 0 ? (
                      reportDetails.actions_history.map((action, index) => (
                        <ListItem key={index} divider={index < reportDetails.actions_history.length - 1}>
                          <ListItemIcon>
                            <HistoryIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={action.description}
                            secondary={
                              <>
                                By {action.moderator__username} • {action.performed_at ? new Date(action.performed_at).toLocaleString() : 'N/A'}
                              </>
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                        No actions recorded
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        ) : (
          <Typography color="text.secondary">No details available</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        <Button 
          variant="contained" 
          onClick={() => { setDetailDialogOpen(false); setActionDialogOpen(true); }}
        >
          Take Action
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDetailsDialog;
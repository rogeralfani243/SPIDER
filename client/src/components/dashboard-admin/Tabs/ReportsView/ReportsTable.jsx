// src/components/dashboard-admin/components/Views/ReportsView/ReportsTable.jsx
import React from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip,
  TablePagination, Badge, CircularProgress, Typography,
  Avatar, Stack, Box
} from '@mui/material';
import {
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

const ReportsTable = ({
  reports,
  isLoading,
  totalCount,
  page,
  rowsPerPage,
  handleViewDetails,
  handleActionMenuOpen,
  handleChangePage,
  handleChangeRowsPerPage,
  getContentTypeIcon,
  getStatusColor
}) => {
  const renderContentPreview = (report) => {
    const content = report.content_info || {};
    
    const MessageIcon = getContentTypeIcon('message').type;
    const ArticleIcon = getContentTypeIcon('post').type;
    const CommentIcon = getContentTypeIcon('comment').type;
    
    switch (content.type) {
      case 'message':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MessageIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
              {content.content || 'No content'}
            </Typography>
          </Box>
        );
      case 'post':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
              {content.title || content.content || 'Post'}
            </Typography>
          </Box>
        );
      case 'comment':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CommentIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
              {content.content || 'Comment'}
            </Typography>
          </Box>
        );
      default:
        return (
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
            {content.type || 'Unknown content'}
          </Typography>
        );
    }
  };

  return (
    <Paper sx={{ mb: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Reporter</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Target User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Loading reports...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Badge
                      badgeContent={report.action_count || 0}
                      color="secondary"
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                    >
                      #{report.id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {getContentTypeIcon(report.content_type)}
                      <Typography variant="body2" fontWeight="medium">
                        {report.report_type_display || report.report_type?.replace('_', ' ') || 'Unknown'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                        {report.reporter?.username?.charAt(0) || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {report.reporter?.username || 'Anonymous'}
                        </Typography>
                        {report.reporter?.email && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {report.reporter.email}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {renderContentPreview(report)}
                  </TableCell>
                  <TableCell>
                    {report.content_author ? (
                      <Chip
                        avatar={
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                            {report.content_author.username?.charAt(0) || '?'}
                          </Avatar>
                        }
                        label={report.content_author.username}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unknown
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.status_display || report.status || 'pending'}
                      color={getStatusColor(report.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {report.created_at ? new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(report)}
                          disabled={isLoading}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Quick Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, report)}
                          disabled={isLoading}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="h6" color="textSecondary">
                    No reports found
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Try adjusting your filters
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {reports.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        />
      )}
    </Paper>
  );
};

export default ReportsTable;
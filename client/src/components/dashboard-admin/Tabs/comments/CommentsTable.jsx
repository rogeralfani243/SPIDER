import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  LinearProgress,
  Typography
} from '@mui/material';
import CommentsTableRow from './CommentsTableRow';

const CommentsTable = ({
  comments,
  loading,
  selectedComments,
  selectAll,
  onSelectAll,
  onSelectComment,
  onViewDetail,
  onTogglePin,
  onToggleHide,
  onToggleSpam,
  onDeleteClick,
  onActionMenuOpen
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={selectAll}
                onChange={onSelectAll}
                indeterminate={selectedComments.length > 0 && selectedComments.length < comments.length}
              />
            </TableCell>
            <TableCell>Comment</TableCell>
            <TableCell>Author</TableCell>
            <TableCell>Post</TableCell>
            <TableCell>Stats</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && comments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <LinearProgress />
              </TableCell>
            </TableRow>
          ) : comments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">No comments found</Typography>
              </TableCell>
            </TableRow>
          ) : (
            comments.map((comment) => (
              <CommentsTableRow
                key={comment.id}
                comment={comment}
                selected={selectedComments.includes(comment.id)}
                onSelect={() => onSelectComment(comment.id)}
                onViewDetail={() => onViewDetail(comment.id)}
                onTogglePin={() => onTogglePin(comment.id)}
                onToggleHide={() => onToggleHide(comment.id)}
                onToggleSpam={() => onToggleSpam(comment.id)}
                onDeleteClick={() => onDeleteClick(comment)}
                onActionMenuOpen={(e) => onActionMenuOpen(e, comment)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CommentsTable;
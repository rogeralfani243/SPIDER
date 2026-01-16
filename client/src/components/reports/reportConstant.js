// src/constants/reportConstants.js
export const REPORT_TYPES = [
  { value: 'spam', label: 'Spam', color: 'warning' },
  { value: 'harassment', label: 'Harassment', color: 'danger' },
  { value: 'hate_speech', label: 'Hate Speech', color: 'danger' },
  { value: 'inappropriate', label: 'Inappropriate', color: 'warning' },
  { value: 'copyright', label: 'Copyright Violation', color: 'info' },
  { value: 'false_info', label: 'False Information', color: 'secondary' },
  
  { value: 'nudity_content', label: 'Nudity  Content', color: 'secondary' },
  { value: 'other', label: 'Other', color: 'dark' },
];

export const CONTENT_TYPES = [
  { value: 'message', label: 'Message', icon: 'bi-chat' },
  { value: 'post', label: 'Post', icon: 'bi-file-text' },
  { value: 'comment', label: 'Comment', icon: 'bi-chat-left' },
  { value: 'profile', label: 'Profile', icon: 'bi-person' },
  { value: 'feedback', label: 'Feedback', icon: 'bi-star' },
];

export const REPORT_STATUS = {
  PENDING: { value: 'pending', label: 'Pending', color: 'warning' },
  UNDER_REVIEW: { value: 'under_review', label: 'Under Review', color: 'info' },
  RESOLVED: { value: 'resolved', label: 'Resolved', color: 'success' },
  DISMISSED: { value: 'dismissed', label: 'Dismissed', color: 'secondary' },
};

export const ACTION_TYPES = [
  { value: 'delete', label: 'Delete', icon: 'bi-trash', color: 'danger' },
  { value: 'warn', label: 'Warn', icon: 'bi-exclamation-triangle', color: 'warning' },
  { value: 'suspend', label: 'Suspend', icon: 'bi-pause-circle', color: 'warning' },
  { value: 'ban', label: 'Ban', icon: 'bi-person-x', color: 'danger' },
  { value: 'ignore', label: 'Ignore', icon: 'bi-eye-slash', color: 'secondary' },
  { value: 'edit', label: 'Edit', icon: 'bi-pencil', color: 'info' },
];
export const REPORT_STATUS_COLORS = {
  [REPORT_STATUS.PENDING]: '#ff9800',
  [REPORT_STATUS.UNDER_REVIEW]: '#2196f3',
  [REPORT_STATUS.RESOLVED]: '#4caf50',
  [REPORT_STATUS.REJECTED]: '#f44336',
};
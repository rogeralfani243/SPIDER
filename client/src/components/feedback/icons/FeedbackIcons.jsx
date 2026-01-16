// components/icons/FeedbackIcons.jsx
import React from 'react';

/**
 * Reusable SVG icons for feedback components
 */
export const FeedbackIcons = {
  Helpful: ({ size = 16, color = 'currentColor', ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...props}>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  
  MenuDots: ({ size = 20, color = 'currentColor', ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...props}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  
  Edit: ({ size = 16, color = 'currentColor', ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  
  Delete: ({ size = 16, color = 'currentColor', ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  
  Check: ({ size = 16, color = 'currentColor', ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  
  Report: ({ size = 16, color = 'currentColor', ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...props}>
      <path d="M12 9v2m0 4h.01" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
};

export default FeedbackIcons;
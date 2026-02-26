// src/components/dashboard-admin/Tabs/comments/hooks/useSnackbar.js
import { useState, useCallback } from 'react';

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => {
      setSnackbar({ open: false, message: '', severity: 'success' });
    }, 3000);
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return { snackbar, showSnackbar, closeSnackbar };
};
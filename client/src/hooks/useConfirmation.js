import { useState, useCallback } from 'react';

const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const askConfirmation = useCallback(({
    title = 'Confirmation',
    message = 'Are you sure you want to proceed?',
    onConfirm,
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  }) => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          if (onConfirm) onConfirm();
          resolve(true);
        },
        type,
        confirmText,
        cancelText
      });
    });
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    confirmationState,
    askConfirmation,
    closeConfirmation
  };
};

export default useConfirmation;
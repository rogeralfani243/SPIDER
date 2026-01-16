import { useEffect } from 'react';

// Hook to handle click outside detection
export const useClickOutside = ({
  showOptions,
  showReportModal,
  setShowOptions,
  setShowReportModal,
  optionsMenuRef,
  optionsButtonRef,
  reportModalRef,
  setReportReason
}) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptions && 
          optionsMenuRef.current && 
          optionsButtonRef.current &&
          !optionsMenuRef.current.contains(event.target) &&
          !optionsButtonRef.current.contains(event.target)) {
        setShowOptions(false);
      }
      
      if (showReportModal && 
          reportModalRef.current && 
          !reportModalRef.current.contains(event.target)) {
        setShowReportModal(false);
        setReportReason('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showOptions, showReportModal, optionsMenuRef, optionsButtonRef, reportModalRef]);
};
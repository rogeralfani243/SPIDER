import { useState, useEffect } from 'react';

// Hook to handle user data
export const useUser = (currentUser) => {
  const [localCurrentUser, setLocalCurrentUser] = useState(null);

  // Get current user from localStorage
  const getCurrentUserFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing currentUser from localStorage:", error);
      return null;
    }
  };

  useEffect(() => {
    if (currentUser) {
      setLocalCurrentUser(currentUser);
    } else {
      const userFromStorage = getCurrentUserFromLocalStorage();
      if (userFromStorage) {
        setLocalCurrentUser(userFromStorage);
      }
    }
  }, [currentUser]);

  return { localCurrentUser };
};
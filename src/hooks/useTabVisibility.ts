import { useState, useEffect } from 'react';

export const useTabVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [hasLeftTab, setHasLeftTab] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentlyVisible = !document.hidden;
      setIsVisible(currentlyVisible);
      
      // Track if user has left the tab during a process
      if (!currentlyVisible) {
        setHasLeftTab(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const resetTabTracking = () => {
    setHasLeftTab(false);
  };

  return {
    isVisible,
    hasLeftTab,
    resetTabTracking
  };
};
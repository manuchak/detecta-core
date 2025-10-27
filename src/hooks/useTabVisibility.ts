import { useState, useEffect } from 'react';

export const useTabVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [hasLeftTab, setHasLeftTab] = useState(false);
  const [lastReturnTime, setLastReturnTime] = useState<Date | null>(null); // 🆕 NUEVO

  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentlyVisible = !document.hidden;
      setIsVisible(currentlyVisible);
      
      // Track if user has left the tab during a process
      if (!currentlyVisible) {
        setHasLeftTab(true);
      } else {
        // 🆕 NUEVO: Registrar cuando regresa
        setLastReturnTime(new Date());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const resetTabTracking = () => {
    setHasLeftTab(false);
    setLastReturnTime(null); // 🆕 NUEVO
  };

  return {
    isVisible,
    hasLeftTab,
    lastReturnTime, // 🆕 NUEVO
    resetTabTracking
  };
};
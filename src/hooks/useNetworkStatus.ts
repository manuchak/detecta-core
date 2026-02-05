 /**
  * Hook para detectar estado online/offline del dispositivo
  * Usado para funcionalidad offline-first
  */
 import { useState, useEffect, useCallback } from 'react';
 
 export interface NetworkStatus {
   isOnline: boolean;
   wasOffline: boolean;
   lastOnlineAt: Date | null;
 }
 
 export function useNetworkStatus(): NetworkStatus {
   const [status, setStatus] = useState<NetworkStatus>({
     isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
     wasOffline: false,
     lastOnlineAt: null,
   });
 
   const handleOnline = useCallback(() => {
     setStatus((prev) => ({
       isOnline: true,
       wasOffline: !prev.isOnline,
       lastOnlineAt: new Date(),
     }));
   }, []);
 
   const handleOffline = useCallback(() => {
     setStatus((prev) => ({
       ...prev,
       isOnline: false,
     }));
   }, []);
 
   useEffect(() => {
     window.addEventListener('online', handleOnline);
     window.addEventListener('offline', handleOffline);
 
     return () => {
       window.removeEventListener('online', handleOnline);
       window.removeEventListener('offline', handleOffline);
     };
   }, [handleOnline, handleOffline]);
 
   return status;
 }
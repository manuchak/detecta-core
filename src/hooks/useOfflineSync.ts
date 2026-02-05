 /**
  * Hook para sincronizar datos offline cuando recupera conexión
  * Maneja cola de sincronización con reintentos automáticos
  */
 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useNetworkStatus } from './useNetworkStatus';
 import {
   getSyncQueue,
   removeSyncQueueItem,
   updateSyncQueueItem,
   getPhotoBlob,
   deletePhotoBlob,
 } from '@/lib/offlineStorage';
import { getGlobalUploadQueue } from '@/lib/uploadQueue';
import { withSmartRetry } from '@/lib/retryUtils';
import { CircuitBreaker } from '@/services/circuitBreakerService';
 import type { SyncQueueItem } from '@/types/checklist';
 
 export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';
 
export interface CircuitBreakerInfo {
  isOpen: boolean;
  consecutiveFailures: number;
  failureRate: number;
  cooldownRemaining: number;
  errorReport: string;
}

 const MAX_RETRY_ATTEMPTS = 3;

// Circuit breaker para proteger contra fallos en cascada
const circuitBreaker = new CircuitBreaker({
  maxConsecutiveFailures: 5,
  maxFailureRate: 30,
  cooldownPeriod: 120,
});

// Cola de uploads global con rate limiting
const uploadQueue = getGlobalUploadQueue({
  maxConcurrent: 2,
  delayBetweenUploads: 500,
});
 
 export function useOfflineSync() {
   const { isOnline, wasOffline } = useNetworkStatus();
   const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
   const [pendingCount, setPendingCount] = useState(0);
   const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [circuitBreakerInfo, setCircuitBreakerInfo] = useState<CircuitBreakerInfo>({
    isOpen: false,
    consecutiveFailures: 0,
    failureRate: 0,
    cooldownRemaining: 0,
    errorReport: '',
  });

  // Actualizar info del circuit breaker
  const updateCircuitBreakerInfo = useCallback(() => {
    const state = circuitBreaker.getState();
    const cooldownRemaining = state.isOpen
      ? Math.max(0, 120 - Math.floor((Date.now() - state.lastFailureTime) / 1000))
      : 0;
    
    setCircuitBreakerInfo({
      isOpen: state.isOpen,
      consecutiveFailures: state.consecutiveFailures,
      failureRate: circuitBreaker.getFailureRate(),
      cooldownRemaining,
      errorReport: circuitBreaker.getErrorReport(),
    });
  }, []);

  // Reset manual del circuit breaker
  const resetCircuitBreaker = useCallback(() => {
    circuitBreaker.reset();
    updateCircuitBreakerInfo();
    console.log('[OfflineSync] Circuit breaker reseteado manualmente');
  }, [updateCircuitBreakerInfo]);
 
  const executeItemSync = async (item: SyncQueueItem): Promise<void> => {
    switch (item.action) {
      case 'upload_photo': {
        const photoBlob = await getPhotoBlob(item.payload.photoId as string);
        if (!photoBlob) return;

        const { error } = await supabase.storage
          .from('checklist-evidencias')
          .upload(item.payload.path as string, photoBlob.blob, {
            contentType: photoBlob.mimeType,
            upsert: true,
          });

        if (error) throw error;
        await deletePhotoBlob(item.payload.photoId as string);
        return;
       }

      case 'save_checklist': {
        const { error } = await supabase
          .from('checklist_servicio')
          .upsert(item.payload, {
            onConflict: 'servicio_id,custodio_telefono',
          });

        if (error) throw error;
        return;
      }

      case 'update_document': {
        const { error } = await supabase
          .from('documentos_custodio')
          .upsert(item.payload, {
            onConflict: 'custodio_telefono,tipo_documento',
          });

        if (error) throw error;
        return;
      }

      default:
        return;
     }
   };
 
  const syncItemWithRetry = async (item: SyncQueueItem): Promise<boolean> => {
    if (circuitBreaker.isCircuitOpen()) {
      console.warn('[OfflineSync] Circuit breaker abierto, posponiendo sync');
      return false;
    }

    try {
      await withSmartRetry(
        () => executeItemSync(item),
        { maxAttempts: 3, baseDelayMs: 1000 },
        (attempt, delay) => {
          console.log(`[OfflineSync] Reintento ${attempt} para ${item.id}, esperando ${delay}ms`);
        }
      );
      circuitBreaker.recordSuccess();
      updateCircuitBreakerInfo();
      return true;
    } catch (error) {
      const errorType = error instanceof Error ? error.name : 'unknown';
      circuitBreaker.recordFailure(errorType);
      updateCircuitBreakerInfo();
      console.error(`[OfflineSync] Error final en ${item.id}:`, error);
      return false;
    }
  };

   const syncAll = useCallback(async () => {
     if (!isOnline) return;
 
    if (circuitBreaker.isCircuitOpen()) {
      console.warn('[OfflineSync] Circuit breaker abierto:', circuitBreaker.getErrorReport());
      setLastSyncError('Demasiados errores, esperando cooldown');
      setSyncStatus('error');
      updateCircuitBreakerInfo();
      return;
    }

     setSyncStatus('syncing');
     setLastSyncError(null);
 
     try {
       const queue = await getSyncQueue();
      
      if (queue.length === 0) {
        setSyncStatus('success');
        setPendingCount(0);
        return;
      }

       let failedCount = 0;
 
       for (const item of queue) {
         if (item.attempts >= MAX_RETRY_ATTEMPTS) {
          console.warn(`[OfflineSync] Item ${item.id} excedió reintentos, removiendo`);
           await removeSyncQueueItem(item.id);
           continue;
         }
 
        uploadQueue.add({
          id: item.id,
          priority: item.action === 'upload_photo' ? 1 : 2,
          execute: async () => {
            const success = await syncItemWithRetry(item);
 
            if (success) {
              await removeSyncQueueItem(item.id);
            } else {
              await updateSyncQueueItem({
                ...item,
                attempts: item.attempts + 1,
                lastAttempt: new Date().toISOString(),
              });
              failedCount++;
            }
          },
        });
       }
 
      // Esperar a que la cola termine
      const checkCompletion = setInterval(async () => {
        if (!uploadQueue.isProcessing()) {
          clearInterval(checkCompletion);
          const updatedQueue = await getSyncQueue();
          setPendingCount(updatedQueue.length);
          setSyncStatus(updatedQueue.length > 0 ? 'error' : 'success');
          if (updatedQueue.length > 0) {
            setLastSyncError(`${updatedQueue.length} elementos pendientes`);
          }
        }
      }, 1000);
     } catch (error) {
       setSyncStatus('error');
       setLastSyncError(
         error instanceof Error ? error.message : 'Error de sincronización'
       );
     }
  }, [isOnline, updateCircuitBreakerInfo]);

  // Monitorear estado del circuit breaker
  useEffect(() => {
    updateCircuitBreakerInfo();
    const interval = setInterval(updateCircuitBreakerInfo, 5000);
    return () => clearInterval(interval);
  }, [updateCircuitBreakerInfo]);
 
   // Auto-sync cuando recupera conexión
   useEffect(() => {
     if (wasOffline && isOnline) {
       syncAll();
     }
   }, [wasOffline, isOnline, syncAll]);
 
   // Contar items pendientes al montar
   useEffect(() => {
     getSyncQueue().then((queue) => setPendingCount(queue.length));
   }, []);
 
   // Actualizar contador periódicamente
   useEffect(() => {
     const interval = setInterval(async () => {
       const queue = await getSyncQueue();
       setPendingCount(queue.length);
     }, 30000);
 
     return () => clearInterval(interval);
   }, []);
 
   return {
     syncStatus,
     pendingCount,
     lastSyncError,
     isOnline,
     syncAll,
    circuitBreakerInfo,
    resetCircuitBreaker,
   };
 }
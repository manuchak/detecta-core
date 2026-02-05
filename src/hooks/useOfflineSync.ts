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
 import type { SyncQueueItem } from '@/types/checklist';
 
 export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';
 
 const MAX_RETRY_ATTEMPTS = 3;
 
 export function useOfflineSync() {
   const { isOnline, wasOffline } = useNetworkStatus();
   const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
   const [pendingCount, setPendingCount] = useState(0);
   const [lastSyncError, setLastSyncError] = useState<string | null>(null);
 
   const syncItem = async (item: SyncQueueItem): Promise<boolean> => {
     try {
       switch (item.action) {
         case 'upload_photo': {
           const photoBlob = await getPhotoBlob(item.payload.photoId as string);
           if (!photoBlob) return true;
 
           const { error } = await supabase.storage
             .from('checklist-evidencias')
             .upload(item.payload.path as string, photoBlob.blob, {
               contentType: photoBlob.mimeType,
               upsert: true,
             });
 
           if (error) throw error;
           await deletePhotoBlob(item.payload.photoId as string);
           return true;
         }
 
         case 'save_checklist': {
           const { error } = await supabase
             .from('checklist_servicio')
             .upsert(item.payload, {
               onConflict: 'servicio_id,custodio_telefono',
             });
 
           if (error) throw error;
           return true;
         }
 
         case 'update_document': {
           const { error } = await supabase
             .from('documentos_custodio')
             .upsert(item.payload, {
               onConflict: 'custodio_telefono,tipo_documento',
             });
 
           if (error) throw error;
           return true;
         }
 
         default:
           return true;
       }
     } catch (error) {
       console.error(`[OfflineSync] Error syncing item ${item.id}:`, error);
       return false;
     }
   };
 
   const syncAll = useCallback(async () => {
     if (!isOnline) return;
 
     setSyncStatus('syncing');
     setLastSyncError(null);
 
     try {
       const queue = await getSyncQueue();
       let failedCount = 0;
 
       for (const item of queue) {
         if (item.attempts >= MAX_RETRY_ATTEMPTS) {
           await removeSyncQueueItem(item.id);
           continue;
         }
 
         const success = await syncItem(item);
 
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
       }
 
       setPendingCount(failedCount);
       setSyncStatus(failedCount > 0 ? 'error' : 'success');
 
       if (failedCount > 0) {
         setLastSyncError(`${failedCount} elementos no se pudieron sincronizar`);
       }
     } catch (error) {
       setSyncStatus('error');
       setLastSyncError(
         error instanceof Error ? error.message : 'Error de sincronización'
       );
     }
   }, [isOnline]);
 
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
   };
 }
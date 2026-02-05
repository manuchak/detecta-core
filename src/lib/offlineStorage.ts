 /**
  * Wrapper para IndexedDB usando idb library
  * Maneja almacenamiento offline de checklists y fotos
  */
 
 import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
 import type {
   ChecklistDraft,
   PhotoBlob,
   SyncQueueItem,
 } from '@/types/checklist';
 
 // ============ SCHEMA DE BASE DE DATOS ============
 
 interface ChecklistDB extends DBSchema {
   checklist_drafts: {
     key: string;
     value: ChecklistDraft;
     indexes: { 'by-phone': string };
   };
   photo_blobs: {
     key: string;
     value: PhotoBlob;
     indexes: { 'by-servicio': string };
   };
   sync_queue: {
     key: string;
     value: SyncQueueItem;
     indexes: { 'by-created': string };
   };
 }
 
 const DB_NAME = 'detecta-checklist-offline';
 const DB_VERSION = 1;
 
 let dbInstance: IDBPDatabase<ChecklistDB> | null = null;
 
 // ============ INICIALIZACIÓN ============
 
 /**
  * Obtiene o crea la instancia de la base de datos
  */
 export async function getDB(): Promise<IDBPDatabase<ChecklistDB>> {
   if (dbInstance) return dbInstance;
 
   dbInstance = await openDB<ChecklistDB>(DB_NAME, DB_VERSION, {
     upgrade(db) {
       // Store para borradores de checklist
       if (!db.objectStoreNames.contains('checklist_drafts')) {
         const draftStore = db.createObjectStore('checklist_drafts', {
           keyPath: 'servicioId',
         });
         draftStore.createIndex('by-phone', 'custodioPhone');
       }
 
       // Store para blobs de fotos
       if (!db.objectStoreNames.contains('photo_blobs')) {
         const photoStore = db.createObjectStore('photo_blobs', {
           keyPath: 'id',
         });
         photoStore.createIndex('by-servicio', 'servicioId');
       }
 
       // Store para cola de sincronización
       if (!db.objectStoreNames.contains('sync_queue')) {
         const syncStore = db.createObjectStore('sync_queue', {
           keyPath: 'id',
         });
         syncStore.createIndex('by-created', 'createdAt');
       }
     },
   });
 
   return dbInstance;
 }
 
 // ============ CHECKLIST DRAFTS ============
 
 export async function saveDraft(draft: ChecklistDraft): Promise<void> {
   const db = await getDB();
   await db.put('checklist_drafts', {
     ...draft,
     updatedAt: new Date().toISOString(),
   });
 }
 
 export async function getDraft(
   servicioId: string
 ): Promise<ChecklistDraft | undefined> {
   const db = await getDB();
   return db.get('checklist_drafts', servicioId);
 }
 
 export async function deleteDraft(servicioId: string): Promise<void> {
   const db = await getDB();
   await db.delete('checklist_drafts', servicioId);
 }
 
 export async function getAllDrafts(phone: string): Promise<ChecklistDraft[]> {
   const db = await getDB();
   return db.getAllFromIndex('checklist_drafts', 'by-phone', phone);
 }
 
 export async function getAllDraftsForUser(): Promise<ChecklistDraft[]> {
   const db = await getDB();
   return db.getAll('checklist_drafts');
 }
 
 // ============ PHOTO BLOBS ============
 
 export async function savePhotoBlob(photo: PhotoBlob): Promise<void> {
   const db = await getDB();
   await db.put('photo_blobs', photo);
 }
 
 export async function getPhotoBlob(
   id: string
 ): Promise<PhotoBlob | undefined> {
   const db = await getDB();
   return db.get('photo_blobs', id);
 }
 
 export async function getPhotosByServicio(
   servicioId: string
 ): Promise<PhotoBlob[]> {
   const db = await getDB();
   return db.getAllFromIndex('photo_blobs', 'by-servicio', servicioId);
 }
 
 export async function deletePhotoBlob(id: string): Promise<void> {
   const db = await getDB();
   await db.delete('photo_blobs', id);
 }
 
 export async function deletePhotosByServicio(
   servicioId: string
 ): Promise<void> {
   const db = await getDB();
   const photos = await getPhotosByServicio(servicioId);
   const tx = db.transaction('photo_blobs', 'readwrite');
   await Promise.all([
     ...photos.map((photo) => tx.store.delete(photo.id)),
     tx.done,
   ]);
 }
 
 // ============ SYNC QUEUE ============
 
 export async function addToSyncQueue(
   item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts' | 'lastAttempt'>
 ): Promise<string> {
   const db = await getDB();
   const id = crypto.randomUUID();
   await db.put('sync_queue', {
     ...item,
     id,
     attempts: 0,
     lastAttempt: null,
     createdAt: new Date().toISOString(),
   });
   return id;
 }
 
 export async function getSyncQueue(): Promise<SyncQueueItem[]> {
   const db = await getDB();
   return db.getAllFromIndex('sync_queue', 'by-created');
 }
 
 export async function updateSyncQueueItem(
   item: SyncQueueItem
 ): Promise<void> {
   const db = await getDB();
   await db.put('sync_queue', item);
 }
 
 export async function removeSyncQueueItem(id: string): Promise<void> {
   const db = await getDB();
   await db.delete('sync_queue', id);
 }
 
 export async function clearSyncQueue(): Promise<void> {
   const db = await getDB();
   await db.clear('sync_queue');
 }
 
 // ============ UTILITIES ============
 
 export async function getPendingSyncCount(): Promise<number> {
   const db = await getDB();
   const queue = await db.getAll('sync_queue');
   return queue.length;
 }
 
 export async function clearAllOfflineData(): Promise<void> {
   const db = await getDB();
   await Promise.all([
     db.clear('checklist_drafts'),
     db.clear('photo_blobs'),
     db.clear('sync_queue'),
   ]);
 }
 
 export async function clearServiceData(servicioId: string): Promise<void> {
   await Promise.all([
     deleteDraft(servicioId),
     deletePhotosByServicio(servicioId),
   ]);
 }
 
 /**
  * Obtiene el tamaño aproximado de datos offline almacenados
  */
 export async function getOfflineStorageSize(): Promise<{
   drafts: number;
   photos: number;
   queue: number;
   total: number;
 }> {
   const db = await getDB();
   const drafts = await db.getAll('checklist_drafts');
   const photos = await db.getAll('photo_blobs');
   const queue = await db.getAll('sync_queue');
 
   const draftsSize = new Blob([JSON.stringify(drafts)]).size;
   const photosSize = photos.reduce((acc, p) => acc + p.blob.size, 0);
   const queueSize = new Blob([JSON.stringify(queue)]).size;
 
   return {
     drafts: draftsSize,
     photos: photosSize,
     queue: queueSize,
     total: draftsSize + photosSize + queueSize,
   };
 }
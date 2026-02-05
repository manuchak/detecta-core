 /**
  * Cola de subida con rate limiting
  * Controla uploads concurrentes para evitar saturar el servidor
  */
 
 export interface UploadQueueConfig {
   maxConcurrent: number;
   delayBetweenUploads: number;
 }
 
 export interface QueuedUpload {
   id: string;
   priority: number; // Menor = mayor prioridad
   execute: () => Promise<void>;
   onProgress?: (progress: number) => void;
   onComplete?: () => void;
   onError?: (error: Error) => void;
 }
 
 export interface QueueStatus {
   pending: number;
   active: number;
   completed: number;
   failed: number;
 }
 
 type QueueEventType = 'start' | 'complete' | 'error' | 'empty';
 type QueueEventCallback = (event: { type: QueueEventType; item?: QueuedUpload; error?: Error }) => void;
 
 const DEFAULT_CONFIG: UploadQueueConfig = {
   maxConcurrent: 2,
   delayBetweenUploads: 500,
 };
 
 export class UploadQueue {
   private queue: QueuedUpload[] = [];
   private activeCount = 0;
   private completedCount = 0;
   private failedCount = 0;
   private isPaused = false;
   private config: UploadQueueConfig;
   private listeners: QueueEventCallback[] = [];
 
   constructor(config: Partial<UploadQueueConfig> = {}) {
     this.config = { ...DEFAULT_CONFIG, ...config };
   }
 
   /**
    * Agrega un upload a la cola
    */
   add(upload: QueuedUpload): void {
     // Insertar en posición correcta según prioridad
     const insertIndex = this.queue.findIndex((item) => item.priority > upload.priority);
     
     if (insertIndex === -1) {
       this.queue.push(upload);
     } else {
       this.queue.splice(insertIndex, 0, upload);
     }
 
     console.log(`[UploadQueue] Agregado: ${upload.id} (prioridad: ${upload.priority}, pendientes: ${this.queue.length})`);
     
     // Procesar cola si no está pausada
     if (!this.isPaused) {
       this.processNext();
     }
   }
 
   /**
    * Procesa el siguiente item de la cola si hay capacidad
    */
   private async processNext(): Promise<void> {
     if (this.isPaused || this.activeCount >= this.config.maxConcurrent || this.queue.length === 0) {
       if (this.activeCount === 0 && this.queue.length === 0) {
         this.emit({ type: 'empty' });
       }
       return;
     }
 
     const item = this.queue.shift();
     if (!item) return;
 
     this.activeCount++;
     this.emit({ type: 'start', item });
 
     console.log(`[UploadQueue] Iniciando: ${item.id} (activos: ${this.activeCount})`);
 
     try {
       await item.execute();
       
       this.completedCount++;
       item.onComplete?.();
       this.emit({ type: 'complete', item });
       
       console.log(`[UploadQueue] Completado: ${item.id}`);
     } catch (error) {
       this.failedCount++;
       const err = error instanceof Error ? error : new Error(String(error));
       item.onError?.(err);
       this.emit({ type: 'error', item, error: err });
       
       console.error(`[UploadQueue] Error en ${item.id}:`, err.message);
     } finally {
       this.activeCount--;
 
       // Delay entre uploads para evitar ráfagas
       if (this.config.delayBetweenUploads > 0) {
         await new Promise((r) => setTimeout(r, this.config.delayBetweenUploads));
       }
 
       // Procesar siguiente
       this.processNext();
     }
   }
 
   /**
    * Pausa el procesamiento de la cola
    */
   pause(): void {
     this.isPaused = true;
     console.log('[UploadQueue] Pausado');
   }
 
   /**
    * Reanuda el procesamiento de la cola
    */
   resume(): void {
     this.isPaused = false;
     console.log('[UploadQueue] Reanudado');
     
     // Iniciar procesamiento de items pendientes
     for (let i = 0; i < this.config.maxConcurrent; i++) {
       this.processNext();
     }
   }
 
   /**
    * Limpia la cola (no afecta uploads en progreso)
    */
   clear(): void {
     const cleared = this.queue.length;
     this.queue = [];
     console.log(`[UploadQueue] Cola limpiada (${cleared} items removidos)`);
   }
 
   /**
    * Obtiene el estado actual de la cola
    */
   getStatus(): QueueStatus {
     return {
       pending: this.queue.length,
       active: this.activeCount,
       completed: this.completedCount,
       failed: this.failedCount,
     };
   }
 
   /**
    * Verifica si hay items pendientes o en progreso
    */
   isProcessing(): boolean {
     return this.activeCount > 0 || this.queue.length > 0;
   }
 
   /**
    * Suscribe a eventos de la cola
    */
   on(callback: QueueEventCallback): () => void {
     this.listeners.push(callback);
     return () => {
       this.listeners = this.listeners.filter((cb) => cb !== callback);
     };
   }
 
   private emit(event: { type: QueueEventType; item?: QueuedUpload; error?: Error }): void {
     this.listeners.forEach((cb) => cb(event));
   }
 
   /**
    * Resetea contadores (útil para nueva sesión)
    */
   resetCounters(): void {
     this.completedCount = 0;
     this.failedCount = 0;
   }
 }
 
 // Singleton para uso global
 let globalQueue: UploadQueue | null = null;
 
 export function getGlobalUploadQueue(config?: Partial<UploadQueueConfig>): UploadQueue {
   if (!globalQueue) {
     globalQueue = new UploadQueue(config);
   }
   return globalQueue;
 }
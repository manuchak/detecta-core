 /**
  * Utilidades para compresión de imágenes
  * Reduce tamaño de fotos antes de almacenar en IndexedDB
  */
 
 export interface CompressionOptions {
   maxWidth: number;
   maxHeight: number;
   quality: number;
   format: 'jpeg' | 'webp';
 }
 
 export interface CompressionResult {
   blob: Blob;
   originalSize: number;
   compressedSize: number;
   compressionRatio: number;
 }
 
 const DEFAULT_OPTIONS: CompressionOptions = {
   maxWidth: 1920,
   maxHeight: 1080,
   quality: 0.7,
   format: 'jpeg',
 };
 
 /**
  * Comprime una imagen usando Canvas API
  * Mantiene aspect ratio y reduce calidad para optimizar almacenamiento
  */
 export async function compressImage(
   file: File | Blob,
   options: Partial<CompressionOptions> = {}
 ): Promise<CompressionResult> {
   const config = { ...DEFAULT_OPTIONS, ...options };
   const originalSize = file.size;
 
   return new Promise((resolve, reject) => {
     const img = new Image();
     const url = URL.createObjectURL(file);
 
     img.onload = () => {
       URL.revokeObjectURL(url);
 
       // Calcular nuevas dimensiones manteniendo aspect ratio
       let { width, height } = img;
       
       if (width > config.maxWidth) {
         height = (height * config.maxWidth) / width;
         width = config.maxWidth;
       }
       
       if (height > config.maxHeight) {
         width = (width * config.maxHeight) / height;
         height = config.maxHeight;
       }
 
       // Crear canvas y dibujar imagen redimensionada
       const canvas = document.createElement('canvas');
       canvas.width = width;
       canvas.height = height;
 
       const ctx = canvas.getContext('2d');
       if (!ctx) {
         reject(new Error('No se pudo crear contexto de canvas'));
         return;
       }
 
       // Aplicar suavizado para mejor calidad
       ctx.imageSmoothingEnabled = true;
       ctx.imageSmoothingQuality = 'high';
       ctx.drawImage(img, 0, 0, width, height);
 
       // Convertir a blob comprimido
       const mimeType = config.format === 'webp' ? 'image/webp' : 'image/jpeg';
       
       canvas.toBlob(
         (blob) => {
           if (!blob) {
             reject(new Error('Error al comprimir imagen'));
             return;
           }
 
           const compressedSize = blob.size;
           const compressionRatio = originalSize > 0 
             ? ((originalSize - compressedSize) / originalSize) * 100 
             : 0;
 
           console.log(
             `[ImageUtils] Comprimido: ${(originalSize / 1024).toFixed(0)}KB -> ${(compressedSize / 1024).toFixed(0)}KB (${compressionRatio.toFixed(0)}% reducción)`
           );
 
           resolve({
             blob,
             originalSize,
             compressedSize,
             compressionRatio,
           });
         },
         mimeType,
         config.quality
       );
     };
 
     img.onerror = () => {
       URL.revokeObjectURL(url);
       reject(new Error('Error al cargar imagen para compresión'));
     };
 
     img.src = url;
   });
 }
 
 /**
  * Verifica si un archivo necesita compresión
  */
 export function needsCompression(file: File | Blob, thresholdBytes = 500 * 1024): boolean {
   return file.size > thresholdBytes;
 }
 
 /**
  * Obtiene dimensiones de una imagen sin cargarla completamente
  */
 export async function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
   return new Promise((resolve, reject) => {
     const img = new Image();
     const url = URL.createObjectURL(file);
 
     img.onload = () => {
       URL.revokeObjectURL(url);
       resolve({ width: img.width, height: img.height });
     };
 
     img.onerror = () => {
       URL.revokeObjectURL(url);
       reject(new Error('Error al leer dimensiones de imagen'));
     };
 
     img.src = url;
   });
 }
/**
 * Utilidades para compresión de imágenes
 * Reduce tamaño de fotos antes de almacenar en IndexedDB
 * 
 * v5: Timeout de 10s + fallback toDataURL para Android WebViews problemáticos
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

const COMPRESSION_TIMEOUT_MS = 10000; // 10 segundos máximo

/**
 * Convierte un dataURL a Blob (fallback para cuando toBlob falla)
 */
function dataURLToBlob(dataUrl: string, mimeType: string): Blob {
  console.log('[ImageUtils] Usando fallback dataURLToBlob');
  const byteString = atob(dataUrl.split(',')[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([uint8Array], { type: mimeType });
}

/**
 * Comprime una imagen usando Canvas API
 * Mantiene aspect ratio y reduce calidad para optimizar almacenamiento
 * 
 * v5: Incluye timeout de 10s y fallback a toDataURL para Android
 */
export async function compressImage(
  file: File | Blob,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;
  
  console.log(`[ImageUtils] v5 - Iniciando compresión: ${(originalSize / 1024).toFixed(0)}KB`);

  const compressionPromise = new Promise<CompressionResult>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      console.log('[ImageUtils] v5 - Imagen cargada, procesando...');

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
      
      console.log('[ImageUtils] v5 - Llamando canvas.toBlob()...');
      
      // Flag para detectar si toBlob llamó al callback
      let toBlobCalled = false;
      
      // Timeout interno para toBlob (5 segundos)
      const toBlobTimeout = setTimeout(() => {
        if (!toBlobCalled) {
          console.warn('[ImageUtils] v5 - toBlob no respondió, usando toDataURL fallback');
          try {
            const dataUrl = canvas.toDataURL(mimeType, config.quality);
            const fallbackBlob = dataURLToBlob(dataUrl, mimeType);
            const compressedSize = fallbackBlob.size;
            const compressionRatio = originalSize > 0 
              ? ((originalSize - compressedSize) / originalSize) * 100 
              : 0;
            
            console.log(
              `[ImageUtils] v5 - Fallback exitoso: ${(originalSize / 1024).toFixed(0)}KB -> ${(compressedSize / 1024).toFixed(0)}KB (${compressionRatio.toFixed(0)}% reducción)`
            );
            
            resolve({
              blob: fallbackBlob,
              originalSize,
              compressedSize,
              compressionRatio,
            });
          } catch (fallbackError) {
            console.error('[ImageUtils] v5 - Fallback toDataURL también falló:', fallbackError);
            reject(new Error('Error en compresión: toBlob y toDataURL fallaron'));
          }
        }
      }, 5000);
      
      canvas.toBlob(
        (blob) => {
          toBlobCalled = true;
          clearTimeout(toBlobTimeout);
          
          console.log('[ImageUtils] v5 - toBlob callback ejecutado, blob:', blob ? `${blob.size} bytes` : 'NULL');
          
          if (!blob) {
            // toBlob llamó al callback pero con null - usar fallback
            console.warn('[ImageUtils] v5 - toBlob devolvió null, usando toDataURL');
            try {
              const dataUrl = canvas.toDataURL(mimeType, config.quality);
              const fallbackBlob = dataURLToBlob(dataUrl, mimeType);
              const compressedSize = fallbackBlob.size;
              const compressionRatio = originalSize > 0 
                ? ((originalSize - compressedSize) / originalSize) * 100 
                : 0;
              
              resolve({
                blob: fallbackBlob,
                originalSize,
                compressedSize,
                compressionRatio,
              });
            } catch (fallbackError) {
              reject(new Error('Error al comprimir imagen (fallback falló)'));
            }
            return;
          }

          const compressedSize = blob.size;
          const compressionRatio = originalSize > 0 
            ? ((originalSize - compressedSize) / originalSize) * 100 
            : 0;

          console.log(
            `[ImageUtils] v5 - Comprimido: ${(originalSize / 1024).toFixed(0)}KB -> ${(compressedSize / 1024).toFixed(0)}KB (${compressionRatio.toFixed(0)}% reducción)`
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
      console.error('[ImageUtils] v5 - Error al cargar imagen');
      reject(new Error('Error al cargar imagen para compresión'));
    };

    img.src = url;
  });

  // Timeout global de 10 segundos para toda la operación
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error('[ImageUtils] v5 - TIMEOUT: Compresión tardó más de 10 segundos');
      reject(new Error('Timeout: La compresión tardó demasiado'));
    }, COMPRESSION_TIMEOUT_MS);
  });

  return Promise.race([compressionPromise, timeoutPromise]);
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

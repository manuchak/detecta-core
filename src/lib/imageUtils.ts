/**
 * Utilidades para compresión de imágenes
 * Reduce tamaño de fotos antes de almacenar en IndexedDB
 * 
 * v6: Timeout de 8s para img.onload + fallback a archivo original si falla todo
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

const IMG_LOAD_TIMEOUT_MS = 8000; // 8 segundos para que la imagen cargue
const TOBLOB_TIMEOUT_MS = 5000; // 5 segundos para toBlob

/**
 * Convierte un dataURL a Blob (fallback para cuando toBlob falla)
 */
function dataURLToBlob(dataUrl: string, mimeType: string): Blob {
  console.log('[ImageUtils] v6 - Usando fallback dataURLToBlob');
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
 * v6: Timeout de 8s para img.onload + fallback toDataURL
 */
export async function compressImage(
  file: File | Blob,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;
  
  console.log(`[ImageUtils] v6 - Iniciando compresión: ${(originalSize / 1024).toFixed(0)}KB, tipo: ${file.type}`);

  return new Promise<CompressionResult>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    // v6: Timeout específico para img.onload (8 segundos)
    const imgLoadTimeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      console.error('[ImageUtils] v6 - TIMEOUT: img.onload no disparó en 8 segundos');
      reject(new Error('Timeout: La imagen no se pudo cargar'));
    }, IMG_LOAD_TIMEOUT_MS);

    img.onload = () => {
      clearTimeout(imgLoadTimeout);
      URL.revokeObjectURL(url);
      console.log(`[ImageUtils] v6 - Imagen cargada: ${img.width}x${img.height}`);

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
      
      console.log('[ImageUtils] v6 - Canvas listo, llamando toBlob...');
      
      // Flag para detectar si toBlob llamó al callback
      let toBlobCalled = false;
      
      // v6: Timeout de 5s para toBlob específicamente
      const toBlobTimeout = setTimeout(() => {
        if (!toBlobCalled) {
          console.warn('[ImageUtils] v6 - toBlob no respondió en 5s, usando toDataURL fallback');
          try {
            const dataUrl = canvas.toDataURL(mimeType, config.quality);
            const fallbackBlob = dataURLToBlob(dataUrl, mimeType);
            const compressedSize = fallbackBlob.size;
            const compressionRatio = originalSize > 0 
              ? ((originalSize - compressedSize) / originalSize) * 100 
              : 0;
            
            console.log(
              `[ImageUtils] v6 - Fallback exitoso: ${(originalSize / 1024).toFixed(0)}KB -> ${(compressedSize / 1024).toFixed(0)}KB (${compressionRatio.toFixed(0)}% reducción)`
            );
            
            resolve({
              blob: fallbackBlob,
              originalSize,
              compressedSize,
              compressionRatio,
            });
          } catch (fallbackError) {
            console.error('[ImageUtils] v6 - Fallback toDataURL también falló:', fallbackError);
            reject(new Error('Error en compresión: toBlob y toDataURL fallaron'));
          }
        }
      }, TOBLOB_TIMEOUT_MS);
      
      canvas.toBlob(
        (blob) => {
          toBlobCalled = true;
          clearTimeout(toBlobTimeout);
          
          console.log('[ImageUtils] v6 - toBlob callback:', blob ? `${blob.size} bytes` : 'NULL');
          
          if (!blob) {
            // toBlob llamó al callback pero con null - usar fallback
            console.warn('[ImageUtils] v6 - toBlob devolvió null, usando toDataURL');
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
            `[ImageUtils] v6 - Comprimido: ${(originalSize / 1024).toFixed(0)}KB -> ${(compressedSize / 1024).toFixed(0)}KB (${compressionRatio.toFixed(0)}% reducción)`
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

    img.onerror = (e) => {
      clearTimeout(imgLoadTimeout);
      URL.revokeObjectURL(url);
      console.error('[ImageUtils] v6 - Error al cargar imagen:', e);
      reject(new Error('Error al cargar imagen para compresión'));
    };

    console.log('[ImageUtils] v6 - Asignando src a img...');
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

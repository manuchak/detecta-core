/**
 * Componente de captura de fotos para custodios
 * v2.0 - Agregado compresión de imágenes y manejo de errores de almacenamiento
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Image, X, Plus, Loader2, HardDrive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { compressImage, needsCompression } from '@/lib/imageUtils';

interface CameraUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

// Verificar espacio disponible
async function checkStorageAvailable(): Promise<boolean> {
  try {
    if (!navigator.storage?.estimate) return true;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return (quota - usage) > 10 * 1024 * 1024; // >10MB
  } catch {
    return true;
  }
}

// Detectar errores de quota
function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.code === 22;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('quota') || msg.includes('storage') || msg.includes('space');
  }
  return false;
}

export const CameraUploader = ({
  files,
  onFilesChange,
  maxFiles = 5
}: CameraUploaderProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storageError, setStorageError] = useState(false);

  // Limpiar URLs de objeto al desmontar
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const remainingSlots = maxFiles - files.length;
    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    
    if (filesToProcess.length === 0) {
      e.target.value = '';
      return;
    }

    setStorageError(false);
    setIsProcessing(true);

    try {
      // Verificar espacio
      const hasSpace = await checkStorageAvailable();
      if (!hasSpace) {
        setStorageError(true);
        setIsProcessing(false);
        e.target.value = '';
        return;
      }

      const processedFiles: File[] = [];
      const newPreviews: string[] = [];

      for (const file of filesToProcess) {
        try {
          let fileToUse = file;
          
          // Comprimir si es necesario
          if (file.type.startsWith('image/') && needsCompression(file)) {
            console.log(`[CameraUploader] Comprimiendo: ${(file.size / 1024).toFixed(0)}KB`);
            const { blob } = await compressImage(file, {
              maxWidth: 1920,
              maxHeight: 1080,
              quality: 0.7
            });
            fileToUse = new File([blob], file.name, { type: 'image/jpeg' });
          }
          
          processedFiles.push(fileToUse);
          newPreviews.push(URL.createObjectURL(fileToUse));
        } catch (error) {
          console.error('[CameraUploader] Error procesando archivo:', error);
          
          if (isQuotaError(error)) {
            setStorageError(true);
            break;
          }
          
          // Si falla compresión, usar original
          processedFiles.push(file);
          newPreviews.push(URL.createObjectURL(file));
        }
      }

      if (processedFiles.length > 0) {
        onFilesChange([...files, ...processedFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);
      }
    } catch (error) {
      console.error('[CameraUploader] Error general:', error);
      if (isQuotaError(error)) {
        setStorageError(true);
      }
    }

    setIsProcessing(false);
    e.target.value = '';
  }, [files, maxFiles, onFilesChange]);

  const removeFile = useCallback((index: number) => {
    // Limpiar URL del preview
    if (previews[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(previews[index]);
    }
    
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    setPreviews(newPreviews);
  }, [files, previews, onFilesChange]);

  const handleRetry = () => {
    setStorageError(false);
  };

  const canAddMore = files.length < maxFiles && !isProcessing;

  // UI de error de almacenamiento
  if (storageError) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <HardDrive className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                Poco espacio en tu dispositivo
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Libera espacio borrando fotos, videos o apps que no uses.
              </p>
            </div>
          </div>
        </div>
        
        <Button onClick={handleRetry} className="w-full h-14 rounded-2xl">
          <RefreshCw className="w-5 h-5 mr-2" />
          Reintentar
        </Button>

        {/* Mostrar fotos ya cargadas */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={preview}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl border border-border"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg active:scale-95 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isProcessing}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={isProcessing}
      />

      {/* Photo previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={preview}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-xl border border-border"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg active:scale-95 touch-manipulation"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {canAddMore && (
        <div className="space-y-3">
          <Button
            type="button"
            variant="default"
            size="lg"
            className="w-full h-16 text-lg font-semibold rounded-2xl gap-3"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Camera className="w-7 h-7" />
                Tomar Foto
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full h-14 text-base rounded-2xl gap-3"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Image className="w-6 h-6" />
            Elegir de Galería
          </Button>
        </div>
      )}

      {/* Counter */}
      <p className="text-center text-muted-foreground text-sm">
        {files.length} de {maxFiles} fotos
        {files.length === 0 && " (opcional)"}
      </p>
    </div>
  );
};

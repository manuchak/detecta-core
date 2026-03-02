/**
 * Slot individual para captura de foto por ángulo
 * v2: Feedback progresivo + mensajes de error específicos
 */
import { useState, useEffect } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeoValidationBadge } from './GeoValidationBadge';
import type { AnguloFoto, FotoValidada } from '@/types/checklist';
import { ANGULO_LABELS } from '@/types/checklist';
import { getPhotoBlob } from '@/lib/offlineStorage';
import { toast } from 'sonner';

interface PhotoSlotProps {
  angle: AnguloFoto;
  label: string;
  foto?: FotoValidada;
  onCapture: (angle: AnguloFoto, file: File, onProgress?: (status: string) => void) => Promise<FotoValidada>;
  onRemove: () => void;
  className?: string;
}

export function PhotoSlot({
  angle,
  label,
  foto,
  onCapture,
  onRemove,
  className,
}: PhotoSlotProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string>('');

  // Cargar preview de foto local
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      if (foto?.localBlobId) {
        const photoBlob = await getPhotoBlob(foto.localBlobId);
        if (photoBlob) {
          objectUrl = URL.createObjectURL(photoBlob.blob);
          setPreviewUrl(objectUrl);
        }
      } else if (foto?.url) {
        setPreviewUrl(foto.url);
      } else {
        setPreviewUrl(null);
      }
    };

    loadPreview();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [foto]);

  const hasPhoto = !!foto;

  const handleCapture = async (file: File) => {
    setIsCapturing(true);
    setCaptureStatus('Iniciando...');
    try {
      await onCapture(angle, file, (status) => setCaptureStatus(status));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown';
      console.error('[PhotoSlot] Error capturing photo:', errorMessage);

      if (errorMessage === 'STORAGE_FULL') {
        toast.error('Almacenamiento lleno', {
          description: 'Sincroniza tus checklists pendientes o libera espacio en tu dispositivo.',
          duration: 8000,
        });
      } else if (errorMessage === 'ZERO_BYTES') {
        toast.error('Foto vacía', {
          description: 'La imagen no se procesó correctamente. Intenta de nuevo.',
        });
      } else {
        toast.error('Error al capturar la foto', {
          description: 'Intenta de nuevo. Si persiste, reinicia la app.',
        });
      }
    } finally {
      setIsCapturing(false);
      setCaptureStatus('');
    }
  };

  return (
    <div className={cn('relative aspect-square', className)}>
      {hasPhoto ? (
        // Preview de foto tomada
        <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-primary">
          {previewUrl && (
            <img
              src={previewUrl}
              alt={ANGULO_LABELS[angle]}
              className="w-full h-full object-cover"
            />
          )}

          {/* Badge de validación GPS */}
          <div className="absolute top-2 left-2">
            <GeoValidationBadge
              validacion={foto.validacion}
              distancia={foto.distancia_origen_m}
            />
          </div>

          {/* Botones de acción */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    handleCapture(file).catch((err) => {
                      console.error('[PhotoSlot] Retake error:', err);
                    });
                  }
                };
                input.click();
              }}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Label */}
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium">
            {label}
          </div>
        </div>
      ) : (
        // Slot vacío - botón para capturar
        <label className="w-full h-full rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors active:scale-95 cursor-pointer">
          {isCapturing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="text-xs font-medium text-primary animate-pulse">
                {captureStatus || 'Procesando...'}
              </span>
            </div>
          ) : (
            <>
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs">Tomar foto</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={isCapturing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCapture(file);
            }}
          />
        </label>
      )}
    </div>
  );
}

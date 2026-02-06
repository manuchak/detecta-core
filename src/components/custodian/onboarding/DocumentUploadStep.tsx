/**
 * Componente de paso individual para subir un documento
 * Incluye captura de foto, fecha de vigencia y estados de carga/éxito/error
 * 
 * v7.0 - Input dinámico (createElement) + Skip compresión para diagnóstico Android
 */
import { useState, useEffect, useCallback } from 'react';
import { Camera, Calendar, CheckCircle2, Image as ImageIcon, AlertCircle, RefreshCw, Loader2, AlertTriangle, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { DocumentoCustodio, TipoDocumentoCustodio } from '@/types/checklist';

const VERSION = 'v7';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type ErrorType = 'storage_low' | 'compression_failed' | 'upload_failed' | 'invalid_phone' | 'generic';

interface DocumentUploadStepProps {
  tipoDocumento: TipoDocumentoCustodio;
  existingDocument?: DocumentoCustodio;
  onUpload: (file: File, fechaVigencia: string) => Promise<void>;
  isUploading: boolean;
}

// Detectar errores de quota de almacenamiento
function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || 
           error.code === 22;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('quota') || 
           msg.includes('storage') || 
           msg.includes('space') ||
           msg.includes('espacio');
  }
  return false;
}

export function DocumentUploadStep({
  tipoDocumento,
  existingDocument,
  onUpload,
  isUploading
}: DocumentUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fechaVigencia, setFechaVigencia] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isExpired = existingDocument 
    ? new Date(existingDocument.fecha_vigencia) < new Date()
    : false;

  // Limpiar URL de objeto al desmontar o cuando cambie
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // v7: Toast y log al montar
  useEffect(() => {
    console.log(`[DocumentUpload] ${VERSION} montado - tipoDocumento:`, tipoDocumento);
    toast.info(`DocumentUpload ${VERSION} cargado`, { duration: 3000 });
  }, []);

  /**
   * v7: Procesar archivo recibido - SIN COMPRESIÓN para diagnóstico
   */
  const processFile = useCallback(async (selectedFile: File) => {
    console.log(`[DocumentUpload] ${VERSION} - Archivo recibido:`, {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type
    });

    // Feedback inmediato
    toast.info('Foto recibida, procesando...', { duration: 2000 });

    // Limpiar preview anterior
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    setUploadStatus('idle');
    setErrorType(null);
    setErrorMessage(null);

    try {
      // v7: SIN COMPRESIÓN - usar archivo directo para diagnóstico
      const url = URL.createObjectURL(selectedFile);
      
      console.log(`[DocumentUpload] ${VERSION} - Preview URL creada:`, url.substring(0, 50));
      
      setFile(selectedFile);
      setPreview(url);
      
      toast.success('Foto lista ✓', { duration: 2000 });
      console.log(`[DocumentUpload] ${VERSION} - Estado actualizado: file=${selectedFile.name}, preview=OK`);
      
    } catch (error) {
      console.error(`[DocumentUpload] ${VERSION} - Error procesando:`, error);
      
      if (isQuotaError(error)) {
        setUploadStatus('error');
        setErrorType('storage_low');
        setErrorMessage('Tu dispositivo no tiene suficiente espacio');
      } else {
        setUploadStatus('error');
        setErrorType('generic');
        setErrorMessage(error instanceof Error ? error.message : 'Error al procesar la imagen');
      }
    }
  }, [preview]);

  /**
   * v7: Handler con input DINÁMICO (patrón de PhotoSlot)
   * Crea un input nuevo cada vez para evitar desincronización de refs en Android
   */
  const handleCameraClick = useCallback(() => {
    // Feedback inmediato al usuario
    toast.info('📷 Abriendo cámara...', { duration: 2000 });
    console.log(`[DocumentUpload] ${VERSION} - Creando input dinámico`);

    setIsProcessing(true);

    // Crear input FRESCO cada vez (no usar ref)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    // Handler asignado INMEDIATAMENTE antes de click
    input.onchange = async (e) => {
      console.log(`[DocumentUpload] ${VERSION} - input.onchange disparado`);
      
      const target = e.target as HTMLInputElement;
      const selectedFile = target.files?.[0];

      if (!selectedFile) {
        console.warn(`[DocumentUpload] ${VERSION} - NO HAY ARCHIVO en onchange`);
        toast.error('No se recibió la foto', {
          description: 'Intenta tomar la foto de nuevo',
          duration: 5000
        });
        setIsProcessing(false);
        return;
      }

      await processFile(selectedFile);
      setIsProcessing(false);
    };

    // Manejar cancelación
    input.oncancel = () => {
      console.log(`[DocumentUpload] ${VERSION} - Captura cancelada`);
      setIsProcessing(false);
    };

    // Disparar apertura de cámara
    input.click();
    console.log(`[DocumentUpload] ${VERSION} - input.click() ejecutado`);
  }, [processFile]);

  const handleSubmit = async () => {
    console.log('[DocumentUploadStep] Submit iniciado:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fechaVigencia,
      tipoDocumento
    });
    
    if (!file || !fechaVigencia) {
      console.warn('[DocumentUploadStep] Faltan datos - archivo:', !!file, 'fecha:', !!fechaVigencia);
      return;
    }
    
    setUploadStatus('uploading');
    setErrorType(null);
    setErrorMessage(null);
    
    console.log('[DocumentUploadStep] Llamando onUpload...');
    
    try {
      await onUpload(file, fechaVigencia);
      console.log('[DocumentUploadStep] Upload exitoso');
      setUploadStatus('success');
      
      // Limpiar estado después de mostrar éxito
      setTimeout(() => {
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
        setFile(null);
        setPreview(null);
        setFechaVigencia('');
        setUploadStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('[DocumentUploadStep] Upload failed:', error);
      setUploadStatus('error');
      
      const errorMsg = error instanceof Error ? error.message : '';
      
      if (errorMsg.includes('teléfono no es válido')) {
        setErrorType('invalid_phone');
        setErrorMessage('Actualiza tu número de teléfono en tu perfil para continuar');
      } else if (isQuotaError(error)) {
        setErrorType('storage_low');
        setErrorMessage('No hay espacio para guardar el documento');
      } else {
        setErrorType('upload_failed');
        setErrorMessage(errorMsg || 'Error desconocido al subir');
      }
    }
  };

  const handleRetry = () => {
    setUploadStatus('idle');
    setErrorType(null);
    setErrorMessage(null);
    
    if (errorType === 'storage_low') {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setFile(null);
      setPreview(null);
    }
  };

  // Si ya existe un documento válido
  if (existingDocument && !isExpired && !preview) {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">
                Documento registrado
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Vigente hasta: {format(new Date(existingDocument.fecha_vigencia), "d 'de' MMMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>
        
        {existingDocument.foto_url && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img 
              src={existingDocument.foto_url} 
              alt="Documento actual"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleCameraClick}
        >
          Actualizar documento
        </Button>
      </div>
    );
  }

  // Estado de éxito
  if (uploadStatus === 'success') {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-lg text-emerald-800 dark:text-emerald-200">
                ¡Documento guardado!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                La foto se subió correctamente
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error - Teléfono inválido
  if (uploadStatus === 'error' && errorType === 'invalid_phone') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                Teléfono no válido
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Para subir documentos necesitas un número de teléfono válido registrado en tu perfil.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Contacta a soporte para actualizar tu información.
              </p>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleRetry}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  // Estado de error - Espacio bajo en dispositivo
  if (uploadStatus === 'error' && errorType === 'storage_low') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                Tu dispositivo tiene poco espacio
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Para continuar, libera espacio en tu teléfono:
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                <li>• Borra fotos o videos que ya no necesites</li>
                <li>• Elimina apps que no uses</li>
                <li>• Limpia la caché del navegador</li>
              </ul>
              {errorMessage && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleRetry}
          className="w-full"
          size="lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  // Estado de error - Genérico
  if (uploadStatus === 'error') {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-lg text-red-800 dark:text-red-200">
                Error al guardar
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage || 'No se pudo subir la foto'}
              </p>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleRetry}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* v7: Badge de versión visible */}
      <div className="absolute -top-2 right-0 bg-primary/10 px-2 py-0.5 rounded text-xs font-mono text-primary">
        {VERSION}
      </div>
      
      {/* Área de captura de foto */}
      <div className="space-y-2">
        <Label>Foto del documento</Label>
        
        {preview ? (
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img 
                src={preview} 
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            {(uploadStatus === 'uploading' || isProcessing) && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm font-medium">
                    {isProcessing ? 'Procesando...' : 'Subiendo...'}
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2"
              onClick={handleCameraClick}
              disabled={uploadStatus === 'uploading' || isProcessing}
            >
              <Camera className="w-4 h-4 mr-1" />
              Cambiar
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCameraClick}
            className="w-full aspect-video border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-3 bg-muted/50 hover:bg-muted transition-colors"
            disabled={uploadStatus === 'uploading' || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="font-medium">Esperando cámara...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Tomar foto</p>
                  <p className="text-sm text-muted-foreground">
                    Usa la cámara trasera para mejor calidad
                  </p>
                </div>
              </>
            )}
          </button>
        )}
      </div>

      {/* Fecha de vigencia */}
      <div className="space-y-2">
        <Label htmlFor="fecha-vigencia" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Fecha de vigencia
        </Label>
        <Input
          id="fecha-vigencia"
          type="date"
          value={fechaVigencia}
          onChange={(e) => setFechaVigencia(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="text-base"
          disabled={uploadStatus === 'uploading' || isProcessing}
        />
        <p className="text-xs text-muted-foreground">
          Indica la fecha de vencimiento del documento
        </p>
      </div>

      {/* Botón de subir */}
      <Button
        onClick={handleSubmit}
        disabled={!file || !fechaVigencia || uploadStatus === 'uploading' || isUploading || isProcessing}
        className="w-full"
        size="lg"
      >
        {uploadStatus === 'uploading' || isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Subiendo documento...
          </>
        ) : (
          <>
            <ImageIcon className="w-4 h-4 mr-2" />
            Guardar documento
          </>
        )}
      </Button>

      {/* Alerta si documento vencido */}
      {existingDocument && isExpired && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
          <p className="text-amber-800 dark:text-amber-200">
            ⚠️ Tu documento anterior venció el {format(new Date(existingDocument.fecha_vigencia), "d 'de' MMMM yyyy", { locale: es })}. 
            Sube uno actualizado.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de paso individual para subir un documento
 * Incluye captura de foto, fecha de vigencia y estados de carga/éxito/error
 * 
 * v5.0 - Timeout en compresión + toasts detallados para debugging Android
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Calendar, CheckCircle2, Image as ImageIcon, AlertCircle, RefreshCw, Loader2, AlertTriangle, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { compressImage, needsCompression } from '@/lib/imageUtils';
import { toast } from 'sonner';
import type { DocumentoCustodio, TipoDocumentoCustodio } from '@/types/checklist';

const VERSION = 'v5';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type ErrorType = 'storage_low' | 'compression_failed' | 'upload_failed' | 'invalid_phone' | 'generic';

interface DocumentUploadStepProps {
  tipoDocumento: TipoDocumentoCustodio;
  existingDocument?: DocumentoCustodio;
  onUpload: (file: File, fechaVigencia: string) => Promise<void>;
  isUploading: boolean;
}

// Verificar si hay espacio disponible en el dispositivo
async function checkStorageAvailable(): Promise<{
  available: boolean;
  spaceLeft?: number;
}> {
  try {
    if (!navigator.storage?.estimate) {
      return { available: true };
    }
    
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const spaceLeft = quota - usage;
    
    // Requerir al menos 10MB disponibles
    return {
      available: spaceLeft > 10 * 1024 * 1024,
      spaceLeft
    };
  } catch {
    // Si no podemos verificar, asumimos que hay espacio
    return { available: true };
  }
}

// Detectar errores de quota de almacenamiento
function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || 
           error.code === 22; // Legacy quota error code
  }
  // También verificar el mensaje de error
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
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // v4: Toast y log al montar para confirmar código actualizado
  useEffect(() => {
    console.log(`[DocumentUpload] ${VERSION} montado - tipoDocumento:`, tipoDocumento);
    toast.info(`DocumentUpload ${VERSION} cargado`, { duration: 3000 });
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    // v4: LOG INMEDIATO - antes de cualquier verificación
    console.log(`[DocumentUpload] ${VERSION} - onChange disparado:`, {
      hasTarget: !!e.target,
      hasFiles: !!e.target?.files,
      filesLength: e.target?.files?.length ?? 0,
      firstFile: e.target?.files?.[0] ? {
        name: e.target.files[0].name,
        size: e.target.files[0].size,
        type: e.target.files[0].type
      } : 'NO FILE'
    });

    const selectedFile = e.target.files?.[0];
    
    // v4: FEEDBACK VISUAL si no hay archivo (Android issue)
    if (!selectedFile) {
      console.warn(`[DocumentUpload] ${VERSION} - NO HAY ARCHIVO - Android issue detectado`);
      toast.error('No se recibió la foto', {
        description: 'Intenta tomar la foto de nuevo o reinicia la app',
        duration: 5000
      });
      return;
    }
    
    // v4: Toast de confirmación al recibir archivo
    toast.info(`Procesando: ${selectedFile.name}`, { duration: 2000 });

    // Limpiar preview anterior
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    setUploadStatus('idle');
    setErrorType(null);
    setErrorMessage(null);

    try {
      // 1. Verificar espacio disponible antes de procesar
      const { available, spaceLeft } = await checkStorageAvailable();
      if (!available) {
        console.warn('[DocumentUpload] Espacio insuficiente:', spaceLeft);
        setUploadStatus('error');
        setErrorType('storage_low');
        setErrorMessage(`Solo quedan ${((spaceLeft || 0) / 1024 / 1024).toFixed(1)}MB disponibles`);
        return;
      }

      // 2. Comprimir imagen si es necesario (>500KB)
      let fileToUse = selectedFile;
      
      if (selectedFile.type.startsWith('image/') && needsCompression(selectedFile)) {
        setIsCompressing(true);
        console.log(`[DocumentUpload] ${VERSION} - Comprimiendo imagen: ${(selectedFile.size / 1024).toFixed(0)}KB`);
        toast.info('Comprimiendo imagen...', { duration: 2000 });
        
        try {
          const { blob, compressionRatio } = await compressImage(selectedFile, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.7
          });
          
          fileToUse = new File([blob], selectedFile.name, { type: 'image/jpeg' });
          console.log(`[DocumentUpload] ${VERSION} - Compresión exitosa: ${compressionRatio.toFixed(0)}% reducción`);
          toast.success('Imagen comprimida ✓', { duration: 1500 });
        } catch (compressionError) {
          console.error(`[DocumentUpload] ${VERSION} - Error de compresión:`, compressionError);
          
          // Verificar si es timeout
          const errorMsg = compressionError instanceof Error ? compressionError.message : '';
          if (errorMsg.includes('Timeout')) {
            toast.warning('Compresión tardó mucho, usando original', { duration: 3000 });
            console.warn(`[DocumentUpload] ${VERSION} - Timeout, usando archivo original`);
            fileToUse = selectedFile;
          } else if (isQuotaError(compressionError)) {
            setUploadStatus('error');
            setErrorType('storage_low');
            setErrorMessage('No hay suficiente espacio para procesar la imagen');
            setIsCompressing(false);
            return;
          } else {
            // Si falla la compresión pero no es error de quota ni timeout, usar archivo original
            console.warn(`[DocumentUpload] ${VERSION} - Usando archivo original sin comprimir`);
            toast.warning('Usando foto original', { duration: 2000 });
            fileToUse = selectedFile;
          }
        }
        
        setIsCompressing(false);
      }

      // 3. Crear preview usando URL.createObjectURL (más eficiente que FileReader)
      const url = URL.createObjectURL(fileToUse);
      setFile(fileToUse);
      setPreview(url);
      
      console.log(`[DocumentUpload] ${VERSION} - Preview creado:`, url.substring(0, 50));
      toast.success('Foto lista ✓', { duration: 2000 });
      
    } catch (error) {
      console.error('[DocumentUpload] Error procesando archivo:', error);
      setIsCompressing(false);
      
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
    
    // Resetear input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
  }, [preview]);

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
    
    // Si el error era de almacenamiento, también limpiar el archivo
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
          onClick={() => fileInputRef.current?.click()}
        >
          Actualizar documento
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
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
      {/* v4: Badge de versión visible para confirmar código actualizado */}
      <div className="absolute -top-2 right-0 bg-primary/10 px-2 py-0.5 rounded text-xs font-mono text-primary">
        {VERSION}
      </div>
      
      {/* Área de captura de foto */}
      <div className="space-y-2">
        <Label>Foto del documento</Label>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploadStatus === 'uploading' || isCompressing}
        />
        
        {preview ? (
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img 
                src={preview} 
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            {(uploadStatus === 'uploading' || isCompressing) && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm font-medium">
                    {isCompressing ? 'Comprimiendo...' : 'Subiendo...'}
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadStatus === 'uploading' || isCompressing}
            >
              <Camera className="w-4 h-4 mr-1" />
              Cambiar
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-3 bg-muted/50 hover:bg-muted transition-colors"
            disabled={uploadStatus === 'uploading' || isCompressing}
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="font-medium">Procesando imagen...</p>
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
          disabled={uploadStatus === 'uploading' || isCompressing}
        />
        <p className="text-xs text-muted-foreground">
          Indica la fecha de vencimiento del documento
        </p>
      </div>

      {/* Botón de subir */}
      <Button
        onClick={handleSubmit}
        disabled={!file || !fechaVigencia || uploadStatus === 'uploading' || isUploading || isCompressing}
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

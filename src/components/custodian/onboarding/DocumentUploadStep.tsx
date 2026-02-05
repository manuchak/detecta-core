/**
 * Componente de paso individual para subir un documento
 * Incluye captura de foto y fecha de vigencia
 */
import { useState, useRef } from 'react';
import { Camera, Calendar, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DocumentoCustodio, TipoDocumentoCustodio } from '@/types/checklist';

interface DocumentUploadStepProps {
  tipoDocumento: TipoDocumentoCustodio;
  existingDocument?: DocumentoCustodio;
  onUpload: (file: File, fechaVigencia: string) => Promise<void>;
  isUploading: boolean;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isExpired = existingDocument 
    ? new Date(existingDocument.fecha_vigencia) < new Date()
    : false;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file || !fechaVigencia) return;
    
    await onUpload(file, fechaVigencia);
    
    // Limpiar estado después de subir
    setFile(null);
    setPreview(null);
    setFechaVigencia('');
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

  return (
    <div className="space-y-4">
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
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2"
              onClick={() => fileInputRef.current?.click()}
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
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Tomar foto</p>
              <p className="text-sm text-muted-foreground">
                Usa la cámara trasera para mejor calidad
              </p>
            </div>
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
        />
        <p className="text-xs text-muted-foreground">
          Indica la fecha de vencimiento del documento
        </p>
      </div>

      {/* Botón de subir */}
      <Button
        onClick={handleSubmit}
        disabled={!file || !fechaVigencia || isUploading}
        className="w-full"
        size="lg"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
            Subiendo...
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

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileImage, Loader2 } from 'lucide-react';
import { useUploadDocumento, useProcesarOCR, DOCUMENTO_LABELS, TipoDocumento } from '@/hooks/useDocumentosCandidato';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidatoId: string;
  candidatoNombre: string;
  tipoDocumento: TipoDocumento;
  onSuccess: () => void;
}

export function DocumentUploadDialog({ 
  open, 
  onOpenChange, 
  candidatoId, 
  candidatoNombre,
  tipoDocumento,
  onSuccess 
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [procesarOcrAuto, setProcesarOcrAuto] = useState(true);

  const uploadDocumento = useUploadDocumento();
  const procesarOCR = useProcesarOCR();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Preview para imágenes
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (droppedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(droppedFile);
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!file) return;

    try {
      const documento = await uploadDocumento.mutateAsync({
        candidatoId,
        tipoDocumento,
        file,
        nombreEsperado: candidatoNombre
      });

      // Procesar OCR automáticamente si está habilitado
      if (procesarOcrAuto && documento && file.type.startsWith('image/')) {
        await procesarOCR.mutateAsync({
          documentoId: documento.id,
          imagenUrl: documento.archivo_url
        });
      }

      setFile(null);
      setPreview(null);
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const isLoading = uploadDocumento.isPending || procesarOCR.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir {DOCUMENTO_LABELS[tipoDocumento]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            {preview ? (
              <div className="space-y-2">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="max-h-48 mx-auto rounded-md"
                />
                <p className="text-sm text-muted-foreground">{file?.name}</p>
              </div>
            ) : file ? (
              <div className="space-y-2">
                <FileImage className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arrastra un archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos: JPG, PNG, WebP, PDF (máx 10MB)
                </p>
              </>
            )}
            <input
              id="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ocr-auto"
              checked={procesarOcrAuto}
              onChange={(e) => setProcesarOcrAuto(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="ocr-auto" className="text-sm cursor-pointer">
              Procesar OCR automáticamente
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!file || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {procesarOCR.isPending ? 'Procesando OCR...' : 'Subiendo...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

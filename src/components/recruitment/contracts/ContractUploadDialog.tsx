import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, Image, X } from 'lucide-react';
import { useSubirContratoFisico, CONTRATO_LABELS, TipoContrato } from '@/hooks/useContratosCandidato';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidatoId: string;
  tipoContrato: TipoContrato;
  onSuccess: () => void;
}

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png';
const MAX_SIZE_MB = 20;

export function ContractUploadDialog({ open, onOpenChange, candidatoId, tipoContrato, onSuccess }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subirContrato = useSubirContratoFisico();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`El archivo excede el límite de ${MAX_SIZE_MB}MB`);
      return;
    }

    setArchivo(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleRemove = () => {
    setArchivo(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!archivo) return;

    await subirContrato.mutateAsync({
      candidatoId,
      tipoContrato,
      archivo
    });

    handleRemove();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleRemove(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir {CONTRATO_LABELS[tipoContrato]} Firmado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Sube el documento firmado físicamente (escaneado o foto). El contrato se marcará automáticamente como firmado.
            </p>
          </div>

          {!archivo ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">PDF, JPG o PNG (máx. {MAX_SIZE_MB}MB)</span>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {archivo.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm truncate">{archivo.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(archivo.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleRemove}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {preview && (
                <img src={preview} alt="Preview" className="w-full max-h-48 object-contain rounded" />
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={subirContrato.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!archivo || subirContrato.isPending}>
              {subirContrato.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Contrato Firmado
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

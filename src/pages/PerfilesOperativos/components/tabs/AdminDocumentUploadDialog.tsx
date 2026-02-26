import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { useCustodianDocuments } from '@/hooks/useCustodianDocuments';
import { useQueryClient } from '@tanstack/react-query';
import type { TipoDocumentoCustodio } from '@/types/checklist';

const TIPOS_DOCUMENTO: { value: TipoDocumentoCustodio; label: string }[] = [
  { value: 'tarjeta_circulacion', label: 'Tarjeta de Circulación' },
  { value: 'poliza_seguro', label: 'Póliza de Seguro' },
  { value: 'verificacion_vehicular', label: 'Verificación Vehicular' },
  { value: 'licencia_conducir', label: 'Licencia de Conducir' },
  { value: 'credencial_custodia', label: 'Credencial de Custodia' },
  { value: 'portacion_arma', label: 'Licencia de Portación de Arma' },
  { value: 'registro_arma', label: 'Registro del Arma' },
];

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface AdminDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telefono: string;
}

export function AdminDocumentUploadDialog({
  open,
  onOpenChange,
  telefono,
}: AdminDocumentUploadDialogProps) {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoCustodio | ''>('');
  const [fechaVigencia, setFechaVigencia] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { updateDocument } = useCustodianDocuments(telefono);
  const queryClient = useQueryClient();

  const isPdf = file?.type === 'application/pdf';
  const isUploading = updateDocument.isPending;
  const canSubmit = !!tipoDocumento && !!fechaVigencia && !!file && !isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      return;
    }

    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setTipoDocumento('');
    setFechaVigencia('');
    setNumeroDocumento('');
    clearFile();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !tipoDocumento) return;

    await updateDocument.mutateAsync({
      tipoDocumento: tipoDocumento as TipoDocumentoCustodio,
      file: file!,
      fechaVigencia,
      numeroDocumento: numeroDocumento || undefined,
    });

    // Also invalidate the profile-level query used by DocumentacionTab
    queryClient.invalidateQueries({ queryKey: ['custodian-docs-profile'] });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Documento</DialogTitle>
          <DialogDescription>
            Sube un documento digitalizado en nombre del custodio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tipo de documento */}
          <div className="space-y-2">
            <Label>Tipo de documento *</Label>
            <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumentoCustodio)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOCUMENTO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha de vigencia */}
          <div className="space-y-2">
            <Label>Fecha de vigencia *</Label>
            <Input
              type="date"
              value={fechaVigencia}
              onChange={(e) => setFechaVigencia(e.target.value)}
            />
          </div>

          {/* Número de documento */}
          <div className="space-y-2">
            <Label>Número de documento (opcional)</Label>
            <Input
              placeholder="Ej. ABC-12345"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
            />
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label>Archivo *</Label>
            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Click para seleccionar archivo</span>
                <span className="text-xs">PDF, JPG, PNG, WebP — máx 20MB</span>
              </button>
            ) : (
              <div className="relative border rounded-lg p-3 flex items-center gap-3">
                {isPdf ? (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <FileText className="h-8 w-8 text-destructive" />
                  </div>
                ) : preview ? (
                  <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                ) : null}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                Subir Documento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

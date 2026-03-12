import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Camera, Upload, Loader2, X } from 'lucide-react';
import { useCreateCustodianExpense, TIPOS_APOYO_CUSTODIO } from '@/hooks/useCustodianExpenses';
import { useCustodianProfile } from '@/hooks/useCustodianProfile';

const MAX_PHOTOS = 3;

interface PhotoPreview {
  file: File;
  url: string;
}

const CreateExpenseForm = () => {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [monto, setMonto] = useState('');
  const [folio, setFolio] = useState('');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const createExpense = useCreateCustodianExpense();
  const { profile } = useCustodianProfile();

  const resetForm = () => {
    setTipo('');
    setMotivo('');
    setMonto('');
    setFolio('');
    photos.forEach(p => URL.revokeObjectURL(p.url));
    setPhotos([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const newPhotos: PhotoPreview[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      newPhotos.push({ file: files[i], url: URL.createObjectURL(files[i]) });
    }
    setPhotos(prev => [...prev, ...newPhotos]);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].url);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!tipo || !motivo || !monto || !folio.trim()) return;

    const result = await createExpense.mutateAsync({
      tipo_apoyo: tipo,
      motivo,
      monto_solicitado: parseFloat(monto),
      urgencia: 'normal',
      custodio_nombre: profile?.display_name || undefined,
      notas: folio.trim(),
      archivos: photos.length > 0 ? photos.map(p => p.file) : undefined,
    }).catch(() => null);

    // Only close if successful (folio duplicado keeps form open)
    if (result) {
      resetForm();
      setOpen(false);
    }
  };

  const isValid = tipo && motivo.trim() && monto && parseFloat(monto) > 0 && folio.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Apoyo Extraordinario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo de Gasto *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_APOYO_CUSTODIO.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <Label>Monto (MXN) *</Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <Label>Descripción / Motivo *</Label>
            <Textarea
              placeholder="Describe el gasto y por qué fue necesario..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>

          {/* Número de Folio */}
          <div className="space-y-1.5">
            <Label>Número de Folio *</Label>
            <Input
              placeholder="Ej. FOL-2026-001"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Fotos */}
          <div className="space-y-1.5">
            <Label>Comprobantes ({photos.length}/{MAX_PHOTOS})</Label>
            
            {/* Photo grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                    <img src={photo.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-0.5"
                      onClick={() => removePhoto(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add photo buttons */}
            {photos.length < MAX_PHOTOS && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Cámara
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Galería
                </Button>
              </div>
            )}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            disabled={!isValid || createExpense.isPending}
            onClick={handleSubmit}
          >
            {createExpense.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
            ) : (
              'Enviar Solicitud'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExpenseForm;

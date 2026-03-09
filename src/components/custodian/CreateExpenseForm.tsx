import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Camera, Upload, Loader2 } from 'lucide-react';
import { useCreateCustodianExpense, TIPOS_APOYO_CUSTODIO } from '@/hooks/useCustodianExpenses';
import { useCustodianProfile } from '@/hooks/useCustodianProfile';

const CreateExpenseForm = () => {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [monto, setMonto] = useState('');
  const [urgencia, setUrgencia] = useState('normal');
  const [notas, setNotas] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const createExpense = useCreateCustodianExpense();
  const { profile } = useCustodianProfile();

  const resetForm = () => {
    setTipo('');
    setMotivo('');
    setMonto('');
    setUrgencia('normal');
    setNotas('');
    setArchivo(null);
    setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivo(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleSubmit = async () => {
    if (!tipo || !motivo || !monto) return;

    await createExpense.mutateAsync({
      tipo_apoyo: tipo,
      motivo,
      monto_solicitado: parseFloat(monto),
      urgencia,
      custodio_nombre: profile?.nombre || undefined,
      notas: notas || undefined,
      archivo: archivo || undefined,
    });

    resetForm();
    setOpen(false);
  };

  const isValid = tipo && motivo.trim() && monto && parseFloat(monto) > 0;

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

          {/* Urgencia */}
          <div className="space-y-1.5">
            <Label>Urgencia</Label>
            <Select value={urgencia} onValueChange={setUrgencia}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas adicionales</Label>
            <Input
              placeholder="Número de servicio, cliente, etc."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* Foto */}
          <div className="space-y-1.5">
            <Label>Comprobante (foto/imagen)</Label>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => { setArchivo(null); setPreview(null); }}
                >
                  Quitar
                </Button>
              </div>
            ) : (
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
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
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

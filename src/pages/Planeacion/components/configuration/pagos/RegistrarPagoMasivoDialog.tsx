import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MassivePaymentData, ProveedorPagoRecord } from '@/hooks/useProveedoresPagos';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RegistrarPagoMasivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicios: ProveedorPagoRecord[];
  onConfirm: (asignacionIds: string[], pagoData: MassivePaymentData) => Promise<void>;
}

export function RegistrarPagoMasivoDialog({ open, onOpenChange, servicios, onConfirm }: RegistrarPagoMasivoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MassivePaymentData>({
    fecha_pago: format(new Date(), 'yyyy-MM-dd'),
    metodo_pago: 'transferencia',
  });

  const totalAmount = servicios.reduce((sum, s) => sum + s.tarifa_acordada, 0);
  const asignacionIds = servicios.map(s => s.asignacion_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(asignacionIds, formData);
      onOpenChange(false);
      setFormData({
        fecha_pago: format(new Date(), 'yyyy-MM-dd'),
        metodo_pago: 'transferencia',
      });
    } catch (error) {
      console.error('Error registering bulk payments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (servicios.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Pagos Masivos</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Se registrarán <strong>{servicios.length} pagos</strong> por un total de{' '}
              <strong>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAmount)}</strong>
            </AlertDescription>
          </Alert>

          {/* Services List Preview */}
          <div className="bg-muted p-4 rounded-lg max-h-48 overflow-y-auto">
            <h4 className="text-sm font-medium mb-2">Servicios seleccionados:</h4>
            <div className="space-y-1">
              {servicios.map((servicio) => (
                <div key={servicio.id} className="text-sm flex justify-between">
                  <span className="text-muted-foreground">
                    {servicio.servicio_id} - {servicio.armado_nombre}
                  </span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: servicio.moneda }).format(servicio.tarifa_acordada)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_pago">Fecha de Pago *</Label>
              <Input
                id="fecha_pago"
                type="date"
                value={formData.fecha_pago}
                onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodo_pago">Método de Pago *</Label>
              <Select
                value={formData.metodo_pago}
                onValueChange={(value) => setFormData({ ...formData, metodo_pago: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="deposito">Depósito</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="referencia_bancaria">Referencia Bancaria</Label>
              <Input
                id="referencia_bancaria"
                value={formData.referencia_bancaria || ''}
                onChange={(e) => setFormData({ ...formData, referencia_bancaria: e.target.value })}
                placeholder="Número de confirmación o referencia (opcional)"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales sobre estos pagos"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : `Registrar ${servicios.length} Pagos`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

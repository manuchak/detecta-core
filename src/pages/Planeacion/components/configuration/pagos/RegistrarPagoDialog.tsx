import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CreatePagoData, ProveedorPagoRecord } from '@/hooks/useProveedoresPagos';
import { format } from 'date-fns';

interface RegistrarPagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicio: ProveedorPagoRecord | null;
  onConfirm: (pagoData: CreatePagoData) => Promise<void>;
}

export function RegistrarPagoDialog({ open, onOpenChange, servicio, onConfirm }: RegistrarPagoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatePagoData>>({
    fecha_pago: format(new Date(), 'yyyy-MM-dd'),
    metodo_pago: 'transferencia',
    moneda: 'MXN',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicio) return;

    setLoading(true);
    try {
      const pagoData: CreatePagoData = {
        asignacion_id: servicio.asignacion_id,
        proveedor_id: servicio.proveedor_id,
        servicio_custodia_id: servicio.servicio_id,
        monto_pagado: formData.monto_pagado || servicio.tarifa_acordada,
        moneda: formData.moneda || servicio.moneda,
        fecha_pago: formData.fecha_pago!,
        metodo_pago: formData.metodo_pago as any,
        numero_factura: formData.numero_factura,
        folio_comprobante: formData.folio_comprobante,
        referencia_bancaria: formData.referencia_bancaria,
        observaciones: formData.observaciones,
      };

      await onConfirm(pagoData);
      onOpenChange(false);
      setFormData({
        fecha_pago: format(new Date(), 'yyyy-MM-dd'),
        metodo_pago: 'transferencia',
        moneda: 'MXN',
      });
    } catch (error) {
      console.error('Error registering payment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!servicio) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Servicio:</span>
                <span className="ml-2 font-medium">{servicio.servicio_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Proveedor:</span>
                <span className="ml-2 font-medium">{servicio.proveedor_nombre}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Armado:</span>
                <span className="ml-2 font-medium">{servicio.armado_nombre}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tarifa Acordada:</span>
                <span className="ml-2 font-medium">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: servicio.moneda }).format(servicio.tarifa_acordada)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto_pagado">Monto Pagado *</Label>
              <Input
                id="monto_pagado"
                type="number"
                step="0.01"
                value={formData.monto_pagado || servicio.tarifa_acordada}
                onChange={(e) => setFormData({ ...formData, monto_pagado: parseFloat(e.target.value) })}
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={formData.moneda || 'MXN'}
                onValueChange={(value) => setFormData({ ...formData, moneda: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_factura">Número de Factura</Label>
              <Input
                id="numero_factura"
                value={formData.numero_factura || ''}
                onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folio_comprobante">Folio Comprobante</Label>
              <Input
                id="folio_comprobante"
                value={formData.folio_comprobante || ''}
                onChange={(e) => setFormData({ ...formData, folio_comprobante: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="referencia_bancaria">Referencia Bancaria</Label>
              <Input
                id="referencia_bancaria"
                value={formData.referencia_bancaria || ''}
                onChange={(e) => setFormData({ ...formData, referencia_bancaria: e.target.value })}
                placeholder="Número de confirmación o referencia"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales sobre el pago"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

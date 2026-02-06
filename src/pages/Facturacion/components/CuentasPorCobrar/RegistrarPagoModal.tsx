import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Building2, 
  Hash,
  Save,
  AlertCircle
} from 'lucide-react';
import { AgingData } from '../../hooks/useCuentasPorCobrar';
import { useFacturasPendientes, FacturaCliente } from '../../hooks/useFacturasCliente';
import { useCreatePago, FORMAS_PAGO, BANCOS } from '../../hooks/usePagos';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { formatCurrency } from '@/utils/formatUtils';
import { format } from 'date-fns';

interface RegistrarPagoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: AgingData | null;
  facturaPreseleccionada?: FacturaCliente | null;
}

interface AplicacionFactura {
  factura_id: string;
  numero_factura: string;
  saldo_pendiente: number;
  monto_aplicado: number;
  selected: boolean;
}

export function RegistrarPagoModal({
  open,
  onOpenChange,
  cliente,
  facturaPreseleccionada,
}: RegistrarPagoModalProps) {
  const { data: facturasPendientes = [], isLoading: loadingFacturas } = useFacturasPendientes(cliente?.cliente_id);
  const createPago = useCreatePago();

  // Standard persistence for payment form
  const persistence = useFormPersistence<{
    monto: string;
    forma_pago: string;
    referencia_bancaria: string;
    banco: string;
    fecha_pago: string;
    fecha_deposito: string;
    notas: string;
  }>({
    key: `registrar_pago_${cliente?.cliente_id || 'new'}`,
    initialData: {
      monto: '',
      forma_pago: 'transferencia',
      referencia_bancaria: '',
      banco: '',
      fecha_pago: format(new Date(), 'yyyy-MM-dd'),
      fecha_deposito: '',
      notas: '',
    },
    level: 'standard',
    isMeaningful: (data) => !!(data.monto || data.referencia_bancaria || data.notas),
  });

  const [formData, setFormData] = useState(persistence.data);
  const [aplicaciones, setAplicaciones] = useState<AplicacionFactura[]>([]);
  const [autoDistribuir, setAutoDistribuir] = useState(true);

  // Sync form data to persistence
  useEffect(() => {
    persistence.updateData(formData);
  }, [formData]);

  // Initialize aplicaciones when facturas load
  useEffect(() => {
    if (facturasPendientes.length > 0) {
      const newAplicaciones = facturasPendientes.map(f => ({
        factura_id: f.id,
        numero_factura: f.numero_factura,
        saldo_pendiente: f.saldo_pendiente || 0,
        monto_aplicado: 0,
        selected: facturaPreseleccionada?.id === f.id,
      }));
      setAplicaciones(newAplicaciones);

      // If there's a preselected factura, set its amount
      if (facturaPreseleccionada) {
        const factura = newAplicaciones.find(a => a.factura_id === facturaPreseleccionada.id);
        if (factura) {
          setFormData(prev => ({
            ...prev,
            monto: String(factura.saldo_pendiente),
          }));
        }
      }
    }
  }, [facturasPendientes, facturaPreseleccionada]);

  // Auto-distribute payment amount
  useEffect(() => {
    if (!autoDistribuir) return;

    const montoTotal = parseFloat(formData.monto) || 0;
    let remaining = montoTotal;

    const newAplicaciones = aplicaciones.map(a => {
      if (a.selected && remaining > 0) {
        const aplicar = Math.min(a.saldo_pendiente, remaining);
        remaining -= aplicar;
        return { ...a, monto_aplicado: aplicar };
      }
      return { ...a, monto_aplicado: 0 };
    });

    setAplicaciones(newAplicaciones);
  }, [formData.monto, autoDistribuir]);

  const handleToggleFactura = (facturaId: string) => {
    setAplicaciones(prev => 
      prev.map(a => 
        a.factura_id === facturaId 
          ? { ...a, selected: !a.selected, monto_aplicado: 0 }
          : a
      )
    );
  };

  const handleMontoAplicadoChange = (facturaId: string, value: string) => {
    const monto = parseFloat(value) || 0;
    setAplicaciones(prev =>
      prev.map(a =>
        a.factura_id === facturaId
          ? { ...a, monto_aplicado: Math.min(monto, a.saldo_pendiente) }
          : a
      )
    );
    setAutoDistribuir(false);
  };

  const totalAplicado = aplicaciones.reduce((sum, a) => sum + (a.selected ? a.monto_aplicado : 0), 0);
  const montoTotal = parseFloat(formData.monto) || 0;
  const diferencia = montoTotal - totalAplicado;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    const aplicacionesValidas = aplicaciones
      .filter(a => a.selected && a.monto_aplicado > 0)
      .map(a => ({
        factura_id: a.factura_id,
        monto_aplicado: a.monto_aplicado,
      }));

    await createPago.mutateAsync({
      cliente_id: cliente.cliente_id,
      monto: montoTotal,
      forma_pago: formData.forma_pago,
      referencia_bancaria: formData.referencia_bancaria || undefined,
      banco: formData.banco || undefined,
      fecha_pago: formData.fecha_pago,
      fecha_deposito: formData.fecha_deposito || undefined,
      notas: formData.notas || undefined,
      aplicaciones: aplicacionesValidas.length > 0 ? aplicacionesValidas : undefined,
    });

    // Clear persistence and reset
    persistence.clearDraft(true);
    setFormData({
      monto: '',
      forma_pago: 'transferencia',
      referencia_bancaria: '',
      banco: '',
      fecha_pago: format(new Date(), 'yyyy-MM-dd'),
      fecha_deposito: '',
      notas: '',
    });
    onOpenChange(false);
  };

  const canSubmit = montoTotal > 0 && formData.fecha_pago && Math.abs(diferencia) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Registrar Pago
          </DialogTitle>
          <DialogDescription>
            {cliente?.cliente_nombre} - Saldo pendiente: {formatCurrency(cliente?.saldo_pendiente || 0)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Monto del Pago *
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) => {
                  setFormData({ ...formData, monto: e.target.value });
                  setAutoDistribuir(true);
                }}
                required
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Fecha de Pago *
              </Label>
              <Input
                type="date"
                value={formData.fecha_pago}
                onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-b">
            <div className="space-y-2">
              <Label>Forma de Pago</Label>
              <Select
                value={formData.forma_pago}
                onValueChange={(value) => setFormData({ ...formData, forma_pago: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGO.map((fp) => (
                    <SelectItem key={fp.value} value={fp.value}>
                      {fp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Banco
              </Label>
              <Select
                value={formData.banco}
                onValueChange={(value) => setFormData({ ...formData, banco: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent>
                  {BANCOS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-b">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                Referencia Bancaria
              </Label>
              <Input
                placeholder="Número de transferencia, cheque, etc."
                value={formData.referencia_bancaria}
                onChange={(e) => setFormData({ ...formData, referencia_bancaria: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Depósito</Label>
              <Input
                type="date"
                value={formData.fecha_deposito}
                onChange={(e) => setFormData({ ...formData, fecha_deposito: e.target.value })}
              />
            </div>
          </div>

          {/* Apply to Facturas */}
          <div className="flex-1 overflow-hidden py-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Aplicar a Facturas</Label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  Aplicado: <span className="font-bold text-foreground">{formatCurrency(totalAplicado)}</span>
                </span>
                {diferencia !== 0 && Math.abs(diferencia) >= 0.01 && (
                  <span className={diferencia > 0 ? 'text-amber-600' : 'text-red-600'}>
                    {diferencia > 0 ? `+${formatCurrency(diferencia)} sin aplicar` : `${formatCurrency(diferencia)} excedido`}
                  </span>
                )}
              </div>
            </div>

            <ScrollArea className="h-[200px] border rounded-lg">
              {loadingFacturas ? (
                <div className="p-4 text-center text-muted-foreground">Cargando facturas...</div>
              ) : facturasPendientes.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No hay facturas pendientes para este cliente
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {aplicaciones.map((ap) => (
                    <div
                      key={ap.factura_id}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                        ap.selected ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                      }`}
                    >
                      <Checkbox
                        checked={ap.selected}
                        onCheckedChange={() => handleToggleFactura(ap.factura_id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ap.numero_factura}</p>
                        <p className="text-xs text-muted-foreground">
                          Saldo: {formatCurrency(ap.saldo_pendiente)}
                        </p>
                      </div>
                      {ap.selected && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Aplicar:</span>
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28 h-8 text-right text-sm"
                            value={ap.monto_aplicado || ''}
                            onChange={(e) => handleMontoAplicadoChange(ap.factura_id, e.target.value)}
                            max={ap.saldo_pendiente}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Notes */}
          <div className="space-y-2 py-4 border-t">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones adicionales..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
            />
          </div>

          {/* Validation Message */}
          {montoTotal > 0 && Math.abs(diferencia) >= 0.01 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>
                {diferencia > 0 
                  ? 'El monto del pago debe estar completamente aplicado a facturas'
                  : 'El monto aplicado excede el pago total'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!canSubmit || createPago.isPending}
            >
              <Save className="h-4 w-4 mr-1.5" />
              {createPago.isPending ? 'Guardando...' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

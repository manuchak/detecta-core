import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreatePagoData, ProveedorPagoRecord } from '@/hooks/useProveedoresPagos';
import { PaymentCalculationResult, formatCurrency } from '@/utils/paymentCalculations';
import { format } from 'date-fns';
import { Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegistrarPagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicio: ProveedorPagoRecord | null;
  onConfirm: (pagoData: CreatePagoData) => Promise<void>;
  calcularMontoAutomatico?: (asignacionId: string) => Promise<PaymentCalculationResult | null>;
}

export function RegistrarPagoDialog({ open, onOpenChange, servicio, onConfirm, calcularMontoAutomatico }: RegistrarPagoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [calculoAutomatico, setCalculoAutomatico] = useState<PaymentCalculationResult | null>(null);
  const [usarCalculoAutomatico, setUsarCalculoAutomatico] = useState(true);
  const [loadingCalculo, setLoadingCalculo] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatePagoData>>({
    fecha_pago: format(new Date(), 'yyyy-MM-dd'),
    metodo_pago: 'transferencia',
    moneda: 'MXN',
  });

  useEffect(() => {
    if (servicio && open && calcularMontoAutomatico) {
      setLoadingCalculo(true);
      calcularMontoAutomatico(servicio.asignacion_id)
        .then((result) => {
          setCalculoAutomatico(result);
          setUsarCalculoAutomatico(true);
        })
        .finally(() => setLoadingCalculo(false));
    } else {
      setCalculoAutomatico(null);
    }
  }, [servicio, open, calcularMontoAutomatico]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicio) return;

    setLoading(true);
    try {
      const montoFinal = usarCalculoAutomatico && calculoAutomatico
        ? calculoAutomatico.monto_calculado
        : (formData.monto_pagado || servicio.tarifa_acordada);

      const pagoData: CreatePagoData = {
        asignacion_id: servicio.asignacion_id,
        proveedor_id: servicio.proveedor_id,
        servicio_custodia_id: servicio.servicio_id,
        monto_pagado: montoFinal,
        moneda: formData.moneda || servicio.moneda,
        fecha_pago: formData.fecha_pago!,
        metodo_pago: formData.metodo_pago as any,
        numero_factura: formData.numero_factura,
        folio_comprobante: formData.folio_comprobante,
        referencia_bancaria: formData.referencia_bancaria,
        observaciones: formData.observaciones,
        ...(usarCalculoAutomatico && calculoAutomatico && {
          desglose_calculo: calculoAutomatico.desglose,
          esquema_pago_id: calculoAutomatico.desglose.esquema_id,
        }),
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

          {/* Automatic Calculation Display */}
          {loadingCalculo && (
            <Alert>
              <Calculator className="h-4 w-4 animate-pulse" />
              <AlertTitle>Calculando monto...</AlertTitle>
              <AlertDescription>Obteniendo datos del servicio para cálculo automático</AlertDescription>
            </Alert>
          )}

          {calculoAutomatico && !loadingCalculo && (
            <Alert className={calculoAutomatico.requiere_validacion_manual ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : 'border-green-500 bg-green-50 dark:bg-green-950'}>
              <Calculator className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>Cálculo Automático</span>
                {!calculoAutomatico.requiere_validacion_manual && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-3 mt-2">
                  <div className="flex justify-between items-center font-medium text-base">
                    <span>Monto Calculado:</span>
                    <span className="text-lg font-bold">{formatCurrency(calculoAutomatico.monto_calculado)}</span>
                  </div>

                  {/* Breakdown for Internal Custodians (Per KM) */}
                  {calculoAutomatico.desglose.breakdown && (
                    <div className="text-xs space-y-2 mt-3 p-3 bg-background/50 rounded border">
                      <p className="font-medium text-sm mb-2">
                        📏 {calculoAutomatico.desglose.tipo_esquema}
                      </p>
                      <div className="text-muted-foreground mb-2">
                        Fuente: <span className="font-mono">{calculoAutomatico.desglose.fuente_datos}</span>
                      </div>
                      <div className="font-medium">
                        Total: {calculoAutomatico.desglose.distancia_km} km recorridos
                      </div>
                      <div className="space-y-1 mt-2">
                        {calculoAutomatico.desglose.breakdown.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span>{item.rango}: {item.km_aplicados} km × {formatCurrency(item.tarifa_por_km)}/km</span>
                            <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t text-muted-foreground">
                        Tarifa promedio: {formatCurrency(calculoAutomatico.desglose.tarifa_promedio_km)}/km
                      </div>
                    </div>
                  )}

                  {/* Breakdown for External Providers (Fixed Time) */}
                  {calculoAutomatico.desglose.horas_trabajadas !== undefined && (
                    <div className="text-xs space-y-2 mt-3 p-3 bg-background/50 rounded border">
                      <p className="font-medium text-sm mb-2">
                        ⏱️ {calculoAutomatico.desglose.tipo_esquema}
                      </p>
                      <div className="text-muted-foreground mb-2">
                        Fuente: <span className="font-mono">{calculoAutomatico.desglose.fuente_datos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarifa Base ({calculoAutomatico.desglose.horas_incluidas}h incluidas):</span>
                        <span className="font-medium">{formatCurrency(calculoAutomatico.desglose.tarifa_base)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Horas trabajadas:</span>
                        <span className="font-medium">{calculoAutomatico.desglose.horas_trabajadas}h</span>
                      </div>
                      {calculoAutomatico.desglose.horas_extra > 0 && (
                        <div className="flex justify-between text-orange-600 dark:text-orange-400">
                          <span>Horas Extra ({calculoAutomatico.desglose.horas_extra}h):</span>
                          <span className="font-medium">+{formatCurrency(calculoAutomatico.desglose.monto_horas_extra)}</span>
                        </div>
                      )}
                      {calculoAutomatico.desglose.viaticos_aplicados && (
                        <div className="flex justify-between text-blue-600 dark:text-blue-400">
                          <span>Viáticos (servicio foráneo):</span>
                          <span className="font-medium">+{formatCurrency(calculoAutomatico.desglose.monto_viaticos)}</span>
                        </div>
                      )}
                      {calculoAutomatico.desglose.km_recorridos > 0 && (
                        <div className="mt-2 pt-2 border-t text-muted-foreground">
                          Km recorridos: {calculoAutomatico.desglose.km_recorridos} km
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warnings */}
                  {calculoAutomatico.warnings.length > 0 && (
                    <div className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded mt-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        {calculoAutomatico.warnings.map((warn, idx) => (
                          <p key={idx}>{warn}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                    <Checkbox
                      id="usar-calculo"
                      checked={usarCalculoAutomatico}
                      onCheckedChange={(checked) => setUsarCalculoAutomatico(checked as boolean)}
                    />
                    <label htmlFor="usar-calculo" className="text-sm font-medium cursor-pointer">
                      Usar este monto calculado
                    </label>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto_pagado">Monto Pagado *</Label>
              <Input
                id="monto_pagado"
                type="number"
                step="0.01"
                value={
                  usarCalculoAutomatico && calculoAutomatico
                    ? calculoAutomatico.monto_calculado
                    : formData.monto_pagado || servicio.tarifa_acordada
                }
                onChange={(e) => {
                  setUsarCalculoAutomatico(false);
                  setFormData({ ...formData, monto_pagado: parseFloat(e.target.value) });
                }}
                disabled={usarCalculoAutomatico && !!calculoAutomatico}
                className={usarCalculoAutomatico && calculoAutomatico ? 'bg-green-50 dark:bg-green-950 font-medium' : ''}
                required
              />
              {usarCalculoAutomatico && calculoAutomatico && (
                <p className="text-xs text-muted-foreground">
                  Monto calculado automáticamente. Desmarque la opción para editar.
                </p>
              )}
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

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Receipt,
  Building2,
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
  Truck,
  Clock,
  Fuel,
  DollarSign,
  Info,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { formatCurrency } from '@/utils/formatUtils';
import { calcularFechaVencimientoReal, VencimientoResult } from '@/utils/calcularVencimiento';
import { ClienteConServiciosPendientes } from '../../hooks/useServiciosPorFacturar';
import { useGenerarFactura } from '../../hooks/useGenerarFactura';
import { useClientesFiscales } from '../../hooks/useClientesFiscales';
import { usePreFacturaInteligente, ConceptoFacturable } from '../../hooks/usePreFacturaInteligente';

interface GenerarFacturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClienteConServiciosPendientes | null;
  onSuccess: () => void;
}

const IVA_RATE = 0.16;
const DEFAULT_DIAS_CREDITO = 30;

const USOS_CFDI = [
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
  { value: 'P01', label: 'P01 - Por definir' },
];

const FORMAS_PAGO = [
  { value: '99', label: '99 - Por definir' },
  { value: '03', label: '03 - Transferencia electrónica' },
  { value: '01', label: '01 - Efectivo' },
];

const METODOS_PAGO = [
  { value: 'PPD', label: 'PPD - Pago en parcialidades o diferido' },
  { value: 'PUE', label: 'PUE - Pago en una sola exhibición' },
];

const CONCEPTO_ICONS: Record<string, React.ReactNode> = {
  custodia: <Truck className="h-3.5 w-3.5" />,
  casetas: <Fuel className="h-3.5 w-3.5" />,
  estadia: <Clock className="h-3.5 w-3.5" />,
  pernocta: <Clock className="h-3.5 w-3.5" />,
  gasto_extra: <DollarSign className="h-3.5 w-3.5" />,
};

const CONCEPTO_LABELS: Record<string, string> = {
  custodia: 'Custodia',
  casetas: 'Casetas',
  estadia: 'Estadías',
  pernocta: 'Pernoctas',
  gasto_extra: 'Extras',
};

export function GenerarFacturaModal({
  open,
  onOpenChange,
  cliente,
  onSuccess,
}: GenerarFacturaModalProps) {
  const { mutate: generarFactura, isPending } = useGenerarFactura();
  const { data: clientesFiscales = [] } = useClientesFiscales();

  // Pre-factura inteligente
  const { data: preFactura, isLoading: isLoadingPre } = usePreFacturaInteligente(
    cliente?.serviciosDetalle || [],
    cliente?.cliente || '',
    open && !!cliente
  );

  // Editable overrides
  const [excludedConceptos, setExcludedConceptos] = useState<Set<string>>(new Set());
  const [editedImportes, setEditedImportes] = useState<Record<string, number>>({});

  // Form state
  const [clienteRfc, setClienteRfc] = useState('XAXX010101000');
  const [clienteEmail, setClienteEmail] = useState('');
  const [fechaEmision, setFechaEmision] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [diasCredito, setDiasCredito] = useState(DEFAULT_DIAS_CREDITO);
  const [usoCfdi, setUsoCfdi] = useState('G03');
  const [formaPago, setFormaPago] = useState('99');
  const [metodoPago, setMetodoPago] = useState('PPD');
  const [notas, setNotas] = useState('');
  const [tipoFactura, setTipoFactura] = useState<'inmediata' | 'corte'>('corte');
  const [ordenCompra, setOrdenCompra] = useState('');
  const [vencimientoOverride, setVencimientoOverride] = useState<string | null>(null);
  const [vencimientoCalc, setVencimientoCalc] = useState<VencimientoResult | null>(null);

  // Reset edits when modal opens
  useEffect(() => {
    if (open && cliente) {
      const fiscal = clientesFiscales.find(
        c => c.nombre.toLowerCase() === cliente.cliente.toLowerCase()
      );

      setFechaEmision(format(new Date(), 'yyyy-MM-dd'));
      setClienteRfc(fiscal?.rfc || 'XAXX010101000');
      setClienteEmail(fiscal?.contacto_facturacion_email || '');
      setDiasCredito(fiscal?.dias_credito || DEFAULT_DIAS_CREDITO);
      setUsoCfdi(fiscal?.uso_cfdi_default || 'G03');
      setTipoFactura((fiscal?.tipo_facturacion as 'inmediata' | 'corte') || 'corte');
      setFormaPago('99');
      setMetodoPago('PPD');
      setNotas('');
      setOrdenCompra('');
      setExcludedConceptos(new Set());
      setEditedImportes({});
      setVencimientoOverride(null);

      // Calcular vencimiento real usando ciclo fiscal del cliente
      if (fiscal) {
        const calc = calcularFechaVencimientoReal(new Date(), {
          dias_credito: fiscal.dias_credito,
          dia_corte: fiscal.dia_corte,
          dia_pago: fiscal.dia_pago,
        });
        setVencimientoCalc(calc);
      } else {
        setVencimientoCalc(null);
      }
    }
  }, [open, cliente, clientesFiscales]);

  if (!cliente) return null;

  // Flatten all concepts for the table
  const allConceptos: (ConceptoFacturable & { key: string })[] = [];
  if (preFactura) {
    preFactura.lineas.forEach((linea, li) => {
      linea.conceptos.forEach((c, ci) => {
        allConceptos.push({ ...c, key: `${li}-${ci}` });
      });
    });
  }

  // Calculate totals with edits/exclusions
  const getImporte = (c: ConceptoFacturable & { key: string }) => {
    if (excludedConceptos.has(c.key)) return 0;
    return editedImportes[c.key] ?? c.importe;
  };

  const subtotal = allConceptos.reduce((sum, c) => sum + getImporte(c), 0);
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;
  const fechaVencimiento = format(
    addDays(new Date(fechaEmision), diasCredito),
    'yyyy-MM-dd'
  );

  // Summary by type
  const summaryByType = (tipo: string) =>
    allConceptos.filter(c => c.tipo === tipo).reduce((s, c) => s + getImporte(c), 0);

  const handleToggleConcepto = (key: string) => {
    setExcludedConceptos(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleEditImporte = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setEditedImportes(prev => ({ ...prev, [key]: num }));
    }
  };

  const handleSubmit = () => {
    generarFactura(
      {
        datosFactura: {
          numeroFactura: '',
          clienteNombre: cliente.cliente,
          clienteRfc,
          clienteEmail: clienteEmail || undefined,
          clienteId: cliente.clienteId || undefined,
          fechaEmision,
          fechaVencimiento,
          usoCfdi,
          formaPago,
          metodoPago,
          notas: notas || undefined,
          tipoFactura,
          ordenCompra: ordenCompra || undefined,
        },
        servicios: cliente.serviciosDetalle,
        conceptosExtra: allConceptos
          .filter(c => !excludedConceptos.has(c.key) && c.tipo !== 'custodia')
          .map(c => ({
            tipo: c.tipo,
            descripcion: c.descripcion,
            cantidad: c.cantidad,
            precioUnitario: c.precioUnitario,
            importe: editedImportes[c.key] ?? c.importe,
            servicioId: c.servicioId,
          })),
      },
      { onSuccess: () => onSuccess() }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Pre-Factura — {cliente.cliente}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <TooltipProvider>
            <div className="space-y-5 pr-4">
              {/* Pre-factura warning */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning-foreground">Pre-Factura (sin timbrado)</p>
                  <p className="text-muted-foreground">
                    Documento interno. Para CFDI se requiere integración con PAC.
                  </p>
                </div>
              </div>

              {/* Summary cards — by concept type */}
              {preFactura && !isLoadingPre && (
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { tipo: 'custodia', icon: <Truck className="h-4 w-4" />, count: preFactura.lineas.length },
                    { tipo: 'casetas', icon: <Fuel className="h-4 w-4" />, count: null },
                    { tipo: 'estadia', icon: <Clock className="h-4 w-4" />, count: preFactura.serviciosConEstadia },
                    { tipo: 'pernocta', icon: <Clock className="h-4 w-4" />, count: preFactura.serviciosConPernocta },
                    { tipo: 'gasto_extra', icon: <DollarSign className="h-4 w-4" />, count: null },
                  ].map(({ tipo, icon, count }) => {
                    const amount = summaryByType(tipo);
                    return (
                      <div key={tipo} className="p-2.5 rounded-lg border bg-background text-center space-y-0.5">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          {icon}
                          <span className="text-[11px]">{CONCEPTO_LABELS[tipo]}</span>
                        </div>
                        <div className="text-sm font-semibold">
                          {amount > 0 ? formatCurrency(amount) : '—'}
                        </div>
                        {count !== null && count > 0 && (
                          <div className="text-[10px] text-muted-foreground">{count} svcs</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Client & billing data — compact 2-column */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="space-y-3">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Datos del Cliente
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">RFC</Label>
                      <Input
                        value={clienteRfc}
                        onChange={(e) => setClienteRfc(e.target.value.toUpperCase())}
                        className="mt-0.5 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={clienteEmail}
                        onChange={(e) => setClienteEmail(e.target.value)}
                        placeholder="facturacion@..."
                        className="mt-0.5 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select value={tipoFactura} onValueChange={(v) => setTipoFactura(v as any)}>
                        <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inmediata">Inmediata</SelectItem>
                          <SelectItem value="corte">Corte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">OC</Label>
                      <Input
                        value={ordenCompra}
                        onChange={(e) => setOrdenCompra(e.target.value)}
                        placeholder="OC-2026-001"
                        className="mt-0.5 h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Datos Fiscales
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Emisión</Label>
                      <Input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} className="mt-0.5 h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Crédito</Label>
                      <Input type="number" value={diasCredito} onChange={(e) => setDiasCredito(parseInt(e.target.value) || 0)} min={0} max={180} className="mt-0.5 h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Vencimiento</Label>
                      <Input value={fechaVencimiento} disabled className="mt-0.5 h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Uso CFDI</Label>
                      <Select value={usoCfdi} onValueChange={setUsoCfdi}>
                        <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {USOS_CFDI.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Forma Pago</Label>
                      <Select value={formaPago} onValueChange={setFormaPago}>
                        <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FORMAS_PAGO.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Método</Label>
                      <Select value={metodoPago} onValueChange={setMetodoPago}>
                        <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {METODOS_PAGO.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Partidas table — all concepts editable */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Partidas
                  <Badge variant="secondary" className="ml-1">
                    {allConceptos.filter(c => !excludedConceptos.has(c.key)).length} conceptos
                  </Badge>
                </h3>

                {isLoadingPre ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Calculando conceptos...</span>
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-[280px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="h-8 w-10 px-2"></TableHead>
                          <TableHead className="h-8 w-8 px-1"></TableHead>
                          <TableHead className="h-8 px-2">Concepto</TableHead>
                          <TableHead className="h-8 px-2 text-right">Cant.</TableHead>
                          <TableHead className="h-8 px-2 text-right">P.U.</TableHead>
                          <TableHead className="h-8 px-2 text-right">Importe</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allConceptos.map((c) => {
                          const excluded = excludedConceptos.has(c.key);
                          return (
                            <TableRow
                              key={c.key}
                              className={`text-xs ${excluded ? 'opacity-40' : ''}`}
                            >
                              <TableCell className="py-1 px-2">
                                <Switch
                                  checked={!excluded}
                                  onCheckedChange={() => handleToggleConcepto(c.key)}
                                  className="scale-75"
                                />
                              </TableCell>
                              <TableCell className="py-1 px-1 text-muted-foreground">
                                {CONCEPTO_ICONS[c.tipo]}
                              </TableCell>
                              <TableCell className="py-1 px-2">
                                <div className="flex items-center gap-1">
                                  <span className="truncate max-w-[260px]">{c.descripcion}</span>
                                  {c.detalle && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground shrink-0 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[300px] text-xs">
                                        {c.detalle}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-1 px-2 text-right tabular-nums">
                                {c.cantidad}
                              </TableCell>
                              <TableCell className="py-1 px-2 text-right tabular-nums">
                                {formatCurrency(c.precioUnitario)}
                              </TableCell>
                              <TableCell className="py-1 px-2 text-right">
                                {c.editable && !excluded ? (
                                  <Input
                                    type="number"
                                    value={editedImportes[c.key] ?? c.importe}
                                    onChange={(e) => handleEditImporte(c.key, e.target.value)}
                                    className="h-6 w-24 text-xs text-right ml-auto tabular-nums"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="tabular-nums">{formatCurrency(getImporte(c))}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {allConceptos.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                              Sin conceptos — verifica los servicios seleccionados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (16%)</span>
                    <span className="tabular-nums">{formatCurrency(iva)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary tabular-nums">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs">Notas (opcional)</Label>
                <Input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
          </TooltipProvider>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || isLoadingPre}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4 mr-2" />
                Generar Pre-Factura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

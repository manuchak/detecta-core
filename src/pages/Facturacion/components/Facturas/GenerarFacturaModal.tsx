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
  Receipt,
  Building2,
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { formatCurrency } from '@/utils/formatUtils';
import { ClienteConServiciosPendientes } from '../../hooks/useServiciosPorFacturar';
import { useGenerarFactura } from '../../hooks/useGenerarFactura';

interface GenerarFacturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClienteConServiciosPendientes | null;
  onSuccess: () => void;
}

const IVA_RATE = 0.16;
const DEFAULT_DIAS_CREDITO = 30;

// Catálogos SAT simplificados
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

export function GenerarFacturaModal({
  open,
  onOpenChange,
  cliente,
  onSuccess,
}: GenerarFacturaModalProps) {
  const { mutate: generarFactura, isPending } = useGenerarFactura();

  // Form state
  const [clienteRfc, setClienteRfc] = useState('XAXX010101000');
  const [clienteEmail, setClienteEmail] = useState('');
  const [fechaEmision, setFechaEmision] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [diasCredito, setDiasCredito] = useState(DEFAULT_DIAS_CREDITO);
  const [usoCfdi, setUsoCfdi] = useState('G03');
  const [formaPago, setFormaPago] = useState('99');
  const [metodoPago, setMetodoPago] = useState('PPD');
  const [notas, setNotas] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (open && cliente) {
      setFechaEmision(format(new Date(), 'yyyy-MM-dd'));
      setDiasCredito(DEFAULT_DIAS_CREDITO);
      setClienteRfc('XAXX010101000');
      setClienteEmail('');
      setUsoCfdi('G03');
      setFormaPago('99');
      setMetodoPago('PPD');
      setNotas('');
    }
  }, [open, cliente]);

  if (!cliente) return null;

  const subtotal = cliente.montoTotal;
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;
  const fechaVencimiento = format(
    addDays(new Date(fechaEmision), diasCredito),
    'yyyy-MM-dd'
  );

  const handleSubmit = () => {
    generarFactura(
      {
        datosFactura: {
          numeroFactura: '', // Auto-generado
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
        },
        servicios: cliente.serviciosDetalle,
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Generar Pre-Factura
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6 pr-4">
            {/* Advertencia pre-factura */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning-foreground">
                  Pre-Factura (sin timbrado)
                </p>
                <p className="text-muted-foreground">
                  Este documento es una pre-factura interna. Para generar CFDI timbrado
                  se requiere integración con PAC autorizado.
                </p>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Datos del Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre / Razón Social</Label>
                  <Input value={cliente.cliente} disabled className="mt-1" />
                </div>
                <div>
                  <Label>RFC</Label>
                  <Input
                    value={clienteRfc}
                    onChange={(e) => setClienteRfc(e.target.value.toUpperCase())}
                    placeholder="XAXX010101000"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Email (opcional)</Label>
                  <Input
                    type="email"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    placeholder="facturacion@cliente.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Datos de facturación */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Datos de Facturación
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Fecha de Emisión</Label>
                  <Input
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Días de Crédito</Label>
                  <Input
                    type="number"
                    value={diasCredito}
                    onChange={(e) => setDiasCredito(parseInt(e.target.value) || 0)}
                    min={0}
                    max={180}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Fecha de Vencimiento</Label>
                  <Input value={fechaVencimiento} disabled className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Uso CFDI</Label>
                  <Select value={usoCfdi} onValueChange={setUsoCfdi}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USOS_CFDI.map((uso) => (
                        <SelectItem key={uso.value} value={uso.value}>
                          {uso.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de Pago</Label>
                  <Select value={formaPago} onValueChange={setFormaPago}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGO.map((forma) => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Método de Pago</Label>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METODOS_PAGO.map((metodo) => (
                        <SelectItem key={metodo.value} value={metodo.value}>
                          {metodo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Resumen de servicios */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Servicios a Facturar
                <Badge variant="secondary" className="ml-2">
                  {cliente.servicios} servicios
                </Badge>
              </h3>

              <div className="border rounded-lg max-h-48 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Folio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cliente.serviciosDetalle.slice(0, 10).map((servicio) => (
                      <TableRow key={servicio.id}>
                        <TableCell className="font-mono text-xs">
                          {servicio.folio_saphiro || servicio.id_servicio}
                        </TableCell>
                        <TableCell className="text-xs">
                          {servicio.fecha_hora_cita?.split('T')[0]}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {servicio.ruta}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(servicio.cobro_cliente || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {cliente.servicios > 10 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                          ... y {cliente.servicios - 10} servicios más
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            {/* Totales */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (16%)</span>
                  <span>{formatCurrency(iva)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label>Notas (opcional)</Label>
              <Input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones adicionales para la factura..."
                className="mt-1"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
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

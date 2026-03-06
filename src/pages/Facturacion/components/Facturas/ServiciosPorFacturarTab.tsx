import React, { useState, Fragment } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  Search,
  FileText,
  AlertCircle,
  TrendingUp,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Truck,
  Fuel,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatUtils';
import { 
  useServiciosAgrupadosPorCliente, 
  ClienteConServiciosPendientes 
} from '../../hooks/useServiciosPorFacturar';
import { useClientesFiscales } from '../../hooks/useClientesFiscales';
import { useReglasEstadias } from '../../hooks/useReglasEstadias';
import { ClienteBillingReadiness } from './ClienteBillingReadiness';
import { GenerarFacturaModal } from './GenerarFacturaModal';

interface ServiciosPorFacturarTabProps {
  fechaInicio?: string;
  fechaFin?: string;
}

function ClienteExpandedRow({ 
  cliente, 
  onFacturar 
}: { 
  cliente: ClienteConServiciosPendientes;
  onFacturar: () => void;
}) {
  const totalCasetas = cliente.serviciosDetalle.reduce(
    (sum, s) => sum + (parseFloat(s.casetas || '0') || 0), 0
  );

  return (
    <div className="px-4 py-3 bg-muted/30 border-t space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border">
          <Truck className="h-4 w-4 text-primary shrink-0" />
          <div>
            <div className="text-[11px] text-muted-foreground">Custodia</div>
            <div className="text-sm font-semibold">{formatCurrency(cliente.montoTotal)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border">
          <Fuel className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <div className="text-[11px] text-muted-foreground">Casetas</div>
            <div className="text-sm font-semibold">{formatCurrency(totalCasetas)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <div className="text-[11px] text-muted-foreground">Estadías</div>
            <div className="text-sm font-semibold text-muted-foreground">Auto-cálculo</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border">
          <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <div className="text-[11px] text-muted-foreground">Total estimado</div>
            <div className="text-sm font-semibold text-primary">
              {formatCurrency(cliente.montoTotal + totalCasetas)}+
            </div>
          </div>
        </div>
      </div>

      {/* Service detail table */}
      <div className="border rounded-lg bg-background overflow-auto max-h-[240px]">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="h-8 px-3">Folio</TableHead>
              <TableHead className="h-8 px-3">Fecha</TableHead>
              <TableHead className="h-8 px-3">Ruta</TableHead>
              <TableHead className="h-8 px-3 text-right">Tarifa</TableHead>
              <TableHead className="h-8 px-3 text-right">Casetas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cliente.serviciosDetalle.slice(0, 15).map((s) => (
              <TableRow key={s.id} className="text-xs">
                <TableCell className="py-1.5 px-3 font-mono">
                  {s.folio_saphiro || s.id_servicio}
                </TableCell>
                <TableCell className="py-1.5 px-3">
                  {s.fecha_hora_cita?.split('T')[0]}
                </TableCell>
                <TableCell className="py-1.5 px-3 max-w-[200px] truncate">
                  {s.ruta}
                </TableCell>
                <TableCell className="py-1.5 px-3 text-right">
                  {formatCurrency(s.cobro_cliente || 0)}
                </TableCell>
                <TableCell className="py-1.5 px-3 text-right">
                  {parseFloat(s.casetas || '0') > 0 ? formatCurrency(parseFloat(s.casetas!)) : '—'}
                </TableCell>
              </TableRow>
            ))}
            {cliente.servicios > 15 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-2">
                  +{cliente.servicios - 15} servicios más
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button size="sm" onClick={onFacturar} className="gap-1.5">
          <Receipt className="h-3.5 w-3.5" />
          Generar Pre-Factura
        </Button>
      </div>
    </div>
  );
}

export function ServiciosPorFacturarTab({ fechaInicio, fechaFin }: ServiciosPorFacturarTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set());
  const [expandedCliente, setExpandedCliente] = useState<string | null>(null);
  const [clienteParaFacturar, setClienteParaFacturar] = useState<ClienteConServiciosPendientes | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { 
    clientesAgrupados, 
    totalServicios, 
    totalMonto, 
    isLoading, 
    refetch 
  } = useServiciosAgrupadosPorCliente({
    fechaInicio,
    fechaFin,
    cliente: searchTerm || undefined,
  });

  const { data: clientesFiscales = [] } = useClientesFiscales();
  const { data: todasReglas = [] } = useReglasEstadias();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientes(new Set(clientesAgrupados.map(c => c.cliente)));
    } else {
      setSelectedClientes(new Set());
    }
  };

  const handleSelectCliente = (cliente: string, checked: boolean) => {
    const newSelected = new Set(selectedClientes);
    if (checked) {
      newSelected.add(cliente);
    } else {
      newSelected.delete(cliente);
    }
    setSelectedClientes(newSelected);
  };

  const handleToggleExpand = (clienteNombre: string) => {
    setExpandedCliente(prev => prev === clienteNombre ? null : clienteNombre);
  };

  const handleFacturarCliente = (cliente: ClienteConServiciosPendientes) => {
    setClienteParaFacturar(cliente);
    setModalOpen(true);
  };

  const clientesSeleccionadosCount = selectedClientes.size;
  const serviciosSeleccionados = clientesAgrupados
    .filter(c => selectedClientes.has(c.cliente))
    .reduce((sum, c) => sum + c.servicios, 0);
  const montoSeleccionado = clientesAgrupados
    .filter(c => selectedClientes.has(c.cliente))
    .reduce((sum, c) => sum + c.montoTotal, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const clientesConRetraso = clientesAgrupados.filter(c => {
    const oldest = c.serviciosDetalle.reduce((o, s) => {
      const d = s.fecha_hora_cita?.split('T')[0];
      return d && d < o ? d : o;
    }, c.ultimoServicio);
    return differenceInDays(new Date(), new Date(oldest)) > 15;
  });

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Late billing alert */}
        {clientesConRetraso.length > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">
                {clientesConRetraso.length} cliente(s) con más de 15 días sin facturar
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {clientesConRetraso.map(c => c.cliente).slice(0, 5).join(', ')}
                {clientesConRetraso.length > 5 && ` y ${clientesConRetraso.length - 5} más`}
              </p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <FileText className="h-3.5 w-3.5" />
                Servicios Pendientes
              </div>
              <div className="text-2xl font-bold">{totalServicios.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                Monto por Facturar
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalMonto)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Receipt className="h-3.5 w-3.5" />
                Clientes con Pendientes
              </div>
              <div className="text-2xl font-bold">{clientesAgrupados.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualizar
            </Button>
          </div>

          {clientesSeleccionadosCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{clientesSeleccionadosCount}</span> cliente(s) |{' '}
                <span className="font-medium text-foreground">{serviciosSeleccionados}</span> servicios |{' '}
                <span className="font-medium text-primary">{formatCurrency(montoSeleccionado)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Client table with expandable rows */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto h-[calc(var(--vh-full)-420px)] min-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          clientesAgrupados.length > 0 &&
                          selectedClientes.size === clientesAgrupados.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="w-16 text-center">Ready</TableHead>
                    <TableHead className="text-right">Servicios</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                    <TableHead>Último Servicio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesAgrupados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-8 w-8" />
                          <p>No hay servicios pendientes de facturar</p>
                          <p className="text-xs">
                            Todos los servicios finalizados ya tienen factura asignada
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientesAgrupados.map((cliente) => {
                      const oldestServiceDate = cliente.serviciosDetalle.reduce((oldest, s) => {
                        const d = s.fecha_hora_cita?.split('T')[0];
                        return d && d < oldest ? d : oldest;
                      }, cliente.ultimoServicio);
                      const diasSinFacturar = differenceInDays(new Date(), new Date(oldestServiceDate));
                      const isLate = diasSinFacturar > 15;
                      const isCritical = diasSinFacturar > 30;
                      const isExpanded = expandedCliente === cliente.cliente;

                      // Find fiscal data & rules for readiness
                      const clienteFiscal = clientesFiscales.find(
                        cf => cf.nombre.toLowerCase() === cliente.cliente.toLowerCase()
                      );
                      const hasReglas = todasReglas.some(
                        r => r.cliente_id === clienteFiscal?.id
                      );

                      return (
                        <Fragment key={cliente.cliente}>
                            <TableRow 
                              className={`cursor-pointer ${isExpanded ? 'bg-muted/30' : ''}`}
                              onClick={() => handleToggleExpand(cliente.cliente)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedClientes.has(cliente.cliente)}
                                  onCheckedChange={(checked) =>
                                    handleSelectCliente(cliente.cliente, checked as boolean)
                                  }
                                />
                              </TableCell>
                              <TableCell className="px-1">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{cliente.cliente}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <ClienteBillingReadiness
                                  clienteFiscal={clienteFiscal}
                                  hasReglasEstadia={hasReglas}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{cliente.servicios}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(cliente.montoTotal)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant={isCritical ? 'destructive' : isLate ? 'outline' : 'secondary'}
                                  className={
                                    isCritical ? '' : 
                                    isLate ? 'border-amber-500 text-amber-700 dark:text-amber-400' : ''
                                  }
                                >
                                  {diasSinFacturar}d
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(cliente.ultimoServicio), 'dd MMM yyyy', { locale: es })}
                                </div>
                              </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleFacturarCliente(cliente)}
                                >
                                  <Receipt className="h-3.5 w-3.5 mr-1" />
                                  Facturar
                                </Button>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <tr>
                                <td colSpan={9} className="p-0">
                                  <ClienteExpandedRow
                                    cliente={cliente}
                                    onFacturar={() => handleFacturarCliente(cliente)}
                                  />
                                </td>
                              </tr>
                            )}
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <GenerarFacturaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          cliente={clienteParaFacturar}
          onSuccess={() => {
            setModalOpen(false);
            setClienteParaFacturar(null);
            setSelectedClientes(new Set());
            refetch();
          }}
        />
      </div>
    </TooltipProvider>
  );
}

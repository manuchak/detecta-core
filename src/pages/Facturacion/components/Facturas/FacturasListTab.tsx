import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Receipt,
  Search,
  Eye,
  FileText,
  AlertCircle,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatUtils';
import { useFacturasEmitidas } from '../../hooks/useGenerarFactura';
import { FacturaDetalleDrawer } from './FacturaDetalleDrawer';

const ESTADOS_FACTURA = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'emitida', label: 'Emitida' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'cancelada', label: 'Cancelada' },
];

const getEstadoBadge = (estado: string, fechaVencimiento: string) => {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const isVencida = estado === 'emitida' && vencimiento < hoy;

  if (isVencida || estado === 'vencida') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Vencida
      </Badge>
    );
  }

  switch (estado) {
    case 'pagada':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Pagada
        </Badge>
      );
    case 'emitida':
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Emitida
        </Badge>
      );
    case 'cancelada':
      return (
        <Badge variant="outline" className="text-muted-foreground gap-1">
          <XCircle className="h-3 w-3" />
          Cancelada
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

export function FacturasListTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: facturas = [], isLoading, refetch } = useFacturasEmitidas({
    cliente: searchTerm || undefined,
    estado: estadoFilter !== 'all' ? estadoFilter : undefined,
  });

  const handleViewDetalle = (facturaId: string) => {
    setSelectedFacturaId(facturaId);
    setDrawerOpen(true);
  };

  // Calcular métricas
  const totalFacturado = facturas.reduce((sum, f) => sum + (f.total || 0), 0);
  const facturasEmitidas = facturas.filter(f => f.estado === 'emitida').length;
  const facturasPagadas = facturas.filter(f => f.estado === 'pagada').length;

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

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Receipt className="h-3.5 w-3.5" />
              Total Facturas
            </div>
            <div className="text-2xl font-bold">{facturas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileText className="h-3.5 w-3.5" />
              Monto Facturado
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalFacturado)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Pagadas / Emitidas
            </div>
            <div className="text-2xl font-bold">
              {facturasPagadas} / {facturasEmitidas}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_FACTURA.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabla de facturas */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto h-[calc(var(--vh-full)-420px)] min-h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead># Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Partidas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-8 w-8" />
                      <p>No hay facturas emitidas</p>
                      <p className="text-xs">
                        Genera facturas desde la pestaña "Por Facturar"
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                facturas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell>
                      <div className="font-mono font-medium text-sm">
                        {factura.numero_factura}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{factura.cliente_nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {factura.cliente_rfc}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(new Date(factura.fecha_emision), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(factura.fecha_vencimiento), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(factura.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {factura.partidas?.[0]?.count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(factura.estado || 'emitida', factura.fecha_vencimiento)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetalle(factura.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Drawer de detalle */}
      <FacturaDetalleDrawer
        facturaId={selectedFacturaId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

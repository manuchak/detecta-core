import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  FileText, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  ChevronRight
} from 'lucide-react';
import { AgingData, getAgingColor } from '../../hooks/useCuentasPorCobrar';
import { useFacturasCliente, FacturaCliente } from '../../hooks/useFacturasCliente';
import { formatCurrency } from '@/utils/formatUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClienteFacturasDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: AgingData | null;
  onRegistrarPago?: (factura: FacturaCliente) => void;
  onVerDetalle?: (factura: FacturaCliente) => void;
}

const getEstadoBadge = (estado: string, diasVencido: number) => {
  switch (estado) {
    case 'pagada':
      return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Pagada</Badge>;
    case 'parcial':
      return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">Parcial</Badge>;
    case 'vencida':
      return <Badge className="bg-red-500/10 text-red-700 border-red-500/30">Vencida</Badge>;
    case 'cancelada':
      return <Badge variant="secondary">Cancelada</Badge>;
    default:
      if (diasVencido > 0) {
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30">{diasVencido}d vencida</Badge>;
      }
      return <Badge className="bg-muted text-muted-foreground">Pendiente</Badge>;
  }
};

export function ClienteFacturasDrawer({
  open,
  onOpenChange,
  cliente,
  onRegistrarPago,
  onVerDetalle,
}: ClienteFacturasDrawerProps) {
  const { data: facturas = [], isLoading } = useFacturasCliente(cliente?.cliente_id);

  // Calculate summary
  const resumen = React.useMemo(() => {
    return facturas.reduce(
      (acc, f) => {
        acc.totalFacturado += Number(f.total);
        acc.totalPagado += f.total_pagado || 0;
        acc.saldoPendiente += f.saldo_pendiente || 0;
        if (f.estado === 'pagada') acc.facturasPagadas++;
        else if (f.estado === 'vencida' || (f.dias_vencido || 0) > 0) acc.facturasVencidas++;
        else acc.facturasPendientes++;
        return acc;
      },
      { totalFacturado: 0, totalPagado: 0, saldoPendiente: 0, facturasPagadas: 0, facturasPendientes: 0, facturasVencidas: 0 }
    );
  }, [facturas]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Facturas del Cliente
          </SheetTitle>
          <SheetDescription className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{cliente?.cliente_nombre}</span>
            <span className="text-xs">{cliente?.cliente_rfc || 'Sin RFC'}</span>
          </SheetDescription>
        </SheetHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 py-4">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Facturado</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(resumen.totalFacturado)}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Pagado</span>
            </div>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(resumen.totalPagado)}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Saldo</span>
            </div>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(resumen.saldoPendiente)}</p>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex items-center gap-2 pb-4 text-xs">
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {resumen.facturasPagadas} pagadas
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {resumen.facturasPendientes} pendientes
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {resumen.facturasVencidas} vencidas
          </Badge>
        </div>

        {/* Facturas Table */}
        <ScrollArea className="h-[calc(100vh-380px)]">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : facturas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay facturas registradas para este cliente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[130px]">Factura</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((factura) => (
                  <TableRow 
                    key={factura.id}
                    className={
                      (factura.dias_vencido || 0) > 60 
                        ? 'bg-red-50/50 dark:bg-red-950/20' 
                        : (factura.dias_vencido || 0) > 0 
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : ''
                    }
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{factura.numero_factura}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(factura.fecha_emision), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Vence: {format(new Date(factura.fecha_vencimiento), 'dd MMM', { locale: es })}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(factura.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${
                        (factura.saldo_pendiente || 0) > 0 
                          ? (factura.dias_vencido || 0) > 0 
                            ? 'text-red-600' 
                            : 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        {formatCurrency(factura.saldo_pendiente || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(factura.estado, factura.dias_vencido || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {(factura.saldo_pendiente || 0) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => onRegistrarPago?.(factura)}
                          >
                            <CreditCard className="h-3 w-3" />
                            Pago
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onVerDetalle?.(factura)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

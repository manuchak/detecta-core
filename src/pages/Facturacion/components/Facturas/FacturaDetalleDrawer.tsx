import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Mail,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatUtils';
import { useFacturaDetalle } from '../../hooks/useGenerarFactura';

interface FacturaDetalleDrawerProps {
  facturaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FacturaDetalleDrawer({
  facturaId,
  open,
  onOpenChange,
}: FacturaDetalleDrawerProps) {
  const { data: factura, isLoading } = useFacturaDetalle(facturaId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Detalle de Factura
            {factura && (
              <Badge variant="outline" className="ml-2 font-mono">
                {factura.numero_factura}
              </Badge>
            )}
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : factura ? (
            <div className="space-y-6">
              {/* Datos del cliente */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4" />
                    Datos del Cliente
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Razón Social:</span>
                      <p className="font-medium">{factura.cliente_nombre}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">RFC:</span>
                      <p className="font-mono">{factura.cliente_rfc}</p>
                    </div>
                    {factura.cliente_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{factura.cliente_email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Datos de Facturación
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Emisión:</span>
                      <p className="font-medium">
                        {format(new Date(factura.fecha_emision), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vencimiento:</span>
                      <p className="font-medium">
                        {format(new Date(factura.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Uso CFDI:</span>
                      <p>{factura.uso_cfdi || 'G03'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Método Pago:</span>
                      <p>{factura.metodo_pago || 'PPD'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Partidas */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  Partidas ({factura.partidas?.length || 0} servicios)
                </h3>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Folio</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {factura.partidas?.map((partida: any) => (
                        <TableRow key={partida.id}>
                          <TableCell className="font-mono text-xs">
                            {partida.id_servicio}
                          </TableCell>
                          <TableCell className="text-xs">
                            {partida.fecha_servicio
                              ? format(new Date(partida.fecha_servicio), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-xs max-w-[250px]">
                            <div className="truncate">{partida.descripcion}</div>
                            {partida.ruta && (
                              <div className="text-muted-foreground truncate">
                                {partida.ruta}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(partida.importe)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2 bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(factura.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (16%)</span>
                    <span>{formatCurrency(factura.iva)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(factura.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {factura.moneda || 'MXN'}
                    </span>
                    <Badge variant={factura.estado === 'pagada' ? 'default' : 'secondary'}>
                      {factura.estado || 'emitida'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {factura.notas && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Notas</h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      {factura.notas}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Selecciona una factura para ver el detalle
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

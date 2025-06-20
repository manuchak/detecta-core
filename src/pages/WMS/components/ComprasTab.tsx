
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useOrdenesCompra } from '@/hooks/useOrdenesCompra';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ComprasTab = () => {
  const { ordenes, isLoading } = useOrdenesCompra();

  const getEstadoBadge = (estado: string) => {
    const config = {
      'borrador': { color: 'bg-gray-100 text-gray-800', icon: Clock },
      'enviada': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'confirmada': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'parcial': { color: 'bg-orange-100 text-orange-800', icon: Clock },
      'recibida': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'cancelada': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const item = config[estado as keyof typeof config] || { color: 'bg-gray-100 text-gray-800', icon: Clock };
    const IconComponent = item.icon;

    return (
      <Badge className={item.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Órdenes de Compra</h2>
          <p className="text-muted-foreground">Gestión de compras y adquisiciones</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Resumen de órdenes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordenes?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {ordenes?.filter(o => ['borrador', 'enviada', 'confirmada'].includes(o.estado)).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {ordenes?.filter(o => o.estado === 'recibida').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${ordenes?.reduce((sum, o) => sum + o.total, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Compra</CardTitle>
          <CardDescription>
            Historial y seguimiento de todas las órdenes de compra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenes?.map((orden) => (
                <TableRow key={orden.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">
                    {orden.numero_orden}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{orden.proveedor?.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {orden.proveedor?.contacto_principal}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(orden.fecha_orden), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    {getEstadoBadge(orden.estado)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        ${orden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">{orden.moneda}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {orden.fecha_entrega_esperada ? (
                      <div>
                        <p className="text-sm">
                          {format(new Date(orden.fecha_entrega_esperada), 'dd/MM/yyyy', { locale: es })}
                        </p>
                        {orden.fecha_entrega_real && (
                          <p className="text-xs text-green-600">
                            Recibido: {format(new Date(orden.fecha_entrega_real), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Sin fecha</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

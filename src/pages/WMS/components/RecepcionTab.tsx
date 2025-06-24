
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
import { Plus, Truck, Clock, CheckCircle, Package } from 'lucide-react';
import { useOrdenesCompra } from '@/hooks/useOrdenesCompra';
import { RecepcionMercanciaDialog } from './RecepcionMercanciaDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const RecepcionTab = () => {
  const { ordenes, isLoading } = useOrdenesCompra();
  const [showRecepcionDialog, setShowRecepcionDialog] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);

  // Filtrar órdenes que están listas para recepción
  const ordenesParaRecepcion = ordenes?.filter(orden => 
    ['enviada', 'confirmada', 'parcial'].includes(orden.estado)
  ) || [];

  const ordenesRecibidas = ordenes?.filter(orden => orden.estado === 'recibida') || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Recepción de Mercancía</h2>
            <p className="text-muted-foreground">Control de llegada y verificación de productos</p>
          </div>
        </div>

        {/* Métricas de recepción */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes Recepción</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordenesParaRecepcion.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recibidas Hoy</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {ordenesRecibidas.filter(o => 
                  o.fecha_entrega_real === new Date().toISOString().split('T')[0]
                ).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recibidas</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{ordenesRecibidas.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Recibido</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${ordenesRecibidas.reduce((sum, o) => sum + o.total, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Órdenes pendientes de recepción */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes Pendientes de Recepción</CardTitle>
            <CardDescription>
              Órdenes confirmadas listas para ser recibidas en almacén
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordenesParaRecepcion.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay órdenes pendientes</p>
                <p className="text-sm">Las órdenes confirmadas aparecerán aquí para su recepción.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha Orden</TableHead>
                    <TableHead>Entrega Esperada</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesParaRecepcion.map((orden) => (
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
                        {orden.fecha_entrega_esperada ? (
                          format(new Date(orden.fecha_entrega_esperada), 'dd/MM/yyyy', { locale: es })
                        ) : (
                          <span className="text-gray-400">Sin fecha</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          orden.estado === 'enviada' ? 'bg-blue-100 text-blue-800' :
                          orden.estado === 'confirmada' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-orange-100 text-orange-800'
                        }>
                          {orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)}
                        </Badge>
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
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedOrden(orden);
                            setShowRecepcionDialog(true);
                          }}
                        >
                          Recibir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recepciones completadas */}
        <Card>
          <CardHeader>
            <CardTitle>Recepciones Completadas</CardTitle>
            <CardDescription>
              Historial de recepciones de mercancía procesadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordenesRecibidas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No hay recepciones completadas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha Recepción</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesRecibidas.slice(0, 10).map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell className="font-mono text-sm">
                        {orden.numero_orden}
                      </TableCell>
                      <TableCell>{orden.proveedor?.nombre}</TableCell>
                      <TableCell>
                        {orden.fecha_entrega_real && format(new Date(orden.fecha_entrega_real), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        ${orden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Recibida
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <RecepcionMercanciaDialog
        open={showRecepcionDialog}
        onOpenChange={setShowRecepcionDialog}
        orden={selectedOrden}
        onClose={() => {
          setShowRecepcionDialog(false);
          setSelectedOrden(null);
        }}
      />
    </>
  );
};

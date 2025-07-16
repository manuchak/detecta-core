import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, FileText, Package, Clock, CheckCircle } from 'lucide-react';
import { useOrdenesCompra } from '@/hooks/useOrdenesCompra';
import { OrdenCompraDialog } from './OrdenCompraDialog';

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'borrador':
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Borrador</Badge>;
    case 'enviada':
      return <Badge variant="secondary"><FileText className="w-3 h-3 mr-1" />Enviada</Badge>;
    case 'confirmada':
      return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Confirmada</Badge>;
    case 'parcial':
      return <Badge className="bg-yellow-500"><Package className="w-3 h-3 mr-1" />Recepción Parcial</Badge>;
    case 'recibida':
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Recibida</Badge>;
    case 'cancelada':
      return <Badge variant="destructive">Cancelada</Badge>;
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

export const ComprasTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('ordenes');

  const { ordenes, isLoading } = useOrdenesCompra();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredOrders = ordenes?.filter(orden =>
    orden.numero_orden.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.proveedor?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calcular estadísticas
  const totalOrdenes = ordenes?.length || 0;
  const ordenesPendientes = ordenes?.filter(o => ['borrador', 'enviada'].includes(o.estado)).length || 0;
  const ordenesRecibidas = ordenes?.filter(o => o.estado === 'recibida').length || 0;
  const valorTotal = ordenes?.reduce((sum, orden) => sum + (orden.total || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdenes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordenesPendientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordenesRecibidas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${valorTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="ordenes">Órdenes de Compra</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
            <TabsTrigger value="cotizaciones">Cotizaciones</TabsTrigger>
          </TabsList>

          <Button onClick={() => setIsOrderDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Orden
          </Button>
        </div>

        <TabsContent value="ordenes" className="space-y-4">
          {/* Filtros y búsqueda */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número de orden o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>

          {/* Tabla de órdenes de compra */}
          <Card>
            <CardHeader>
              <CardTitle>Órdenes de Compra</CardTitle>
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
                  {filteredOrders.map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell className="font-medium">{orden.numero_orden}</TableCell>
                      <TableCell>{orden.proveedor?.nombre}</TableCell>
                      <TableCell>
                        {new Date(orden.fecha_orden).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getEstadoBadge(orden.estado)}</TableCell>
                      <TableCell>${orden.total?.toLocaleString()}</TableCell>
                      <TableCell>
                        {orden.fecha_entrega_esperada
                          ? new Date(orden.fecha_entrega_esperada).toLocaleDateString()
                          : 'Por definir'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(orden);
                            setIsOrderDialogOpen(true);
                          }}
                        >
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No se encontraron órdenes de compra</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitudes">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">Solicitudes de Compra</h3>
              <p className="text-muted-foreground">Módulo en desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cotizaciones">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">Cotizaciones</h3>
              <p className="text-muted-foreground">Módulo en desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para crear/editar orden */}
      <OrdenCompraDialog
        orden={selectedOrder}
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
        onClose={() => {
          setIsOrderDialogOpen(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
};
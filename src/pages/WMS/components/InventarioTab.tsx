
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { ProductoDialog } from './ProductoDialog';

export const InventarioTab = () => {
  const { productos, isLoading } = useProductosInventario();
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductoDialog, setShowProductoDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);

  const filteredProductos = productos?.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (producto: any) => {
    const stock = producto.stock?.cantidad_disponible || 0;
    const minimo = producto.stock_minimo || 0;
    
    if (stock === 0) {
      return { status: 'sin-stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    } else if (stock <= minimo) {
      return { status: 'stock-bajo', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    } else {
      return { status: 'stock-ok', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
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
    <>
      <div className="space-y-6">
        {/* Header con botón prominente cuando no hay productos */}
        {(!productos || productos.length === 0) ? (
          <EmptyInventoryState onCreateProduct={() => setShowProductoDialog(true)} />
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={() => setShowProductoDialog(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </div>

            {/* Resumen de inventario */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{productos?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {productos?.filter(p => (p.stock?.cantidad_disponible || 0) <= (p.stock_minimo || 0) && (p.stock?.cantidad_disponible || 0) > 0).length || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {productos?.filter(p => (p.stock?.cantidad_disponible || 0) === 0).length || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${productos?.reduce((sum, p) => sum + (p.stock?.valor_inventario || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Productos en Inventario</CardTitle>
                <CardDescription>
                  Gestión completa de productos, stock y especificaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!filteredProductos || filteredProductos.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No se encontraron productos</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? 'Intenta con diferentes términos de búsqueda' : 'Todos los productos están aquí'}
                    </p>
                    {searchTerm && (
                      <Button variant="outline" onClick={() => setSearchTerm('')}>
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProductos?.map((producto) => {
                        const stockInfo = getStockStatus(producto);
                        const IconComponent = stockInfo.icon;
                        
                        return (
                          <TableRow key={producto.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-sm">
                              {producto.codigo_producto}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{producto.nombre}</p>
                                <p className="text-sm text-muted-foreground">
                                  {producto.marca} {producto.modelo}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {producto.categoria?.nombre || 'Sin categoría'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <p className="font-medium">{producto.stock?.cantidad_disponible || 0}</p>
                                <p className="text-xs text-muted-foreground">
                                  Min: {producto.stock_minimo || 0}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={stockInfo.color}>
                                <IconComponent className="h-3 w-3 mr-1" />
                                {stockInfo.status === 'sin-stock' ? 'Sin Stock' : 
                                 stockInfo.status === 'stock-bajo' ? 'Stock Bajo' : 'OK'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">
                                  ${(producto.precio_compra_promedio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-muted-foreground">Compra</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProducto(producto);
                                  setShowProductoDialog(true);
                                }}
                              >
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ProductoDialog
        open={showProductoDialog}
        onOpenChange={setShowProductoDialog}
        producto={selectedProducto}
        onClose={() => {
          setShowProductoDialog(false);
          setSelectedProducto(null);
        }}
      />
    </>
  );
};

// Componente para el estado vacío mejorado
const EmptyInventoryState = ({ onCreateProduct }: { onCreateProduct: () => void }) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl w-64 h-64"></div>
      <Package className="relative h-24 w-24 text-primary mx-auto" />
    </div>
    
    <div className="space-y-4 max-w-md">
      <h1 className="text-3xl font-bold tracking-tight">Bienvenido a tu Inventario</h1>
      <p className="text-lg text-muted-foreground">
        Comienza creando tu primer producto GPS y gestiona todo tu inventario desde aquí.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row gap-4">
      <Button onClick={onCreateProduct} size="lg" className="bg-primary hover:bg-primary/90">
        <Plus className="h-5 w-5 mr-2" />
        Crear Primer Producto
      </Button>
      <Button variant="outline" size="lg">
        <Package className="h-5 w-5 mr-2" />
        Ver Demo
      </Button>
    </div>

    <div className="grid md:grid-cols-3 gap-6 max-w-4xl pt-8">
      <FeatureCard 
        icon={Package}
        title="Gestión Completa"
        description="Controla stock, precios y especificaciones técnicas de todos tus dispositivos GPS"
      />
      <FeatureCard 
        icon={AlertTriangle}
        title="Alertas Inteligentes"
        description="Recibe notificaciones automáticas cuando el stock esté bajo o se agote"
      />
      <FeatureCard 
        icon={CheckCircle}
        title="Integración GPS"
        description="Formularios inteligentes que auto-completan datos técnicos de dispositivos GPS"
      />
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }: { 
  icon: React.ComponentType<{ className?: string }>, 
  title: string, 
  description: string 
}) => (
  <Card className="text-center p-6 border-dashed hover:border-solid transition-all hover:shadow-md">
    <CardContent className="pt-6 space-y-4">
      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

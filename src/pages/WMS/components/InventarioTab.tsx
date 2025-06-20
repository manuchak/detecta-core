
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
          <Button onClick={() => setShowProductoDialog(true)}>
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
                {productos?.filter(p => (p.stock?.cantidad_disponible || 0) <= (p.stock_minimo || 0)).length || 0}
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
                    <TableRow key={producto.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {producto.codigo_producto}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{producto.nombre}</p>
                          <p className="text-sm text-gray-500">
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
                          <p className="text-xs text-gray-500">
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
                          <p className="text-xs text-gray-500">Compra</p>
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
          </CardContent>
        </Card>
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

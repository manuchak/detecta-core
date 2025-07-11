
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useStockProductos } from '@/hooks/useStockProductos';

export const StockTab = () => {
  const { stock, movimientos, isLoading, isLoadingMovimientos, error } = useStockProductos();

  const isLoadingData = isLoading || isLoadingMovimientos;

  if (isLoadingData) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Control de Stock</h2>
          <p className="text-muted-foreground">Cargando datos del inventario...</p>
        </div>
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Control de Stock</h2>
          <p className="text-red-600">Error al cargar los datos: {error.message}</p>
        </div>
      </div>
    );
  }

  const stockBajo = stock?.filter(s => s.cantidad_disponible <= (s.producto?.stock_minimo || 0)).length || 0;
  const sinStock = stock?.filter(s => s.cantidad_disponible === 0).length || 0;
  const valorTotal = stock?.reduce((sum, s) => sum + s.valor_inventario, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Control de Stock</h2>
        <p className="text-muted-foreground">Monitoreo en tiempo real del inventario</p>
      </div>

      {/* Resumen de stock */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stockBajo}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sinStock}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stock actual */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Actual</CardTitle>
            <CardDescription>Inventario disponible por producto</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock?.slice(0, 10).map((item) => {
                  const isLowStock = item.cantidad_disponible <= (item.producto?.stock_minimo || 0);
                  const isOutOfStock = item.cantidad_disponible === 0;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.producto?.nombre}</p>
                          <p className="text-sm text-gray-500">{item.producto?.codigo_producto}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-medium">{item.cantidad_disponible}</p>
                          <p className="text-xs text-gray-500">
                            Min: {item.producto?.stock_minimo || 0}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            isOutOfStock ? 'bg-red-100 text-red-800' :
                            isLowStock ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }
                        >
                          {isOutOfStock ? 'Sin Stock' : isLowStock ? 'Stock Bajo' : 'OK'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Movimientos recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Movimientos Recientes</CardTitle>
            <CardDescription>Últimos movimientos de inventario</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos?.slice(0, 10).map((mov) => {
                  const isEntrada = mov.tipo_movimiento === 'entrada';
                  const IconComponent = isEntrada ? TrendingUp : TrendingDown;
                  
                  return (
                    <TableRow key={mov.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{mov.producto?.nombre}</p>
                          <p className="text-sm text-gray-500">{mov.producto?.codigo_producto}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            isEntrada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }
                        >
                          <IconComponent className="h-3 w-3 mr-1" />
                          {mov.tipo_movimiento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={isEntrada ? 'text-green-600' : 'text-red-600'}>
                          {isEntrada ? '+' : '-'}{mov.cantidad}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

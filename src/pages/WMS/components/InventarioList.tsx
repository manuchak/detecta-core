import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Package,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { ProductoInventario } from '@/types/wms';
import { ProductoDialog } from './ProductoDialog';

interface InventarioListProps {
  productos: ProductoInventario[];
  onCreateProduct: () => void;
  onEditProduct: (producto: ProductoInventario) => void;
  onDeleteProduct: (id: string) => void;
}

export const InventarioList = ({ 
  productos, 
  onCreateProduct, 
  onEditProduct, 
  onDeleteProduct 
}: InventarioListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.categoria?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (producto: ProductoInventario) => {
    const stock = producto.stock?.[0];
    if (!stock) return { status: 'sin-datos', label: 'Sin datos', color: 'secondary' };
    
    const { cantidad_disponible } = stock;
    
    if (cantidad_disponible === 0) {
      return { status: 'agotado', label: 'Agotado', color: 'destructive' };
    } else if (cantidad_disponible <= producto.stock_minimo) {
      return { status: 'bajo', label: 'Stock Bajo', color: 'warning' };
    } else {
      return { status: 'normal', label: 'En Stock', color: 'success' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y botón crear */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreateProduct} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProductos.map((producto) => {
          const stockStatus = getStockStatus(producto);
          const stock = producto.stock?.[0];
          
          return (
            <Card key={producto.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{producto.nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {producto.codigo_producto}
                    </p>
                  </div>
                  <Badge 
                    variant={stockStatus.color as any}
                    className="text-xs"
                  >
                    {stockStatus.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Categoría:</span>
                    <span>{producto.categoria?.nombre || 'Sin categoría'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-medium">
                      {stock?.cantidad_disponible || 0} {producto.unidad_medida}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Precio:</span>
                    <span className="font-medium">
                      ${producto.precio_venta_sugerido?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEditProduct(producto)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDeleteProduct(producto.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estado cuando no hay productos filtrados */}
      {filteredProductos.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
          <p className="text-muted-foreground">
            Intenta con otros términos de búsqueda o crea un nuevo producto.
          </p>
        </div>
      )}
    </div>
  );
};
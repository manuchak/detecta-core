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
  CheckCircle2,
  Cpu,
  BarChart3,
  TrendingUp,
  Eye,
  DollarSign
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
    <div className="space-y-8">
      {/* Header mejorado con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50" />
        <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Inventario GPS
            </h2>
            <p className="text-muted-foreground">
              {filteredProductos.length} producto{filteredProductos.length !== 1 ? 's' : ''} encontrado{filteredProductos.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80 bg-background/80 backdrop-blur-sm border-border/50"
              />
            </div>
            <Button 
              onClick={onCreateProduct} 
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/25 px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </div>

      {/* Grid mejorado de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProductos.map((producto) => {
          const stockStatus = getStockStatus(producto);
          const stock = producto.stock?.[0];
          
          return (
            <Card 
              key={producto.id} 
              className="group relative overflow-hidden border border-border/50 bg-gradient-to-br from-card to-card/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Indicador de stock como barra lateral */}
              <div className={`absolute left-0 top-0 h-full w-1 ${
                stockStatus.status === 'agotado' ? 'bg-destructive' :
                stockStatus.status === 'bajo' ? 'bg-warning' : 'bg-success'
              }`} />
              
              <CardHeader className="pb-4 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <Badge 
                        variant={stockStatus.color as any}
                        className="text-xs font-medium"
                      >
                        {stockStatus.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold leading-tight truncate">
                      {producto.nombre}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">
                      {producto.codigo_producto}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Información principal con iconos */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Categoría</span>
                    </div>
                    <span className="text-sm font-medium">
                      {producto.categoria?.nombre || 'Sin categoría'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Stock</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">
                        {stock?.cantidad_disponible || 0}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        piezas
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Precio</span>
                    </div>
                    <span className="text-lg font-bold text-success">
                      ${producto.precio_venta_sugerido?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Botones de acción mejorados */}
                <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEditProduct(producto)}
                    className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDeleteProduct(producto.id)}
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="hover:bg-accent/10 hover:text-accent-foreground hover:border-accent transition-colors"
                  >
                    <Eye className="h-4 w-4" />
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
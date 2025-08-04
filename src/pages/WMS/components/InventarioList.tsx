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
  DollarSign,
  Shield,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductoInventario } from '@/types/wms';
import { ProductoDialog } from './ProductoDialog';
import { AuditLogDialog } from './AuditLogDialog';
import { ProductoDeletionDialog } from './ProductoDeletionDialog';

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
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDeletionDialog, setShowDeletionDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<ProductoInventario | null>(null);
  
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.categoria?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || producto.categoria?.id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Agrupar productos por categoría
  const productsByCategory = filteredProductos.reduce((acc, producto) => {
    const categoryId = producto.categoria?.id || 'sin-categoria';
    const categoryName = producto.categoria?.nombre || 'Sin categoría';
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        name: categoryName,
        productos: []
      };
    }
    acc[categoryId].productos.push(producto);
    return acc;
  }, {} as Record<string, { name: string; productos: ProductoInventario[] }>);

  // Obtener categorías únicas para el filtro
  const categories = Array.from(new Set(productos.map(p => p.categoria).filter(Boolean)));

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

  const handleDeleteClick = (producto: ProductoInventario) => {
    setSelectedProducto(producto);
    setShowDeletionDialog(true);
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
                className="pl-10 w-full sm:w-64 bg-background/80 backdrop-blur-sm border-border/50"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-background/80 backdrop-blur-sm">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline"
              onClick={() => setShowAuditLog(true)}
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
            >
              <Shield className="h-4 w-4 mr-2" />
              Log de Auditoría
            </Button>
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

      {/* Lista agrupada por categorías */}
      <div className="space-y-6">
        {Object.entries(productsByCategory).map(([categoryId, category]) => (
          <div key={categoryId} className="space-y-4">
            {/* Header de categoría */}
            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {category.name}
              </h3>
              <Badge variant="secondary" className="ml-auto">
                {category.productos.length} producto{category.productos.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Lista compacta de productos */}
            <div className="space-y-2">
              {category.productos.map((producto) => {
                const stockStatus = getStockStatus(producto);
                const stock = producto.stock?.[0];
                
                return (
                  <Card 
                    key={producto.id} 
                    className="hover:shadow-md transition-all duration-200 hover:bg-accent/5"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Indicador de stock */}
                        <div className={`w-1 h-12 rounded-full ${
                          stockStatus.status === 'agotado' ? 'bg-destructive' :
                          stockStatus.status === 'bajo' ? 'bg-warning' : 'bg-success'
                        }`} />
                        
                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground truncate">
                              {producto.nombre}
                            </h4>
                            <Badge 
                              variant={stockStatus.color as any}
                              className="text-xs"
                            >
                              {stockStatus.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {producto.codigo_producto}
                          </p>
                        </div>

                        {/* Datos de stock y precio */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground">Stock</p>
                            <p className="font-bold text-lg">
                              {stock?.cantidad_disponible || 0}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Precio</p>
                            <p className="font-bold text-success">
                              ${producto.precio_venta_sugerido?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Botones de acción compactos */}
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onEditProduct(producto)}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteClick(producto)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
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

      {/* Dialog de log de auditoría */}
      <AuditLogDialog 
        open={showAuditLog}
        onOpenChange={setShowAuditLog}
      />
      
      {/* Dialog de opciones de eliminación */}
      <ProductoDeletionDialog
        open={showDeletionDialog}
        onOpenChange={setShowDeletionDialog}
        producto={selectedProducto}
      />
    </div>
  );
};
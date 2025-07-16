import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { ProductoDialog } from './ProductoDialog';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { InventarioList } from './InventarioList';

export const InventarioTab = () => {
  const [showProductoDialog, setShowProductoDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  
  const { productos, isLoading, deleteProducto } = useProductosInventario();

  const handleCreateProduct = () => {
    setSelectedProducto(null);
    setShowProductoDialog(true);
  };

  const handleEditProduct = (producto: any) => {
    setSelectedProducto(producto);
    setShowProductoDialog(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      deleteProducto.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-12 w-12 text-muted-foreground mx-auto animate-pulse" />
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {productos && productos.length > 0 ? (
          <InventarioList
            productos={productos}
            onCreateProduct={handleCreateProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        ) : (
          <EmptyInventoryState onCreateProduct={handleCreateProduct} />
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

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Users, BarChart3, Truck, Settings, Smartphone, ArrowRight, Lock, Search, RotateCcw, Trash2 } from 'lucide-react';
import { useWMSAccess } from '@/hooks/useWMSAccess';
import { InventarioTab } from './components/InventarioTab';
import { StockTab } from './components/StockTab';
import { ComprasTab } from './components/ComprasTab';
import { ProveedoresTab } from './components/ProveedoresTab';
import { RecepcionTab } from './components/RecepcionTab';
import { CatalogoGPSTab } from './components/CatalogoGPSTab';
import { ConfiguracionTab } from './components/ConfiguracionTab';
import { GPSResearchTab } from './components/GPSResearchTab';
import { RMATab } from './components/RMATab';
import { DesechosTab } from './components/DesechosTab';

interface EmptyModuleCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actionText: string;
  onAction: () => void;
}

const EmptyModuleCard = ({ title, description, icon: Icon, actionText, onAction }: EmptyModuleCardProps) => (
  <Card className="max-w-md mx-auto">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <CardTitle>{title}</CardTitle>
      <CardDescription className="text-center">
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent className="text-center">
      <p className="text-sm text-muted-foreground mb-6">
        Este módulo estará disponible próximamente. Mientras tanto, puedes empezar configurando tu inventario.
      </p>
      <Button onClick={onAction} variant="outline" className="w-full">
        {actionText}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </CardContent>
  </Card>
);

export const WMSPage = () => {
  const [activeTab, setActiveTab] = useState('inventario');
  const { hasWMSAccess, canAccessWMS } = useWMSAccess();

  if (!canAccessWMS()) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema WMS - GPS</h1>
          <p className="text-muted-foreground">
            Gestión integral de inventario, compras y almacén para dispositivos GPS
          </p>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription className="text-center">
              No tienes permisos para acceder al módulo WMS
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Solo los usuarios con roles de administrador, coordinador de operaciones o monitorista 
              pueden acceder a este módulo. Contacta a tu administrador si necesitas acceso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistema WMS - GPS</h1>
        <p className="text-muted-foreground">
          Gestión integral de inventario, compras y almacén para dispositivos GPS
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full h-12 overflow-x-auto gap-1 flex-wrap sm:flex-nowrap">
          <TabsTrigger value="inventario" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="compras" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Compras
          </TabsTrigger>
          <TabsTrigger value="proveedores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Proveedores
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="recepcion" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Recepción
          </TabsTrigger>
          <TabsTrigger value="devoluciones" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Devoluciones
          </TabsTrigger>
          <TabsTrigger value="desechos" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Desechos
          </TabsTrigger>
          <TabsTrigger value="catalogo" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Catálogo GPS
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Investigación
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventario">
          <InventarioTab />
        </TabsContent>

        <TabsContent value="compras">
          <ComprasTab />
        </TabsContent>

        <TabsContent value="proveedores">
          <ProveedoresTab />
        </TabsContent>

        <TabsContent value="stock">
          <StockTab />
        </TabsContent>

        <TabsContent value="recepcion">
          <RecepcionTab />
        </TabsContent>

        <TabsContent value="devoluciones">
          <RMATab />
        </TabsContent>

        <TabsContent value="desechos">
          <DesechosTab />
        </TabsContent>

        <TabsContent value="catalogo">
          <CatalogoGPSTab />
        </TabsContent>
        
        <TabsContent value="research">
          <GPSResearchTab />
        </TabsContent>
        
        <TabsContent value="configuracion">
          <ConfiguracionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WMSPage;

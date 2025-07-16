
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart, Users, BarChart3, Truck, Settings, Smartphone } from 'lucide-react';
import { InventarioTab } from './components/InventarioTab';
import { StockTab } from './components/StockTab';
import { ComprasTab } from './components/ComprasTab';

export const WMSPage = () => {
  const [activeTab, setActiveTab] = useState('inventario');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistema WMS - GPS</h1>
        <p className="text-muted-foreground">
          Gestión integral de inventario, compras y almacén para dispositivos GPS
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 h-12">
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
          <TabsTrigger value="catalogo-gps" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Catálogo GPS
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
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Módulo de Proveedores</h3>
            <p className="text-muted-foreground">En desarrollo</p>
          </div>
        </TabsContent>

        <TabsContent value="stock">
          <StockTab />
        </TabsContent>

        <TabsContent value="recepcion">
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Módulo de Recepción</h3>
            <p className="text-muted-foreground">En desarrollo</p>
          </div>
        </TabsContent>

        <TabsContent value="catalogo-gps">
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Catálogo GPS</h3>
            <p className="text-muted-foreground">En desarrollo</p>
          </div>
        </TabsContent>

        <TabsContent value="configuracion">
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Configuración</h3>
            <p className="text-muted-foreground">En desarrollo</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WMSPage;

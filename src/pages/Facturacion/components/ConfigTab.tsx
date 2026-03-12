import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, HelpCircle, Package } from 'lucide-react';
import { GestionClientesTab } from './GestionClientes/GestionClientesTab';
import { EstadiasPanel } from './CxPOperativo/Estadias/EstadiasPanel';
import { ManualFacturacionTab } from './Manual/ManualFacturacionTab';
import { GadgetsConsolidadoTab } from './Config/GadgetsConsolidadoTab';

export function ConfigTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de clientes, reglas de cortesía y manual del módulo.
        </p>
      </div>

      <Tabs defaultValue="clientes" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="clientes" className="text-xs h-7 px-3 gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="estadias" className="text-xs h-7 px-3 gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Reglas Estadías
          </TabsTrigger>
          <TabsTrigger value="gadgets" className="text-xs h-7 px-3 gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Gadgets
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs h-7 px-3 gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-4">
          <GestionClientesTab />
        </TabsContent>
        <TabsContent value="estadias" className="mt-4">
          <EstadiasPanel />
        </TabsContent>
        <TabsContent value="gadgets" className="mt-4">
          <GadgetsConsolidadoTab />
        </TabsContent>
        <TabsContent value="manual" className="mt-4">
          <ManualFacturacionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

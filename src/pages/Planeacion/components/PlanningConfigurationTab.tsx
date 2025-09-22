import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, MapPin, DollarSign, Database, Navigation } from 'lucide-react';

// Lazy import de componentes existentes para configuración
import ClientesTab from './ClientesTab';
import { CustodiosTab } from './CustodiosTab';
import { MatrizPreciosTab } from './MatrizPreciosTab';
import { ManageMeetingPointsTab } from './configuration/ManageMeetingPointsTab';

export function PlanningConfigurationTab() {
  const [activeConfigTab, setActiveConfigTab] = useState('clientes');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
        <p className="text-muted-foreground">
          Gestión de maestros y configuraciones del sistema de planeación
        </p>
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="custodios" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Custodios
          </TabsTrigger>
          <TabsTrigger value="ubicaciones" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Ubicaciones
          </TabsTrigger>
          <TabsTrigger value="precios" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Matriz Precios
          </TabsTrigger>
        </TabsList>

        {/* Clientes Tab */}
        <TabsContent value="clientes" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClientesTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custodios Tab */}
        <TabsContent value="custodios" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Gestión de Custodios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustodiosTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ubicaciones Tab */}
        <TabsContent value="ubicaciones" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Gestión de Ubicaciones Favoritas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ManageMeetingPointsTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matriz Precios Tab */}
        <TabsContent value="precios" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Matriz de Precios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MatrizPreciosTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Database className="h-6 w-6" />
              <span className="text-sm">Sincronizar Datos</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Importar Clientes</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <MapPin className="h-6 w-6" />
              <span className="text-sm">Actualizar Custodios</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">Revisar Precios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Users, Database, DollarSign, MapPin } from 'lucide-react';
import ProveedoresArmadosTab from './ProveedoresArmadosTab';
import ParametrosOperacionalesTab from './ParametrosOperacionalesTab';
import EsquemasArmadosTab from './EsquemasArmadosTab';
import CustodiosZonasTab from './CustodiosZonasTab';

export function PlanningConfigurationTab() {
  const [activeTab, setActiveTab] = useState('proveedores-armados');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Configuración de Planeación</h2>
        <p className="text-muted-foreground">
          Configura proveedores, parámetros operacionales y ajustes del sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="proveedores-armados" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Proveedores</span>
            <span className="sm:hidden">Prov</span>
          </TabsTrigger>
          <TabsTrigger value="esquemas" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Esquemas</span>
            <span className="sm:hidden">$$</span>
          </TabsTrigger>
          <TabsTrigger value="zonas-custodios" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Zonas Base</span>
            <span className="sm:hidden">Zonas</span>
          </TabsTrigger>
          <TabsTrigger value="parametros" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Parámetros</span>
            <span className="sm:hidden">Conf</span>
          </TabsTrigger>
          <TabsTrigger value="datos" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Datos</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proveedores-armados">
          <ProveedoresArmadosTab />
        </TabsContent>

        <TabsContent value="esquemas">
          <EsquemasArmadosTab />
        </TabsContent>

        <TabsContent value="zonas-custodios">
          <CustodiosZonasTab />
        </TabsContent>

        <TabsContent value="parametros">
          <ParametrosOperacionalesTab />
        </TabsContent>

        <TabsContent value="datos">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Datos</CardTitle>
              <CardDescription>
                Migración de datos históricos, sincronización y mantenimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Gestión de datos - Próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PlanningConfigurationTab;
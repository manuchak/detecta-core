import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Settings, BarChart3, Smartphone } from 'lucide-react';

export default function PlanningHub() {
  const [activeTab, setActiveTab] = useState('create-request');

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Hub de Planeación</h1>
        <p className="text-muted-foreground">
          Gestiona solicitudes de servicios desde clientes hasta asignación de custodios
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="create-request" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Crear Solicitud
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="gps-comodatos" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            GPS Comodatos
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Crear Solicitud - Placeholder */}
        <TabsContent value="create-request" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Creación de Solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <PlusCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Workflow en Construcción</h3>
                <p className="text-muted-foreground">
                  El flujo de creación de solicitudes estará disponible pronto.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Placeholder */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Operativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Dashboard en Construcción</h3>
                <p className="text-muted-foreground">
                  Los KPIs operativos estarán disponibles pronto.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GPS Comodatos - Placeholder */}
        <TabsContent value="gps-comodatos" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>GPS Comodatos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Módulo en Construcción</h3>
                <p className="text-muted-foreground">
                  El módulo de GPS comodatos estará disponible pronto.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración Placeholder */}
        <TabsContent value="configuration" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Configuración en Construcción</h3>
                <p className="text-muted-foreground">
                  Las opciones de configuración estarán disponibles pronto.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
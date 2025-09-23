import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Settings, BarChart3, Smartphone, Calendar, TrendingUp } from 'lucide-react';
import { RequestCreationWorkflow } from './components/RequestCreationWorkflow';
import { OperationalDashboard } from './components/OperationalDashboard';
import { ComodatosGPSTab } from './components/ComodatosGPSTab';
import { PlanningConfigurationTab } from './components/PlanningConfigurationTab';
import { ScheduledServicesTab } from './components/ScheduledServicesTab';
import { AdminPerformanceTab } from './components/AdminPerformanceTab';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';

export default function PlanningHub() {
  const [activeTab, setActiveTab] = useState('create-request');
  const { logSecurityEvent } = useSecurityAudit();

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
        <TabsList className="grid w-full grid-cols-6 lg:w-[1200px]">
          <TabsTrigger value="create-request" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Crear Solicitud
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="scheduled-services" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Servicios Programados
          </TabsTrigger>
          <TabsTrigger value="gps-comodatos" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            GPS Comodatos
          </TabsTrigger>
          <TabsTrigger value="admin-performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Admin
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Crear Solicitud - Core Workflow */}
        <TabsContent value="create-request" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Creación de Solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestCreationWorkflow />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Operativo */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <OperationalDashboard />
        </TabsContent>

        {/* Servicios Programados */}
        <TabsContent value="scheduled-services" className="space-y-6 mt-6">
          <ScheduledServicesTab />
        </TabsContent>

        {/* GPS Comodatos - Workflow Independiente */}
        <TabsContent value="gps-comodatos" className="space-y-6 mt-6">
          <ComodatosGPSTab />
        </TabsContent>

        {/* Admin Performance Dashboard */}
        <TabsContent value="admin-performance" className="space-y-6 mt-6">
          <AdminPerformanceTab />
        </TabsContent>

        {/* Configuración - Maestros Simplificados */}
        <TabsContent value="configuration" className="space-y-6 mt-6">
          <PlanningConfigurationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
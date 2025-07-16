import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  MapPin, 
  ClipboardCheck, 
  Package, 
  TrendingUp,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import InstallerManagement from './InstallerManagement';
import { PagosInstaladores } from './components/PagosInstaladores';
import { UbicacionInstaladores } from './components/UbicacionInstaladores';
import { NormasInstalacion } from './components/NormasInstalacion';
import { InventarioInstaladores } from './components/InventarioInstaladores';
import { MetricasInstaladores } from './components/MetricasInstaladores';

const GestionInstaladores = () => {
  const [activeTab, setActiveTab] = useState('instaladores');

  // Estadísticas generales
  const estadisticasGenerales = {
    totalInstaladores: 45,
    instaladoresActivos: 38,
    pagosRealizados: 156780,
    serviciosCompletados: 342
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Instaladores</h1>
          <p className="text-muted-foreground mt-1">
            Sistema completo de control y seguimiento de instaladores
          </p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instaladores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasGenerales.totalInstaladores}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{estadisticasGenerales.instaladoresActivos}</span> activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Mes Actual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${estadisticasGenerales.pagosRealizados.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios Completados</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasGenerales.serviciosCompletados}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              Basada en evaluaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="instaladores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Instaladores
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="ubicacion" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ubicación
          </TabsTrigger>
          <TabsTrigger value="normas" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Normas
          </TabsTrigger>
          <TabsTrigger value="inventario" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="metricas" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instaladores" className="space-y-4">
          <InstallerManagement />
        </TabsContent>

        <TabsContent value="pagos" className="space-y-4">
          <PagosInstaladores />
        </TabsContent>

        <TabsContent value="ubicacion" className="space-y-4">
          <UbicacionInstaladores />
        </TabsContent>

        <TabsContent value="normas" className="space-y-4">
          <NormasInstalacion />
        </TabsContent>

        <TabsContent value="inventario" className="space-y-4">
          <InventarioInstaladores />
        </TabsContent>

        <TabsContent value="metricas" className="space-y-4">
          <MetricasInstaladores />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GestionInstaladores;
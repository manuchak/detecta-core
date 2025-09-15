
// @ts-nocheck
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import SupplyChainMetrics from "@/components/monitoring/SupplyChainMetrics";
import MapDisplay from "@/components/monitoring/MapDisplay";

const SupplyChainMonitoring = () => {
  const [refreshing, setRefreshing] = useState(false);

  // Mock metrics data
  const metricsData = {
    onTimeCount: 42,
    onTimePercent: 84,
    delayedCount: 8,
    delayedPercent: 16,
    riskZones: 3,
    riskZonePercent: 12,
    activeIncidents: {
      critical: 2,
      major: 3,
      minor: 5
    },
    totalServices: 50
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <div className="p-0 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-4 lg:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoreo de Cadena de Suministro</h1>
          <p className="text-muted-foreground">Visibilidad en tiempo real de tu operación logística</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="gap-2 whitespace-nowrap" 
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="map">
            <TabsList className="mb-2">
              <TabsTrigger value="map">Mapa de Rutas</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="mt-0">
              <MapDisplay className="h-[600px]" title="Rutas de Distribución" />
            </TabsContent>
            
            <TabsContent value="metrics" className="mt-0">
              <SupplyChainMetrics 
                onTimeCount={metricsData.onTimeCount}
                onTimePercent={metricsData.onTimePercent}
                delayedCount={metricsData.delayedCount}
                delayedPercent={metricsData.delayedPercent}
                riskZones={metricsData.riskZones}
                riskZonePercent={metricsData.riskZonePercent}
                activeIncidents={metricsData.activeIncidents}
                totalServices={metricsData.totalServices}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Side panel */}
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Estado de Envíos</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">En Tránsito</span>
                <span className="font-medium">42</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entregados Hoy</span>
                <span className="font-medium">28</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retrasados</span>
                <span className="font-medium text-destructive">7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eficiencia de Entrega</span>
                <span className="font-medium text-primary">94%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Resumen de Inventario</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Almacenes Activos</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de SKUs</span>
                <span className="font-medium">1,245</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nivel de Inventario</span>
                <span className="font-medium text-amber-500">78%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Productos críticos</span>
                <span className="font-medium text-destructive">12</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainMonitoring;

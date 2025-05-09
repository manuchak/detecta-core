
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import ActiveServiceCard from "@/components/monitoring/ActiveServiceCard";
import ServiceDetailsPanel from "@/components/monitoring/ServiceDetailsPanel";
import WeatherWidget from "@/components/monitoring/WeatherWidget";
import TwitterFeed from "@/components/monitoring/TwitterFeed";
import MapDisplay from "@/components/monitoring/MapDisplay";

interface Vehicle {
  id: string;
  plate: string;
  status: string;
  lastUpdate: string;
}

const MonitoringPage = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const activeServices = [
    { id: "1", client: "Transportes ABC", vehicle: "ABC-123", status: "En ruta", progress: 65, destination: "CDMX", startTime: "10:30", eta: "12:45" },
    { id: "2", client: "Logística XYZ", vehicle: "XYZ-456", status: "Detenido", progress: 30, destination: "Querétaro", startTime: "09:15", eta: "14:30" },
    { id: "3", client: "Distribuidora 123", vehicle: "123-789", status: "En ruta", progress: 80, destination: "Puebla", startTime: "08:45", eta: "11:20" },
    { id: "4", client: "Fletes Rápidos", vehicle: "RAP-101", status: "Cargando", progress: 10, destination: "Toluca", startTime: "11:00", eta: "15:45" },
  ];

  // Mock function to handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Find service by ID for ServiceDetailsPanel
  const selectedServiceData = activeServices.find(service => service.id === selectedService);

  return (
    <div className="p-0 lg:p-6">
      <div className="flex justify-between items-center mb-6 px-4 lg:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoreo de Servicios</h1>
          <p className="text-muted-foreground">Visualiza y gestiona servicios en tiempo real</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="map">
            <TabsList className="mb-2">
              <TabsTrigger value="map">Mapa</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="mt-0">
              <MapDisplay className="h-[500px]" />
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <Card className="h-[500px] overflow-auto">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeServices.map((service) => (
                      <ActiveServiceCard
                        key={service.id}
                        id={service.id}
                        serviceId={service.id}
                        driver={service.client}
                        vehicleType={service.vehicle}
                        destination={service.destination}
                        eta={service.eta}
                        progress={service.progress}
                        status={service.status === "En ruta" ? "on-time" : "delayed"}
                        isSelected={service.id === selectedService}
                        onClick={() => setSelectedService(service.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {selectedService && selectedServiceData && (
            <ServiceDetailsPanel 
              service={{
                id: selectedServiceData.id,
                serviceId: selectedServiceData.id,
                driver: selectedServiceData.client,
                vehicleType: selectedServiceData.vehicle,
                origin: "Ciudad de origen",
                destination: selectedServiceData.destination,
                eta: selectedServiceData.eta,
                progress: selectedServiceData.progress,
                status: selectedServiceData.status === "En ruta" ? "on-time" : "delayed",
                custodian: "Custodio asignado",
                trackingId: `TRK-${selectedServiceData.id}`,
              }}
              onClose={() => setSelectedService(null)} 
            />
          )}
        </div>

        {/* Side panel for additional info */}
        <div className="space-y-6">
          <WeatherWidget />
          <TwitterFeed />
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;

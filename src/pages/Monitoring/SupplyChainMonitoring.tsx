
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Filter, Map, RefreshCw, Search } from "lucide-react";
import TwitterFeed from "@/components/monitoring/TwitterFeed";
import WeatherWidget from "@/components/monitoring/WeatherWidget";
import ActiveServiceCard from "@/components/monitoring/ActiveServiceCard";
import ServiceDetailsPanel from "@/components/monitoring/ServiceDetailsPanel";
import SupplyChainMetrics from "@/components/monitoring/SupplyChainMetrics";
import { calculateETA, calculateRiskScore, calculateServiceProgress } from "@/utils/supplyChainCalculations";

// Mock data for services
const mockServices = [
  {
    id: "001",
    serviceId: "001",
    driver: "Carlos Méndez",
    vehicleType: "Camión 3.5T",
    origin: "CDMX - Centro de Distribución",
    destination: "Puebla - Tienda Central",
    trackingId: "TRK12345",
    custodian: "Carlos Méndez",
    expectedArrivalTime: new Date(2025, 4, 9, 15, 20),
    departureTime: new Date(2025, 4, 9, 12, 0),
    currentLocation: { lat: 19.3456, lng: -98.6789 },
    progress: 65,
    incidents: [
      { type: "traffic", delayMinutes: 30 },
      { type: "weather", delayMinutes: 20 }
    ],
    status: "delayed"
  },
  {
    id: "002",
    serviceId: "002",
    driver: "Miguel Ángel Pérez",
    vehicleType: "Van de carga",
    origin: "CDMX - Centro de Distribución",
    destination: "Xalapa - Centro",
    trackingId: "TRK67890",
    custodian: "Miguel Ángel Pérez",
    expectedArrivalTime: new Date(2025, 4, 9, 13, 15),
    departureTime: new Date(2025, 4, 9, 9, 0),
    currentLocation: { lat: 19.5432, lng: -96.9012 },
    progress: 50,
    incidents: [],
    status: "on-time"
  },
  {
    id: "003",
    serviceId: "003",
    driver: "Laura Sánchez",
    vehicleType: "Camión 5T",
    origin: "CDMX - Centro de Distribución",
    destination: "Querétaro - Bodega Principal",
    trackingId: "TRK23456",
    custodian: "Laura Sánchez",
    expectedArrivalTime: new Date(2025, 4, 9, 14, 30),
    departureTime: new Date(2025, 4, 9, 10, 30),
    currentLocation: { lat: 20.5872, lng: -100.3893 },
    progress: 75,
    incidents: [
      { type: "roadblock", delayMinutes: 45 }
    ],
    status: "delayed"
  },
  {
    id: "004",
    serviceId: "004",
    driver: "Roberto Díaz",
    vehicleType: "Van de carga",
    origin: "CDMX - Centro de Distribución",
    destination: "Toluca - Centro Comercial",
    trackingId: "TRK34567",
    custodian: "Roberto Díaz",
    expectedArrivalTime: new Date(2025, 4, 9, 12, 45),
    departureTime: new Date(2025, 4, 9, 11, 0),
    currentLocation: { lat: 19.2826, lng: -99.6557 },
    progress: 90,
    incidents: [],
    status: "on-time"
  },
  {
    id: "005",
    serviceId: "005",
    driver: "Ana Martínez",
    vehicleType: "Camión 10T",
    origin: "CDMX - Centro de Distribución",
    destination: "Cuernavaca - Almacén Central",
    trackingId: "TRK45678",
    custodian: "Ana Martínez",
    expectedArrivalTime: new Date(2025, 4, 9, 17, 0),
    departureTime: new Date(2025, 4, 9, 14, 0),
    currentLocation: { lat: 18.9261, lng: -99.2264 },
    progress: 30,
    incidents: [],
    status: "on-time"
  },
  {
    id: "006",
    serviceId: "006",
    driver: "Javier López",
    vehicleType: "Camión 3.5T",
    origin: "CDMX - Centro de Distribución",
    destination: "Pachuca - Tienda Principal",
    trackingId: "TRK56789",
    custodian: "Javier López",
    expectedArrivalTime: new Date(2025, 4, 9, 16, 15),
    departureTime: new Date(2025, 4, 9, 13, 15),
    currentLocation: { lat: 20.1011, lng: -98.7591 },
    progress: 45,
    incidents: [
      { type: "traffic", delayMinutes: 15 }
    ],
    status: "delayed"
  }
];

// Calculate metrics
const calculateMetrics = (services: typeof mockServices) => {
  const totalServices = services.length;
  const onTimeServices = services.filter(s => s.status === "on-time");
  const delayedServices = services.filter(s => s.status === "delayed");
  
  return {
    onTimeCount: onTimeServices.length,
    onTimePercent: Math.round((onTimeServices.length / totalServices) * 100),
    delayedCount: delayedServices.length,
    delayedPercent: Math.round((delayedServices.length / totalServices) * 100),
    riskZones: 2,
    riskZonePercent: 17,
    activeIncidents: {
      critical: 2,
      major: 1,
      minor: 2
    },
    totalServices
  };
};

// Format time for display
const formatTime = (date: Date) => {
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export const SupplyChainMonitoring = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState(() => {
    // Process services to add ETA information
    return mockServices.map(service => {
      const eta = formatTime(service.expectedArrivalTime);
      
      // Calculate delay in minutes if any
      let delayMinutes = 0;
      if (service.incidents && service.incidents.length > 0) {
        delayMinutes = service.incidents.reduce((sum, inc) => sum + inc.delayMinutes, 0);
      }
      
      return {
        ...service,
        eta,
        delayMinutes: service.status === "delayed" ? delayMinutes : 0
      };
    });
  });
  
  // Metrics calculation
  const metrics = calculateMetrics(services);
  
  // Filter services based on search
  const filteredServices = services.filter(service => {
    const searchLower = searchQuery.toLowerCase();
    return (
      service.driver.toLowerCase().includes(searchLower) ||
      service.destination.toLowerCase().includes(searchLower) ||
      service.serviceId.toLowerCase().includes(searchLower)
    );
  });
  
  // Get details of selected service
  const selectedServiceDetails = services.find(s => s.id === selectedService);
  
  // Update time and progress periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setServices(currentServices => 
        currentServices.map(service => {
          // Update progress based on time
          const updatedProgress = calculateServiceProgress(
            service.departureTime,
            service.expectedArrivalTime
          );
          
          return {
            ...service,
            progress: updatedProgress
          };
        })
      );
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);

  const handleServiceClick = (id: string) => {
    setSelectedService(id);
  };

  const handleCloseDetails = () => {
    setSelectedService(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Monitoreo de Cadena de Suministro</h1>
          <p className="text-muted-foreground">
            Servicios activos e incidentes en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            Actualizado: {new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')} p.m.
          </span>
        </div>
      </div>
      
      {/* Twitter Feed and Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <TwitterFeed />
        </div>
        <div>
          <h3 className="font-medium text-sm mb-2">Condiciones climáticas</h3>
          <WeatherWidget />
        </div>
      </div>
      
      {/* Metrics */}
      <SupplyChainMetrics {...metrics} />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm border">
            <CardContent className="p-4">
              <Tabs defaultValue="list">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="list" className="flex gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Servicios</span>
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex gap-2">
                      <Map className="h-4 w-4" />
                      <span>Mapa</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar servicio..." 
                        className="pl-8 w-[200px]" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="list" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {filteredServices.length > 0 ? (
                      filteredServices.map((service) => (
                        <ActiveServiceCard
                          key={service.id}
                          id={service.id}
                          serviceId={service.serviceId}
                          driver={service.driver}
                          vehicleType={service.vehicleType}
                          destination={service.destination}
                          eta={service.eta}
                          progress={service.progress}
                          status={service.status}
                          delayMinutes={service.delayMinutes}
                          onClick={handleServiceClick}
                        />
                      ))
                    ) : (
                      <div className="col-span-2 p-8 text-center">
                        <p className="text-muted-foreground">No se encontraron servicios</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="map" className="mt-0">
                  <div className="aspect-video bg-accent/20 rounded-md flex items-center justify-center mt-4">
                    <div className="text-center p-8">
                      <Map className="h-12 w-12 mb-2 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground text-lg font-medium">Vista de mapa en desarrollo</p>
                      <p className="text-muted-foreground max-w-md mx-auto mt-2">
                        Se integrará próximamente con datos reales de los servidores de GPS.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          {selectedServiceDetails ? (
            <ServiceDetailsPanel
              service={{
                ...selectedServiceDetails,
                serviceId: selectedServiceDetails.serviceId
              }}
              onClose={handleCloseDetails}
            />
          ) : (
            <Card className="bg-white shadow-sm border h-full">
              <CardContent className="p-4 flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <div className="bg-blue-100 p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <Map className="h-8 w-8 text-blue-700" />
                  </div>
                  <p className="text-lg font-medium">Detalles del servicio</p>
                  <p className="text-muted-foreground mt-2">
                    Selecciona un servicio para ver los detalles
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplyChainMonitoring;

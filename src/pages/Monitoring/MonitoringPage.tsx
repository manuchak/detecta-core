
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Filter,
  RefreshCw,
  Shield,
  AlarmClock,
  Gauge,
  Car,
  MapPin,
  Calendar,
  CircleCheck,
  TriangleAlert,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for monitoring
const mockVehicles = [
  {
    id: "VH-001",
    plate: "ABC-123",
    client: "Transportes Rápidos",
    driver: "Juan Pérez",
    lastUpdate: "2025-05-09T15:30:00",
    status: "active",
    speed: 65,
    location: "Ciudad de México, CDMX",
    alerts: 0,
    battery: 95,
    signal: "high"
  },
  {
    id: "VH-002",
    plate: "XYZ-789",
    client: "Logística Internacional",
    driver: "María López",
    lastUpdate: "2025-05-09T15:28:00",
    status: "active",
    speed: 0,
    location: "Monterrey, NL",
    alerts: 2,
    battery: 82,
    signal: "medium"
  },
  {
    id: "VH-003",
    plate: "DEF-456",
    client: "Cargas Expresas",
    driver: "Roberto Díaz",
    lastUpdate: "2025-05-09T14:15:00",
    status: "inactive",
    speed: 0,
    location: "Guadalajara, JAL",
    alerts: 1,
    battery: 45,
    signal: "low"
  },
  {
    id: "VH-004",
    plate: "GHI-789",
    client: "Transportadora Nacional",
    driver: "Ana Martínez",
    lastUpdate: "2025-05-09T15:25:00",
    status: "active",
    speed: 78,
    location: "Puebla, PUE",
    alerts: 0,
    battery: 90,
    signal: "high"
  },
  {
    id: "VH-005",
    plate: "JKL-012",
    client: "Fletes Rápidos",
    driver: "Carlos Gutiérrez",
    lastUpdate: "2025-05-09T15:10:00",
    status: "alarm",
    speed: 110,
    location: "Toluca, MEX",
    alerts: 3,
    battery: 88,
    signal: "high"
  },
  {
    id: "VH-006",
    plate: "MNO-345",
    client: "Transportes MX",
    driver: "Laura Sánchez",
    lastUpdate: "2025-05-09T13:45:00",
    status: "inactive",
    speed: 0,
    location: "Querétaro, QRO",
    alerts: 0,
    battery: 30,
    signal: "zero"
  },
  {
    id: "VH-007",
    plate: "PQR-678",
    client: "Seguridad Logística",
    driver: "Fernando Ortiz",
    lastUpdate: "2025-05-09T15:22:00",
    status: "active",
    speed: 52,
    location: "Mérida, YUC",
    alerts: 1,
    battery: 75,
    signal: "medium"
  },
  {
    id: "VH-008",
    plate: "STU-901",
    client: "Transporte de Valores",
    driver: "Patricia Ramírez",
    lastUpdate: "2025-05-09T15:00:00",
    status: "stopped",
    speed: 0,
    location: "León, GTO",
    alerts: 0,
    battery: 85,
    signal: "high"
  },
];

// Mock statistics data
const mockStats = {
  totalVehicles: 42,
  activeVehicles: 32,
  inactiveVehicles: 8,
  alertVehicles: 2,
  averageSpeed: 48,
  totalAlerts: 12,
  batteryIssues: 3,
  signalIssues: 2,
  productivity: 87
};

// Format date to human readable format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// Get status badge based on vehicle status
const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>;
    case "inactive":
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactivo</Badge>;
    case "alarm":
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Alerta</Badge>;
    case "stopped":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Detenido</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

// Get signal indicator based on signal strength
const getSignalIndicator = (signal: string) => {
  switch (signal) {
    case "high":
      return <div className="flex items-center"><div className="w-2 h-5 bg-green-500 rounded-sm mr-0.5"></div><div className="w-2 h-7 bg-green-500 rounded-sm mr-0.5"></div><div className="w-2 h-9 bg-green-500 rounded-sm"></div></div>;
    case "medium":
      return <div className="flex items-center"><div className="w-2 h-5 bg-green-500 rounded-sm mr-0.5"></div><div className="w-2 h-7 bg-green-500 rounded-sm mr-0.5"></div><div className="w-2 h-9 bg-gray-300 rounded-sm"></div></div>;
    case "low":
      return <div className="flex items-center"><div className="w-2 h-5 bg-yellow-500 rounded-sm mr-0.5"></div><div className="w-2 h-7 bg-gray-300 rounded-sm mr-0.5"></div><div className="w-2 h-9 bg-gray-300 rounded-sm"></div></div>;
    case "zero":
      return <div className="flex items-center"><div className="w-2 h-5 bg-red-500 rounded-sm mr-0.5"></div><div className="w-2 h-7 bg-gray-300 rounded-sm mr-0.5"></div><div className="w-2 h-9 bg-gray-300 rounded-sm"></div></div>;
    default:
      return <div className="flex items-center"><div className="w-2 h-5 bg-gray-300 rounded-sm mr-0.5"></div><div className="w-2 h-7 bg-gray-300 rounded-sm mr-0.5"></div><div className="w-2 h-9 bg-gray-300 rounded-sm"></div></div>;
  }
};

export const MonitoringPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  // Filter vehicles based on search and status
  const filteredVehicles = mockVehicles.filter((vehicle) => {
    const matchesSearch = 
      vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || vehicle.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Monitoreo en vivo</h1>
        <p className="text-muted-foreground mt-1">
          Panel de control para monitoreo de servicios activos GPS.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
        {/* Security Stats */}
        <Card className="w-full md:w-1/3 card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-medium text-foreground flex items-center">
              <Shield className="mr-2 h-5 w-5 text-primary" />
              Seguridad
            </CardTitle>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {mockStats.alertVehicles} alertas
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vehículos activos</p>
                <p className="text-2xl font-medium">{mockStats.activeVehicles}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Alertas totales</p>
                <p className="text-2xl font-medium">{mockStats.totalAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Safety Stats */}
        <Card className="w-full md:w-1/3 card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-medium text-foreground flex items-center">
              <AlarmClock className="mr-2 h-5 w-5 text-primary" />
              Seguridad operativa
            </CardTitle>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              {mockStats.batteryIssues + mockStats.signalIssues} problemas
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Batería baja</p>
                <p className="text-2xl font-medium">{mockStats.batteryIssues}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Señal débil</p>
                <p className="text-2xl font-medium">{mockStats.signalIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Productivity Stats */}
        <Card className="w-full md:w-1/3 card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-medium text-foreground flex items-center">
              <Gauge className="mr-2 h-5 w-5 text-primary" />
              Productividad
            </CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {mockStats.productivity}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vel. promedio</p>
                <p className="text-2xl font-medium">{mockStats.averageSpeed} km/h</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Inactivos</p>
                <p className="text-2xl font-medium">{mockStats.inactiveVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="fleet" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="fleet" className="flex gap-2">
            <Car className="h-4 w-4" />
            <span>Flota</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex gap-2">
            <MapPin className="h-4 w-4" />
            <span>Mapa</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex gap-2">
            <Calendar className="h-4 w-4" />
            <span>Historial</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fleet">
          <Card className="card-apple">
            <CardHeader className="pb-3">
              <CardTitle>Monitoreo de Flota</CardTitle>
              <p className="text-muted-foreground text-sm">
                Información en tiempo real de los vehículos monitoreados.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="w-full sm:w-1/2 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por placa, cliente, conductor..." 
                    className="pl-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                      <SelectItem value="alarm">Con alertas</SelectItem>
                      <SelectItem value="stopped">Detenidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Conductor</TableHead>
                      <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
                      <TableHead className="hidden md:table-cell">Velocidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última act.</TableHead>
                      <TableHead className="hidden sm:table-cell">Señal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id} className={
                          vehicle.status === "alarm" ? "bg-red-50" : 
                          vehicle.battery < 50 ? "bg-yellow-50" : ""
                        }>
                          <TableCell className="font-medium">{vehicle.plate}</TableCell>
                          <TableCell className="hidden sm:table-cell">{vehicle.client}</TableCell>
                          <TableCell className="hidden md:table-cell">{vehicle.driver}</TableCell>
                          <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{vehicle.location}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {vehicle.speed > 0 ? (
                              <span className={vehicle.speed > 100 ? "text-red-600 font-medium" : ""}>{vehicle.speed} km/h</span>
                            ) : (
                              <span className="text-muted-foreground">Detenido</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(vehicle.status)}
                            {vehicle.alerts > 0 && (
                              <span className="inline-flex items-center justify-center ml-1 w-5 h-5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                {vehicle.alerts}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{formatDate(vehicle.lastUpdate)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              {getSignalIndicator(vehicle.signal)}
                              <div className="w-10 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className={`h-full rounded-full ${
                                    vehicle.battery > 70 ? "bg-green-500" : 
                                    vehicle.battery > 30 ? "bg-yellow-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${vehicle.battery}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No se encontraron vehículos que coincidan con los criterios de búsqueda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {filteredVehicles.length} de {mockVehicles.length} vehículos
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm">
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="map">
          <Card className="card-apple">
            <CardHeader>
              <CardTitle>Vista de Mapa</CardTitle>
              <p className="text-muted-foreground text-sm">
                Visualización geográfica de la flota en tiempo real.
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div className="aspect-video bg-accent/20 rounded-md flex items-center justify-center">
                <div className="text-center p-8">
                  <MapPin className="h-12 w-12 mb-2 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-lg font-medium">Vista de mapa en desarrollo</p>
                  <p className="text-muted-foreground max-w-md mx-auto mt-2">
                    Se integrará próximamente con datos reales de los servidores de GPS.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="card-apple">
            <CardHeader>
              <CardTitle>Historial de Alertas</CardTitle>
              <p className="text-muted-foreground text-sm">
                Registro de alertas y eventos importantes.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-2">
                  <div className="flex flex-1 gap-2 items-center">
                    <div className="rounded-full w-8 h-8 bg-red-100 flex items-center justify-center">
                      <TriangleAlert className="h-4 w-4 text-red-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Exceso de velocidad</p>
                      <p className="text-sm text-muted-foreground">Vehículo JKL-012 registró 110 km/h en zona de 80 km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Hace 25 min</p>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En revisión</Badge>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-2">
                  <div className="flex flex-1 gap-2 items-center">
                    <div className="rounded-full w-8 h-8 bg-yellow-100 flex items-center justify-center">
                      <AlarmClock className="h-4 w-4 text-yellow-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Batería baja</p>
                      <p className="text-sm text-muted-foreground">Vehículo MNO-345 reporta batería al 30%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Hace 1h 15min</p>
                    <Badge variant="outline" className="bg-red-100 text-red-800">Crítico</Badge>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-2">
                  <div className="flex flex-1 gap-2 items-center">
                    <div className="rounded-full w-8 h-8 bg-red-100 flex items-center justify-center">
                      <TriangleAlert className="h-4 w-4 text-red-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Botón de pánico</p>
                      <p className="text-sm text-muted-foreground">Vehículo XYZ-789 activó el botón de pánico</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Hace 1h 30min</p>
                    <Badge variant="outline" className="bg-green-100 text-green-800">Resuelto</Badge>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-2">
                  <div className="flex flex-1 gap-2 items-center">
                    <div className="rounded-full w-8 h-8 bg-blue-100 flex items-center justify-center">
                      <CircleCheck className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Mantenimiento completado</p>
                      <p className="text-sm text-muted-foreground">Vehículo DEF-456 ha completado mantenimiento programado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Hace 3h 45min</p>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">Información</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringPage;

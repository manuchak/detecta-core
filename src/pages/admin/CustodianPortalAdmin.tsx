import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, User, Phone, Mail, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Route, Activity, Ticket, Eye, Settings, UserCheck, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockCustodians = [
  {
    id: '1',
    name: 'Juan Pérez',
    phone: '+52 55 1234 5678',
    email: 'juan.perez@email.com',
    status: 'Activo',
    services: 12,
    tickets: 3,
    lastActivity: '2025-01-17'
  },
  {
    id: '2',
    name: 'María González',
    phone: '+52 55 8765 4321',
    email: 'maria.gonzalez@email.com',
    status: 'Disponible',
    services: 8,
    tickets: 1,
    lastActivity: '2025-01-16'
  },
  {
    id: '3',
    name: 'Carlos Ruiz',
    phone: '+52 55 9999 0000',
    email: 'carlos.ruiz@email.com',
    status: 'No disponible',
    services: 15,
    tickets: 0,
    lastActivity: '2025-01-15'
  }
];

const CustodianPortalAdmin = () => {
  const { toast } = useToast();
  const [selectedCustodian, setSelectedCustodian] = useState<string>(mockCustodians[0].id);

  const handleViewAsUser = (custodianId: string) => {
    const custodian = mockCustodians.find(c => c.id === custodianId);
    toast({
      title: "Vista de custodio",
      description: `Simulando vista de ${custodian?.name}`,
    });
  };

  const currentCustodian = mockCustodians.find(c => c.id === selectedCustodian) || mockCustodians[0];

  // Mock stats for the selected custodian
  const mockStats = {
    total_servicios: currentCustodian.services,
    servicios_completados: Math.floor(currentCustodian.services * 0.8),
    servicios_pendientes: Math.ceil(currentCustodian.services * 0.2),
    km_totales: currentCustodian.services * 45,
    ingresos_totales: currentCustodian.services * 2500
  };

  const mockTicketStats = {
    total: currentCustodian.tickets + 2,
    abiertos: currentCustodian.tickets,
    en_progreso: 1,
    resueltos: 1,
    cerrados: 0
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Portal del Custodio - Vista Admin</h1>
            <p className="text-muted-foreground">Administración y vista previa del portal de custodios</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              <Eye className="h-3 w-3 mr-1" />
              Vista de administrador
            </Badge>
            <Button asChild>
              <Link to="/custodian">
                <UserCheck className="mr-2 h-4 w-4" />
                Ver Portal Real
              </Link>
            </Button>
          </div>
        </div>

        {/* Custodian Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Seleccionar Custodio para Simular
            </CardTitle>
            <CardDescription>
              Selecciona un custodio para ver cómo se vería su portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedCustodian} onValueChange={setSelectedCustodian}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustodians.map((custodian) => (
                      <SelectItem key={custodian.id} value={custodian.id}>
                        {custodian.name} - {custodian.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleViewAsUser(selectedCustodian)}>
                <Eye className="mr-2 h-4 w-4" />
                Vista Previa
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tickets">Sistema de Tickets</TabsTrigger>
            <TabsTrigger value="management">Gestión</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Simulated Custodian Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Custodio: {currentCustodian.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{currentCustodian.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{currentCustodian.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={currentCustodian.status === 'Activo' ? 'default' : 'secondary'}>
                    {currentCustodian.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Última actividad: {currentCustodian.lastActivity}</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Servicios Totales</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.total_servicios}</div>
                  <p className="text-xs text-muted-foreground">
                    {mockStats.servicios_completados} completados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Servicios Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.servicios_pendientes}</div>
                  <p className="text-xs text-muted-foreground">Por completar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kilómetros</CardTitle>
                  <Route className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.km_totales.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">km totales</p>
                </CardContent>
              </Card>

              {/* Tarjeta de Ingresos oculta hasta auditoría completa */}
            </div>

            {/* Recent Services Simulation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Servicios Recientes (Simulado)
                </CardTitle>
                <CardDescription>
                  Vista previa de cómo verían los custodios sus servicios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Empresa ABC</h4>
                      <Badge variant="default">Completado</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Custodia de carga</p>
                      <p>Ciudad de México → Guadalajara</p>
                      <p>Fecha: 16/01/2025</p>
                      <p>Distancia: 540 km</p>
                      <p>Cobro: $8,500 MXN</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Transportes XYZ</h4>
                      <Badge variant="secondary">En progreso</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Custodia especializada</p>
                      <p>Monterrey → Tijuana</p>
                      <p>Fecha: 17/01/2025</p>
                      <p>Distancia: 1,200 km</p>
                      <p>Cobro: $15,000 MXN</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            {/* Ticket Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockTicketStats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockTicketStats.abiertos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockTicketStats.en_progreso}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockTicketStats.resueltos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockTicketStats.cerrados}</div>
                </CardContent>
              </Card>
            </div>

            {/* Mock Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Tickets del Custodio: {currentCustodian.name}
                </CardTitle>
                <CardDescription>
                  Vista previa del sistema de tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Problema con GPS en servicio ABC-123</h4>
                      <div className="flex gap-2">
                        <Badge variant="destructive">Alta</Badge>
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Abierto
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      El dispositivo GPS no está transmitiendo correctamente durante el trayecto Ciudad de México - Guadalajara
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <p>Categoría: GPS</p>
                      <p>Creado: 17/01/2025</p>
                      <p>Servicio: ABC-123</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Solicitud de documentación adicional</h4>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Media</Badge>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          En progreso
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Necesito documentación adicional para el reporte final del servicio XYZ-456
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <p>Categoría: Documentación</p>
                      <p>Creado: 16/01/2025</p>
                      <p>Servicio: XYZ-456</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Gestión del Portal de Custodios
                </CardTitle>
                <CardDescription>
                  Herramientas de administración para el portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Evaluaciones SIERCP</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">Sistema de Evaluación SIERCP</p>
                            <p className="text-sm text-muted-foreground">Sistema Integrado de Evaluación de Riesgo y Confiabilidad Psico-Criminológica</p>
                          </div>
                          <Button asChild size="sm">
                            <Link to="/evaluation/siercp">
                              <Brain className="mr-2 h-4 w-4" />
                              Ir a SIERCP
                            </Link>
                          </Button>
                        </div>
                        <div>
                          <p className="text-sm mb-2">Módulos disponibles:</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">Integridad</Badge>
                            <Badge variant="outline">Psicopatía</Badge>
                            <Badge variant="outline">Riesgo de Violencia</Badge>
                            <Badge variant="outline">Agresividad</Badge>
                            <Badge variant="outline">Afrontamiento</Badge>
                            <Badge variant="outline">Veracidad</Badge>
                            <Badge variant="outline">Entrevista</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Estadísticas Globales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Custodios:</span>
                          <span className="font-medium">{mockCustodians.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custodios Activos:</span>
                          <span className="font-medium">
                            {mockCustodians.filter(c => c.status === 'Activo').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Servicios:</span>
                          <span className="font-medium">
                            {mockCustodians.reduce((acc, c) => acc + c.services, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Tickets:</span>
                          <span className="font-medium">
                            {mockCustodians.reduce((acc, c) => acc + c.tickets, 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración Portal
                  </Button>
                  <Button variant="outline">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Gestionar Roles
                  </Button>
                  <Button variant="outline">
                    <Ticket className="mr-2 h-4 w-4" />
                    Administrar Tickets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustodianPortalAdmin;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, User, Phone, Mail, AlertCircle, CheckCircle, TrendingUp, DollarSign, Route, Activity, Ticket } from "lucide-react";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { useCustodianServices } from "@/hooks/useCustodianServices";
import { useCustodianTickets } from "@/hooks/useCustodianTickets";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const CustodianDashboard = () => {
  const { toast } = useToast();
  const { profile, loading: profileLoading, updateAvailability } = useCustodianProfile();
  const { services, stats, loading: servicesLoading, getRecentServices, getUpcomingServices } = useCustodianServices(profile?.phone);
  const { stats: ticketStats, loading: ticketsLoading } = useCustodianTickets(profile?.phone);

  const loading = profileLoading || servicesLoading || ticketsLoading;

  const handleToggleAvailability = async () => {
    if (!profile) return;
    
    const success = await updateAvailability(!profile.disponibilidad);
    if (success) {
      toast({
        title: "Disponibilidad actualizada",
        description: `Ahora estás ${!profile.disponibilidad ? 'disponible' : 'no disponible'} para servicios`,
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar la disponibilidad",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información del custodio...</p>
        </div>
      </div>
    );
  }

  const recentServices = getRecentServices(3);
  const upcomingServices = getUpcomingServices();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Bienvenido, {profile?.display_name || 'Custodio'}
            </h1>
            <p className="text-muted-foreground">Panel de control del custodio</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={profile?.disponibilidad ? "default" : "secondary"}>
              {profile?.disponibilidad ? "Disponible" : "No disponible"}
            </Badge>
            {!profile?.is_verified && (
              <Badge variant="destructive">
                No verificado
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Totales</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_servicios}</div>
              <p className="text-xs text-muted-foreground">
                {stats.servicios_completados} completados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.servicios_pendientes}</div>
              <p className="text-xs text-muted-foreground">
                Por completar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kilómetros Recorridos</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.km_totales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                km totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.ingresos_totales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                MXN generados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile?.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile?.ciudad}, {profile?.estado}</span>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Última actividad: {profile?.fecha_ultima_actividad ? 
                  new Date(profile.fecha_ultima_actividad).toLocaleDateString('es-ES') : 
                  'Nunca'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleToggleAvailability}
                variant={profile?.disponibilidad ? "outline" : "default"}
                size="sm"
              >
                {profile?.disponibilidad ? 'Marcar como no disponible' : 'Marcar como disponible'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Servicios Recientes
              </CardTitle>
              <CardDescription>
                Últimos servicios realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentServices.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay servicios recientes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentServices.map((service) => (
                    <div key={service.id_servicio} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{service.nombre_cliente}</h4>
                        <Badge variant={
                          ['completado', 'finalizado', 'Completado', 'Finalizado'].includes(service.estado) 
                            ? "default" 
                            : "secondary"
                        }>
                          {service.estado}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{service.tipo_servicio}</p>
                        <p>{service.origen} → {service.destino}</p>
                        <p>Fecha: {new Date(service.fecha_hora_cita).toLocaleDateString('es-ES')}</p>
                        {service.km_recorridos && (
                          <p>Distancia: {service.km_recorridos} km</p>
                        )}
                        {service.cobro_cliente && (
                          <p>Cobro: ${service.cobro_cliente.toLocaleString()} MXN</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Servicios Próximos
              </CardTitle>
              <CardDescription>
                Servicios programados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingServices.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay servicios próximos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingServices.map((service) => (
                    <div key={service.id_servicio} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{service.nombre_cliente}</h4>
                        <Badge variant="outline">
                          {service.estado}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{service.tipo_servicio}</p>
                        <p>{service.origen} → {service.destino}</p>
                        <p>Fecha: {new Date(service.fecha_hora_cita).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Funciones disponibles para custodios
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/custodian/tickets">
                <Ticket className="mr-2 h-4 w-4" />
                Ver mis tickets ({ticketStats.abiertos} abiertos)
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <CheckCircle className="mr-2 h-4 w-4" />
              Ver todos los servicios
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <MapPin className="mr-2 h-4 w-4" />
              Actualizar ubicación
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <Calendar className="mr-2 h-4 w-4" />
              Ver horarios disponibles
            </Button>
            <p className="text-xs text-muted-foreground md:col-span-2 lg:col-span-3 mt-4">
              * Funciones en desarrollo - Se habilitarán en próximas versiones
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustodianDashboard;
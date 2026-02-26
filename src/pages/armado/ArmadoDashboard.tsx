import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useArmadoProfile } from "@/hooks/useArmadoProfile";
import { useArmadoServices } from "@/hooks/useArmadoServices";
import { useCustodianTickets } from "@/hooks/useCustodianTickets";
import { useCustodianTicketsEnhanced } from "@/hooks/useCustodianTicketsEnhanced";
import ArmadoBottomNav, { ArmadoNavItem } from "@/components/armado/ArmadoBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, ClipboardList, MessageCircle, Star, 
  Calendar, MapPin, AlertCircle, DollarSign, Shield
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ArmadoDashboard = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useArmadoProfile();
  const { services, stats, loading: servicesLoading, getRecentServices, refetch: refetchServices } = useArmadoServices(profile?.armado_operativo_id);
  const { stats: ticketStats, loading: ticketsLoading } = useCustodianTickets(profile?.phone);
  const { tickets: allTickets } = useCustodianTicketsEnhanced(profile?.phone || '');
  
  const [refreshing, setRefreshing] = useState(false);

  const loading = profileLoading || servicesLoading || ticketsLoading;

  const serviciosEsteMes = useMemo(() => {
    if (!services.length) return 0;
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return services.filter(s => new Date(s.fecha_hora_cita || s.created_at) >= start).length;
  }, [services]);

  const ingresosEsteMes = useMemo(() => {
    if (!services.length) return 0;
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return services
      .filter(s => new Date(s.fecha_hora_cita || s.created_at) >= start)
      .reduce((sum, s) => sum + (s.tarifa_acordada || 0), 0);
  }, [services]);

  const openTickets = useMemo(() => 
    allTickets.filter(t => t.status === 'abierto' || t.status === 'en_progreso'), 
    [allTickets]
  );

  const handleNavigation = (item: ArmadoNavItem) => {
    switch (item) {
      case 'services': navigate('/armado/services'); break;
      case 'support': navigate('/armado/support'); break;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProfile?.(), refetchServices?.()]);
    } catch {}
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const recentServices = getRecentServices(3);
  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: es });
  const nextPending = services.find(s => 
    ['pendiente', 'confirmado', 'asignado', 'en_ruta'].includes(s.estado_asignacion)
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Hola, {profile?.display_name?.split(' ')[0] || 'Armado'} 👋
            </h1>
            <p className="text-sm text-muted-foreground capitalize">{currentMonth}</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="px-5 py-4 space-y-4">
        {/* Pending tickets alert */}
        {openTickets.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {openTickets.length} ticket{openTickets.length > 1 ? 's' : ''} pendiente{openTickets.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">Revisa el estado en Soporte</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/armado/support')}>
                  Ver
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next service card */}
        {nextPending ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">Próximo Servicio</h3>
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="font-medium">{nextPending.nombre_cliente}</p>
                {nextPending.origen && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{nextPending.origen} → {nextPending.destino}</span>
                  </div>
                )}
                {nextPending.fecha_hora_cita && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(nextPending.fecha_hora_cita).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {nextPending.punto_encuentro && (
                  <p className="text-xs text-muted-foreground">📍 Punto de encuentro: {nextPending.punto_encuentro}</p>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {nextPending.estado_asignacion}
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin servicios próximos asignados</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <ClipboardList className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{serviciosEsteMes}</p>
              <p className="text-[10px] text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold">${ingresosEsteMes.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Ingresos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{profile?.rating_promedio?.toFixed(1) || '—'}</p>
              <p className="text-[10px] text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/armado/services')}>
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs">Ver Servicios</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/armado/support')}>
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Soporte</span>
          </Button>
        </div>

        {/* Recent services */}
        {recentServices.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Servicios Recientes</h3>
            {recentServices.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{service.nombre_cliente}</p>
                    <Badge variant={
                      ['completado', 'finalizado'].includes(service.estado_asignacion) ? "default" : "secondary"
                    } className="text-[10px]">
                      {service.estado_asignacion}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {service.origen} → {service.destino}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{service.fecha_hora_cita ? new Date(service.fecha_hora_cita).toLocaleDateString('es-MX') : ''}</span>
                    {service.tarifa_acordada && (
                      <span className="font-medium text-foreground">${service.tarifa_acordada.toLocaleString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <ArmadoBottomNav 
        activeItem="home" 
        onNavigate={handleNavigation}
        pendingCount={ticketStats?.abiertos || 0}
      />
    </div>
  );
};

export default ArmadoDashboard;

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { useCustodianServices } from "@/hooks/useCustodianServices";
import { useCustodianTickets } from "@/hooks/useCustodianTickets";
import { useToast } from "@/hooks/use-toast";
import AvailabilityToggleBig from "./AvailabilityToggleBig";
import NextServiceCard from "./NextServiceCard";
import QuickStatsMobile from "./QuickStatsMobile";
import QuickActionButtons from "./QuickActionButtons";
import SimpleServiceCard from "./SimpleServiceCard";
import MobileBottomNav, { NavItem } from "./MobileBottomNav";
import { RefreshCw } from "lucide-react";

const MobileDashboardLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading, updateAvailability } = useCustodianProfile();
  const { services, stats, loading: servicesLoading, getUpcomingServices } = useCustodianServices(profile?.phone);
  const { stats: ticketStats, loading: ticketsLoading } = useCustodianTickets(profile?.phone);
  
  const [activeNav, setActiveNav] = useState<NavItem>('home');
  const [refreshing, setRefreshing] = useState(false);

  const loading = profileLoading || servicesLoading || ticketsLoading;

  const upcomingServices = useMemo(() => {
    if (!services || services.length === 0) return [];
    return services.filter(s => new Date(s.fecha_hora_cita) >= new Date());
  }, [services]);
  
  const nextService = upcomingServices[0] || null;

  // Calcular servicios esta semana
  const serviciosEstaSemana = useMemo(() => {
    if (!services || services.length === 0) return 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return services.filter(s => {
      const serviceDate = new Date(s.fecha_hora_cita);
      return serviceDate >= startOfWeek;
    }).length;
  }, [services]);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    
    const success = await updateAvailability(!profile.disponibilidad);
    if (success) {
      toast({
        title: profile.disponibilidad ? "No disponible" : "Disponible",
        description: profile.disponibilidad 
          ? "Ya no recibirás servicios" 
          : "Ahora puedes recibir servicios",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo cambiar tu disponibilidad",
        variant: "destructive"
      });
    }
  };

  const handleNavigation = (item: NavItem) => {
    setActiveNav(item);
    if (item === 'create') {
      navigate('/custodian/tickets');
    } else if (item === 'list') {
      navigate('/custodian/tickets');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Early return AFTER all hooks
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header simple */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Hola, {profile?.display_name?.split(' ')[0] || 'Custodio'} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile?.ciudad || 'Ciudad de México'}
            </p>
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

      {/* Content */}
      <main className="px-5 py-6 space-y-6">
        {/* Toggle de disponibilidad */}
        <AvailabilityToggleBig
          isAvailable={profile?.disponibilidad ?? true}
          onToggle={handleToggleAvailability}
        />

        {/* Próximo servicio */}
        <section>
          <NextServiceCard service={nextService} />
        </section>

        {/* Stats rápidos */}
        <section>
          <QuickStatsMobile
            serviciosEstaSemana={serviciosEstaSemana}
            montosPorCobrar={stats.ingresos_totales}
          />
        </section>

        {/* Acciones rápidas */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            ¿Qué quieres hacer?
          </h2>
          <QuickActionButtons
            onViewServices={() => navigate('/custodian/services')}
            onReportProblem={() => navigate('/custodian/tickets')}
            ticketsAbiertos={ticketStats?.abiertos || 0}
          />
        </section>

        {/* Lista de servicios próximos (si hay más de 1) */}
        {upcomingServices.length > 1 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Otros servicios próximos
            </h2>
            <div className="space-y-3">
              {upcomingServices.slice(1, 4).map((service) => (
                <SimpleServiceCard
                  key={service.id_servicio}
                  service={service}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav
        activeItem={activeNav}
        onNavigate={handleNavigation}
        pendingCount={ticketStats?.abiertos || 0}
      />
    </div>
  );
};

export default MobileDashboardLayout;

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { useCustodianServices } from "@/hooks/useCustodianServices";
import { useCustodianTickets } from "@/hooks/useCustodianTickets";
import { useCustodianMaintenance } from "@/hooks/useCustodianMaintenance";
import { useCustodioIndisponibilidades } from "@/hooks/useCustodioIndisponibilidades";
import { useToast } from "@/hooks/use-toast";
import DashboardHeroAlert from "./DashboardHeroAlert";
import CompactStatsBar from "./CompactStatsBar";
import QuickActionsGrid from "./QuickActionsGrid";
import RecentServicesCollapsible from "./RecentServicesCollapsible";
import UnavailabilityStatusBanner from "./UnavailabilityStatusBanner";
import MobileBottomNavNew, { NavItem } from "./MobileBottomNavNew";
import BatchMaintenanceDialog from "./BatchMaintenanceDialog";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MobileDashboardLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useCustodianProfile();
  const { services, stats, loading: servicesLoading, getRecentServices } = useCustodianServices(profile?.phone);
  const { stats: ticketStats, loading: ticketsLoading } = useCustodianTickets(profile?.phone);
  const { maintenanceStatus, pendingMaintenance, createMaintenance, loading: maintenanceLoading } = useCustodianMaintenance(profile?.phone, stats.km_totales);
  const { crearIndisponibilidad, cancelarIndisponibilidad, custodioTieneIndisponibilidadActiva } = useCustodioIndisponibilidades();
  
  const [activeNav, setActiveNav] = useState<NavItem>('home');
  const [refreshing, setRefreshing] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  const loading = profileLoading || servicesLoading || ticketsLoading || maintenanceLoading;

  // Calcular servicios este mes
  const serviciosEsteMes = useMemo(() => {
    if (!services || services.length === 0) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return services.filter(s => new Date(s.fecha_hora_cita) >= startOfMonth).length;
  }, [services]);

  // Check unavailability (simplified - would need custodio_id in real implementation)
  const currentUnavailability = null; // Placeholder

  const handleNavigation = (item: NavItem) => {
    setActiveNav(item);
    switch (item) {
      case 'services':
        navigate('/custodian/services');
        break;
      case 'vehicle':
        navigate('/custodian/vehicle');
        break;
      case 'support':
        navigate('/custodian/support');
        break;
      default:
        break;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleRecordMaintenance = async (data: any) => {
    return await createMaintenance(data);
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

  const recentServices = getRecentServices(5);
  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: es });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Hola, {profile?.display_name?.split(' ')[0] || 'Custodio'} 👋
            </h1>
            <p className="text-sm text-muted-foreground capitalize">
              {currentMonth}
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
      <main className="px-5 py-4 space-y-4">
        {/* Banner de indisponibilidad si existe */}
        {currentUnavailability && (
          <UnavailabilityStatusBanner
            tipo={currentUnavailability.tipo}
            fechaFin={currentUnavailability.fecha_fin}
            motivo={currentUnavailability.motivo}
          />
        )}

        {/* Hero Alert - Lo más importante primero */}
        <section className="animate-fade-in">
          <DashboardHeroAlert
            maintenanceStatus={maintenanceStatus}
            onRegisterService={() => setShowBatchDialog(true)}
          />
        </section>

        {/* Stats compactos */}
        <section className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CompactStatsBar
            serviciosEsteMes={serviciosEsteMes}
            kmRecorridos={stats.km_totales}
            ingresosTotales={stats.ingresos_totales}
          />
        </section>

        {/* Acciones rápidas */}
        <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <QuickActionsGrid
            onRegisterService={() => setShowBatchDialog(true)}
            onReportUnavailability={() => navigate('/custodian/support')}
            pendingTickets={ticketStats?.abiertos || 0}
          />
        </section>

        {/* Historial colapsable */}
        <section className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <RecentServicesCollapsible
            services={recentServices}
            onViewAll={() => navigate('/custodian/services')}
          />
        </section>
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNavNew
        activeItem={activeNav}
        onNavigate={handleNavigation}
        pendingCount={ticketStats?.abiertos || 0}
      />

      {/* Batch Maintenance Dialog */}
      <BatchMaintenanceDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        currentKm={stats.km_totales}
        onConfirm={handleRecordMaintenance}
      />
    </div>
  );
};

export default MobileDashboardLayout;

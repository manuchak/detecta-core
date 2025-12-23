import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { useCustodianServices } from "@/hooks/useCustodianServices";
import { useCustodianTickets } from "@/hooks/useCustodianTickets";
import { useCustodianTicketsEnhanced, CustodianTicket } from "@/hooks/useCustodianTicketsEnhanced";
import { useCustodianMaintenance } from "@/hooks/useCustodianMaintenance";
import { useCustodioIndisponibilidades } from "@/hooks/useCustodioIndisponibilidades";
import { useToast } from "@/hooks/use-toast";
import DashboardHeroAlert from "./DashboardHeroAlert";
import CompactStatsBar from "./CompactStatsBar";
import QuickActionsGrid from "./QuickActionsGrid";
import RecentServicesCollapsible from "./RecentServicesCollapsible";
import ResolvedTicketAlert from "./ResolvedTicketAlert";
import UnavailabilityStatusBanner from "./UnavailabilityStatusBanner";
import SupportContactModal from "./SupportContactModal";
import MobileBottomNavNew, { NavItem } from "./MobileBottomNavNew";
import BatchMaintenanceDialog from "./BatchMaintenanceDialog";
import { CustodianTicketDetail } from "./CustodianTicketDetail";
import ReportUnavailabilityCard from "./ReportUnavailabilityCard";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MobileDashboardLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useCustodianProfile();
  const { services, stats, loading: servicesLoading, getRecentServices } = useCustodianServices(profile?.phone);
  const { stats: ticketStats, loading: ticketsLoading } = useCustodianTickets(profile?.phone);
  const { getRecentlyResolvedTickets, markTicketAsSeen } = useCustodianTicketsEnhanced(profile?.phone);
  const { maintenanceStatus, pendingMaintenance, createMaintenance, loading: maintenanceLoading } = useCustodianMaintenance(profile?.phone, stats.km_totales);
  const { 
    indisponibilidadesActivas,
    crearIndisponibilidad, 
    cancelarIndisponibilidad,
  } = useCustodioIndisponibilidades();
  
  const [activeNav, setActiveNav] = useState<NavItem>('home');
  const [refreshing, setRefreshing] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showUnavailabilityDialog, setShowUnavailabilityDialog] = useState(false);
  const [selectedResolvedTicket, setSelectedResolvedTicket] = useState<CustodianTicket | null>(null);
  const [dismissedTickets, setDismissedTickets] = useState<Set<string>>(new Set());

  const loading = profileLoading || servicesLoading || ticketsLoading || maintenanceLoading;

  // Calcular servicios este mes
  const serviciosEsteMes = useMemo(() => {
    if (!services || services.length === 0) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return services.filter(s => new Date(s.fecha_hora_cita) >= startOfMonth).length;
  }, [services]);

  // Check unavailability for current custodian from the already-loaded list
  const currentUnavailability = profile?.id 
    ? indisponibilidadesActivas.find((i: any) => i.custodio_id === profile.id)
    : null;

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

  const handleReportUnavailability = async (data: { tipo: string; motivo?: string; dias: number | null }) => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "No se encontró tu perfil de custodio",
        variant: "destructive",
      });
      return false;
    }

    try {
      const fechaFin = data.dias 
        ? new Date(Date.now() + data.dias * 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      // Map tipo to tipo_indisponibilidad enum values
      const tipoMap: Record<string, string> = {
        'falla_mecanica': 'falla_mecanica',
        'enfermedad': 'enfermedad',
        'emergencia_familiar': 'familiar',
        'capacitacion': 'capacitacion',
        'otro': 'otro',
      };
      
      await crearIndisponibilidad.mutateAsync({
        custodio_id: profile.id,
        tipo_indisponibilidad: (tipoMap[data.tipo] || 'otro') as any,
        motivo: data.motivo || 'Sin detalle proporcionado',
        fecha_inicio: new Date().toISOString(),
        fecha_fin_estimada: fechaFin || undefined,
        severidad: 'media',
      });
      
      toast({
        title: "✅ Indisponibilidad registrada",
        description: "Planeación ha sido notificada de tu estado",
      });
      setShowUnavailabilityDialog(false);
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar la indisponibilidad",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleCancelUnavailability = async () => {
    if (!currentUnavailability) return false;
    
    try {
      await cancelarIndisponibilidad.mutateAsync({
        id: currentUnavailability.id,
        motivo_cancelacion: 'Cancelado por el custodio'
      });
      toast({
        title: "✅ Disponibilidad restaurada",
        description: "Ya estás disponible para recibir servicios",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la indisponibilidad",
        variant: "destructive",
      });
      return false;
    }
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
  
  // Get resolved tickets not dismissed
  const resolvedTicketsToShow = getRecentlyResolvedTickets(48).filter(t => !dismissedTickets.has(t.id));

  const handleViewResolvedTicket = (ticket: CustodianTicket) => {
    setSelectedResolvedTicket(ticket);
  };

  const handleDismissTicket = (ticketId: string) => {
    setDismissedTickets(prev => new Set(prev).add(ticketId));
    markTicketAsSeen(ticketId);
  };

  // Show ticket detail if selected
  if (selectedResolvedTicket && profile?.phone) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <main className="px-5 py-4">
          <CustodianTicketDetail
            ticket={selectedResolvedTicket}
            custodianPhone={profile.phone}
            onBack={() => setSelectedResolvedTicket(null)}
          />
        </main>
        <MobileBottomNavNew
          activeItem="support"
          onNavigate={handleNavigation}
          pendingCount={ticketStats?.abiertos || 0}
        />
      </div>
    );
  }

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
        {/* Resolved ticket alert - Good news first! */}
        {resolvedTicketsToShow.length > 0 && (
          <section className="animate-fade-in">
            <ResolvedTicketAlert
              tickets={resolvedTicketsToShow}
              onViewTicket={handleViewResolvedTicket}
              onDismiss={handleDismissTicket}
            />
          </section>
        )}

        {/* Banner de indisponibilidad si existe */}
        {currentUnavailability && (
          <UnavailabilityStatusBanner
            tipo={currentUnavailability.tipo}
            fechaFin={currentUnavailability.fecha_fin}
            motivo={currentUnavailability.motivo}
          />
        )}

        {/* Hero Alert - Lo más importante primero */}
        <section className="animate-fade-in" style={{ animationDelay: resolvedTicketsToShow.length > 0 ? '50ms' : '0ms' }}>
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
            onReportUnavailability={() => setShowUnavailabilityDialog(true)}
            onContactSupport={() => setShowContactModal(true)}
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

      {/* Support Contact Modal */}
      <SupportContactModal
        open={showContactModal}
        onOpenChange={setShowContactModal}
      />

      {/* Unavailability Dialog */}
      <ReportUnavailabilityCard
        open={showUnavailabilityDialog}
        onOpenChange={setShowUnavailabilityDialog}
        onReportUnavailability={handleReportUnavailability}
        isCurrentlyUnavailable={!!currentUnavailability}
        currentUnavailability={currentUnavailability ? {
          tipo: currentUnavailability.tipo_indisponibilidad,
          fecha_fin: currentUnavailability.fecha_fin_estimada || undefined,
          motivo: currentUnavailability.motivo || undefined,
        } : undefined}
        onCancelUnavailability={handleCancelUnavailability}
        showTriggerButton={false}
      />
    </div>
  );
};

export default MobileDashboardLayout;

import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { useCustodianServices } from "@/hooks/useCustodianServices";
import { useCustodianTickets } from "@/hooks/useCustodianTickets";
import { useCustodianTicketsEnhanced, CustodianTicket } from "@/hooks/useCustodianTicketsEnhanced";
import { useCustodianMaintenance } from "@/hooks/useCustodianMaintenance";
import { useCustodioIndisponibilidades } from "@/hooks/useCustodioIndisponibilidades";
 import { useNextService } from "@/hooks/useNextService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserRole } from "@/utils/authHelpers";
import { normalizePhone } from "@/lib/phoneUtils";
import DashboardHeroAlert from "./DashboardHeroAlert";
import CompactStatsBar from "./CompactStatsBar";
import QuickActionsGrid from "./QuickActionsGrid";
import RecentServicesCollapsible from "./RecentServicesCollapsible";
import ResolvedTicketAlert from "./ResolvedTicketAlert";
import PendingTicketAlert from "./PendingTicketAlert";
import UnavailabilityStatusBanner from "./UnavailabilityStatusBanner";
import SupportContactModal from "./SupportContactModal";
import InternalChatModal from "./InternalChatModal";
import MobileBottomNavNew, { NavItem } from "./MobileBottomNavNew";
import BatchMaintenanceDialog from "./BatchMaintenanceDialog";
import { CustodianTicketDetail } from "./CustodianTicketDetail";
import ReportUnavailabilityCard from "./ReportUnavailabilityCard";
 import NextServiceCard from "./NextServiceCard";
import PhoneUpdatePrompt from "./PhoneUpdatePrompt";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MobileDashboardLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading, updateProfile, refetch: refetchProfile } = useCustodianProfile();
  const { services, stats, loading: servicesLoading, getRecentServices, refetch: refetchServices } = useCustodianServices(profile?.phone);
  const { stats: ticketStats, loading: ticketsLoading, refetch: refetchTicketStats } = useCustodianTickets(profile?.phone);
  const { tickets: allTickets, getRecentlyResolvedTickets, markTicketAsSeen, refetch: refetchTickets } = useCustodianTicketsEnhanced(profile?.phone);
  const { maintenanceStatus, pendingMaintenance, createMaintenance, createBatchMaintenance, loading: maintenanceLoading, refetch: refetchMaintenance } = useCustodianMaintenance(profile?.phone, stats.km_totales);
   // useNextService moved below after realCustodioId declaration
  const { 
    indisponibilidadesActivas,
    crearIndisponibilidad, 
    cancelarIndisponibilidad,
  } = useCustodioIndisponibilidades();
  
  const [activeNav, setActiveNav] = useState<NavItem>('home');
  const [refreshing, setRefreshing] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSaraChat, setShowSaraChat] = useState(false);
  const [showUnavailabilityDialog, setShowUnavailabilityDialog] = useState(false);
  const [selectedResolvedTicket, setSelectedResolvedTicket] = useState<CustodianTicket | null>(null);
  const [dismissedTickets, setDismissedTickets] = useState<Set<string>>(new Set());
  const [realCustodioId, setRealCustodioId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { service: nextService, checklistStatus, refetch: refetchNextService } = useNextService(profile?.phone, realCustodioId);
  
  // Phone update flow state
  const [showPhoneUpdatePrompt, setShowPhoneUpdatePrompt] = useState(false);
  const [phoneUpdateError, setPhoneUpdateError] = useState<string | null>(null);
  const [pendingUnavailabilityData, setPendingUnavailabilityData] = useState<{ tipo: string; motivo?: string; dias: number | null } | null>(null);

  // Helper function to find custodio by phone
  const findCustodioByPhone = useCallback(async (phone: string): Promise<string | null> => {
    const cleanPhone = normalizePhone(phone);
    const { data } = await supabase
      .from('custodios_operativos')
      .select('id')
      .or(`telefono.eq.${cleanPhone},telefono.ilike.%${cleanPhone}%`)
      .limit(1)
      .maybeSingle();
    
    return data?.id || null;
  }, []);

  // Always find real custodio ID by phone (for all users, not just admins)
  useEffect(() => {
    const findCustodioId = async () => {
      const role = await getCurrentUserRole();
      const isAdmin = role === 'admin' || role === 'owner';
      setIsAdminMode(isAdmin);
      
      // Always try to find custodio by phone, regardless of role
      if (profile?.phone) {
        const custodioId = await findCustodioByPhone(profile.phone);
        if (custodioId) {
          setRealCustodioId(custodioId);
        }
      }
    };
    
    if (profile) {
      findCustodioId();
    }
  }, [profile, findCustodioByPhone]);

  const loading = profileLoading || servicesLoading || ticketsLoading || maintenanceLoading;

  // Calcular servicios este mes
  const serviciosEsteMes = useMemo(() => {
    if (!services || services.length === 0) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return services.filter(s => new Date(s.fecha_hora_cita) >= startOfMonth).length;
  }, [services]);

  // Calcular KM e ingresos del mes actual (mismo filtro que serviciosEsteMes)
  const kmEsteMes = useMemo(() => {
    if (!services || services.length === 0) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return services
      .filter(s => new Date(s.fecha_hora_cita) >= startOfMonth)
      .reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
  }, [services]);

  const ingresosEsteMes = useMemo(() => {
    if (!services || services.length === 0) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return services
      .filter(s => new Date(s.fecha_hora_cita) >= startOfMonth)
      .reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
  }, [services]);

  // Get open tickets for urgency calculation - MUST be before any conditional returns
  const openTickets = useMemo(() => 
    allTickets.filter(t => t.status === 'abierto' || t.status === 'en_progreso'), 
    [allTickets]
  );
  
  const pendingTicketsWithAge = useMemo(() => {
    const now = new Date();
    return openTickets
      .map(t => ({
        ...t,
        diasAbierto: Math.floor((now.getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }))
      .filter(t => t.diasAbierto >= 2);
  }, [openTickets]);
  
  // Check if there are urgent pending tickets (5+ days)
  const hasUrgentTickets = pendingTicketsWithAge.some(t => t.diasAbierto >= 5);
  // Check if there are any old pending tickets (2+ days)
  const hasOldPendingTickets = pendingTicketsWithAge.length > 0;

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
    try {
      await Promise.all([
        refetchServices?.(),
        refetchTickets?.(),
        refetchTicketStats?.(),
        refetchMaintenance?.(),
         refetchNextService?.(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecordMaintenance = async (data: any) => {
    return await createMaintenance(data);
  };

  // Handle phone update and retry unavailability report
  const handlePhoneUpdate = async (newPhone: string): Promise<boolean> => {
    setPhoneUpdateError(null);
    
    // Update profile with new phone
    const updateSuccess = await updateProfile({ phone: newPhone });
    if (!updateSuccess) {
      setPhoneUpdateError("No se pudo actualizar el teléfono. Intenta de nuevo.");
      return false;
    }
    
    // Refetch profile to get updated data
    await refetchProfile();
    
    // Try to find custodio with new phone
    const custodioId = await findCustodioByPhone(newPhone);
    
    if (!custodioId) {
      setPhoneUpdateError(
        "Este número no está registrado como custodio activo. Contacta a Planeación para que te vincule al sistema."
      );
      return false;
    }
    
    // Success! Update state
    setRealCustodioId(custodioId);
    setShowPhoneUpdatePrompt(false);
    
    // If we have pending unavailability data, submit it now
    if (pendingUnavailabilityData) {
      const result = await submitUnavailability(pendingUnavailabilityData, custodioId);
      setPendingUnavailabilityData(null);
      return result;
    }
    
    // Re-open unavailability dialog for user to continue
    setShowUnavailabilityDialog(true);
    return true;
  };

  // Core unavailability submission logic
  const submitUnavailability = async (
    data: { tipo: string; motivo?: string; dias: number | null },
    custodioId: string
  ): Promise<boolean> => {
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
        custodio_id: custodioId,
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

  const handleReportUnavailability = async (data: { tipo: string; motivo?: string; dias: number | null }) => {
    // Always use realCustodioId (found by phone lookup)
    const custodioIdToUse = realCustodioId;
    
    if (!custodioIdToUse) {
      // No custodio found - show phone update prompt instead of error
      setPendingUnavailabilityData(data);
      setShowUnavailabilityDialog(false);
      setPhoneUpdateError(null);
      setShowPhoneUpdatePrompt(true);
      return false;
    }

    return await submitUnavailability(data, custodioIdToUse);
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

   const handleStartChecklist = (serviceId: string) => {
     const params = new URLSearchParams();
     if (nextService?.origen_lat && nextService?.origen_lng) {
       params.set('lat', nextService.origen_lat.toString());
       params.set('lng', nextService.origen_lng.toString());
     }
     const qs = params.toString();
     navigate(`/custodian/checklist/${serviceId}${qs ? `?${qs}` : ''}`);
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

  const handleViewPendingTicket = (ticket: CustodianTicket) => {
    navigate('/custodian/support');
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
        {/* 1. URGENT: Pending tickets alert (2+ days old) - HIGHEST PRIORITY */}
        {hasOldPendingTickets && (
          <section className="animate-fade-in">
            <PendingTicketAlert
              tickets={openTickets}
              onViewTicket={handleViewPendingTicket}
            />
          </section>
        )}

        {/* 2. Resolved ticket alert - Good news! */}
        {resolvedTicketsToShow.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: hasOldPendingTickets ? '50ms' : '0ms' }}>
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

         {/* Próximo servicio con checklist */}
         <section className="animate-fade-in" style={{ animationDelay: (resolvedTicketsToShow.length > 0 || hasOldPendingTickets) ? '75ms' : '0ms' }}>
           <NextServiceCard
             service={nextService}
             onStartChecklist={handleStartChecklist}
             checklistCompleted={checklistStatus === 'completo'}
             onViewDetails={() => nextService && navigate(`/custodian/services`)}
           />
         </section>
 
        {/* 3. Hero Alert - Maintenance status (only show "all OK" if no urgent tickets) */}
        {!hasUrgentTickets && (
          <section className="animate-fade-in" style={{ animationDelay: (resolvedTicketsToShow.length > 0 || hasOldPendingTickets) ? '100ms' : '0ms' }}>
            <DashboardHeroAlert
              maintenanceStatus={maintenanceStatus}
              onRegisterService={() => setShowBatchDialog(true)}
            />
          </section>
        )}

        {/* Stats compactos */}
        <section className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CompactStatsBar
            serviciosEsteMes={serviciosEsteMes}
            kmRecorridos={kmEsteMes}
            ingresosTotales={ingresosEsteMes}
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
        onConfirm={createBatchMaintenance}
      />

      {/* Support Contact Modal */}
      <SupportContactModal
        open={showContactModal}
        onOpenChange={setShowContactModal}
        tickets={allTickets}
        custodianPhone={profile?.phone || ''}
        onRefresh={refetchTickets}
        onOpenSaraChat={() => setShowSaraChat(true)}
      />

      {/* Sara Chat Modal - Independent lifecycle */}
      <InternalChatModal
        open={showSaraChat}
        onOpenChange={setShowSaraChat}
        tickets={allTickets}
        custodianPhone={profile?.phone || ''}
        onCreateTicket={() => navigate('/custodian/support')}
        onRefresh={refetchTickets}
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

      {/* Phone Update Prompt - shown when custodio not found by phone */}
      <PhoneUpdatePrompt
        open={showPhoneUpdatePrompt}
        onOpenChange={(open) => {
          setShowPhoneUpdatePrompt(open);
          if (!open) {
            setPhoneUpdateError(null);
            setPendingUnavailabilityData(null);
          }
        }}
        currentPhone={profile?.phone}
        onPhoneUpdated={handlePhoneUpdate}
        errorMessage={phoneUpdateError}
      />
    </div>
  );
};

export default MobileDashboardLayout;

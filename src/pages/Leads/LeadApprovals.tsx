
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AssignedLead } from "@/types/leadTypes";
import { useLeadApprovals } from "@/hooks/useLeadApprovals";
import { usePoolReserva } from "@/hooks/usePoolReserva";
import { useCustodioLiberacion } from "@/hooks/useCustodioLiberacion";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { LeadsList } from "@/components/leads/approval/LeadsList";
import { LeadDialogs } from "@/components/leads/approval/LeadDialogs";
import { ScheduledCallsView } from "@/components/leads/approval/ScheduledCallsView";
import { PoolReservaView } from "@/components/leads/pool/PoolReservaView";
import { ApprovalAdvancedFilters, ApprovalAdvancedFiltersState } from "@/components/leads/approval/ApprovalAdvancedFilters";
import { MoveToPoolDialog } from "@/components/leads/pool/MoveToPoolDialog";
import { SessionRecoveryDialog } from "@/components/leads/approval/SessionRecoveryDialog";
import { InterruptedInterviewDialog } from "@/components/leads/approval/InterruptedInterviewDialog";
import { SandboxBanner } from "@/components/sandbox/SandboxBanner";
import { LeadsPagination } from "@/components/leads/approval/LeadsPagination";
import { useSandbox } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
import { exportLeadsToCSV } from "@/utils/exportLeadsCSV";
import { toast } from "@/hooks/use-toast";

console.log('🚀 LeadApprovals: Module loaded successfully');

export const LeadApprovals = () => {
  console.log('🚀 LeadApprovals: Component rendering started');
  
  const { isSandboxMode } = useSandbox();
  
  const {
    assignedLeads,
    callLogs,
    loading,
    totalCount,
    page,
    pageSize,
    setPageSize,
    fetchAssignedLeads,
    fetchCallLogs,
    refreshAfterCall,
    handleApproveLead,
    handleSendToSecondInterview,
    handleRejectWithReasons,
    retryVinculacion,
    goToPage,
    applyDateFilter
  } = useLeadApprovals();
  
  console.log('📊 LeadApprovals: Hook state - loading:', loading, 'assignedLeads:', assignedLeads?.length || 0);
  
  const { moveToPool } = usePoolReserva();
  const { createLiberacion } = useCustodioLiberacion();
  const { savedViews, saveCurrentFilters, saveView, deleteView, getLastFilters } = useFilterPersistence();
  const navigate = useNavigate();

  // Validación de ambiente vs conteo de datos
  useEffect(() => {
    if (assignedLeads.length > 0) {
      const isAnomalous = 
        (isSandboxMode && assignedLeads.length > 100) || 
        (!isSandboxMode && assignedLeads.length < 5);
      
      if (isAnomalous) {
        console.warn('⚠️ Posible inconsistencia de ambiente:', {
          modo: isSandboxMode ? 'SANDBOX' : 'PRODUCCIÓN',
          cantidadCandidatos: assignedLeads.length,
          esperado: isSandboxMode ? '< 100' : '> 5'
        });
      }
    }
  }, [assignedLeads.length, isSandboxMode]);

  const [selectedLead, setSelectedLead] = useState<AssignedLead | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showVapiDialog, setShowVapiDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showMissingInfoDialog, setShowMissingInfoDialog] = useState(false);
  const [showCallLogDialog, setShowCallLogDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showMoveToPoolDialog, setShowMoveToPoolDialog] = useState(false);
  
  // Session recovery states
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);
  const [showInterruptedDialog, setShowInterruptedDialog] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{
    hasRecoveryData: boolean;
    sessionId?: string;
    data?: Record<string, any>;
    interruptionReason?: string;
  }>({ hasRecoveryData: false });
  
  // Initialize from persisted filters
  const lastFilters = getLastFilters();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(lastFilters.activeTab || "pending");
  const [currentFilteredLeads, setCurrentFilteredLeads] = useState<AssignedLead[]>([]);
  
  // Estados para los filtros
  const [quickFilter, setQuickFilter] = useState<string | null>(lastFilters.quickFilter);
  const [advancedFilters, setAdvancedFilters] = useState<ApprovalAdvancedFiltersState>(lastFilters.filters || {
    creationDateFrom: '',
    creationDateTo: '',
    lastContactDateFrom: '',
    lastContactDateTo: '',
    scheduledCallDateFrom: '',
    scheduledCallDateTo: '',
    contactAttempts: 'all',
    lastContactOutcome: 'all',
    currentStage: 'all',
    finalDecision: 'all',
    hasSuccessfulCall: 'all',
    hasScheduledCall: 'all',
    interviewInterrupted: 'all',
    assignedAnalyst: 'all'
  });

  // Persist filters when they change
  useEffect(() => {
    saveCurrentFilters(advancedFilters, quickFilter, activeTab);
  }, [advancedFilters, quickFilter, activeTab, saveCurrentFilters]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      pending: assignedLeads.filter(l => l.final_decision === 'pending' || !l.final_decision).length,
      approved: assignedLeads.filter(l => l.final_decision === 'approved').length,
      rejected: assignedLeads.filter(l => l.final_decision === 'rejected').length,
      scheduled: assignedLeads.filter(l => l.has_scheduled_call).length,
    };
  }, [assignedLeads]);

  // Handle loading saved view
  const handleLoadView = (view: { filters: ApprovalAdvancedFiltersState; quickFilter: string | null; activeTab: string }) => {
    setAdvancedFilters(view.filters);
    setQuickFilter(view.quickFilter);
    setActiveTab(view.activeTab);
  };

  // Handle saving current view
  const handleSaveView = (name: string) => {
    saveView(name, advancedFilters, quickFilter, activeTab);
    toast({
      title: "Vista guardada",
      description: `La vista "${name}" se guardó correctamente.`,
    });
  };

  const handleVapiCall = (lead: AssignedLead) => {
    setSelectedLead(lead);
    setShowVapiDialog(true);
  };

  const handleManualInterview = async (lead: AssignedLead) => {
    // Check for interrupted sessions before opening dialog
    const recovery = await checkForInterruptedSession(lead.lead_id);
    
    if (recovery.hasRecoveryData) {
      setSelectedLead(lead);
      setRecoveryData(recovery);
      setShowSessionRecovery(true);
    } else {
      setSelectedLead(lead);
      setShowManualDialog(true);
    }
  };

  // Check for interrupted interview sessions
  const checkForInterruptedSession = async (leadId: string) => {
    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .select('last_interview_data, interview_session_id, interruption_reason')
        .eq('id', leadId)
        .single();

      if (error || !lead) {
        return { hasRecoveryData: false };
      }

      const hasData = lead.last_interview_data && 
                     typeof lead.last_interview_data === 'string' &&
                     Object.keys(JSON.parse(lead.last_interview_data)).length > 0;
      
      if (hasData) {
        return {
          hasRecoveryData: true,
          sessionId: lead.interview_session_id as string,
          data: JSON.parse(lead.last_interview_data as string),
          interruptionReason: lead.interruption_reason as string
        };
      }

      return { hasRecoveryData: false };
    } catch (error) {
      console.error('Error checking for interrupted session:', error);
      return { hasRecoveryData: false };
    }
  };

  // Handle session recovery choices
  const handleContinueSession = () => {
    setShowSessionRecovery(false);
    setShowManualDialog(true);
  };

  const handleStartNewSession = async () => {
    if (selectedLead) {
      // Clear existing session data
      try {
        await supabase
          .from('leads')
          .update({
            last_interview_data: null,
            interview_session_id: null,
            interruption_reason: null
          })
          .eq('id', selectedLead.lead_id);
      } catch (error) {
        console.error('Error clearing session data:', error);
      }
    }
    
    setShowSessionRecovery(false);
    setShowManualDialog(true);
  };

  const handleEditLead = (lead: AssignedLead) => {
    setSelectedLead(lead);
    setShowEditDialog(true);
  };

  const handleViewCallHistory = (lead: AssignedLead) => {
    setSelectedLead(lead);
    setShowCallHistory(true);
  };

  const handleCompleteMissingInfo = (lead: AssignedLead) => {
    setSelectedLead(lead);
    setShowMissingInfoDialog(true);
  };

  const handleLogCall = (lead: AssignedLead) => {
    setSelectedLead(lead);
    setShowCallLogDialog(true);
  };

  const handleRejectWithReason = (lead: AssignedLead) => {
    setSelectedLead(lead);
    setShowRejectionDialog(true);
  };

  const handleMoveToPool = (lead: AssignedLead) => {
    setSelectedLead(lead);
    setShowMoveToPoolDialog(true);
  };

  const handleIniciarLiberacion = async (lead: AssignedLead) => {
    try {
      await createLiberacion.mutateAsync(lead.lead_id);
      toast({
        title: "Liberación iniciada",
        description: `Se ha iniciado el proceso de liberación para ${lead.lead_nombre}`
      });
      navigate('/leads/liberacion');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar el proceso de liberación",
        variant: "destructive"
      });
    }
  };

  const handleConfirmReject = (reasons: string[], customReason: string) => {
    if (selectedLead) {
      handleRejectWithReasons(selectedLead, reasons, customReason);
    }
  };

  const handleCallComplete = () => {
    refreshAfterCall();
  };

  const handleOpenCompleteInfo = () => {
    if (selectedLead) {
      setShowMissingInfoDialog(true);
    }
  };

  const handleQuickFilterChange = (filterId: string | null) => {
    setQuickFilter(filterId);
    
    // ✅ OPTIMIZADO: Aplicar filtros de fecha en el backend
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filterId) {
      case 'last3Days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 3);
        applyDateFilter(from.toISOString(), undefined);
        break;
      }
      case 'last7Days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 7);
        applyDateFilter(from.toISOString(), undefined);
        break;
      }
      case 'last15Days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 15);
        applyDateFilter(from.toISOString(), undefined);
        break;
      }
      case 'last30Days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 30);
        applyDateFilter(from.toISOString(), undefined);
        break;
      }
      default:
        // Reset filter - load all
        applyDateFilter(undefined, undefined);
        break;
    }
  };

  const handleResetAdvancedFilters = () => {
    setAdvancedFilters({
      creationDateFrom: '',
      creationDateTo: '',
      lastContactDateFrom: '',
      lastContactDateTo: '',
      scheduledCallDateFrom: '',
      scheduledCallDateTo: '',
      contactAttempts: 'all',
      lastContactOutcome: 'all',
      currentStage: 'all',
      finalDecision: 'all',
      hasSuccessfulCall: 'all',
      hasScheduledCall: 'all',
      interviewInterrupted: 'all',
      assignedAnalyst: 'all'
    });
  };

  const handleFilteredLeadsChange = useCallback((filteredLeads: AssignedLead[]) => {
    setCurrentFilteredLeads(filteredLeads);
  }, []);

  const handleExportCSV = () => {
    try {
      const tabNames: Record<string, string> = {
        'pending': 'pendientes',
        'approved': 'aprobados',
        'rejected': 'rechazados',
        'scheduled': 'programadas',
        'pool': 'pool_reserva'
      };
      
      const filterName = tabNames[activeTab] || 'todos';
      const fileName = exportLeadsToCSV(currentFilteredLeads, filterName);
      
      toast({
        title: "Exportación exitosa",
        description: `Se descargó el archivo: ${fileName}`,
      });
    } catch (error) {
      console.error("Error al exportar CSV:", error);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo CSV. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    console.log('⏳ LeadApprovals: Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando candidatos asignados...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 LeadApprovals: Rendering main component with', assignedLeads?.length || 0, 'leads');

  try {
    return (
      <TooltipProvider>
        <div className="space-y-6 p-6">
        <SandboxBanner dataCount={assignedLeads.length} />
        
        {/* Header - Lean */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="apple-text-title">Aprobaciones</h1>
              <Badge 
                variant="outline"
                className={isSandboxMode 
                  ? "border-warning/30 text-warning text-xs" 
                  : "border-success/30 text-success text-xs"
                }
              >
                {isSandboxMode ? 'SANDBOX' : 'PROD'}
              </Badge>
              <span className="text-xs text-muted-foreground tabular-nums">
                {totalCount} candidatos
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCSV}
              disabled={currentFilteredLeads.length === 0}
              className="h-8 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchAssignedLeads()}
              className="h-8 text-xs"
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Search + Filters - Inline */}
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[200px] h-8 text-sm"
          />
          
          <ApprovalAdvancedFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onResetFilters={handleResetAdvancedFilters}
            leads={assignedLeads}
            savedViews={savedViews}
            onSaveView={handleSaveView}
            onLoadView={handleLoadView}
            onDeleteView={deleteView}
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="h-8">
              <TabsTrigger value="pending" className="text-xs h-7 px-3 gap-1.5">
                Pendientes
                {tabCounts.pending > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{tabCounts.pending}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs h-7 px-3 gap-1.5">
                Aprobados
                {tabCounts.approved > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{tabCounts.approved}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs h-7 px-3 gap-1.5">
                Rechazados
                {tabCounts.rejected > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{tabCounts.rejected}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs h-7 px-3 gap-1.5">
                Programadas
                {tabCounts.scheduled > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{tabCounts.scheduled}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pool" className="text-xs h-7 px-3">Pool</TabsTrigger>
            </TabsList>

              <TabsContent value="pending" className="mt-6">
                <LeadsList
                  leads={assignedLeads}
                  callLogs={callLogs}
                  searchTerm={searchTerm}
                  activeTab="pending"
                  quickFilter={quickFilter}
                  advancedFilters={advancedFilters}
                  onQuickFilterChange={handleQuickFilterChange}
                  onAdvancedFiltersChange={setAdvancedFilters}
                  onResetAdvancedFilters={handleResetAdvancedFilters}
                  onFilteredLeadsChange={handleFilteredLeadsChange}
                  onVapiCall={handleVapiCall}
                  onManualInterview={handleManualInterview}
                  onEditLead={handleEditLead}
                  onViewCallHistory={handleViewCallHistory}
                  onApproveLead={handleApproveLead}
                  onSendToSecondInterview={handleSendToSecondInterview}
                  onReject={handleRejectWithReason}
                  onCompleteMissingInfo={handleCompleteMissingInfo}
                  onLogCall={handleLogCall}
                  onMoveToPool={handleMoveToPool}
                  onIniciarLiberacion={handleIniciarLiberacion}
                  onRetryVinculacion={retryVinculacion}
                />
                <LeadsPagination
                  currentPage={page}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  onPageSizeChange={setPageSize}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <LeadsList
                  leads={assignedLeads}
                  callLogs={callLogs}
                  searchTerm={searchTerm}
                  activeTab="approved"
                  onFilteredLeadsChange={handleFilteredLeadsChange}
                  onVapiCall={handleVapiCall}
                  onManualInterview={handleManualInterview}
                  onEditLead={handleEditLead}
                  onViewCallHistory={handleViewCallHistory}
                  onApproveLead={handleApproveLead}
                  onSendToSecondInterview={handleSendToSecondInterview}
                  onReject={handleRejectWithReason}
                  onCompleteMissingInfo={handleCompleteMissingInfo}
                  onLogCall={handleLogCall}
                  onMoveToPool={handleMoveToPool}
                  onIniciarLiberacion={handleIniciarLiberacion}
                  onRetryVinculacion={retryVinculacion}
                />
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <LeadsList
                  leads={assignedLeads}
                  callLogs={callLogs}
                  searchTerm={searchTerm}
                  activeTab="rejected"
                  onFilteredLeadsChange={handleFilteredLeadsChange}
                  onVapiCall={handleVapiCall}
                  onManualInterview={handleManualInterview}
                  onEditLead={handleEditLead}
                  onViewCallHistory={handleViewCallHistory}
                  onApproveLead={handleApproveLead}
                  onSendToSecondInterview={handleSendToSecondInterview}
                  onReject={handleRejectWithReason}
                  onCompleteMissingInfo={handleCompleteMissingInfo}
                  onLogCall={handleLogCall}
                  onMoveToPool={handleMoveToPool}
                  onIniciarLiberacion={handleIniciarLiberacion}
                  onRetryVinculacion={retryVinculacion}
                />
              </TabsContent>

              <TabsContent value="scheduled" className="mt-6">
                <ScheduledCallsView 
                  assignedLeads={assignedLeads.filter(lead => lead.has_scheduled_call)} 
                />
              </TabsContent>

              <TabsContent value="pool" className="mt-6">
                <PoolReservaView searchTerm={searchTerm} />
              </TabsContent>
            </Tabs>
        </div>

        <LeadDialogs
          selectedLead={selectedLead}
          showEditDialog={showEditDialog}
          showVapiDialog={showVapiDialog}
          showManualDialog={showManualDialog}
          showCallHistory={showCallHistory}
          showMissingInfoDialog={showMissingInfoDialog}
          showCallLogDialog={showCallLogDialog}
          showRejectionDialog={showRejectionDialog}
          callLogs={callLogs}
          onEditDialogChange={setShowEditDialog}
          onVapiDialogChange={setShowVapiDialog}
          onManualDialogChange={setShowManualDialog}
          onCallHistoryChange={setShowCallHistory}
          onMissingInfoDialogChange={setShowMissingInfoDialog}
          onCallLogDialogChange={setShowCallLogDialog}
          onRejectionDialogChange={setShowRejectionDialog}
          onUpdate={fetchAssignedLeads}
          onCallComplete={handleCallComplete}
          onOpenCompleteInfo={handleOpenCompleteInfo}
          onConfirmReject={handleConfirmReject}
        />
        
        <MoveToPoolDialog
          lead={selectedLead}
          open={showMoveToPoolDialog}
          onOpenChange={setShowMoveToPoolDialog}
          onConfirm={moveToPool}
        />

        <SessionRecoveryDialog
          open={showSessionRecovery}
          onOpenChange={setShowSessionRecovery}
          lead={selectedLead}
          recoveryData={recoveryData}
          onContinueSession={handleContinueSession}
          onStartNewSession={handleStartNewSession}
        />

        <InterruptedInterviewDialog
          open={showInterruptedDialog}
          onOpenChange={setShowInterruptedDialog}
          lead={selectedLead}
          sessionId={recoveryData.sessionId}
          recoveredData={recoveryData.data}
          onConfirm={() => {
            setShowInterruptedDialog(false);
            fetchAssignedLeads();
          }}
        />
      </div>
    </TooltipProvider>
  );
  } catch (error) {
    console.error('❌ LeadApprovals: Render error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Error en la página de aprobaciones</h2>
          <p className="text-muted-foreground">
            Ha ocurrido un error al cargar la página. Revisa la consola para más detalles.
          </p>
          <Button 
            onClick={() => {
              console.log('🔄 LeadApprovals: Error recovery - forcing reload');
              window.location.reload();
            }}
            variant="outline"
          >
            Recargar página
          </Button>
        </div>
      </div>
    );
  }
};

export default LeadApprovals;

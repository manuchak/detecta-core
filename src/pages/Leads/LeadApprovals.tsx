
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { LeadsList } from "@/components/leads/approval/LeadsList";
import { LeadDialogs } from "@/components/leads/approval/LeadDialogs";
import { ScheduledCallsView } from "@/components/leads/approval/ScheduledCallsView";
import { PoolReservaView } from "@/components/leads/pool/PoolReservaView";
import { ApprovalAdvancedFiltersState } from "@/components/leads/approval/ApprovalAdvancedFilters";
import { MoveToPoolDialog } from "@/components/leads/pool/MoveToPoolDialog";
import { SessionRecoveryDialog } from "@/components/leads/approval/SessionRecoveryDialog";
import { InterruptedInterviewDialog } from "@/components/leads/approval/InterruptedInterviewDialog";
import { supabase } from "@/integrations/supabase/client";
import { exportLeadsToCSV } from "@/utils/exportLeadsCSV";
import { toast } from "@/hooks/use-toast";

console.log('🚀 LeadApprovals: Module loaded successfully');

export const LeadApprovals = () => {
  console.log('🚀 LeadApprovals: Component rendering started');
  
  const {
    assignedLeads,
    callLogs,
    loading,
    fetchAssignedLeads,
    fetchCallLogs,
    refreshAfterCall,
    handleApproveLead,
    handleSendToSecondInterview,
    handleRejectWithReasons
  } = useLeadApprovals();
  
  console.log('📊 LeadApprovals: Hook state - loading:', loading, 'assignedLeads:', assignedLeads?.length || 0);
  
  const { moveToPool } = usePoolReserva();

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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [currentFilteredLeads, setCurrentFilteredLeads] = useState<AssignedLead[]>([]);
  
  // Estados para los filtros
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<ApprovalAdvancedFiltersState>({
    creationDateFrom: '',
    creationDateTo: '',
    lastContactDateFrom: '',
    lastContactDateTo: '',
    scheduledCallDateFrom: '',
    scheduledCallDateTo: '',
    contactAttempts: 'all',
    lastContactOutcome: 'all',
    approvalStage: 'all',
    finalDecision: 'all',
    hasSuccessfulCall: 'all',
    hasScheduledCall: 'all',
    interviewInterrupted: 'all',
    assignedAnalyst: 'all'
  });

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
      approvalStage: 'all',
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
        <div className="space-y-6 p-6">{/* rest of content will be preserved */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Aprobación de Candidatos</h1>
            <p className="text-muted-foreground">
              Gestiona las entrevistas y aprobaciones de los candidatos asignados.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={currentFilteredLeads.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
              {currentFilteredLeads.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {currentFilteredLeads.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log('🔄 LeadApprovals: Manual refresh clicked');
                fetchAssignedLeads();
              }}
            >
              Actualizar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Candidatos Asignados</CardTitle>
            <CardDescription>
              Total: {assignedLeads.length} candidatos | 
              Pendientes: {assignedLeads.filter(l => !l.final_decision).length} |
              Aprobados: {assignedLeads.filter(l => l.final_decision === 'approved').length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">Pendientes</TabsTrigger>
                <TabsTrigger value="approved">Aprobados</TabsTrigger>
                <TabsTrigger value="rejected">Rechazados</TabsTrigger>
                <TabsTrigger value="scheduled">Programadas</TabsTrigger>
                <TabsTrigger value="pool">Pool de Reserva</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                <LeadsList
                  leads={assignedLeads}
                  callLogs={callLogs}
                  searchTerm={searchTerm}
                  activeTab="pending"
                  quickFilter={quickFilter}
                  advancedFilters={advancedFilters}
                  onQuickFilterChange={setQuickFilter}
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
          </CardContent>
        </Card>

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

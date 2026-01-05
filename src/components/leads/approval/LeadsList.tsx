import { useMemo } from "react";
import { AssignedLead } from "@/types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { ImprovedLeadCard } from "./ImprovedLeadCard";
import { ApprovalQuickFilters } from "./ApprovalQuickFilters";
import { ApprovalAdvancedFiltersState } from "./ApprovalAdvancedFilters";

interface LeadsListProps {
  leads: AssignedLead[];
  callLogs: VapiCallLog[];
  searchTerm: string;
  activeTab: string;
  quickFilter?: string | null;
  advancedFilters?: ApprovalAdvancedFiltersState;
  onQuickFilterChange?: (filterId: string | null) => void;
  onAdvancedFiltersChange?: (filters: ApprovalAdvancedFiltersState) => void;
  onResetAdvancedFilters?: () => void;
  onFilteredLeadsChange?: (filteredLeads: AssignedLead[]) => void;
  onVapiCall: (lead: AssignedLead) => void;
  onManualInterview: (lead: AssignedLead) => void;
  onEditLead: (lead: AssignedLead) => void;
  onViewCallHistory: (lead: AssignedLead) => void;
  onApproveLead: (lead: AssignedLead) => void;
  onSendToSecondInterview: (lead: AssignedLead) => void;
  onReject: (lead: AssignedLead) => void;
  onCompleteMissingInfo: (lead: AssignedLead) => void;
  onLogCall: (lead: AssignedLead) => void;
  onMoveToPool?: (lead: AssignedLead) => void;
  onIniciarLiberacion?: (lead: AssignedLead) => void;
  onRetryVinculacion?: (lead: AssignedLead) => void;
}

export const LeadsList = ({
  leads,
  callLogs,
  searchTerm,
  activeTab,
  quickFilter = null,
  advancedFilters,
  onQuickFilterChange,
  onAdvancedFiltersChange,
  onResetAdvancedFilters,
  onFilteredLeadsChange,
  onVapiCall,
  onManualInterview,
  onEditLead,
  onViewCallHistory,
  onApproveLead,
  onSendToSecondInterview,
  onReject,
  onCompleteMissingInfo,
  onLogCall,
  onMoveToPool,
  onIniciarLiberacion,
  onRetryVinculacion,
}: LeadsListProps) => {
  const getLeadCallLogs = (leadId: string) => {
    return callLogs.filter(log => log.id === leadId);
  };

  // Filtros avanzados aplicados en cliente (solo para UI)
  const applyAdvancedFilters = (leads: AssignedLead[], filters: ApprovalAdvancedFiltersState | undefined): AssignedLead[] => {
    if (!filters) return leads;
    
    return leads.filter(lead => {
      // Filtros por fechas de creación
      if (filters.creationDateFrom) {
        const creationDate = new Date(lead.lead_fecha_creacion);
        const filterDate = new Date(filters.creationDateFrom);
        if (creationDate < filterDate) return false;
      }
      
      if (filters.creationDateTo) {
        const creationDate = new Date(lead.lead_fecha_creacion);
        const filterDate = new Date(filters.creationDateTo);
        if (creationDate > filterDate) return false;
      }
      
      // Filtros por citas programadas
      if (filters.scheduledCallDateFrom && lead.scheduled_call_datetime) {
        const scheduledDate = new Date(lead.scheduled_call_datetime);
        const filterDate = new Date(filters.scheduledCallDateFrom);
        if (scheduledDate < filterDate) return false;
      }
      
      if (filters.scheduledCallDateTo && lead.scheduled_call_datetime) {
        const scheduledDate = new Date(lead.scheduled_call_datetime);
        const filterDate = new Date(filters.scheduledCallDateTo);
        if (scheduledDate > filterDate) return false;
      }
      
      // Filtros por intentos de contacto
      if (filters.contactAttempts && filters.contactAttempts !== 'all') {
        const attempts = lead.contact_attempts_count || 0;
        switch (filters.contactAttempts) {
          case '0':
            if (attempts !== 0) return false;
            break;
          case '1-2':
            if (attempts < 1 || attempts > 2) return false;
            break;
          case '3-5':
            if (attempts < 3 || attempts > 5) return false;
            break;
          case '5+':
            if (attempts < 5) return false;
            break;
        }
      }
      
      // Filtros por resultado del último contacto
      if (filters.lastContactOutcome && filters.lastContactOutcome !== 'all') {
        if (lead.last_contact_outcome !== filters.lastContactOutcome) return false;
      }
      
      // Filtros por llamada exitosa
      if (filters.hasSuccessfulCall && filters.hasSuccessfulCall !== 'all') {
        const hasSuccessful = lead.has_successful_call === true;
        if (filters.hasSuccessfulCall === 'true' && !hasSuccessful) return false;
        if (filters.hasSuccessfulCall === 'false' && hasSuccessful) return false;
      }
      
      // Filtros por cita programada
      if (filters.hasScheduledCall && filters.hasScheduledCall !== 'all') {
        const hasScheduled = lead.has_scheduled_call === true;
        if (filters.hasScheduledCall === 'true' && !hasScheduled) return false;
        if (filters.hasScheduledCall === 'false' && hasScheduled) return false;
      }
      
      // Filtros por entrevista interrumpida
      if (filters.interviewInterrupted && filters.interviewInterrupted !== 'all') {
        const isInterrupted = lead.interview_interrupted === true;
        if (filters.interviewInterrupted === 'true' && !isInterrupted) return false;
        if (filters.interviewInterrupted === 'false' && isInterrupted) return false;
      }
      
      // Filtros por decisión final
      if (filters.finalDecision && filters.finalDecision !== 'all') {
        if (filters.finalDecision === 'pending' && lead.final_decision) return false;
        if (filters.finalDecision !== 'pending' && lead.final_decision !== filters.finalDecision) return false;
      }
      
      // Filtro por analista asignado
      if (filters.assignedAnalyst && filters.assignedAnalyst !== 'all') {
        if (filters.assignedAnalyst === 'unassigned') {
          if (lead.asignado_a) return false;
        } else {
          if (lead.asignado_a !== filters.assignedAnalyst) return false;
        }
      }
      
      return true;
    });
  };

  // ✅ OPTIMIZADO: Filtrado ligero solo en cliente (el backend ya hizo el trabajo pesado)
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads;
    
    // Apply advanced filters (solo UI)
    filtered = applyAdvancedFilters(filtered, advancedFilters);
    
    // Filter by search term (solo UI)
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.lead_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lead_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lead_telefono?.includes(searchTerm)
      );
    }

    // Filter by active tab
    if (activeTab === "pending") {
      filtered = filtered.filter(lead => 
        !lead.final_decision && 
        lead.lead_estado !== 'rechazado' && 
        lead.lead_estado !== 'aprobado' &&
        !lead.fecha_entrada_pool
      );
    } else if (activeTab === "approved") {
      filtered = filtered.filter(lead => 
        lead.final_decision === 'approved' || lead.lead_estado === 'aprobado'
      );
    } else if (activeTab === "rejected") {
      filtered = filtered.filter(lead => 
        lead.final_decision === 'rejected' || lead.lead_estado === 'rechazado'
      );
    }

    // ✅ El ordenamiento ya viene del backend (ORDER BY fecha_creacion DESC)
    // No calculamos prioridad en cliente - ahora solo procesamos ~50 leads

    // Notify parent of filtered leads
    if (onFilteredLeadsChange) {
      onFilteredLeadsChange(filtered);
    }

    return filtered;
  }, [leads, searchTerm, activeTab, advancedFilters, onFilteredLeadsChange]);

  return (
    <div className="space-y-4">
      {/* Filtros inteligentes (quick filters) */}
      {onQuickFilterChange && (
        <ApprovalQuickFilters
          leads={leads}
          activeFilter={quickFilter}
          onFilterChange={onQuickFilterChange}
        />
      )}

      {filteredAndSortedLeads.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No se encontraron candidatos que coincidan con los criterios de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedLeads.map((lead) => {
            const leadCallLogs = getLeadCallLogs(lead.lead_id);
            return (
              <ImprovedLeadCard
                key={lead.lead_id}
                lead={lead}
                callLogs={leadCallLogs}
                onVapiCall={onVapiCall}
                onManualInterview={onManualInterview}
                onEditLead={onEditLead}
                onViewCallHistory={onViewCallHistory}
                onApproveLead={onApproveLead}
                onSendToSecondInterview={onSendToSecondInterview}
                onReject={onReject}
                onCompleteMissingInfo={onCompleteMissingInfo}
                onLogCall={onLogCall}
                onMoveToPool={onMoveToPool}
                onIniciarLiberacion={onIniciarLiberacion}
                onRetryVinculacion={onRetryVinculacion}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
import { useMemo } from "react";
import { AssignedLead } from "@/types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { ImprovedLeadCard } from "./ImprovedLeadCard";
import { ApprovalQuickFilters } from "./ApprovalQuickFilters";
import { ApprovalAdvancedFilters, ApprovalAdvancedFiltersState } from "./ApprovalAdvancedFilters";

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
}: LeadsListProps) => {
  const getLeadCallLogs = (leadId: string) => {
    return callLogs.filter(log => log.id === leadId);
  };

  // Función para calcular prioridad FIFO inteligente
  const calculateLeadPriority = (lead: AssignedLead) => {
    const now = new Date();
    let priority = 0;
    
    // MÁXIMA PRIORIDAD: Entrevistas interrumpidas (2000 puntos)
    if (lead.interview_interrupted && lead.interview_session_id) {
      priority += 2000;
    }
    
    // ALTA PRIORIDAD: Citas programadas inminentes (≤1 hora) (1500 puntos)
    if (lead.has_scheduled_call && lead.scheduled_call_datetime) {
      const scheduledDate = new Date(lead.scheduled_call_datetime);
      const hoursUntilCall = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilCall <= 1 && hoursUntilCall >= 0) {
        // Cita en la próxima hora - muy alta prioridad
        priority += 1500;
      } else if (hoursUntilCall < 0 && hoursUntilCall >= -1) {
        // Cita vencida por menos de 1 hora - emergencia
        priority += 1800;
      } else if (hoursUntilCall > 1) {
        // Cita programada futura - prioridad media
        priority += 500;
      }
    }
    
    // PENALIZACIÓN SEVERA: Leads con intentos fallidos van al final (-1000 a -2000 puntos)
    const failedOutcomes = ['voicemail', 'no_answer', 'busy', 'wrong_number', 'non_existent_number', 'call_failed'];
    if (lead.last_contact_outcome && failedOutcomes.includes(lead.last_contact_outcome)) {
      // Penalización base por intento fallido
      priority -= 1000;
      
      // Penalización progresiva por múltiples intentos fallidos
      const attempts = lead.contact_attempts_count || 0;
      priority -= attempts * 200;
      
      // Si ya tiene muchos intentos fallidos, va al final absoluto
      if (attempts >= 3) {
        priority -= 2000;
      }
    }
    
    // ALTA PRIORIDAD: Leads nuevos sin intentos fallidos (1000 puntos)
    const attempts = lead.contact_attempts_count || 0;
    if (attempts === 0 && !lead.last_contact_outcome) {
      priority += 1000;
    }
    
    // PRIORIDAD MEDIA: Información incompleta (300 puntos)
    if (!lead.lead_telefono || !lead.lead_email) {
      priority += 300;
    }
    
    // AJUSTE POR TIEMPO: Leads antiguos sin gestión (máximo 200 puntos)
    const creationDate = new Date(lead.lead_fecha_creacion);
    const daysSinceCreation = Math.floor((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Solo si no han tenido intentos fallidos
    if (!lead.last_contact_outcome || !failedOutcomes.includes(lead.last_contact_outcome)) {
      priority += Math.min(daysSinceCreation * 5, 200);
    }
    
    // AJUSTE FINAL: Llamadas exitosas pendientes de seguimiento
    if (lead.has_successful_call && !lead.final_decision) {
      priority += 100;
    }
    
    return priority;
  };

  const applyQuickFilter = (leads: AssignedLead[], filterId: string | null): AssignedLead[] => {
    if (!filterId) return leads;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysAgo = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    switch (filterId) {
      case 'newToday':
        return leads.filter(lead => {
          const creationDate = new Date(lead.lead_fecha_creacion);
          const creationDateOnly = new Date(creationDate.getFullYear(), creationDate.getMonth(), creationDate.getDate());
          return creationDateOnly.getTime() === today.getTime() && (lead.contact_attempts_count || 0) === 0;
        });
        
      case 'urgentPending':
        return leads.filter(lead => {
          const creationDate = new Date(lead.lead_fecha_creacion);
          return creationDate < threeDaysAgo && (lead.contact_attempts_count || 0) === 0;
        });
        
      case 'failedAttempts':
        return leads.filter(lead => {
          const failedOutcomes = ['voicemail', 'no_answer', 'busy', 'wrong_number', 'non_existent_number', 'call_failed'];
          return lead.last_contact_outcome && failedOutcomes.includes(lead.last_contact_outcome);
        });
        
      case 'successfulCalls':
        return leads.filter(lead => lead.has_successful_call && !lead.final_decision);
        
      case 'scheduledToday':
        return leads.filter(lead => {
          if (!lead.scheduled_call_datetime) return false;
          const scheduledDate = new Date(lead.scheduled_call_datetime);
          const scheduledDateOnly = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
          return scheduledDateOnly.getTime() === today.getTime();
        });
        
      case 'interruptedInterviews':
        return leads.filter(lead => lead.interview_interrupted && lead.interview_session_id);
        
      case 'missingInfo':
        return leads.filter(lead => !lead.lead_telefono || !lead.lead_email);
        
      case 'multipleFailedAttempts':
        return leads.filter(lead => (lead.contact_attempts_count || 0) >= 3);
        
      default:
        return leads;
    }
  };

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
      
      return true;
    });
  };

  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads;

    // Apply quick filter
    filtered = applyQuickFilter(filtered, quickFilter);
    
    // Apply advanced filters
    filtered = applyAdvancedFilters(filtered, advancedFilters);
    
    // Filter by search term
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
        lead.lead_estado !== 'aprobado'
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

    // Sort leads
    const sortedLeads = filtered.sort((a, b) => {
      // Aplicar ordenamiento FIFO inteligente solo en tab "pending"
      if (activeTab === "pending") {
        const priorityA = calculateLeadPriority(a);
        const priorityB = calculateLeadPriority(b);
        
        // Ordenar por prioridad descendente (mayor prioridad primero)
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
      }
      
      // Ordenamiento secundario por fecha de creación (más antiguo primero)
      return new Date(a.lead_fecha_creacion).getTime() - new Date(b.lead_fecha_creacion).getTime();
    });

    return sortedLeads;
  }, [leads, searchTerm, activeTab, quickFilter, advancedFilters]);

  return (
    <div className="space-y-4">
      {/* Filtros inteligentes */}
      {onQuickFilterChange && (
        <ApprovalQuickFilters
          leads={leads}
          activeFilter={quickFilter}
          onFilterChange={onQuickFilterChange}
        />
      )}
      
      {/* Filtros avanzados */}
      {advancedFilters && onAdvancedFiltersChange && onResetAdvancedFilters && (
        <ApprovalAdvancedFilters
          filters={advancedFilters}
          onFiltersChange={onAdvancedFiltersChange}
          onResetFilters={onResetAdvancedFilters}
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
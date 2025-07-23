
import { AssignedLead } from "../../../types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { ImprovedLeadCard } from "./ImprovedLeadCard";

interface LeadsListProps {
  leads: AssignedLead[];
  callLogs: VapiCallLog[];
  searchTerm: string;
  activeTab: string;
  onVapiCall: (lead: AssignedLead) => void;
  onManualInterview: (lead: AssignedLead) => void;
  onEditLead: (lead: AssignedLead) => void;
  onViewCallHistory: (lead: AssignedLead) => void;
  onApproveLead: (lead: AssignedLead) => void;
  onSendToSecondInterview: (lead: AssignedLead) => void;
  onReject: (lead: AssignedLead) => void;
  onCompleteMissingInfo: (lead: AssignedLead) => void;
  onLogCall: (lead: AssignedLead) => void;
}

export const LeadsList = ({
  leads,
  callLogs,
  searchTerm,
  activeTab,
  onVapiCall,
  onManualInterview,
  onEditLead,
  onViewCallHistory,
  onApproveLead,
  onSendToSecondInterview,
  onReject,
  onCompleteMissingInfo,
  onLogCall
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

  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch = lead.lead_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.lead_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (lead.lead_telefono && lead.lead_telefono.includes(searchTerm));
      
      if (activeTab === "pending") {
        return matchesSearch && 
               !lead.final_decision && 
               lead.lead_estado !== 'rechazado' && 
               lead.lead_estado !== 'aprobado';
      } else if (activeTab === "approved") {
        return matchesSearch && 
               (lead.final_decision === 'approved' || lead.lead_estado === 'aprobado');
      } else if (activeTab === "rejected") {
        return matchesSearch && 
               (lead.final_decision === 'rejected' || lead.lead_estado === 'rechazado');
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
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

  if (filteredLeads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontraron candidatos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredLeads.map((lead) => {
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
          />
        );
      })}
    </div>
  );
};

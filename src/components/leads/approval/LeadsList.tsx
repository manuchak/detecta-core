
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
    
    // Verificar si tiene llamada programada o entrevista interrumpida
    if (lead.interview_interrupted && lead.interview_session_id) {
      // Máxima prioridad para entrevistas interrumpidas
      priority += 1000;
    }
    
    // Prioridad alta para llamadas programadas
    if (lead.has_scheduled_call && lead.scheduled_call_datetime) {
      const scheduledDate = new Date(lead.scheduled_call_datetime);
      const hoursUntilCall = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Mayor prioridad si la llamada es en las próximas 24 horas
      if (hoursUntilCall <= 24 && hoursUntilCall >= 0) {
        priority += 800;
      } else if (hoursUntilCall < 0) {
        // Llamada vencida - prioridad muy alta
        priority += 900;
      }
    }
    
    // Calcular días transcurridos desde creación
    const creationDate = new Date(lead.lead_fecha_creacion);
    const daysSinceCreation = Math.floor((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Aumentar prioridad por días sin contacto inicial (máximo 500 puntos)
    priority += Math.min(daysSinceCreation * 10, 500);
    
    // Prioridad adicional si no tiene información completa
    if (!lead.lead_telefono || !lead.lead_email) {
      priority += 200;
    }
    
    // Factor de equidad: mayor prioridad a contactos que llevan más tiempo sin gestión
    if (!lead.has_successful_call && daysSinceCreation > 3) {
      priority += 300;
    }
    
    // Reducir prioridad si ya tiene llamada exitosa pero no está cerrado
    if (lead.has_successful_call && !lead.final_decision) {
      priority -= 50;
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

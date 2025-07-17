
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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.lead_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.lead_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.lead_telefono && lead.lead_telefono.includes(searchTerm));
    
    if (activeTab === "pending") {
      // Un lead está pendiente si no tiene decisión final Y su estado no es rechazado/aprobado
      return matchesSearch && 
             !lead.final_decision && 
             lead.lead_estado !== 'rechazado' && 
             lead.lead_estado !== 'aprobado';
    } else if (activeTab === "approved") {
      // Un lead está aprobado si tiene decisión final 'approved' O su estado es 'aprobado'
      return matchesSearch && 
             (lead.final_decision === 'approved' || lead.lead_estado === 'aprobado');
    } else if (activeTab === "rejected") {
      // Un lead está rechazado si tiene decisión final 'rejected' O su estado es 'rechazado'
      return matchesSearch && 
             (lead.final_decision === 'rejected' || lead.lead_estado === 'rechazado');
    }
    
    return matchesSearch;
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

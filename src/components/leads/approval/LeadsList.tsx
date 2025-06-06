
import { AssignedLead } from "../../../types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { LeadCard } from "./LeadCard";

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
  onCompleteMissingInfo
}: LeadsListProps) => {
  const getLeadCallLogs = (leadId: string) => {
    return callLogs.filter(log => log.id === leadId);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.lead_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.lead_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.lead_telefono && lead.lead_telefono.includes(searchTerm));
    
    if (activeTab === "pending") {
      return matchesSearch && !lead.final_decision;
    } else if (activeTab === "approved") {
      return matchesSearch && lead.final_decision === 'approved';
    } else if (activeTab === "rejected") {
      return matchesSearch && lead.final_decision === 'rejected';
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
          <LeadCard
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
          />
        );
      })}
    </div>
  );
};


import { AssignedLead } from "../../../types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { LeadEditDialog } from "@/components/leads/LeadEditDialog";
import { VapiCallDialog } from "@/components/leads/VapiCallDialog";
import { ManualInterviewDialog } from "@/components/leads/ManualInterviewDialog";
import { CallHistoryDialog } from "@/components/leads/CallHistoryDialog";

interface LeadDialogsProps {
  selectedLead: AssignedLead | null;
  showEditDialog: boolean;
  showVapiDialog: boolean;
  showManualDialog: boolean;
  showCallHistory: boolean;
  callLogs: VapiCallLog[];
  onEditDialogChange: (open: boolean) => void;
  onVapiDialogChange: (open: boolean) => void;
  onManualDialogChange: (open: boolean) => void;
  onCallHistoryChange: (open: boolean) => void;
  onUpdate: () => void;
  onCallComplete: () => void;
}

export const LeadDialogs = ({
  selectedLead,
  showEditDialog,
  showVapiDialog,
  showManualDialog,
  showCallHistory,
  callLogs,
  onEditDialogChange,
  onVapiDialogChange,
  onManualDialogChange,
  onCallHistoryChange,
  onUpdate,
  onCallComplete
}: LeadDialogsProps) => {
  if (!selectedLead) return null;

  const getLeadCallLogs = (leadId: string) => {
    return callLogs.filter(log => log.id === leadId);
  };

  return (
    <>
      <LeadEditDialog
        open={showEditDialog}
        onOpenChange={onEditDialogChange}
        lead={selectedLead}
        onUpdate={onUpdate}
      />
      
      <VapiCallDialog
        open={showVapiDialog}
        onOpenChange={onVapiDialogChange}
        lead={selectedLead}
        onCallComplete={onCallComplete}
      />
      
      <ManualInterviewDialog
        open={showManualDialog}
        onOpenChange={onManualDialogChange}
        lead={selectedLead}
        onComplete={onUpdate}
      />
      
      <CallHistoryDialog
        open={showCallHistory}
        onOpenChange={onCallHistoryChange}
        lead={selectedLead}
        callLogs={getLeadCallLogs(selectedLead.lead_id)}
      />
    </>
  );
};


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { LeadsList } from "@/components/leads/approval/LeadsList";
import { LeadDialogs } from "@/components/leads/approval/LeadDialogs";
import { ScheduledCallsView } from "@/components/leads/approval/ScheduledCallsView";

export const LeadApprovals = () => {
  const {
    assignedLeads,
    callLogs,
    loading,
    fetchAssignedLeads,
    fetchCallLogs,
    refreshAfterCall,
    handleApproveLead,
    handleSendToSecondInterview,
    handleReject
  } = useLeadApprovals();

  const [selectedLead, setSelectedLead] = useState<AssignedLead | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showVapiDialog, setShowVapiDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showMissingInfoDialog, setShowMissingInfoDialog] = useState(false);
  const [showCallLogDialog, setShowCallLogDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const handleVapiCall = (lead: AssignedLead) => {
    setSelectedLead(lead);
    setShowVapiDialog(true);
  };

  const handleManualInterview = (lead: AssignedLead) => {
    setSelectedLead(lead);
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

  const handleCallComplete = () => {
    refreshAfterCall();
  };

  const handleOpenCompleteInfo = () => {
    if (selectedLead) {
      setShowMissingInfoDialog(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando candidatos asignados...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Aprobación de Candidatos</h1>
            <p className="text-muted-foreground">
              Gestiona las entrevistas y aprobaciones de los candidatos asignados.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchAssignedLeads}
          >
            Actualizar
          </Button>
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
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                <LeadsList
                  leads={assignedLeads}
                  callLogs={callLogs}
                  searchTerm={searchTerm}
                  activeTab="pending"
                  onVapiCall={handleVapiCall}
                  onManualInterview={handleManualInterview}
                  onEditLead={handleEditLead}
                  onViewCallHistory={handleViewCallHistory}
                  onApproveLead={handleApproveLead}
                  onSendToSecondInterview={handleSendToSecondInterview}
                  onReject={handleReject}
                  onCompleteMissingInfo={handleCompleteMissingInfo}
                  onLogCall={handleLogCall}
                />
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <LeadsList
                  leads={assignedLeads}
                  callLogs={callLogs}
                  searchTerm={searchTerm}
                  activeTab="approved"
                  onVapiCall={handleVapiCall}
                  onManualInterview={handleManualInterview}
                  onEditLead={handleEditLead}
                  onViewCallHistory={handleViewCallHistory}
                  onApproveLead={handleApproveLead}
                  onSendToSecondInterview={handleSendToSecondInterview}
                  onReject={handleReject}
                  onCompleteMissingInfo={handleCompleteMissingInfo}
                  onLogCall={handleLogCall}
                />
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <LeadsList
                  leads={assignedLeads}
                  callLogs={callLogs}
                  searchTerm={searchTerm}
                  activeTab="rejected"
                  onVapiCall={handleVapiCall}
                  onManualInterview={handleManualInterview}
                  onEditLead={handleEditLead}
                  onViewCallHistory={handleViewCallHistory}
                  onApproveLead={handleApproveLead}
                  onSendToSecondInterview={handleSendToSecondInterview}
                  onReject={handleReject}
                  onCompleteMissingInfo={handleCompleteMissingInfo}
                  onLogCall={handleLogCall}
                />
              </TabsContent>

              <TabsContent value="scheduled" className="mt-6">
                <ScheduledCallsView assignedLeads={assignedLeads} />
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
          callLogs={callLogs}
          onEditDialogChange={setShowEditDialog}
          onVapiDialogChange={setShowVapiDialog}
          onManualDialogChange={setShowManualDialog}
          onCallHistoryChange={setShowCallHistory}
          onMissingInfoDialogChange={setShowMissingInfoDialog}
          onCallLogDialogChange={setShowCallLogDialog}
          onUpdate={fetchAssignedLeads}
          onCallComplete={handleCallComplete}
          onOpenCompleteInfo={handleOpenCompleteInfo}
        />
      </div>
    </TooltipProvider>
  );
};

export default LeadApprovals;

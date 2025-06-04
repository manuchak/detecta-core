
import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Bot, 
  Edit, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  ArrowRight,
  UserCheck,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { LeadEditDialog } from "@/components/leads/LeadEditDialog";
import { VapiCallDialog } from "@/components/leads/VapiCallDialog";
import { ManualInterviewDialog } from "@/components/leads/ManualInterviewDialog";
import { CallHistoryDialog } from "@/components/leads/CallHistoryDialog";
import { VapiCallLog } from "@/types/vapiTypes";

interface AssignedLead {
  lead_id: string;
  lead_nombre: string;
  lead_email: string;
  lead_telefono: string;
  lead_estado: string;
  lead_fecha_creacion: string;
  approval_stage: string;
  phone_interview_completed: boolean;
  second_interview_required: boolean;
  final_decision: string | null;
}

export const LeadApprovals = () => {
  const [assignedLeads, setAssignedLeads] = useState<AssignedLead[]>([]);
  const [callLogs, setCallLogs] = useState<VapiCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<AssignedLead | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showVapiDialog, setShowVapiDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignedLeads();
    fetchCallLogs();
  }, []);

  const fetchAssignedLeads = async () => {
    try {
      console.log('Fetching assigned leads...');
      
      // Primero verificar que el usuario esté autenticado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id, user?.email);
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      const { data, error } = await supabase.rpc('get_analyst_assigned_leads');
      
      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      
      console.log('Assigned leads data:', data);
      setAssignedLeads(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "Sin candidatos asignados",
          description: "No tienes candidatos asignados en este momento.",
        });
      }
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los candidatos asignados: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCallLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('vapi_call_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCallLogs(data || []);
    } catch (error) {
      console.error('Error fetching call logs:', error);
    }
  };

  const getStatusBadge = (stage: string, decision: string | null) => {
    if (decision === 'approved') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>;
    }
    if (decision === 'rejected') {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
    }
    
    switch (stage) {
      case 'phone_interview':
        return <Badge className="bg-blue-100 text-blue-800"><Phone className="h-3 w-3 mr-1" />Entrevista Telefónica</Badge>;
      case 'second_interview':
        return <Badge className="bg-purple-100 text-purple-800"><Clock className="h-3 w-3 mr-1" />Segunda Entrevista</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  const filteredLeads = assignedLeads.filter(lead => {
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

  const handleApproveToNextStage = async (lead: AssignedLead) => {
    try {
      let nextStage = 'approved';
      let finalDecision = 'approved';
      
      if (lead.approval_stage === 'phone_interview') {
        nextStage = 'second_interview';
        finalDecision = null;
      }

      const { error } = await supabase.rpc('update_approval_process', {
        p_lead_id: lead.lead_id,
        p_stage: nextStage,
        p_interview_method: 'manual',
        p_notes: 'Aprobado directamente por el analista',
        p_decision: finalDecision,
        p_decision_reason: 'Candidato calificado para siguiente etapa'
      });

      if (error) throw error;

      if (finalDecision) {
        await supabase
          .from('leads')
          .update({
            estado: 'aprobado',
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.lead_id);
      }

      toast({
        title: "Candidato aprobado",
        description: finalDecision ? "El candidato ha sido aprobado completamente." : "El candidato ha sido enviado a segunda entrevista.",
      });

      fetchAssignedLeads();
    } catch (error) {
      console.error('Error approving lead:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar el candidato.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (lead: AssignedLead) => {
    try {
      const { error } = await supabase.rpc('update_approval_process', {
        p_lead_id: lead.lead_id,
        p_stage: 'rejected',
        p_interview_method: 'manual',
        p_notes: 'Rechazado por el analista',
        p_decision: 'rejected',
        p_decision_reason: 'No cumple con los requisitos'
      });

      if (error) throw error;

      await supabase
        .from('leads')
        .update({
          estado: 'rechazado',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.lead_id);

      toast({
        title: "Candidato rechazado",
        description: "El candidato ha sido rechazado.",
      });

      fetchAssignedLeads();
    } catch (error) {
      console.error('Error rejecting lead:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar el candidato.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLeadCallLogs = (leadId: string) => {
    return callLogs.filter(log => log.id === leadId);
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
          <div className="mb-4">
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
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="grid gap-4">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-10">
                    <p>No se encontraron candidatos</p>
                  </div>
                ) : (
                  filteredLeads.map((lead) => {
                    const leadCallLogs = getLeadCallLogs(lead.lead_id);
                    
                    return (
                      <Card key={lead.lead_id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            {/* Información del candidato */}
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {lead.lead_nombre.charAt(0).toUpperCase()}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{lead.lead_nombre}</h3>
                                  {getStatusBadge(lead.approval_stage, lead.final_decision)}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {lead.lead_email}
                                  </div>
                                  {lead.lead_telefono && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4" />
                                      {lead.lead_telefono}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(lead.lead_fecha_creacion)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Play className="h-4 w-4" />
                                    {leadCallLogs.length} llamadas
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex flex-col gap-2 ml-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLead(lead)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                
                                {leadCallLogs.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewCallHistory(lead)}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Historial
                                  </Button>
                                )}
                              </div>

                              {!lead.final_decision && (
                                <div className="flex gap-2">
                                  {/* Entrevistas */}
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleVapiCall(lead)}
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                    >
                                      <Bot className="h-4 w-4 mr-1" />
                                      VAPI
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleManualInterview(lead)}
                                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                                    >
                                      <Phone className="h-4 w-4 mr-1" />
                                      Manual
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {!lead.final_decision && (
                                <div className="flex gap-2">
                                  {/* Decisiones rápidas */}
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveToNextStage(lead)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {lead.approval_stage === 'phone_interview' ? (
                                      <>
                                        <ArrowRight className="h-4 w-4 mr-1" />
                                        2da Entrevista
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-1" />
                                        Aprobar
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleReject(lead)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedLead && (
        <>
          <LeadEditDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            lead={selectedLead}
            onUpdate={fetchAssignedLeads}
          />
          
          <VapiCallDialog
            open={showVapiDialog}
            onOpenChange={setShowVapiDialog}
            lead={selectedLead}
            onCallComplete={() => {
              fetchCallLogs();
              fetchAssignedLeads();
            }}
          />
          
          <ManualInterviewDialog
            open={showManualDialog}
            onOpenChange={setShowManualDialog}
            lead={selectedLead}
            onComplete={fetchAssignedLeads}
          />
          
          <CallHistoryDialog
            open={showCallHistory}
            onOpenChange={setShowCallHistory}
            lead={selectedLead}
            callLogs={getLeadCallLogs(selectedLead.lead_id)}
          />
        </>
      )}
    </div>
  );
};

export default LeadApprovals;

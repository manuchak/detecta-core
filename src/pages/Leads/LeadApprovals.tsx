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
  Calendar,
  MoreHorizontal
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
      return <Badge className="bg-green-100 text-green-800 border-green-200">Aprobado</Badge>;
    }
    if (decision === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Rechazado</Badge>;
    }
    
    switch (stage) {
      case 'phone_interview':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Entrevista Telefónica</Badge>;
      case 'second_interview':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Segunda Entrevista</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pendiente</Badge>;
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
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="space-y-4">
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No se encontraron candidatos</p>
                    </div>
                  ) : (
                    filteredLeads.map((lead) => {
                      const leadCallLogs = getLeadCallLogs(lead.lead_id);
                      
                      return (
                        <Card key={lead.lead_id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              {/* Información del candidato */}
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {lead.lead_nombre.charAt(0).toUpperCase()}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{lead.lead_nombre}</h3>
                                    {getStatusBadge(lead.approval_stage, lead.final_decision)}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-4 w-4" />
                                      {lead.lead_email}
                                    </div>
                                    {lead.lead_telefono && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        {lead.lead_telefono}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(lead.lead_fecha_creacion)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Play className="h-3 w-3" />
                                      {leadCallLogs.length} llamadas
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Acciones con iconos y tooltips */}
                              <div className="flex items-center gap-2">
                                {/* Llamada VAPI - Acción principal */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleVapiCall(lead)}
                                      className="h-9 w-9 p-0 bg-blue-50 hover:bg-blue-100 border-blue-200"
                                    >
                                      <Bot className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Llamada automática con VAPI</p>
                                  </TooltipContent>
                                </Tooltip>

                                {/* Aprobar/Siguiente etapa - Solo para pendientes */}
                                {!lead.final_decision && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveToNextStage(lead)}
                                        className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        {lead.approval_stage === 'phone_interview' ? (
                                          <>
                                            <ArrowRight className="h-4 w-4 mr-1" />
                                            2da Entrevista
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Aprobar
                                          </>
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {lead.approval_stage === 'phone_interview' 
                                          ? "Enviar a segunda entrevista" 
                                          : "Aprobar candidato"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Rechazar - Solo para pendientes */}
                                {!lead.final_decision && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleReject(lead)}
                                        className="h-9 w-9 p-0"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Rechazar candidato</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Menú de acciones adicionales */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar candidato
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem onClick={() => handleManualInterview(lead)}>
                                      <Phone className="h-4 w-4 mr-2" />
                                      Entrevista manual
                                    </DropdownMenuItem>
                                    
                                    {leadCallLogs.length > 0 && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleViewCallHistory(lead)}>
                                          <Play className="h-4 w-4 mr-2" />
                                          Ver historial de llamadas
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
    </TooltipProvider>
  );
};

export default LeadApprovals;

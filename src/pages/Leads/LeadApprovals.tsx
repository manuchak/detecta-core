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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, Bot, Edit, Play, CheckCircle, XCircle, Clock, User, Mail, MapPin } from "lucide-react";
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
      const { data, error } = await supabase.rpc('get_analyst_assigned_leads');
      
      if (error) throw error;
      
      setAssignedLeads(data || []);
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los candidatos asignados.",
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Llamadas</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          <p>No se encontraron candidatos</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => {
                        const leadCallLogs = getLeadCallLogs(lead.lead_id);
                        
                        return (
                          <TableRow key={lead.lead_id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{lead.lead_nombre}</p>
                                  <p className="text-sm text-muted-foreground">{lead.lead_email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {lead.lead_email}
                                </div>
                                {lead.lead_telefono && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3 w-3" />
                                    {lead.lead_telefono}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(lead.approval_stage, lead.final_decision)}
                            </TableCell>
                            <TableCell>
                              {formatDate(lead.lead_fecha_creacion)}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm">{leadCallLogs.length} llamadas</p>
                                {leadCallLogs.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewCallHistory(lead)}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Ver historial
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLead(lead)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                                {!lead.phone_interview_completed && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleVapiCall(lead)}
                                    >
                                      <Bot className="h-3 w-3 mr-1" />
                                      VAPI
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleManualInterview(lead)}
                                    >
                                      <Phone className="h-3 w-3 mr-1" />
                                      Manual
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
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

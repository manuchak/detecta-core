import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Search, Plus, MoreHorizontal, ChevronRight, Loader2, Eye, Edit, UserCheck, X, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { LeadForm } from "@/components/leads/LeadForm";
import { ReferralManager } from "@/components/leads/ReferralManager";
import { LeadAssignmentDialog } from "@/components/leads/LeadAssignmentDialog";

interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  mensaje: string | null;
  fuente: string;
  estado: string;
  fecha_creacion: string;
  fecha_contacto: string | null;
  notas: string | null;
  asignado_a: string | null;
  created_at: string;
  updated_at: string;
  // Información de referido
  referido_por?: string | null;
  referido_info?: any;
  // Información adicional del candidato
  tipo_custodio?: string | null;
  ciudad?: string | null;
  estado_nombre?: string | null;
  // Información del analista asignado
  analista_nombre?: string | null;
}

const statusBadgeStyles = {
  nuevo: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  contactado: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  entrevista: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  documentos: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  aprobado: "bg-green-100 text-green-800 hover:bg-green-100",
  rechazado: "bg-red-100 text-red-800 hover:bg-red-100",
  en_proceso: "bg-amber-100 text-amber-800 hover:bg-amber-100",
};

export const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("candidatos");
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedLeadForAssignment, setSelectedLeadForAssignment] = useState<Lead | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      console.log('Iniciando fetchLeads...');
      
      // Obtener datos básicos de leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        throw leadsError;
      }
      
      console.log('Leads data:', leadsData);
      
      if (!leadsData || leadsData.length === 0) {
        console.log('No se encontraron leads en la base de datos');
        setLeads([]);
        setFilteredLeads([]);
        return;
      }

      // Procesar cada lead para extraer información adicional
      const processedLeads: Lead[] = leadsData.map((item: any) => {
        let referidoInfo = null;
        let referidoPor = null;
        let tipoCustodio = null;
        let ciudad = null;
        let estadoNombre = null;
        let analistaNombre = null;

        // Extraer información del campo notas si existe
        try {
          if (item.notas) {
            const notasData = JSON.parse(item.notas);
            console.log('Notas data para lead', item.id, ':', notasData);
            
            if (notasData.referido) {
              referidoInfo = notasData.referido;
              referidoPor = notasData.referido.custodio_referente_nombre;
            }
            if (notasData.tipo_custodio) {
              tipoCustodio = notasData.tipo_custodio;
            }
            if (notasData.datos_personales) {
              ciudad = notasData.datos_personales.ciudad;
              estadoNombre = notasData.datos_personales.estado;
            }
          }
        } catch (e) {
          console.error('Error parsing notas for lead', item.id, ':', e);
        }

        // Mapear el lead con la información procesada
        const processedLead: Lead = {
          id: item.id,
          nombre: item.nombre || '',
          email: item.email || '',
          telefono: item.telefono,
          empresa: item.empresa,
          mensaje: item.mensaje,
          fuente: item.fuente || 'web',
          estado: item.estado || 'nuevo',
          fecha_creacion: item.fecha_creacion || item.created_at,
          fecha_contacto: item.fecha_contacto,
          notas: item.notas,
          asignado_a: item.asignado_a,
          created_at: item.created_at,
          updated_at: item.updated_at,
          referido_por: referidoPor,
          referido_info: referidoInfo,
          tipo_custodio: tipoCustodio,
          ciudad: ciudad,
          estado_nombre: estadoNombre,
          analista_nombre: analistaNombre
        };

        console.log('Processed lead:', processedLead);
        return processedLead;
      });

      // Obtener información de analistas asignados
      if (processedLeads.some(lead => lead.asignado_a)) {
        const analystIds = processedLeads
          .filter(lead => lead.asignado_a)
          .map(lead => lead.asignado_a);

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', analystIds);

        if (!profilesError && profiles) {
          processedLeads.forEach(lead => {
            if (lead.asignado_a) {
              const analyst = profiles.find(p => p.id === lead.asignado_a);
              if (analyst) {
                lead.analista_nombre = analyst.display_name;
              }
            }
          });
        }
      }
      
      console.log('Final processed leads:', processedLeads);
      setLeads(processedLeads);
      setFilteredLeads(processedLeads);
      
    } catch (error) {
      console.error('Error in fetchLeads:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los candidatos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Filtering leads. Search term:', searchTerm, 'Status filter:', statusFilter);
    console.log('All leads:', leads);
    
    let result = [...leads]; // Crear una copia para evitar mutaciones
    
    if (searchTerm && searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      result = result.filter((lead) => {
        const matchesName = lead.nombre?.toLowerCase().includes(lowerSearchTerm);
        const matchesEmail = lead.email?.toLowerCase().includes(lowerSearchTerm);
        const matchesPhone = lead.telefono?.toLowerCase().includes(lowerSearchTerm);
        const matchesReferrer = lead.referido_por?.toLowerCase().includes(lowerSearchTerm);
        
        return matchesName || matchesEmail || matchesPhone || matchesReferrer;
      });
    }
    
    if (statusFilter !== "todos") {
      result = result.filter((lead) => {
        const leadStatus = (lead.estado || 'nuevo').toLowerCase();
        return leadStatus === statusFilter.toLowerCase();
      });
    }
    
    console.log('Filtered result:', result);
    setFilteredLeads(result);
  }, [searchTerm, statusFilter, leads]);

  const getStatusBadgeStyle = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    
    const normalizedStatus = status.toLowerCase();
    const matchedStyle = Object.entries(statusBadgeStyles).find(([key]) => 
      normalizedStatus.includes(key)
    );
    
    return matchedStyle ? matchedStyle[1] : "bg-gray-100 text-gray-800 hover:bg-gray-100";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          estado: newStatus,
          fecha_contacto: newStatus === 'contactado' ? new Date().toISOString() : null
        })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `El estado del candidato ha sido actualizado a ${newStatus}.`,
      });

      fetchLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del candidato.",
        variant: "destructive",
      });
    }
  };

  const renderLeadDetails = (lead: Lead) => {
    let candidateDetails = null;
    try {
      candidateDetails = lead.notas ? JSON.parse(lead.notas) : null;
    } catch (e) {
      console.error('Error parsing candidate details:', e);
    }

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <div>
          <h3 className="text-lg font-semibold mb-3">Información Personal</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><strong>Nombre:</strong> {lead.nombre}</div>
            <div><strong>Email:</strong> {lead.email}</div>
            <div><strong>Teléfono:</strong> {lead.telefono || 'No especificado'}</div>
            <div><strong>Estado:</strong> 
              <Badge variant="outline" className={getStatusBadgeStyle(lead.estado)}>
                {lead.estado}
              </Badge>
            </div>
            {lead.referido_por && (
              <div className="col-span-2">
                <strong>Referido por:</strong> 
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                  <Users className="h-3 w-3 mr-1" />
                  {lead.referido_por}
                </Badge>
              </div>
            )}
            {candidateDetails?.datos_personales && (
              <>
                <div><strong>Edad:</strong> {candidateDetails.datos_personales.edad || 'No especificado'}</div>
                <div><strong>Ciudad:</strong> {candidateDetails.datos_personales.ciudad || 'No especificado'}</div>
                <div className="col-span-2"><strong>Dirección:</strong> {candidateDetails.datos_personales.direccion || 'No especificado'}</div>
              </>
            )}
          </div>
        </div>

        {candidateDetails?.vehiculo && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Información del Vehículo</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Marca:</strong> {candidateDetails.vehiculo.marca || 'No especificado'}</div>
              <div><strong>Modelo:</strong> {candidateDetails.vehiculo.modelo || 'No especificado'}</div>
              <div><strong>Año:</strong> {candidateDetails.vehiculo.año || 'No especificado'}</div>
              <div><strong>Placas:</strong> {candidateDetails.vehiculo.placas || 'No especificado'}</div>
              <div><strong>Color:</strong> {candidateDetails.vehiculo.color || 'No especificado'}</div>
              <div><strong>Tipo:</strong> {candidateDetails.vehiculo.tipo || 'No especificado'}</div>
              <div className="col-span-2"><strong>Seguro vigente:</strong> {candidateDetails.vehiculo.seguro_vigente || 'No especificado'}</div>
            </div>
          </div>
        )}

        {candidateDetails?.experiencia && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Experiencia Laboral</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Experiencia en custodia:</strong> {candidateDetails.experiencia.experiencia_custodia || 'No especificado'}</div>
              <div><strong>Años de experiencia:</strong> {candidateDetails.experiencia.años_experiencia || 'No especificado'}</div>
              <div><strong>Licencia:</strong> {candidateDetails.experiencia.licencia_conducir || 'No especificado'}</div>
              <div><strong>Tipo licencia:</strong> {candidateDetails.experiencia.tipo_licencia || 'No especificado'}</div>
              <div className="col-span-2"><strong>Empresas anteriores:</strong> {candidateDetails.experiencia.empresas_anteriores || 'No especificado'}</div>
              <div className="col-span-2"><strong>Antecedentes penales:</strong> {candidateDetails.experiencia.antecedentes_penales || 'No especificado'}</div>
            </div>
          </div>
        )}

        {candidateDetails?.zona_trabajo && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Zona de Trabajo</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Zona preferida:</strong> {candidateDetails.zona_trabajo.zona_preferida || 'No especificado'}</div>
              <div><strong>Rango km:</strong> {candidateDetails.zona_trabajo.rango_km || 'No especificado'}</div>
              <div><strong>Horario:</strong> {candidateDetails.zona_trabajo.disponibilidad_horario || 'No especificado'}</div>
              <div><strong>Días:</strong> {candidateDetails.zona_trabajo.disponibilidad_dias || 'No especificado'}</div>
            </div>
          </div>
        )}

        {lead.mensaje && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Mensaje</h3>
            <p className="text-sm bg-gray-50 p-3 rounded">{lead.mensaje}</p>
          </div>
        )}

        {candidateDetails?.referencias && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Referencias</h3>
            <p className="text-sm bg-gray-50 p-3 rounded">{candidateDetails.referencias}</p>
          </div>
        )}
      </div>
    );
  };

  const handleAssignLead = (lead: Lead) => {
    setSelectedLeadForAssignment(lead);
    setShowAssignmentDialog(true);
  };

  const getTipoCustodioLabel = (tipo: string | null | undefined) => {
    if (!tipo) return 'No especificado';
    
    const tipos: Record<string, string> = {
      'custodio_vehiculo': 'Con Vehículo',
      'armado': 'Armado',
      'armado_vehiculo': 'Armado con Vehículo',
      'abordo': 'Abordo'
    };
    
    return tipos[tipo] || tipo;
  };

  const getFuenteLabel = (fuente: string) => {
    const fuentes: Record<string, string> = {
      'web': 'Sitio Web',
      'facebook': 'Facebook',
      'indeed': 'Indeed',
      'linkedin': 'LinkedIn',
      'referido': 'Referido',
      'whatsapp': 'WhatsApp',
      'telefono': 'Teléfono'
    };
    
    return fuentes[fuente] || fuente;
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Candidatos</h1>
          <p className="text-muted-foreground">
            Administra candidatos a custodios y el sistema de referidos.
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Candidato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Candidato</DialogTitle>
            </DialogHeader>
            <LeadForm 
              onSuccess={() => {
                setShowForm(false);
                fetchLeads();
              }}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
          <TabsTrigger value="referidos">Sistema de Referidos</TabsTrigger>
        </TabsList>

        <TabsContent value="candidatos">
          <Card>
            <CardHeader>
              <CardTitle>Listado de Candidatos</CardTitle>
              <CardDescription>
                Total de candidatos: {filteredLeads.length} | 
                Referidos: {leads.filter(l => l.referido_por).length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por nombre, email, teléfono o referente..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Select 
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="nuevo">Nuevo</SelectItem>
                      <SelectItem value="contactado">Contactado</SelectItem>
                      <SelectItem value="entrevista">En entrevista</SelectItem>
                      <SelectItem value="documentos">Documentos</SelectItem>
                      <SelectItem value="en_proceso">En proceso</SelectItem>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">Tipo</TableHead>
                      <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
                      <TableHead className="hidden lg:table-cell">Fuente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden lg:table-cell">Analista</TableHead>
                      <TableHead className="hidden md:table-cell">Fecha</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Cargando candidatos...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10">
                          <p>No se encontraron candidatos</p>
                          <p className="text-muted-foreground text-sm mt-1">
                            {searchTerm || statusFilter !== "todos" 
                              ? "Intenta con otros filtros de búsqueda" 
                              : "Agrega nuevos candidatos para empezar a visualizarlos aquí"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">
                            <div>
                              {lead.nombre}
                              {lead.referido_por && (
                                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                                  <Users className="h-3 w-3 mr-1" />
                                  Referido
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              {getTipoCustodioLabel(lead.tipo_custodio)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-sm">
                              {lead.ciudad && lead.estado_nombre ? 
                                `${lead.ciudad}, ${lead.estado_nombre}` : 
                                lead.ciudad || lead.estado_nombre || 'No especificado'
                              }
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="outline" className="bg-gray-50 text-gray-700">
                              {getFuenteLabel(lead.fuente)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeStyle(lead.estado)}>
                              {lead.estado ? (lead.estado.charAt(0).toUpperCase() + lead.estado.slice(1)) : "Nuevo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {lead.analista_nombre ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <UserCheck className="h-3 w-3 mr-1" />
                                {lead.analista_nombre}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Sin asignar</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(lead.fecha_creacion)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Acciones</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedLead(lead);
                                  setShowDetails(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAssignLead(lead)}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Asignar analista
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'contactado')}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Marcar contactado
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'aprobado')}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Aprobar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => updateLeadStatus(lead.id, 'rechazado')}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Rechazar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referidos">
          <ReferralManager />
        </TabsContent>
      </Tabs>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles del Candidato</DialogTitle>
          </DialogHeader>
          {selectedLead && renderLeadDetails(selectedLead)}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <LeadAssignmentDialog
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
        leadId={selectedLeadForAssignment?.id || ''}
        leadName={selectedLeadForAssignment?.nombre || ''}
        currentAssignee={selectedLeadForAssignment?.asignado_a}
        onAssignmentUpdate={fetchLeads}
      />
    </div>
  );
};

export default LeadsList;

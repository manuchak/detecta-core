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
import { Search, Plus, MoreHorizontal, ChevronRight, Loader2, Eye, Edit, UserCheck, X, Users, User, MapPin, Phone, Mail, Calendar, Car, Briefcase, Shield, Award, Clock, Star } from "lucide-react";
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

      const processedLeads: Lead[] = leadsData.map((item: any) => {
        let referidoInfo = null;
        let referidoPor = null;
        let tipoCustodio = null;
        let ciudad = null;
        let estadoNombre = null;
        let analistaNombre = null;

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

      if (processedLeads.some(lead => lead.asignado_a)) {
        try {
          const { data: profiles, error: profilesError } = await supabase
            .rpc('get_users_with_roles_secure');

          if (!profilesError && profiles) {
            processedLeads.forEach(lead => {
              if (lead.asignado_a) {
                const analyst = profiles.find((p: any) => p.id === lead.asignado_a);
                if (analyst) {
                  lead.analista_nombre = analyst.display_name || analyst.email;
                }
              }
            });
          }
        } catch (error) {
          console.error('Error fetching analyst profiles:', error);
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
    
    let result = [...leads];
    
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
          updated_at: new Date().toISOString()
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

    const getExperienceYears = () => {
      if (candidateDetails?.experiencia?.años_experiencia) {
        return candidateDetails.experiencia.años_experiencia;
      }
      return "No especificado";
    };

    const getVehicleInfo = () => {
      if (candidateDetails?.vehiculo) {
        const { marca, modelo, año } = candidateDetails.vehiculo;
        return `${marca || ''} ${modelo || ''} ${año || ''}`.trim() || "No especificado";
      }
      return "No especificado";
    };

    return (
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Header moderno con avatar y información principal */}
        <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 rounded-2xl text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-6">
              {/* Avatar moderno */}
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-bold text-green-800">✓</span>
                </div>
              </div>
              
              {/* Información principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white truncate">{lead.nombre}</h2>
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    {lead.estado?.charAt(0).toUpperCase() + lead.estado?.slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-white/90">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <Phone className="h-4 w-4" />
                    <span>{lead.telefono || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="h-4 w-4" />
                    <span>{lead.ciudad && lead.estado_nombre ? `${lead.ciudad}, ${lead.estado_nombre}` : 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(lead.fecha_creacion)}</span>
                  </div>
                </div>
                
                {lead.referido_por && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-100/20 text-amber-100 border-amber-200/30 backdrop-blur-sm">
                      <Users className="h-3 w-3 mr-1" />
                      Referido por {lead.referido_por}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de información organizadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Información Personal */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Datos Personales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidateDetails?.datos_personales?.edad && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Edad</span>
                  <span className="text-sm font-medium">{candidateDetails.datos_personales.edad}</span>
                </div>
              )}
              {candidateDetails?.datos_personales?.direccion && (
                <div>
                  <span className="text-xs text-gray-600">Dirección</span>
                  <p className="text-sm font-medium mt-1 leading-tight">{candidateDetails.datos_personales.direccion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Vehículo */}
          {candidateDetails?.vehiculo && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-green-900 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Vehículo</span>
                  <span className="text-sm font-medium">{getVehicleInfo()}</span>
                </div>
                {candidateDetails.vehiculo.color && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Color</span>
                    <span className="text-sm font-medium">{candidateDetails.vehiculo.color}</span>
                  </div>
                )}
                {candidateDetails.vehiculo.placas && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Placas</span>
                    <span className="text-sm font-medium">{candidateDetails.vehiculo.placas}</span>
                  </div>
                )}
                {candidateDetails.vehiculo.seguro_vigente && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">Seguro vigente</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Experiencia */}
          {candidateDetails?.experiencia && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Experiencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Años de experiencia</span>
                  <span className="text-sm font-medium">{getExperienceYears()}</span>
                </div>
                {candidateDetails.experiencia.experiencia_custodia && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-purple-700 font-medium">Experiencia en custodia</span>
                  </div>
                )}
                {candidateDetails.experiencia.licencia_conducir && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Licencia</span>
                    <span className="text-sm font-medium">{candidateDetails.experiencia.tipo_licencia || 'Sí'}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Zona de Trabajo */}
          {candidateDetails?.zona_trabajo && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Zona de Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidateDetails.zona_trabajo.zona_preferida && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Zona preferida</span>
                    <span className="text-sm font-medium">{candidateDetails.zona_trabajo.zona_preferida}</span>
                  </div>
                )}
                {candidateDetails.zona_trabajo.disponibilidad_horario && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-orange-700 font-medium">{candidateDetails.zona_trabajo.disponibilidad_horario}</span>
                  </div>
                )}
                {candidateDetails.zona_trabajo.rango_km && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Rango km</span>
                    <span className="text-sm font-medium">{candidateDetails.zona_trabajo.rango_km}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tipo de Custodio */}
          {lead.tipo_custodio && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-teal-900 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Tipo de Custodio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-300">
                  {getTipoCustodioLabel(lead.tipo_custodio)}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mensaje adicional */}
        {lead.mensaje && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">Mensaje del Candidato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed italic">"{lead.mensaje}"</p>
            </CardContent>
          </Card>
        )}

        {/* Referencias */}
        {candidateDetails?.referencias && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-indigo-900">Referencias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">{candidateDetails.referencias}</p>
            </CardContent>
          </Card>
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
                        <TableRow key={lead.id} className="hover:bg-gray-50/50">
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Perfil del Candidato</DialogTitle>
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

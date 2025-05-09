
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Plus, MoreHorizontal, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Interface for the Lead data from Supabase
interface Lead {
  id: number;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  estado: string | null;
  empresa: string | null;
  fecha_creacion: string | null;
  created_at: string;
  fuente: string | null;
}

const statusBadgeStyles = {
  nuevo: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  proceso: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  aprobacion: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  aprobado: "bg-green-100 text-green-800 hover:bg-green-100",
  rechazado: "bg-red-100 text-red-800 hover:bg-red-100",
};

export const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const { toast } = useToast();

  // Fetch leads from Supabase
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setLeads(data || []);
        setFilteredLeads(data || []);
      } catch (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los leads. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [toast]);

  // Handle search and filter
  useEffect(() => {
    let result = leads;
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter((lead) => 
        (lead.nombre?.toLowerCase().includes(lowerSearchTerm) || false) ||
        (lead.email?.toLowerCase().includes(lowerSearchTerm) || false) ||
        (lead.telefono?.toLowerCase().includes(lowerSearchTerm) || false) ||
        (lead.empresa?.toLowerCase().includes(lowerSearchTerm) || false)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "todos") {
      result = result.filter((lead) => {
        const leadStatus = lead.estado?.toLowerCase() || '';
        return leadStatus === statusFilter;
      });
    }
    
    setFilteredLeads(result);
  }, [searchTerm, statusFilter, leads]);

  // Get the status badge style based on lead status
  const getStatusBadgeStyle = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    
    const normalizedStatus = status.toLowerCase();
    const matchedStyle = Object.entries(statusBadgeStyles).find(([key]) => 
      normalizedStatus.includes(key)
    );
    
    return matchedStyle ? matchedStyle[1] : "bg-gray-100 text-gray-800 hover:bg-gray-100";
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Gestiona los leads y su proceso de aprobación.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Lead
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Leads</CardTitle>
          <CardDescription>
            Total de leads: {filteredLeads.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, contacto o email..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select 
                defaultValue="todos"
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="proceso">En proceso</SelectItem>
                  <SelectItem value="aprobacion">En aprobación</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Filtrar</Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Cargando leads...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <p>No se encontraron leads</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {searchTerm || statusFilter !== "todos" 
                          ? "Intenta con otros filtros de búsqueda" 
                          : "Agrega nuevos leads para empezar a visualizarlos aquí"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.nombre || "Sin nombre"}</TableCell>
                      <TableCell>{lead.empresa || "Sin empresa"}</TableCell>
                      <TableCell className="hidden md:table-cell">{lead.email || "Sin email"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{lead.telefono || "Sin teléfono"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeStyle(lead.estado)}>
                          {lead.estado ? (lead.estado.charAt(0).toUpperCase() + lead.estado.slice(1)) : "Nuevo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(lead.fecha_creacion || lead.created_at)}
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
                            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Eliminar
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
          
          <div className="mt-4 flex items-center justify-end space-x-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsList;

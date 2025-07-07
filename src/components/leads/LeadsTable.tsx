
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Edit, AlertCircle, RefreshCw, Info } from "lucide-react";
import { useLeads, Lead } from "@/hooks/useLeads";
import { LeadAssignmentDialog } from "./LeadAssignmentDialog";

interface LeadsTableProps {
  onEditLead?: (lead: Lead) => void;
}

export const LeadsTable = ({ onEditLead }: LeadsTableProps) => {
  const { leads, isLoading, error, refetch } = useLeads();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);

  console.log('🎯 LeadsTable - Estado actual:', {
    isLoading,
    error: error ? error.message : null,
    leadsCount: leads?.length || 0,
    leads: leads?.slice(0, 2) // Solo primeros 2 para debug
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Cargando candidatos...</span>
          <div className="text-xs text-gray-500 max-w-md text-center">
            Verificando permisos y consultando base de datos...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">Error al cargar candidatos</span>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-red-800 font-medium">Detalles del error:</p>
            <p className="text-red-700 text-sm font-mono break-words">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
          </div>
          
          <div className="text-left">
            <p className="text-red-800 font-medium mb-2">Posibles causas:</p>
            <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
              <li>Problema de recursión infinita en políticas RLS</li>
              <li>Permisos insuficientes para acceder a la tabla</li>
              <li>Usuario no tiene el rol adecuado (admin, owner, manager)</li>
              <li>Problemas de autenticación con Supabase</li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="secondary"
          >
            Recargar página
          </Button>
        </div>
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <Info className="h-5 w-5" />
            <h3 className="font-semibold">No se encontraron candidatos</h3>
          </div>
          <div className="space-y-2 text-blue-700">
            <p>La consulta se ejecutó correctamente pero no devolvió resultados.</p>
            <div className="text-sm bg-blue-100 p-3 rounded border">
              <p className="font-medium">Esto puede significar:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>No hay leads registrados en la base de datos</li>
                <li>Los leads no son visibles con tu rol actual</li>
                <li>Las políticas RLS están restringiendo el acceso</li>
              </ul>
            </div>
          </div>
        </div>
        
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>
    );
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefono?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || lead.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'nuevo': 'bg-blue-100 text-blue-800',
      'en_proceso': 'bg-yellow-100 text-yellow-800',
      'aprobado': 'bg-green-100 text-green-800',
      'rechazado': 'bg-red-100 text-red-800',
      'pendiente': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const handleAssignLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowAssignmentDialog(true);
  };

  return (
    <div className="space-y-4">
      {/* Estado de éxito */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-green-800">
            <span className="text-sm font-medium">✅ Datos cargados exitosamente</span>
          </div>
          <div className="text-xs text-green-600">
            Total: {leads.length} | Filtrados: {filteredLeads.length}
          </div>
        </div>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="nuevo">Nuevo</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.nombre}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.telefono}</TableCell>
                <TableCell>{getStatusBadge(lead.estado)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{lead.fuente || 'N/A'}</Badge>
                </TableCell>
                <TableCell>
                  {lead.fecha_creacion ? new Date(lead.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'}
                </TableCell>
                <TableCell>
                  {lead.asignado_a ? (
                    <Badge variant="outline">Asignado</Badge>
                  ) : (
                    <Badge variant="secondary">Sin asignar</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignLead(lead)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Asignar
                    </Button>
                    {onEditLead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditLead(lead)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredLeads.length === 0 && leads.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No se encontraron candidatos que coincidan con los filtros aplicados.
          </p>
        </div>
      )}

      {selectedLead && (
        <LeadAssignmentDialog
          open={showAssignmentDialog}
          onOpenChange={setShowAssignmentDialog}
          leadId={selectedLead.id}
          leadName={selectedLead.nombre}
          currentAssignee={selectedLead.asignado_a}
          onAssignmentUpdate={() => refetch()}
        />
      )}
    </div>
  );
};

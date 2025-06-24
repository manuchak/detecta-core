
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
import { Search, UserPlus, Edit } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Cargando candidatos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">
          Error al cargar candidatos: {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
        <Button onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          No hay candidatos registrados en el sistema.
        </p>
        <Button onClick={() => refetch()}>
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
                  {new Date(lead.fecha_creacion).toLocaleDateString('es-ES')}
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

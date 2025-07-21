import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Search, UserPlus, Edit, AlertCircle, RefreshCw, CheckCircle, User, UserX } from "lucide-react";
import { useSimpleLeads } from "@/hooks/useSimpleLeads";
import { Lead } from "@/types/leadTypes";
import { LeadAssignmentDialog } from "./LeadAssignmentDialog";
import { LeadsMetricsDashboard } from "./LeadsMetricsDashboard";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { AdvancedFilters, AdvancedFiltersState } from "./AdvancedFilters";
import { QuickFilters, QuickFilterPreset } from "./QuickFilters";
import { LeadDetailsDialog } from "./LeadDetailsDialog";

interface LeadsTableProps {
  onEditLead?: (lead: Lead) => void;
}

export const LeadsTable = ({ onEditLead }: LeadsTableProps) => {
  // Estados para filtros y UI
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>(() => ({
    dateFrom: '',
    dateTo: '',
    source: 'all',
    unassignedDays: 'all',
    status: 'all',
    assignment: 'all'
  }));

  // Preparar filtros para el hook optimizado
  const leadsFilters = useMemo(() => ({
    searchTerm: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    assignment: assignmentFilter !== 'all' ? assignmentFilter : undefined,
    dateFrom: advancedFilters.dateFrom || undefined,
    dateTo: advancedFilters.dateTo || undefined,
    source: advancedFilters.source !== 'all' ? advancedFilters.source : undefined,
  }), [searchTerm, statusFilter, assignmentFilter, advancedFilters]);

  // Hook optimizado con filtros en backend y paginación
  const { 
    leads, 
    totalCount,
    paginationInfo,
    isLoading, 
    error, 
    canAccess, 
    accessReason, 
    permissions, 
    refetch,
    clearCache
  } = useSimpleLeads({
    filters: leadsFilters,
    pagination: { page: currentPage, pageSize: 50 },
    enableCache: true
  });

  // ALL CALLBACK HOOKS
  const handleAdvancedFiltersChange = useCallback((newFilters: AdvancedFiltersState) => {
    setAdvancedFilters(newFilters);
    setCurrentPage(1); // Reset página al cambiar filtros
  }, []);

  const handleResetFilters = useCallback(() => {
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      source: 'all',
      unassignedDays: 'all',
      status: 'all',
      assignment: 'all'
    });
    setStatusFilter('all');
    setAssignmentFilter('all');
    setSearchTerm('');
    setActiveQuickFilter('');
    setCurrentPage(1); // Reset página al limpiar filtros
  }, []);

  const handleQuickFilter = useCallback((preset: QuickFilterPreset) => {
    setActiveQuickFilter(preset.id);
    
    // Limpiar filtros existentes
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      source: 'all',
      unassignedDays: 'all',
      status: 'all',
      assignment: 'all'
    });
    setStatusFilter('all');
    setAssignmentFilter('all');
    
    // Aplicar el preset de filtros rápidos
    const newFilters = { ...advancedFilters };
    
    if (preset.filters.days) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - preset.filters.days);
      newFilters.dateFrom = targetDate.toISOString().split('T')[0];
    }
    
    if (preset.filters.dateFrom) {
      newFilters.dateFrom = preset.filters.dateFrom;
    }
    
    if (preset.filters.dateTo) {
      newFilters.dateTo = preset.filters.dateTo;
    }
    
    if (preset.filters.source && preset.filters.source !== 'all') {
      newFilters.source = preset.filters.source;
    }
    
    if (preset.filters.assignment) {
      newFilters.assignment = preset.filters.assignment;
      setAssignmentFilter(preset.filters.assignment);
    }
    
    if (preset.filters.status) {
      newFilters.status = preset.filters.status;
      setStatusFilter(preset.filters.status);
    }
    
    setAdvancedFilters(newFilters);
  }, [advancedFilters]);

  // HELPER FUNCTIONS (Ya no necesitamos filtrar en frontend, se hace en backend)
  const resetPageOnFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

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

  const handleSelectLead = (lead: Lead, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, lead]);
    } else {
      setSelectedLeads(prev => prev.filter(l => l.id !== lead.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads); // Usar leads directamente (ya filtrados en backend)
    } else {
      setSelectedLeads([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedLeads([]);
  };

  const isLeadSelected = (leadId: string) => {
    return selectedLeads.some(lead => lead.id === leadId);
  };

  // Los leads ya vienen filtrados del backend
  const allFilteredSelected = leads.length > 0 && 
    leads.every(lead => isLeadSelected(lead.id));

  // CONDITIONAL RENDERING - AFTER ALL HOOKS
  if (!canAccess) {
    return (
      <div className="text-center py-8">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-center space-x-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Acceso Restringido</h3>
          </div>
          <p className="text-orange-700 text-lg">
            {accessReason}
          </p>
          {error && (
            <p className="text-sm text-destructive mt-2">
              Error técnico: {error.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">
            {canAccess ? 'Cargando candidatos...' : 'Verificando permisos...'}
          </span>
          {canAccess && (
            <div className="text-xs text-gray-500 max-w-md text-center">
              Consultando la base de datos...
            </div>
          )}
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
              {error.message}
            </p>
          </div>
          
          <div className="text-left">
            <p className="text-red-800 font-medium mb-2">Acciones disponibles:</p>
            <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
              <li>Verificar que estás autenticado correctamente</li>
              <li>Recargar la página para refrescar la sesión</li>
              <li>Contactar al administrador si el problema persiste</li>
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
            <CheckCircle className="h-5 w-5" />
            <h3 className="font-semibold">Sistema funcionando correctamente</h3>
          </div>
          <div className="space-y-2 text-blue-700">
            <p>La consulta se ejecutó exitosamente pero no hay candidatos registrados.</p>
          </div>
        </div>
        
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <div className="space-y-4">
      <LeadsMetricsDashboard leads={leads || []} />

      <QuickFilters 
        onApplyFilter={handleQuickFilter}
        activePreset={activeQuickFilter}
      />

      <AdvancedFilters 
        filters={advancedFilters}
        onFiltersChange={handleAdvancedFiltersChange}
        onResetFilters={handleResetFilters}
      />

      <BulkActionsToolbar 
        selectedLeads={selectedLeads}
        onClearSelection={handleClearSelection}
        onBulkAssignmentComplete={refetch}
      />

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}>
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
        <Select value={assignmentFilter} onValueChange={(value) => {
          setAssignmentFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por asignación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="assigned">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-green-600" />
                Asignados
              </div>
            </SelectItem>
            <SelectItem value="unassigned">
              <div className="flex items-center">
                <UserX className="h-4 w-4 mr-2 text-red-600" />
                Sin asignar
              </div>
            </SelectItem>
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
              <TableHead className="w-12">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-[200px]">Asignación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {leads.map((lead) => {
            const isAssigned = !!lead.asignado_a;
            const rowClass = isAssigned 
              ? "bg-green-50 hover:bg-green-100/80 border-l-4 border-l-green-500" 
              : "bg-red-50 hover:bg-red-100/80 border-l-4 border-l-red-500";
            
            return (
              <TableRow key={lead.id} className={rowClass}>
                <TableCell>
                  <Checkbox
                    checked={isLeadSelected(lead.id)}
                    onCheckedChange={(checked) => handleSelectLead(lead, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">{lead.nombre}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.telefono}</TableCell>
                <TableCell>{getStatusBadge(lead.estado)}</TableCell>
                <TableCell>
                  {lead.fecha_creacion ? new Date(lead.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'}
                </TableCell>
                <TableCell>
                  {isAssigned ? (
                    <div className="flex items-center space-x-3 p-2 bg-green-100 rounded-lg border border-green-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-green-800">Asignado</span>
                        <span className="text-xs text-green-600">ID: {lead.asignado_a?.slice(-8)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-2 bg-red-100 rounded-lg border border-red-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full">
                        <UserX className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-red-800">Sin asignar</span>
                        <span className="text-xs text-red-600">Requiere asignación</span>
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <LeadDetailsDialog lead={lead} />
                    {permissions.canEditLeads && (
                      <Button
                        variant={isAssigned ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleAssignLead(lead)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {isAssigned ? "Reasignar" : "Asignar"}
                      </Button>
                    )}
                    {permissions.canEditLeads && onEditLead && (
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
            );
          })}
          </TableBody>
        </Table>
      </div>

      {/* Información de paginación */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {paginationInfo.startIndex} a {paginationInfo.endIndex} de {paginationInfo.totalCount} candidatos
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={!paginationInfo.hasPreviousPage}
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {paginationInfo.currentPage} de {paginationInfo.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(paginationInfo.totalPages, currentPage + 1))}
            disabled={!paginationInfo.hasNextPage}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {leads.length === 0 && !isLoading && (
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
// @ts-nocheck
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Search, UserPlus, Edit, AlertCircle, RefreshCw, CheckCircle, User, UserX, Users, Download } from "lucide-react";
import { toast } from "sonner";
import { exportUncontactedLeads } from "@/utils/exportLeads";
import { supabase } from "@/integrations/supabase/client";
import { useSimpleLeads } from "@/hooks/useSimpleLeads";
import { Lead } from "@/types/leadTypes";
import { LeadAssignmentDialog } from "./LeadAssignmentDialog";
import { LeadsMetricsDashboard } from "./LeadsMetricsDashboard";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { AdvancedFilters, AdvancedFiltersState } from "./AdvancedFilters";
import { QuickFilters, QuickFilterPreset } from "./QuickFilters";
import { LeadDetailsDialog } from "./LeadDetailsDialog";
import { TeamManagementView } from "./TeamManagementView";
import { useAuth } from "@/contexts/AuthContext";
import { useSandboxAwareSupabase } from "@/hooks/useSandboxAwareSupabase";
import { SandboxDataWarning } from "@/components/sandbox/SandboxDataWarning";

interface LeadsTableProps {
  onEditLead?: (lead: Lead) => void;
  onQuickPreview?: (lead: Lead) => void;
  filterByDecision?: 'all' | 'approved' | 'pending' | 'rejected';
}

export const LeadsTable = ({ onEditLead, onQuickPreview, filterByDecision = 'all' }: LeadsTableProps) => {
  // Estados para tabs y UI principal
  const [activeTab, setActiveTab] = useState("leads");
  
  // Estados para filtros y UI
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [uncontactedCount, setUncontactedCount] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>(() => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - 14); // Últimos 14 días por defecto
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return {
      dateFrom: fmt(from),
      dateTo: fmt(today),
      source: 'all',
      unassignedDays: 'all',
      status: 'all',
      assignment: 'all'
    };
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset page when search changes
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Preparar filtros para el hook optimizado
  const leadsFilters = useMemo(() => ({
    searchTerm: debouncedSearchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    assignment: assignmentFilter !== 'all' ? assignmentFilter : undefined,
    dateFrom: advancedFilters.dateFrom || undefined,
    dateTo: advancedFilters.dateTo || undefined,
    source: advancedFilters.source !== 'all' ? advancedFilters.source : undefined,
  }), [debouncedSearchTerm, statusFilter, assignmentFilter, advancedFilters]);

  // Hook optimizado con filtros en backend y paginación
  const { 
    leads, 
    totalCount,
    paginationInfo,
    isLoading, 
    error, 
    canAccess, 
    accessReason, 
    refetch,
    clearCache
  } = useSimpleLeads({
    filters: leadsFilters,
    pagination: { page: currentPage, pageSize: 1000 }, // Aumentado para mostrar más candidatos
    enableCache: true
  });

  // Permisos reales desde AuthContext
  const { permissions: authPermissions } = useAuth();

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
    const statusMap: Record<string, { label: string; className: string }> = {
      'nuevo': { 
        label: 'Nuevo', 
        className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700 font-medium' 
      },
      'en_proceso': { 
        label: 'En Proceso', 
        className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700 font-medium' 
      },
      'aprobado': { 
        label: 'Aprobado', 
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700 font-medium' 
      },
      'rechazado': { 
        label: 'Rechazado', 
        className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700 font-medium' 
      },
      'pendiente': { 
        label: 'Pendiente', 
        className: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 font-medium' 
      }
    };
    
    const config = statusMap[status] || { 
      label: status, 
      className: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 font-medium' 
    };
    
    return (
      <Badge variant="outline" className={`border ${config.className}`}>
        {config.label}
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
      setSelectedLeads(filteredLeads); // Usar filteredLeads en lugar de leads
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

  // Filtrar leads por decisión de aprobación (frontend)
  const filteredLeads = useMemo(() => {
    if (filterByDecision === 'all') return leads;
    
    return leads.filter(lead => {
      const approval = (lead as any).approval;
      if (!approval) {
        // Si no tiene proceso de aprobación, considerarlo como "pendiente"
        return filterByDecision === 'pending';
      }
      
      const decision = approval.final_decision;
      
      if (filterByDecision === 'approved') {
        return decision === 'approved';
      }
      if (filterByDecision === 'rejected') {
        return decision === 'rejected';
      }
      if (filterByDecision === 'pending') {
        return !decision || decision === 'pending' || decision === null;
      }
      
      return true;
    });
  }, [leads, filterByDecision]);

  // Los leads ya vienen filtrados del backend y ahora también por decisión
  const allFilteredSelected = filteredLeads.length > 0 && 
    filteredLeads.every(lead => isLeadSelected(lead.id));

  // All conditional logic moved to JSX render - no early returns

  // Función para refrescar datos desde gestión de equipo
  const handleRefreshLeads = useCallback(() => {
    setCurrentPage(1);
    clearCache();
    refetch();
  }, [clearCache, refetch]);

  // Calcular contador de leads no contactados
  useEffect(() => {
    const calculateUncontacted = async () => {
      try {
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .is('fecha_contacto', null);

        if (leadsError) throw leadsError;

        // Para simplificar, usamos el count directo
        // En producción, deberías filtrar también por call_logs = 0
        setUncontactedCount(leadsData || 0);
      } catch (error) {
        console.error('Error calculando leads no contactados:', error);
        setUncontactedCount(0);
      }
    };

    if (canAccess && !isLoading) {
      calculateUncontacted();
    }
  }, [leads, canAccess, isLoading]);

  // Manejar exportación de leads no contactados
  const handleExportUncontacted = async () => {
    setIsExporting(true);
    try {
      const count = await exportUncontactedLeads();
      toast.success(`Se exportaron ${count} leads no contactados exitosamente`, {
        description: 'El archivo Excel se descargó automáticamente'
      });
    } catch (error: any) {
      console.error('Error exportando:', error);
      toast.error('Error al exportar leads', {
        description: error.message || 'No se pudo generar el archivo de exportación'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // MAIN RENDER - All conditions handled in JSX
  return (
    <div className="space-y-4">
      {/* Access denied */}
      {!canAccess && (
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
      )}

      {/* Loading state */}
      {canAccess && isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">
              Cargando candidatos...
            </span>
            <div className="text-xs text-gray-500 max-w-md text-center">
              Consultando la base de datos...
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {canAccess && error && !isLoading && (
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
            <Button onClick={() => {
              setCurrentPage(1);
              clearCache();
              refetch();
            }} variant="outline">
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
      )}

      {/* Empty state */}
      {canAccess && !isLoading && !error && (!leads || leads.length === 0) && (
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
          
          <Button onClick={() => {
            setCurrentPage(1);
            clearCache();
            refetch();
          }} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      )}

      {/* Main content - only show when we have access and data */}
      {canAccess && !isLoading && !error && leads && leads.length > 0 && (
        <>
          {/* Advertencia de Sandbox */}
          <SandboxDataWarning entityType="lead" action="view" />
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leads" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Gestión de Leads</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Gestión de Equipo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <LeadsMetricsDashboard
            leads={filteredLeads || []} 
            dateFrom={advancedFilters.dateFrom || undefined}
            dateTo={advancedFilters.dateTo || undefined}
          />

          <QuickFilters 
            onApplyFilter={handleQuickFilter}
            activePreset={activeQuickFilter}
          />

          <AdvancedFilters 
            filters={advancedFilters}
            onFiltersChange={handleAdvancedFiltersChange}
            onResetFilters={handleResetFilters}
          />

          {authPermissions.canAssignLeads && (
            <BulkActionsToolbar 
              selectedLeads={selectedLeads}
              onClearSelection={handleClearSelection}
              onBulkAssignmentComplete={() => {
                setCurrentPage(1);
                clearCache();
                refetch();
              }}
            />
          )}

      {/* Active Filters Display */}
      {(statusFilter !== 'all' || assignmentFilter !== 'all' || debouncedSearchTerm || 
        advancedFilters.source !== 'all' || advancedFilters.dateFrom || advancedFilters.dateTo) && (
        <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Filtros activos:</span>
          
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Estado: {statusFilter}
              <button 
                onClick={() => setStatusFilter('all')}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          )}
          
          {assignmentFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Asignación: {assignmentFilter === 'assigned' ? 'Asignados' : 'Sin asignar'}
              <button 
                onClick={() => setAssignmentFilter('all')}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          )}
          
          {debouncedSearchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Búsqueda: "{debouncedSearchTerm}"
              <button 
                onClick={() => setSearchTerm('')}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          )}
          
          {advancedFilters.source !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Fuente: {advancedFilters.source}
              <button 
                onClick={() => setAdvancedFilters(prev => ({ ...prev, source: 'all' }))}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          )}
          
          {(advancedFilters.dateFrom || advancedFilters.dateTo) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Fecha: {advancedFilters.dateFrom} - {advancedFilters.dateTo}
              <button 
                onClick={() => setAdvancedFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setStatusFilter('all');
              setAssignmentFilter('all');
              setSearchTerm('');
              setAdvancedFilters(prev => ({ ...prev, source: 'all', dateFrom: '', dateTo: '' }));
              setCurrentPage(1);
            }}
            className="text-xs"
          >
            Limpiar todos
          </Button>
        </div>
      )}

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
        <Button 
          onClick={handleExportUncontacted}
          variant="outline"
          disabled={isExporting || uncontactedCount === 0}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar No Contactados
          {uncontactedCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {uncontactedCount}
            </Badge>
          )}
        </Button>
        <Button 
          onClick={() => {
            setCurrentPage(1); // Reset a página 1
            clearCache(); // Limpia cache primero
            refetch(); // Luego refresca
          }} 
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
               <TableHead className="w-12">
                 {authPermissions.canAssignLeads ? (
                   <Checkbox
                     checked={allFilteredSelected}
                     onCheckedChange={handleSelectAll}
                   />
                 ) : null}
               </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead>Último Contacto</TableHead>
              <TableHead className="w-[200px]">Asignación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
           </TableHeader>
           <TableBody>
          {filteredLeads.map((lead) => {
            const isAssigned = !!lead.asignado_a;
            const rowClass = isAssigned 
              ? "bg-emerald-50/50 hover:bg-emerald-50 border-l-4 border-l-emerald-400 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 dark:border-l-emerald-600" 
              : "bg-orange-50/50 hover:bg-orange-50 border-l-4 border-l-orange-400 dark:bg-orange-950/20 dark:hover:bg-orange-950/30 dark:border-l-orange-600";
            
            const daysSinceContact = lead.fecha_contacto 
              ? Math.floor((new Date().getTime() - new Date(lead.fecha_contacto).getTime()) / (1000 * 3600 * 24))
              : null;
            
            return (
              <TableRow key={lead.id} className={rowClass}>
                 <TableCell>
                   {authPermissions.canAssignLeads ? (
                     <Checkbox
                       checked={isLeadSelected(lead.id)}
                       onCheckedChange={(checked) => handleSelectLead(lead, checked as boolean)}
                     />
                   ) : null}
                 </TableCell>
                <TableCell className="font-medium">{lead.nombre}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.telefono}</TableCell>
                <TableCell>{getStatusBadge(lead.estado)}</TableCell>
                <TableCell>
                  {lead.fecha_creacion ? new Date(lead.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'}
                </TableCell>
                <TableCell>
                  {lead.fecha_contacto ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">
                        {new Date(lead.fecha_contacto).toLocaleDateString('es-ES')}
                      </span>
                      {daysSinceContact !== null && daysSinceContact > 0 && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium ${
                            daysSinceContact > 7 
                              ? 'border-red-300 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 dark:border-red-700' 
                              : daysSinceContact > 3 
                              ? 'border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700'
                              : 'border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600'
                          }`}
                        >
                          Hace {daysSinceContact}d
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 dark:border-red-700 font-medium">
                      Sin contactar
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isAssigned ? (
                    <div className="flex items-center space-x-3 p-2 bg-emerald-100 rounded-lg border border-emerald-300 dark:bg-emerald-900 dark:border-emerald-700">
                      <div className="flex items-center justify-center w-8 h-8 bg-emerald-200 rounded-full dark:bg-emerald-800">
                        <User className="h-4 w-4 text-emerald-700 dark:text-emerald-200" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">Asignado</span>
                        <span className="text-xs text-emerald-700 dark:text-emerald-300">ID: {lead.asignado_a?.slice(-8)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-2 bg-orange-100 rounded-lg border border-orange-300 dark:bg-orange-900 dark:border-orange-700">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-200 rounded-full dark:bg-orange-800">
                        <UserX className="h-4 w-4 text-orange-700 dark:text-orange-200" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-orange-800 dark:text-orange-100">Sin asignar</span>
                        <span className="text-xs text-orange-700 dark:text-orange-300">Requiere asignación</span>
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {onQuickPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuickPreview(lead)}
                      >
                        Vista Rápida
                      </Button>
                    )}
                    <LeadDetailsDialog lead={lead} />
                    {authPermissions.canAssignLeads && (
                      <Button
                        variant={isAssigned ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleAssignLead(lead)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {isAssigned ? "Reasignar" : "Asignar"}
                      </Button>
                    )}
                    {authPermissions.canEditLeads && onEditLead && (
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
          Mostrando {filteredLeads.length} de {paginationInfo.totalCount} candidatos
          {filterByDecision !== 'all' && (
            <span className="ml-2 text-primary font-medium">
              (Filtro: {filterByDecision === 'approved' ? 'Aprobados' : filterByDecision === 'rejected' ? 'Rechazados' : 'En Proceso'})
            </span>
          )}
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

      {/* Empty results message */}
      {filteredLeads.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No se encontraron candidatos que coincidan con los filtros aplicados.
          </p>
        </div>
      )}
      </TabsContent>

          <TabsContent value="team">
            {authPermissions.canAssignLeads ? (
              <TeamManagementView onRefreshLeads={handleRefreshLeads} />
            ) : (
              <div className="text-center py-8">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-orange-600">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-semibold">Acceso Restringido</h3>
                  </div>
                  <p className="text-orange-700">
                    Solo los supply admins pueden acceder a la gestión de equipo.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </>
      )}

      {/* Dialogs - always rendered but controlled by state */}
      {selectedLead && (
        <LeadAssignmentDialog
          open={showAssignmentDialog}
          onOpenChange={setShowAssignmentDialog}
          leadId={selectedLead.id}
          leadName={selectedLead.nombre}
          currentAssignee={selectedLead.asignado_a}
          onAssignmentUpdate={() => {
            setCurrentPage(1);
            clearCache();
            refetch();
          }}
        />
      )}
    </div>
  );
};
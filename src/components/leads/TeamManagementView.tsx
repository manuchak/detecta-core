import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { 
  Users, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  UserCheck, 
  AlertCircle, 
  TrendingUp,
  ArrowRight,
  Shuffle,
  Target,
  Clock,
  Mail,
  User
} from 'lucide-react';

interface TeamManagementViewProps {
  onRefreshLeads?: () => void;
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  onRefreshLeads,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAnalysts, setExpandedAnalysts] = useState<Set<string>>(new Set());
  const [selectedReassignTo, setSelectedReassignTo] = useState<string>('');
  
  const { 
    analysts, 
    isLoading, 
    error, 
    reassignLeads, 
    reassignAllLeads,
    distributeEquitably,
    refreshData 
  } = useTeamManagement();

  const filteredAnalysts = analysts.filter(analyst =>
    analyst.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analyst.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpanded = (analystId: string) => {
    const newExpanded = new Set(expandedAnalysts);
    if (newExpanded.has(analystId)) {
      newExpanded.delete(analystId);
    } else {
      newExpanded.add(analystId);
    }
    setExpandedAnalysts(newExpanded);
  };

  const handleReassignAll = async (fromAnalystId: string) => {
    if (!selectedReassignTo) return;
    
    const success = await reassignAllLeads(fromAnalystId, selectedReassignTo);
    if (success) {
      refreshData();
      onRefreshLeads?.();
    }
  };

  const handleDistributeEquitably = async (fromAnalystId: string) => {
    const success = await distributeEquitably(fromAnalystId);
    if (success) {
      refreshData();
      onRefreshLeads?.();
    }
  };

  const handleReassignSpecificLead = async (leadId: string, fromAnalystId: string) => {
    if (!selectedReassignTo) return;
    
    const success = await reassignLeads([leadId], selectedReassignTo);
    if (success) {
      refreshData();
      onRefreshLeads?.();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'owner':
        return 'default';
      case 'supply_admin':
        return 'secondary';
      case 'supply_lead':
        return 'outline';
      case 'ejecutivo_ventas':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getWorkloadColor = (count: number) => {
    if (count > 15) return 'bg-red-500';
    if (count > 8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Cargando información del equipo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-red-600 text-center">
          <h3 className="font-semibold mb-2">Error al cargar el equipo</h3>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={refreshData} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Overview */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Gestión de Equipo</h2>
          </div>
          <p className="text-muted-foreground">
            Administra la asignación de leads entre los analistas del equipo
          </p>
        </div>
        <Button 
          onClick={refreshData}
          variant="outline" 
          size="sm"
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analistas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAnalysts.length}</div>
            <p className="text-xs text-muted-foreground">activos en el sistema</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAnalysts.reduce((acc, analyst) => acc + analyst.assignedLeadsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">asignados en total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredAnalysts.reduce((acc, analyst) => acc + analyst.pendingLeadsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">requieren atención</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Analista</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAnalysts.length > 0 ? 
                Math.round(filteredAnalysts.reduce((acc, analyst) => acc + analyst.assignedLeadsCount, 0) / filteredAnalysts.length) 
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">leads por persona</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Herramientas de Gestión</CardTitle>
          <CardDescription>
            Busca analistas y configura reasignaciones masivas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar analista por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select 
              value={selectedReassignTo} 
              onValueChange={setSelectedReassignTo}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Seleccionar analista destino" />
              </SelectTrigger>
              <SelectContent>
                {filteredAnalysts.map((analyst) => (
                  <SelectItem key={analyst.id} value={analyst.id}>
                    <div className="flex items-center space-x-2">
                      <span>{analyst.display_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {analyst.assignedLeadsCount} leads
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Miembros del Equipo</h3>
        
        {filteredAnalysts.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay analistas</h3>
                <p className="text-sm">
                  {searchTerm ? 'No se encontraron analistas que coincidan con la búsqueda.' : 'No hay analistas asignados al equipo.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAnalysts.map((analyst) => (
              <Card key={analyst.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{analyst.display_name}</h3>
                          <Badge variant={getRoleBadgeColor(analyst.role)} className="text-xs">
                            {analyst.role}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{analyst.email}</span>
                          {analyst.lastActivity && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <Clock className="h-3 w-3" />
                              <span>
                                Última actividad: {new Date(analyst.lastActivity).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* Workload Indicators */}
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {analyst.assignedLeadsCount} leads
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {analyst.pendingLeadsCount} pendientes
                            </div>
                          </div>
                          <div 
                            className={`w-3 h-8 rounded-full ${getWorkloadColor(analyst.assignedLeadsCount)}`}
                            title={`Carga de trabajo: ${analyst.assignedLeadsCount} leads`}
                          />
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {analyst.assignedLeadsCount > 0 && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={!selectedReassignTo || selectedReassignTo === analyst.id}
                                  className="gap-2"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                  Reasignar Todo
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Reasignación Total</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que quieres reasignar todos los {analyst.assignedLeadsCount} leads 
                                    de {analyst.display_name} al analista seleccionado?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleReassignAll(analyst.id)}
                                  >
                                    Reasignar Todo
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Shuffle className="h-3 w-3" />
                                  Distribuir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Distribución Equitativa</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que quieres distribuir equitativamente los {analyst.assignedLeadsCount} leads 
                                    de {analyst.display_name} entre el resto del equipo?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDistributeEquitably(analyst.id)}
                                  >
                                    Distribuir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        
                        <Collapsible 
                          open={expandedAnalysts.has(analyst.id)}
                          onOpenChange={(open) => toggleExpanded(analyst.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                              {expandedAnalysts.has(analyst.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              Ver Leads ({analyst.assignedLeadsCount})
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <Collapsible 
                  open={expandedAnalysts.has(analyst.id)}
                  onOpenChange={(open) => toggleExpanded(analyst.id)}
                >
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Separator className="mb-4" />
                      {analyst.leads.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No tiene leads asignados</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Leads Asignados ({analyst.leads.length})
                          </h4>
                          <div className="grid gap-2 max-h-60 overflow-y-auto">
                            {analyst.leads.map((lead) => (
                              <div key={lead.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-sm">{lead.nombre}</span>
                                    <Badge 
                                      variant={lead.estado === 'nuevo' ? 'default' : 
                                              lead.estado === 'en_proceso' ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {lead.estado}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center space-x-2 mt-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{lead.email}</span>
                                    <Separator orientation="vertical" className="h-3" />
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!selectedReassignTo || selectedReassignTo === analyst.id}
                                  onClick={() => handleReassignSpecificLead(lead.id, analyst.id)}
                                  className="gap-2 text-xs"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                  Reasignar
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
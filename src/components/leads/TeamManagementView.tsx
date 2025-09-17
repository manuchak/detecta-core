import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, ChevronDown, ChevronRight, Users, ArrowRight, RotateCcw } from 'lucide-react';
import { useTeamManagement } from '@/hooks/useTeamManagement';

interface TeamManagementViewProps {
  onRefreshLeads?: () => void;
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({ onRefreshLeads }) => {
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
    setExpandedAnalysts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analystId)) {
        newSet.delete(analystId);
      } else {
        newSet.add(analystId);
      }
      return newSet;
    });
  };

  const handleReassignAll = async (fromAnalystId: string) => {
    if (!selectedReassignTo) return;
    
    const success = await reassignAllLeads(fromAnalystId, selectedReassignTo);
    if (success) {
      refreshData();
      onRefreshLeads?.();
      setSelectedReassignTo('');
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
      setSelectedReassignTo('');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'owner':
        return 'bg-red-100 text-red-800';
      case 'supply_admin':
        return 'bg-purple-100 text-purple-800';
      case 'supply_lead':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkloadColor = (count: number) => {
    if (count === 0) return 'text-gray-500';
    if (count <= 5) return 'text-green-600';
    if (count <= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">Gestión de Equipo</h3>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar analista por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedReassignTo} onValueChange={setSelectedReassignTo}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleccionar analista destino" />
          </SelectTrigger>
          <SelectContent>
            {analysts.map((analyst) => (
              <SelectItem key={analyst.id} value={analyst.id}>
                {analyst.display_name} ({analyst.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Analista</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Leads Asignados</TableHead>
              <TableHead>Última Actividad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnalysts.map((analyst) => (
              <React.Fragment key={analyst.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(analyst.id)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedAnalysts.has(analyst.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{analyst.display_name}</div>
                      <div className="text-sm text-muted-foreground">{analyst.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(analyst.role)}>
                      {analyst.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${getWorkloadColor(analyst.assignedLeadsCount)}`}>
                      {analyst.assignedLeadsCount} leads
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {analyst.pendingLeadsCount} pendientes
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {analyst.lastActivity ? 
                        new Date(analyst.lastActivity).toLocaleDateString() : 
                        'Sin actividad'
                      }
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {analyst.assignedLeadsCount > 0 && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={!selectedReassignTo}>
                                <ArrowRight className="h-4 w-4 mr-1" />
                                Reasignar Todos
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Reasignación</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que quieres reasignar todos los {analyst.assignedLeadsCount} leads 
                                  de {analyst.display_name} al analista seleccionado?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleReassignAll(analyst.id)}>
                                  Confirmar Reasignación
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="secondary" size="sm">
                                <Users className="h-4 w-4 mr-1" />
                                Distribuir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Distribución Equitativa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Quieres distribuir equitativamente todos los leads de {analyst.display_name} 
                                  entre el resto del equipo?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDistributeEquitably(analyst.id)}>
                                  Distribuir Equitativamente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                
                <Collapsible open={expandedAnalysts.has(analyst.id)}>
                  <CollapsibleContent>
                    {analyst.leads && analyst.leads.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Leads asignados:</h4>
                            <div className="grid gap-2 max-h-60 overflow-y-auto">
                              {analyst.leads.map((lead) => (
                                <div key={lead.id} className="flex items-center justify-between bg-white p-2 rounded border">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{lead.nombre}</div>
                                     <div className="text-xs text-muted-foreground">
                                       {lead.email} • {lead.estado}
                                     </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReassignSpecificLead(lead.id, analyst.id)}
                                    disabled={!selectedReassignTo}
                                    className="text-xs"
                                  >
                                    <ArrowRight className="h-3 w-3 mr-1" />
                                    Reasignar
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAnalysts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron analistas
        </div>
      )}
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, Filter, Download, Users, 
  ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// RACI Types
export type RACIType = 'R' | 'A' | 'C' | 'I';

export interface RACIEntry {
  phaseId: string;
  phaseName: string;
  module: string;
  moduleColor: string;
  assignments: Record<string, RACIType[]>;
}

// Roles principales del sistema
const roles = [
  { id: 'supply_lead', name: 'Supply Lead', shortName: 'Supply' },
  { id: 'coord_op', name: 'Coordinación Operativa', shortName: 'Coord.Op' },
  { id: 'coord_tec', name: 'Coordinación Técnica', shortName: 'Coord.Tec' },
  { id: 'planeacion', name: 'Planeación', shortName: 'Planea.' },
  { id: 'bi_director', name: 'BI Director', shortName: 'BI' },
  { id: 'c4', name: 'C4/Monitoreo', shortName: 'C4' },
  { id: 'instaladores', name: 'Instaladores', shortName: 'Install.' },
  { id: 'admin', name: 'Administración', shortName: 'Admin' },
];

// Matriz RACI completa
const raciData: RACIEntry[] = [
  // Supply Module
  { phaseId: 'supply_1', phaseName: 'Generación de Lead', module: 'Supply', moduleColor: '#10B981', 
    assignments: { supply_lead: ['R'], coord_op: ['I'], planeacion: ['I'] } },
  { phaseId: 'supply_2', phaseName: 'Contacto Inicial', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R', 'A'], coord_op: ['I'] } },
  { phaseId: 'supply_3', phaseName: 'Entrevista VAPI', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R'], coord_op: ['C'], bi_director: ['I'] } },
  { phaseId: 'supply_4', phaseName: 'Entrevista Estructurada', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R'], coord_op: ['A'], bi_director: ['C'] } },
  { phaseId: 'supply_5', phaseName: 'Evaluación Psicométrica', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R'], coord_op: ['A', 'C'], admin: ['I'] } },
  { phaseId: 'supply_6', phaseName: 'Prueba Toxicológica', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R', 'A'], coord_op: ['I'] } },
  { phaseId: 'supply_7', phaseName: 'Validación Referencias', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R', 'A'], admin: ['C'] } },
  { phaseId: 'supply_8', phaseName: 'Validación Documentos', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R'], admin: ['A', 'C'] } },
  { phaseId: 'supply_9', phaseName: 'Firma de Contrato', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R'], admin: ['A'], coord_op: ['I'] } },
  { phaseId: 'supply_10', phaseName: 'Capacitación', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R'], admin: ['A'], coord_op: ['I'] } },
  { phaseId: 'supply_11', phaseName: 'Instalación GPS', module: 'Supply', moduleColor: '#10B981',
    assignments: { coord_tec: ['R', 'A'], instaladores: ['R'], supply_lead: ['I'] } },
  { phaseId: 'supply_12', phaseName: 'Liberación Final', module: 'Supply', moduleColor: '#10B981',
    assignments: { supply_lead: ['R'], coord_op: ['A'], planeacion: ['I'] } },
  
  // Planeación Module
  { phaseId: 'plan_1', phaseName: 'Configuración Maestros', module: 'Planeación', moduleColor: '#8B5CF6',
    assignments: { planeacion: ['R', 'A'], admin: ['C'] } },
  { phaseId: 'plan_2', phaseName: 'Gestión Proveedores', module: 'Planeación', moduleColor: '#8B5CF6',
    assignments: { planeacion: ['R'], admin: ['A'], bi_director: ['C'] } },
  { phaseId: 'plan_3', phaseName: 'Recepción Solicitud', module: 'Planeación', moduleColor: '#8B5CF6',
    assignments: { planeacion: ['R', 'A'], c4: ['I'] } },
  { phaseId: 'plan_4', phaseName: 'Asignación Custodio', module: 'Planeación', moduleColor: '#8B5CF6',
    assignments: { planeacion: ['R', 'A'], c4: ['I'], bi_director: ['C'] } },
  { phaseId: 'plan_5', phaseName: 'Asignación Armado', module: 'Planeación', moduleColor: '#8B5CF6',
    assignments: { planeacion: ['R', 'A'], c4: ['I'] } },
  { phaseId: 'plan_6', phaseName: 'Gestión Excepciones', module: 'Planeación', moduleColor: '#8B5CF6',
    assignments: { planeacion: ['R'], coord_op: ['A'], c4: ['C'] } },
  { phaseId: 'plan_7', phaseName: 'Ejecución y Tracking', module: 'Planeación', moduleColor: '#8B5CF6',
    assignments: { c4: ['R'], planeacion: ['A'], coord_op: ['I'] } },
  { phaseId: 'plan_8', phaseName: 'Cierre Servicio', module: 'Planeación', moduleColor: '#8B5CF6',
    assignments: { planeacion: ['R', 'A'], c4: ['C'], bi_director: ['I'] } },
  
  // Monitoreo Module
  { phaseId: 'mon_1', phaseName: 'Monitoreo Tiempo Real', module: 'Monitoreo', moduleColor: '#EF4444',
    assignments: { c4: ['R', 'A'], planeacion: ['I'] } },
  { phaseId: 'mon_2', phaseName: 'Gestión Alertas', module: 'Monitoreo', moduleColor: '#EF4444',
    assignments: { c4: ['R', 'A'], coord_op: ['C'], planeacion: ['I'] } },
  { phaseId: 'mon_3', phaseName: 'Incidentes RRSS', module: 'Monitoreo', moduleColor: '#EF4444',
    assignments: { c4: ['R'], bi_director: ['A', 'C'] } },
];

// RACI type configuration
const raciConfig: Record<RACIType, { label: string; color: string; bgColor: string; description: string }> = {
  R: { 
    label: 'Responsible', 
    color: 'text-red-700 dark:text-red-400', 
    bgColor: 'bg-red-100 dark:bg-red-500/20',
    description: 'Ejecuta la tarea'
  },
  A: { 
    label: 'Accountable', 
    color: 'text-amber-700 dark:text-amber-400', 
    bgColor: 'bg-amber-100 dark:bg-amber-500/20',
    description: 'Aprueba y es responsable final'
  },
  C: { 
    label: 'Consulted', 
    color: 'text-blue-700 dark:text-blue-400', 
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
    description: 'Se consulta su opinión'
  },
  I: { 
    label: 'Informed', 
    color: 'text-emerald-700 dark:text-emerald-400', 
    bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
    description: 'Se le informa del avance'
  },
};

interface RACIMatrixProps {
  className?: string;
}

export const RACIMatrix: React.FC<RACIMatrixProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isCompact, setIsCompact] = useState(false);

  // Get unique modules
  const modules = useMemo(() => {
    const moduleSet = new Set(raciData.map(r => r.module));
    return Array.from(moduleSet);
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    return raciData.filter(entry => {
      // Search filter
      if (searchQuery && !entry.phaseName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Module filter
      if (selectedModule !== 'all' && entry.module !== selectedModule) {
        return false;
      }
      // Role filter
      if (selectedRole !== 'all' && !entry.assignments[selectedRole]) {
        return false;
      }
      return true;
    });
  }, [searchQuery, selectedModule, selectedRole]);

  // Stats
  const stats = useMemo(() => {
    const total = raciData.length;
    const byType: Record<RACIType, number> = { R: 0, A: 0, C: 0, I: 0 };
    
    raciData.forEach(entry => {
      Object.values(entry.assignments).forEach(types => {
        types.forEach(type => byType[type]++);
      });
    });
    
    return { total, byType };
  }, []);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Matriz RACI
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Responsible, Accountable, Consulted, Informed
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3">
            {(Object.entries(raciConfig) as [RACIType, typeof raciConfig.R][]).map(([type, config]) => (
              <TooltipProvider key={type}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm",
                        config.bgColor, config.color
                      )}>
                        {type}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="font-semibold">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Buscar fase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-[160px]">
              <Filter size={14} className="mr-2" />
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los módulos</SelectItem>
              {modules.map(module => (
                <SelectItem key={module} value={module}>{module}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[180px]">
              <Users size={14} className="mr-2" />
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsCompact(!isCompact)}
          >
            {isCompact ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span className="ml-1">{isCompact ? 'Expandir' : 'Compactar'}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-sm sticky left-0 bg-muted/50 z-10 min-w-[200px]">
                Fase / Proceso
              </th>
              {roles.map(role => (
                <th 
                  key={role.id} 
                  className={cn(
                    "text-center font-medium text-sm",
                    isCompact ? "p-2" : "p-3"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={isCompact ? "text-xs" : "text-sm"}>
                      {isCompact ? role.shortName : role.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry, index) => (
              <tr 
                key={entry.phaseId}
                className={cn(
                  "border-b transition-colors hover:bg-muted/30",
                  index % 2 === 0 ? "bg-background" : "bg-muted/10"
                )}
              >
                <td className="p-3 sticky left-0 bg-inherit z-10">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-1.5 h-8 rounded-full"
                      style={{ backgroundColor: entry.moduleColor }}
                    />
                    <div>
                      <div className="font-medium text-sm">{entry.phaseName}</div>
                      <div className="text-xs text-muted-foreground">{entry.module}</div>
                    </div>
                  </div>
                </td>
                {roles.map(role => {
                  const types = entry.assignments[role.id];
                  return (
                    <td 
                      key={role.id} 
                      className={cn("text-center", isCompact ? "p-1" : "p-2")}
                    >
                      {types && types.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          {types.map((type, i) => (
                            <TooltipProvider key={i}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={cn(
                                    "rounded-md flex items-center justify-center font-bold cursor-help transition-transform hover:scale-110",
                                    raciConfig[type].bgColor,
                                    raciConfig[type].color,
                                    isCompact ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
                                  )}>
                                    {type}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="font-semibold">{raciConfig[type].label}</div>
                                  <div className="text-xs">{role.name}</div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Info size={32} className="mx-auto mb-2 opacity-50" />
            <p>No se encontraron resultados para los filtros aplicados</p>
          </div>
        )}
      </CardContent>

      {/* Footer Stats */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              {filteredData.length} de {raciData.length} fases
            </span>
          </div>
          <div className="flex items-center gap-4">
            {(Object.entries(stats.byType) as [RACIType, number][]).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={cn(
                  "w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
                  raciConfig[type].bgColor, raciConfig[type].color
                )}>
                  {type}
                </div>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

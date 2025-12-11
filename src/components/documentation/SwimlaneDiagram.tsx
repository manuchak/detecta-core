import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UserCheck, Calendar, Wrench, Radio, 
  ChevronRight, Clock, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Definición de carriles (actors/departments)
export interface SwimlaneLane {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// Definición de nodos en el flujo
export interface SwimlaneNode {
  id: string;
  name: string;
  shortName?: string;
  lane: string;
  phase: number;
  sla?: string;
  status: 'complete' | 'in-progress' | 'pending';
  description?: string;
  gates?: string[];
}

// Conexiones entre nodos
export interface SwimlaneConnection {
  from: string;
  to: string;
  type: 'sequence' | 'handoff' | 'parallel';
}

// Datos del swimlane para el flujo completo del candidato
const lanes: SwimlaneLane[] = [
  { 
    id: 'supply', 
    name: 'Supply', 
    icon: <UserCheck size={18} />, 
    color: 'hsl(160, 84%, 39%)', // Emerald
    bgColor: 'hsl(160, 84%, 39%, 0.08)'
  },
  { 
    id: 'coordinacion', 
    name: 'Coordinación', 
    icon: <Calendar size={18} />, 
    color: 'hsl(262, 83%, 58%)', // Purple
    bgColor: 'hsl(262, 83%, 58%, 0.08)'
  },
  { 
    id: 'instaladores', 
    name: 'Instaladores', 
    icon: <Wrench size={18} />, 
    color: 'hsl(38, 92%, 50%)', // Amber
    bgColor: 'hsl(38, 92%, 50%, 0.08)'
  },
  { 
    id: 'planeacion', 
    name: 'Planeación', 
    icon: <Radio size={18} />, 
    color: 'hsl(262, 83%, 58%)', // Purple (same as coordinacion for visual grouping)
    bgColor: 'hsl(262, 83%, 58%, 0.08)'
  },
];

// Nodos del flujo completo
const nodes: SwimlaneNode[] = [
  // Supply Lane
  { id: 'lead', name: 'Generación de Lead', shortName: 'Lead', lane: 'supply', phase: 1, sla: '15min', status: 'complete', description: 'Captura inicial del candidato' },
  { id: 'contacto', name: 'Contacto Inicial', shortName: 'Contacto', lane: 'supply', phase: 2, sla: '24h', status: 'complete', description: 'Sesión informativa' },
  { id: 'vapi', name: 'Entrevista VAPI', shortName: 'VAPI', lane: 'supply', phase: 2.5, sla: '15min', status: 'complete', description: 'Entrevista AI por voz' },
  { id: 'entrevista', name: 'Entrevista Estructurada', shortName: 'Entrevista', lane: 'supply', phase: 3, sla: '3d', status: 'complete', description: 'Ratings 1-5 + Risk Checklist' },
  { id: 'psicometricos', name: 'Psicométricos', shortName: 'Psico', lane: 'supply', phase: 4, sla: '3d', status: 'complete', description: 'MIDOT + Psicotest → Verde/Ámbar/Rojo' },
  { id: 'toxicologia', name: 'Toxicología', shortName: 'Toxi', lane: 'supply', phase: 5, sla: '5d', status: 'complete', description: 'Resultado NEGATIVO requerido' },
  { id: 'referencias', name: 'Referencias', shortName: 'Refs', lane: 'supply', phase: 6, sla: '5d', status: 'complete', description: '2 laborales + 2 personales' },
  { id: 'documentos', name: 'Documentos OCR', shortName: 'Docs', lane: 'supply', phase: 7, sla: '3d', status: 'complete', description: '6 documentos validados' },
  { id: 'contrato', name: 'Firma Contrato', shortName: 'Contrato', lane: 'supply', phase: 8, sla: '2d', status: 'complete', description: 'E-signature + PDF' },
  { id: 'capacitacion', name: 'Capacitación', shortName: 'Capac.', lane: 'supply', phase: 9, sla: '7d', status: 'complete', description: 'Quiz 80% mínimo' },
  
  // Instaladores Lane
  { id: 'instalacion', name: 'Instalación GPS', shortName: 'GPS', lane: 'instaladores', phase: 10, sla: '5d', status: 'complete', description: 'Instalación técnica' },
  
  // Coordinación Lane (gates)
  { id: 'aval_psico', name: 'Aval Psicométrico', shortName: 'Aval', lane: 'coordinacion', phase: 4.5, status: 'complete', description: 'Si resultado Ámbar' },
  { id: 'liberacion', name: 'Liberación', shortName: 'Liber.', lane: 'coordinacion', phase: 11, sla: '1d', status: 'complete', description: 'Gate final → Planeación' },
  
  // Planeación Lane
  { id: 'recepcion', name: 'Recepción Solicitud', shortName: 'Recep.', lane: 'planeacion', phase: 12, sla: '1h', status: 'complete', description: 'Alta de servicio' },
  { id: 'asignacion', name: 'Asignación Custodio', shortName: 'Asign.', lane: 'planeacion', phase: 13, sla: '15min', status: 'complete', description: 'Proximity + Score' },
  { id: 'servicio', name: 'Servicio Activo', shortName: 'Servicio', lane: 'planeacion', phase: 14, status: 'complete', description: 'Tracking en tiempo real' },
];

// Conexiones del flujo
const connections: SwimlaneConnection[] = [
  { from: 'lead', to: 'contacto', type: 'sequence' },
  { from: 'contacto', to: 'vapi', type: 'sequence' },
  { from: 'vapi', to: 'entrevista', type: 'sequence' },
  { from: 'entrevista', to: 'psicometricos', type: 'sequence' },
  { from: 'psicometricos', to: 'aval_psico', type: 'handoff' },
  { from: 'aval_psico', to: 'toxicologia', type: 'handoff' },
  { from: 'psicometricos', to: 'toxicologia', type: 'sequence' },
  { from: 'toxicologia', to: 'referencias', type: 'sequence' },
  { from: 'referencias', to: 'documentos', type: 'sequence' },
  { from: 'documentos', to: 'contrato', type: 'sequence' },
  { from: 'contrato', to: 'capacitacion', type: 'sequence' },
  { from: 'capacitacion', to: 'instalacion', type: 'handoff' },
  { from: 'instalacion', to: 'liberacion', type: 'handoff' },
  { from: 'liberacion', to: 'recepcion', type: 'handoff' },
  { from: 'recepcion', to: 'asignacion', type: 'sequence' },
  { from: 'asignacion', to: 'servicio', type: 'sequence' },
];

interface SwimlaneDiagramProps {
  onNodeClick?: (nodeId: string) => void;
  selectedNode?: string | null;
}

export const SwimlaneDiagram: React.FC<SwimlaneDiagramProps> = ({ 
  onNodeClick,
  selectedNode 
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Agrupar nodos por carril
  const nodesByLane = lanes.map(lane => ({
    ...lane,
    nodes: nodes.filter(n => n.lane === lane.id).sort((a, b) => a.phase - b.phase)
  }));

  // Obtener el nodo por ID
  const getNode = (id: string) => nodes.find(n => n.id === id);

  // Verificar si un nodo está conectado al nodo hovered
  const isConnectedTo = (nodeId: string) => {
    if (!hoveredNode) return false;
    return connections.some(
      c => (c.from === hoveredNode && c.to === nodeId) || 
           (c.to === hoveredNode && c.from === nodeId)
    );
  };

  const getStatusIcon = (status: SwimlaneNode['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle2 size={10} className="text-emerald-500" />;
      case 'in-progress': return <Clock size={10} className="text-amber-500" />;
      case 'pending': return <AlertCircle size={10} className="text-muted-foreground" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-1 rounded-full bg-gradient-to-r from-emerald-500 via-purple-500 to-amber-500" />
              Flujo del Candidato: Lead → Servicio
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visualización end-to-end del proceso de reclutamiento y asignación
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Completado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-muted-foreground">En Progreso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">Pendiente</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-x-auto">
        <TooltipProvider>
          <div className="min-w-[1200px]">
            {/* Swimlane Rows */}
            {nodesByLane.map((lane, laneIndex) => (
              <div 
                key={lane.id}
                className={cn(
                  "flex items-stretch border-b last:border-b-0",
                  laneIndex % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
                {/* Lane Header */}
                <div 
                  className="w-36 shrink-0 p-4 border-r flex items-center gap-3 sticky left-0 z-10"
                  style={{ backgroundColor: lane.bgColor }}
                >
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${lane.color}20` }}
                  >
                    <div style={{ color: lane.color }}>
                      {lane.icon}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-sm">{lane.name}</span>
                    <p className="text-xs text-muted-foreground">
                      {lane.nodes.length} pasos
                    </p>
                  </div>
                </div>

                {/* Lane Content - Nodes */}
                <div className="flex-1 flex items-center gap-2 p-4 min-h-[100px]">
                  {lane.nodes.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic px-4">
                      Sin pasos en este carril
                    </div>
                  ) : (
                    lane.nodes.map((node, nodeIndex) => (
                      <React.Fragment key={node.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onNodeClick?.(node.id)}
                              onMouseEnter={() => setHoveredNode(node.id)}
                              onMouseLeave={() => setHoveredNode(null)}
                              className={cn(
                                "relative group flex flex-col items-center justify-center",
                                "min-w-[90px] h-[70px] rounded-xl border-2 px-3 py-2",
                                "transition-all duration-300 ease-out",
                                "hover:scale-105 hover:shadow-lg hover:z-20",
                                selectedNode === node.id && "ring-2 ring-primary ring-offset-2",
                                hoveredNode === node.id && "shadow-xl scale-105",
                                isConnectedTo(node.id) && "ring-2 ring-primary/50",
                                node.status === 'complete' && "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10",
                                node.status === 'in-progress' && "border-amber-500/50 bg-amber-50 dark:bg-amber-500/10",
                                node.status === 'pending' && "border-border bg-muted/30"
                              )}
                            >
                              {/* Phase Number Badge */}
                              <div 
                                className={cn(
                                  "absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full",
                                  "flex items-center justify-center text-[10px] font-bold text-white",
                                  node.status === 'complete' && "bg-emerald-500",
                                  node.status === 'in-progress' && "bg-amber-500",
                                  node.status === 'pending' && "bg-muted-foreground"
                                )}
                              >
                                {Math.floor(node.phase)}
                              </div>

                              {/* SLA Badge */}
                              {node.sla && (
                                <div className="absolute -top-2 right-1">
                                  <Badge 
                                    variant="secondary" 
                                    className="text-[9px] px-1.5 py-0 h-4 bg-background border shadow-sm"
                                  >
                                    <Clock size={8} className="mr-0.5" />
                                    {node.sla}
                                  </Badge>
                                </div>
                              )}

                              {/* Node Content */}
                              <span className="text-xs font-medium text-center leading-tight">
                                {node.shortName || node.name}
                              </span>
                              
                              {/* Status indicator */}
                              <div className="absolute -bottom-1.5 right-1">
                                {getStatusIcon(node.status)}
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="max-w-[250px] p-3"
                          >
                            <div className="space-y-2">
                              <div className="font-semibold">{node.name}</div>
                              <p className="text-xs text-muted-foreground">
                                {node.description}
                              </p>
                              {node.sla && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Clock size={12} />
                                  <span>SLA: {node.sla}</span>
                                </div>
                              )}
                              {node.gates && node.gates.length > 0 && (
                                <div className="pt-1 border-t">
                                  <span className="text-xs font-medium">Gates:</span>
                                  <ul className="text-xs text-muted-foreground mt-1">
                                    {node.gates.map((gate, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <span className="text-emerald-500">✓</span>
                                        {gate}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>

                        {/* Connector Arrow */}
                        {nodeIndex < lane.nodes.length - 1 && (
                          <div className="flex items-center text-muted-foreground/50">
                            <ChevronRight size={16} />
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>

        {/* Cross-lane connections legend */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-muted-foreground/30" />
              <span>Secuencia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-primary border-dashed border-t-2" />
              <span>Handoff entre áreas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 font-medium">
                11 fases Supply
              </div>
              <span>→</span>
              <div className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 font-medium">
                3 fases Planeación
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, ArrowRight, Clock, Users, FileText, Flag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Module, ProcessPhase, getStatusColor } from '@/data/productArchitecture';
import { StatusBadge } from './StatusBadge';

interface ModuleCardProps {
  module: Module;
  onPhaseClick?: (phase: ProcessPhase) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ 
  module, 
  onPhaseClick,
  isExpanded = false,
  onToggle 
}) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Dynamic icon loading
  const IconComponent = (LucideIcons as any)[module.icon] || LucideIcons.Box;

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const completedPhases = module.phases.filter(p => p.status === 'complete').length;
  const totalPhases = module.phases.length;
  const completionPercent = Math.round((completedPhases / totalPhases) * 100);

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-border/50">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            style={{ borderLeft: `4px solid ${module.color}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${module.color}20` }}
                >
                  <IconComponent 
                    size={24} 
                    style={{ color: module.color }} 
                  />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {module.shortName}
                    <Badge variant="outline" className="text-xs font-normal">
                      {completedPhases}/{totalPhases} fases
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {module.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Progress indicator */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${completionPercent}%`,
                        backgroundColor: module.color 
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">
                    {completionPercent}%
                  </span>
                </div>
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            {/* Phase Timeline */}
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Flujo de Proceso
              </h4>
              
              <div className="relative">
                {module.phases.map((phase, index) => (
                  <Collapsible 
                    key={phase.id}
                    open={expandedPhases.has(phase.id)}
                    onOpenChange={() => togglePhase(phase.id)}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
                          style={{ backgroundColor: getStatusColor(phase.status) }}
                        >
                          {phase.phaseNumber}
                        </div>
                        {index < module.phases.length - 1 && (
                          <div className="w-0.5 h-full min-h-[20px] bg-border" />
                        )}
                      </div>

                      {/* Phase content */}
                      <div className="flex-1 pb-4">
                        <CollapsibleTrigger asChild>
                          <button className="w-full text-left group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium group-hover:text-primary transition-colors">
                                  {phase.name}
                                </span>
                                <StatusBadge status={phase.status} size="sm" />
                              </div>
                              {expandedPhases.has(phase.id) ? (
                                <ChevronDown size={16} className="text-muted-foreground" />
                              ) : (
                                <ChevronRight size={16} className="text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {phase.description}
                            </p>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="mt-3 pl-0 space-y-3 bg-muted/30 rounded-lg p-3">
                            {/* SLA and Responsible */}
                            <div className="flex flex-wrap gap-4 text-sm">
                              {phase.sla && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock size={14} />
                                  <span>SLA: {phase.sla}</span>
                                </div>
                              )}
                              {phase.responsible.length > 0 && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Users size={14} />
                                  <span>{phase.responsible.join(', ')}</span>
                                </div>
                              )}
                            </div>

                            {/* Feature Flag */}
                            {phase.featureFlag && (
                              <div className="flex items-center gap-1.5 text-sm">
                                <Flag size={14} className="text-blue-500" />
                                <code className="text-xs bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">
                                  {phase.featureFlag}
                                </code>
                              </div>
                            )}

                            {/* Subprocesses */}
                            {phase.subprocesses && phase.subprocesses.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Subprocesos:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {phase.subprocesses.map(sub => (
                                    <Badge 
                                      key={sub.id} 
                                      variant="secondary"
                                      className="text-xs"
                                      title={sub.description}
                                    >
                                      {sub.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Gates */}
                            {phase.gates && phase.gates.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Gates de Aprobación:
                                </p>
                                <ul className="text-sm space-y-1">
                                  {phase.gates.map((gate, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-green-500 mt-0.5">✓</span>
                                      <span>{gate}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Documents */}
                            {phase.documents && phase.documents.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                  <FileText size={12} />
                                  Documentos:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {phase.documents.map((doc, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {doc}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </div>

            {/* Module Connections */}
            {module.connections.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Conexiones con otros módulos
                </h4>
                <div className="space-y-2">
                  {module.connections.map((conn, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-lg"
                    >
                      <ArrowRight size={14} className="text-primary shrink-0" />
                      <span className="font-medium">{conn.targetModule}</span>
                      <Badge variant="outline" className="text-xs">
                        {conn.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {conn.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {module.tables && module.tables.length > 0 && (
                  <div>
                    <span className="font-medium">Tablas:</span>{' '}
                    {module.tables.length} tablas
                  </div>
                )}
                {module.edgeFunctions && module.edgeFunctions.length > 0 && (
                  <div>
                    <span className="font-medium">Edge Functions:</span>{' '}
                    {module.edgeFunctions.join(', ')}
                  </div>
                )}
                <div>
                  <span className="font-medium">Actualizado:</span>{' '}
                  {module.lastUpdated}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

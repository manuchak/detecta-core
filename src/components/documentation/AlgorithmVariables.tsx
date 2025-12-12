import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Code, Database, Gauge } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AlgorithmComponent } from './AlgorithmVisualization';

interface AlgorithmVariablesProps {
  components: AlgorithmComponent[];
}

export const AlgorithmVariables: React.FC<AlgorithmVariablesProps> = ({ components }) => {
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  const toggleComponent = (id: string) => {
    setExpandedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="mt-3 space-y-2">
      {components.map((comp) => (
        <Collapsible
          key={comp.id}
          open={expandedComponents.has(comp.id)}
          onOpenChange={() => toggleComponent(comp.id)}
        >
          <CollapsibleTrigger className="w-full">
            <div
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              style={{ borderLeft: `3px solid ${comp.color}` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: comp.color }}
                />
                <span className="font-medium text-sm">{comp.name}</span>
                <Badge variant="outline" className="text-xs">
                  {comp.weight}%
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {comp.variables.length} variables
                </Badge>
              </div>
              {expandedComponents.has(comp.id) ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="ml-4 mt-2 rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Variable</th>
                    <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Fuente</th>
                    <th className="px-3 py-2 text-left font-medium">Rango</th>
                    <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {comp.variables.map((variable, index) => (
                    <tr
                      key={variable.name}
                      className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">{variable.name}</span>
                        </div>
                        {/* Mobile: show description below */}
                        <p className="text-muted-foreground mt-0.5 md:hidden">
                          {variable.description}
                        </p>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3 text-muted-foreground" />
                          <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                            {variable.source}
                          </code>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <code className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {variable.range}
                        </code>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">
                        {variable.description}
                        {variable.calculation && (
                          <div className="flex items-center gap-1 mt-1">
                            <Code className="h-3 w-3" />
                            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                              {variable.calculation}
                            </code>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

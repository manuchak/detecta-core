import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AlgorithmComponent } from './AlgorithmVisualization';

interface AlgorithmFormulaProps {
  components: AlgorithmComponent[];
}

export const AlgorithmFormula: React.FC<AlgorithmFormulaProps> = ({ components }) => {
  // Sort by weight descending for consistent display
  const sortedComponents = [...components].sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        📊 Fórmula de Cálculo
      </h4>
      
      {/* Formula Text Representation */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border/50 font-mono text-sm overflow-x-auto">
        <span className="text-foreground font-semibold">Score = </span>
        {sortedComponents.map((comp, index) => (
          <span key={comp.id}>
            <span style={{ color: comp.color }} className="font-semibold">
              ({comp.id.charAt(0).toUpperCase()}
            </span>
            <span className="text-muted-foreground">×</span>
            <span className="text-foreground">{comp.weight}%)</span>
            {index < sortedComponents.length - 1 && (
              <span className="text-muted-foreground"> + </span>
            )}
          </span>
        ))}
      </div>

      {/* Visual Weight Bars */}
      <div className="space-y-2">
        <TooltipProvider>
          {sortedComponents.map((comp) => (
            <Tooltip key={comp.id}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 cursor-help group">
                  <div className="w-24 text-xs font-medium text-right shrink-0 group-hover:text-foreground text-muted-foreground transition-colors">
                    {comp.name}
                  </div>
                  <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${comp.weight}%`,
                        backgroundColor: comp.color,
                        minWidth: '32px'
                      }}
                    >
                      <span className="text-[10px] font-bold text-white drop-shadow-sm">
                        {comp.weight}%
                      </span>
                    </div>
                  </div>
                  <div className="w-8 text-xs text-muted-foreground shrink-0">
                    {comp.variables.length}v
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold">{comp.name}</p>
                <p className="text-xs text-muted-foreground">{comp.description}</p>
                <p className="text-xs mt-1">
                  <span className="font-medium">{comp.variables.length}</span> variables involucradas
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
        {sortedComponents.map((comp) => (
          <div key={comp.id} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: comp.color }}
            />
            <span className="text-muted-foreground">
              {comp.id.charAt(0).toUpperCase()} = {comp.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

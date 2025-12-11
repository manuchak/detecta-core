import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as LucideIcons from 'lucide-react';
import { productArchitecture, Module } from '@/data/productArchitecture';

interface ProductMapProps {
  onModuleClick?: (moduleId: string) => void;
  selectedModule?: string | null;
}

// Define module positions for the interactive map (relative positioning)
const modulePositions: Record<string, { x: number; y: number; row: number }> = {
  supply: { x: 0, y: 0, row: 0 },
  planeacion: { x: 1, y: 0, row: 0 },
  monitoring: { x: 2, y: 0, row: 0 },
  instaladores: { x: 0, y: 1, row: 1 },
  wms: { x: 1, y: 1, row: 1 },
  reportes: { x: 2, y: 1, row: 1 },
  configuracion: { x: 0, y: 2, row: 2 },
  integraciones: { x: 2, y: 2, row: 2 },
};

export const ProductMap: React.FC<ProductMapProps> = ({ onModuleClick, selectedModule }) => {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const modules = Object.values(productArchitecture.modules);
  const connections = productArchitecture.globalConnections;

  const getModuleStats = (module: Module) => {
    const completed = module.phases.filter(p => p.status === 'complete').length;
    const total = module.phases.length;
    return { completed, total, percent: Math.round((completed / total) * 100) };
  };

  // Group modules by row for layout
  const rows: Module[][] = [[], [], []];
  modules.forEach(module => {
    const pos = modulePositions[module.id];
    if (pos) {
      rows[pos.row].push(module);
    }
  });

  // Sort each row by x position
  rows.forEach(row => {
    row.sort((a, b) => (modulePositions[a.id]?.x || 0) - (modulePositions[b.id]?.x || 0));
  });

  return (
    <TooltipProvider>
      <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Mapa del Producto</h3>
          <p className="text-sm text-muted-foreground">
            Click en un módulo para ver sus detalles. Las líneas muestran flujos de datos.
          </p>
        </div>

        {/* Connection lines as SVG background */}
        <div className="relative">
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ minHeight: '400px' }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="hsl(var(--muted-foreground))"
                  opacity="0.5"
                />
              </marker>
            </defs>
            {/* Connection lines would be drawn here dynamically */}
          </svg>

          {/* Module Grid */}
          <div className="space-y-8">
            {rows.map((row, rowIndex) => (
              <div 
                key={rowIndex}
                className="flex justify-center gap-4 md:gap-8"
              >
                {row.map((module) => {
                  const IconComponent = (LucideIcons as any)[module.icon] || LucideIcons.Box;
                  const stats = getModuleStats(module);
                  const isSelected = selectedModule === module.id;
                  const isHovered = hoveredModule === module.id;
                  const isConnected = hoveredModule 
                    ? connections.some(c => 
                        (c.from === hoveredModule && c.to === module.id) ||
                        (c.to === hoveredModule && c.from === module.id)
                      )
                    : false;

                  return (
                    <Tooltip key={module.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onModuleClick?.(module.id)}
                          onMouseEnter={() => setHoveredModule(module.id)}
                          onMouseLeave={() => setHoveredModule(null)}
                          className={`
                            relative group flex flex-col items-center p-4 rounded-xl border-2 
                            transition-all duration-300 min-w-[120px] md:min-w-[160px]
                            ${isSelected 
                              ? 'border-primary shadow-lg scale-105' 
                              : isConnected
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:shadow-md'
                            }
                            bg-card hover:bg-card/80
                          `}
                        >
                          {/* Icon with color background */}
                          <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: `${module.color}20` }}
                          >
                            <IconComponent 
                              size={28} 
                              style={{ color: module.color }}
                            />
                          </div>

                          {/* Module name */}
                          <span className="font-medium text-sm text-center">
                            {module.shortName}
                          </span>

                          {/* Progress bar */}
                          <div className="w-full mt-2">
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${stats.percent}%`,
                                  backgroundColor: module.color 
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                              {stats.completed}/{stats.total} fases
                            </p>
                          </div>

                          {/* Domain badge */}
                          <Badge 
                            variant="outline" 
                            className="mt-2 text-xs"
                            style={{ 
                              borderColor: `${module.color}50`,
                              color: module.color 
                            }}
                          >
                            {module.domain}
                          </Badge>

                          {/* Connection indicator */}
                          {isHovered && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary animate-pulse" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="font-medium">{module.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {module.description}
                        </p>
                        {module.externalServices && module.externalServices.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {module.externalServices.map(service => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {module.connections.length > 0 && (
                          <p className="text-xs mt-2">
                            <span className="text-muted-foreground">Conecta con: </span>
                            {module.connections.map(c => c.targetModule).join(', ')}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Supply</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span>Operations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span>Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-500" />
              <span>Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span>Integrations</span>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

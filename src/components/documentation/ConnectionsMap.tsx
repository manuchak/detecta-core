import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Database, Zap, RefreshCw, Radio } from 'lucide-react';
import { productArchitecture, GlobalConnection } from '@/data/productArchitecture';

interface ConnectionsMapProps {
  highlightModule?: string | null;
}

export const ConnectionsMap: React.FC<ConnectionsMapProps> = ({ highlightModule }) => {
  const connections = productArchitecture.globalConnections;
  const modules = productArchitecture.modules;

  const getTypeIcon = (type: GlobalConnection['type']) => {
    switch (type) {
      case 'data': return Database;
      case 'event': return Radio;
      case 'trigger': return Zap;
      default: return ArrowRight;
    }
  };

  const getTypeColor = (type: GlobalConnection['type']) => {
    switch (type) {
      case 'data': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'event': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'trigger': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredConnections = highlightModule
    ? connections.filter(c => c.from === highlightModule || c.to === highlightModule)
    : connections;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw size={20} className="text-primary" />
          Mapa de Integraciones
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Flujos de datos y eventos entre módulos del sistema
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredConnections.map((connection, index) => {
            const fromModule = modules[connection.from];
            const toModule = modules[connection.to];
            const TypeIcon = getTypeIcon(connection.type);

            if (!fromModule || !toModule) return null;

            const isHighlighted = highlightModule 
              ? connection.from === highlightModule || connection.to === highlightModule
              : false;

            return (
              <div 
                key={index}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${isHighlighted ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border/50'}
                `}
              >
                {/* From Module */}
                <div className="flex items-center gap-2 min-w-[100px]">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: fromModule.color }}
                  />
                  <span className="font-medium text-sm">{fromModule.shortName}</span>
                </div>

                {/* Connection Type */}
                <div className="flex items-center gap-2 flex-1">
                  <ArrowRight size={16} className="text-muted-foreground" />
                  <Badge variant="outline" className={`${getTypeColor(connection.type)} gap-1`}>
                    <TypeIcon size={12} />
                    {connection.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground hidden md:inline">
                    {connection.label}
                  </span>
                </div>

                {/* To Module */}
                <div className="flex items-center gap-2 min-w-[100px] justify-end">
                  <span className="font-medium text-sm">{toModule.shortName}</span>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: toModule.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Tipos de Conexión:</p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className={`${getTypeColor('data')} gap-1`}>
              <Database size={12} />
              Data: Flujo de datos directo
            </Badge>
            <Badge variant="outline" className={`${getTypeColor('event')} gap-1`}>
              <Radio size={12} />
              Event: Notificación asíncrona
            </Badge>
            <Badge variant="outline" className={`${getTypeColor('trigger')} gap-1`}>
              <Zap size={12} />
              Trigger: Acción automática
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp } from 'lucide-react';
import type { ZonaDemanda } from '../../types/planningResources';

interface TopZonasDemandaCardProps {
  zonas: ZonaDemanda[];
}

const MEDAL_STYLES = [
  'bg-yellow-500 text-yellow-950', // 🥇
  'bg-gray-400 text-gray-900',     // 🥈
  'bg-amber-700 text-amber-100',   // 🥉
];

export default function TopZonasDemandaCard({ zonas }: TopZonasDemandaCardProps) {
  const maxServicios = zonas.length > 0 ? zonas[0].cantidad_servicios : 1;
  
  if (zonas.length === 0) {
    return (
      <Card className="shadow-apple-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Top Zonas de Demanda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No hay datos de demanda en los últimos 30 días
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-apple-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            Top Zonas de Demanda
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Últimos 30 días
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {zonas.map((zona, index) => {
          const barWidth = (zona.cantidad_servicios / maxServicios) * 100;
          const isMedal = index < 3;
          
          return (
            <div key={zona.origen} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMedal ? (
                    <span 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${MEDAL_STYLES[index]}`}
                    >
                      {index + 1}
                    </span>
                  ) : (
                    <span className="w-6 h-6 flex items-center justify-center text-sm text-muted-foreground font-medium">
                      {index + 1}.
                    </span>
                  )}
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {zona.origen}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {zona.cantidad_servicios}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({zona.porcentaje}%)
                  </span>
                </div>
              </div>
              
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    index === 0 ? 'bg-primary' : 
                    index === 1 ? 'bg-primary/80' : 
                    index === 2 ? 'bg-primary/60' : 'bg-primary/40'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {/* Insight */}
        <div className="pt-3 mt-3 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Las zonas del Estado de México (EDOMEX) concentran la mayor demanda. 
              Considera fortalecer la red de custodios en estas áreas.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

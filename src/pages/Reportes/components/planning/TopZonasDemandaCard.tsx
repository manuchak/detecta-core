import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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

type TopCount = '5' | '10' | '15';

export default function TopZonasDemandaCard({ zonas }: TopZonasDemandaCardProps) {
  const [topCount, setTopCount] = useState<TopCount>('5');
  
  const zonasVisibles = zonas.slice(0, parseInt(topCount));
  const maxServicios = zonasVisibles.length > 0 ? zonasVisibles[0].cantidad_servicios : 1;
  
  // Calcular estadísticas de geocodificación
  const zonasConGeo = zonas.filter(z => z.lat && z.lng).length;
  const porcentajeGeocodificado = zonas.length > 0 
    ? Math.round((zonasConGeo / zonas.length) * 100) 
    : 0;
  
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
            No hay datos de demanda en el período seleccionado
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-apple-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            Top Zonas de Demanda
          </CardTitle>
          
          <div className="flex items-center gap-3">
            <ToggleGroup 
              type="single" 
              value={topCount} 
              onValueChange={(v) => v && setTopCount(v as TopCount)}
              className="bg-muted rounded-lg p-0.5"
            >
              <ToggleGroupItem 
                value="5" 
                size="sm" 
                className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                Top 5
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="10" 
                size="sm" 
                className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                disabled={zonas.length < 6}
              >
                Top 10
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="15" 
                size="sm" 
                className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                disabled={zonas.length < 11}
              >
                Top 15
              </ToggleGroupItem>
            </ToggleGroup>
            
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {zonasVisibles.length} zonas
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className={`space-y-2 ${parseInt(topCount) > 5 ? 'max-h-[400px] overflow-y-auto pr-1' : ''}`}>
          {zonasVisibles.map((zona, index) => {
            const barWidth = (zona.cantidad_servicios / maxServicios) * 100;
            const isMedal = index < 3;
            const hasGeo = zona.lat && zona.lng;
            
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate max-w-[180px]" title={zona.origen}>
                        {zona.origen}
                      </span>
                      {hasGeo && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Geolocalizado" />
                      )}
                    </div>
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
        </div>
        
        {/* Insight */}
        <div className="pt-3 mt-3 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {porcentajeGeocodificado >= 80 
                ? `${porcentajeGeocodificado}% de las zonas están geolocalizadas. Visualiza el mapa de burbujas para identificar patrones regionales.`
                : zonasVisibles.some(z => z.origen.toLowerCase().includes('manzanillo') || z.origen.toLowerCase().includes('lazaro'))
                  ? 'Puertos logísticos (Manzanillo, Lázaro Cárdenas) muestran alta demanda. Considera posicionar custodios cerca para minimizar empty legs.'
                  : 'Las zonas del Estado de México concentran la mayor demanda. Considera fortalecer la red de custodios en estas áreas.'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

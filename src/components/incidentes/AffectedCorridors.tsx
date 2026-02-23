import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, AlertTriangle } from 'lucide-react';
import { IncidenteRRSS } from '@/hooks/useIncidentesRRSS';
import { HIGHWAY_CORRIDORS } from '@/lib/security/highwayCorridors';

interface AffectedCorridorsProps {
  incidentes: IncidenteRRSS[];
}

const TIPO_LABELS: Record<string, string> = {
  robo_carga: 'robo',
  robo_unidad: 'robo unidad',
  robo_combustible: 'robo combustible',
  asalto_transporte: 'asalto',
  bloqueo_carretera: 'bloqueo',
  accidente_trailer: 'accidente',
  secuestro_operador: 'secuestro',
  extorsion: 'extorsión',
};

export function AffectedCorridors({ incidentes }: AffectedCorridorsProps) {
  // Count incidents by carretera
  const porCarretera = useMemo(() => {
    const map: Record<string, { count: number; tipos: Record<string, number> }> = {};
    incidentes.forEach(inc => {
      if (inc.carretera) {
        if (!map[inc.carretera]) map[inc.carretera] = { count: 0, tipos: {} };
        map[inc.carretera].count++;
        const tipo = inc.tipo_incidente || 'otro';
        map[inc.carretera].tipos[tipo] = (map[inc.carretera].tipos[tipo] || 0) + 1;
      }
    });
    return Object.entries(map).sort(([, a], [, b]) => b.count - a.count).slice(0, 8);
  }, [incidentes]);

  if (porCarretera.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Route className="h-4 w-4" />
          Corredores Afectados
          <Badge variant="outline" className="text-xs">{porCarretera.length} tramos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {porCarretera.map(([carretera, info]) => {
            const tipoResumen = Object.entries(info.tipos)
              .map(([t, c]) => `${c} ${TIPO_LABELS[t] || t}`)
              .join(', ');

            return (
              <div key={carretera} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5 text-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                <span className="font-medium">{carretera}</span>
                <span className="text-muted-foreground text-xs">({tipoResumen})</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

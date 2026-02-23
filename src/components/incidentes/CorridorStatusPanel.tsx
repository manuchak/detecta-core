import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, AlertOctagon, Clock } from 'lucide-react';
import { IncidenteRRSS } from '@/hooks/useIncidentesRRSS';
import { HIGHWAY_CORRIDORS, HighwayCorridor } from '@/lib/security/highwayCorridors';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CorridorStatusPanelProps {
  incidentes: IncidenteRRSS[];
}

type StatusLevel = 'rojo' | 'amarillo' | 'verde';

interface CorridorStatus {
  corridor: HighwayCorridor;
  status: StatusLevel;
  label: string;
  incidentCount: number;
  tipoPredominante: string | null;
  ultimaActualizacion: string | null;
}

const TIPO_LABELS: Record<string, string> = {
  robo_carga: 'Robo carga',
  robo_unidad: 'Robo unidad',
  robo_combustible: 'Robo combustible',
  asalto_transporte: 'Asalto',
  bloqueo_carretera: 'Bloqueo',
  accidente_trailer: 'Accidente',
  secuestro_operador: 'Secuestro',
  extorsion: 'Extorsión',
  vandalismo_unidad: 'Vandalismo',
};

function matchIncidentToCorridor(incident: IncidenteRRSS, corridor: HighwayCorridor): boolean {
  const carreteraLower = (incident.carretera || '').toLowerCase();
  const corridorNameLower = corridor.name.toLowerCase();
  const corridorIdLower = corridor.id.toLowerCase();

  // Match by carretera name similarity
  if (carreteraLower && (
    corridorNameLower.includes(carreteraLower) ||
    carreteraLower.includes(corridorIdLower.replace(/-/g, ' ')) ||
    carreteraLower.includes(corridor.name.split(' ')[0].toLowerCase())
  )) {
    return true;
  }

  // Match by proximity to waypoints (rough bounding box)
  if (incident.coordenadas_lat && incident.coordenadas_lng) {
    const lats = corridor.waypoints.map(w => w[1]);
    const lngs = corridor.waypoints.map(w => w[0]);
    const margin = 0.3; // ~30km
    const inBounds =
      incident.coordenadas_lat >= Math.min(...lats) - margin &&
      incident.coordenadas_lat <= Math.max(...lats) + margin &&
      incident.coordenadas_lng >= Math.min(...lngs) - margin &&
      incident.coordenadas_lng <= Math.max(...lngs) + margin;
    if (inBounds) return true;
  }

  return false;
}

export function CorridorStatusPanel({ incidentes }: CorridorStatusPanelProps) {
  const corridorStatuses = useMemo(() => {
    const now = new Date();
    const hace4h = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const hace24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return HIGHWAY_CORRIDORS.map((corridor): CorridorStatus => {
      const matched = incidentes.filter(inc => matchIncidentToCorridor(inc, corridor));
      const matched4h = matched.filter(inc => new Date(inc.fecha_publicacion) >= hace4h);
      const matched24h = matched.filter(inc => new Date(inc.fecha_publicacion) >= hace24h);

      // Determine status
      const hasCritical4h = matched4h.some(inc =>
        inc.severidad === 'critica' || inc.severidad === 'alta'
      );

      let status: StatusLevel = 'verde';
      let label = 'OPERAR NORMAL';

      if (hasCritical4h || matched4h.length >= 2) {
        status = 'rojo';
        label = 'EVITAR';
      } else if (matched24h.length > 0) {
        status = 'amarillo';
        label = 'PRECAUCIÓN';
      }

      // Tipo predominante
      const tipos: Record<string, number> = {};
      matched24h.forEach(inc => {
        if (inc.tipo_incidente && inc.tipo_incidente !== 'sin_clasificar') {
          tipos[inc.tipo_incidente] = (tipos[inc.tipo_incidente] || 0) + 1;
        }
      });
      const tipoPredominante = Object.entries(tipos).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      // Última actualización
      const ultimaActualizacion = matched24h.length > 0 ? matched24h[0].fecha_publicacion : null;

      return {
        corridor,
        status,
        label,
        incidentCount: matched24h.length,
        tipoPredominante,
        ultimaActualizacion,
      };
    }).sort((a, b) => {
      const order: Record<StatusLevel, number> = { rojo: 0, amarillo: 1, verde: 2 };
      return order[a.status] - order[b.status];
    });
  }, [incidentes]);

  const countByStatus = useMemo(() => {
    const counts = { rojo: 0, amarillo: 0, verde: 0 };
    corridorStatuses.forEach(cs => counts[cs.status]++);
    return counts;
  }, [corridorStatuses]);

  const StatusIcon = ({ status }: { status: StatusLevel }) => {
    if (status === 'rojo') return <AlertOctagon className="h-4 w-4 text-destructive" />;
    if (status === 'amarillo') return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <Shield className="h-4 w-4 text-green-500" />;
  };

  const statusBg: Record<StatusLevel, string> = {
    rojo: 'bg-destructive/10 border-destructive/30',
    amarillo: 'bg-orange-500/10 border-orange-500/30',
    verde: 'bg-green-500/5 border-border',
  };

  const statusTextColor: Record<StatusLevel, string> = {
    rojo: 'text-destructive font-bold',
    amarillo: 'text-orange-500 font-semibold',
    verde: 'text-green-500 font-medium',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Estatus de Corredores
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="destructive" className="text-xs">{countByStatus.rojo} EVITAR</Badge>
            <Badge className="text-xs bg-orange-500 hover:bg-orange-600">{countByStatus.amarillo} PRECAUCIÓN</Badge>
            <Badge variant="outline" className="text-xs text-green-600 border-green-500">{countByStatus.verde} NORMAL</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium text-muted-foreground">Corredor</th>
                <th className="text-center p-2 font-medium text-muted-foreground w-28">Estatus</th>
                <th className="text-center p-2 font-medium text-muted-foreground w-16">Inc.</th>
                <th className="text-left p-2 font-medium text-muted-foreground w-24">Tipo</th>
                <th className="text-right p-2 font-medium text-muted-foreground w-32">Últ. reporte</th>
              </tr>
            </thead>
            <tbody>
              {corridorStatuses.map(cs => (
                <tr key={cs.corridor.id} className={`border-b last:border-0 ${statusBg[cs.status]}`}>
                  <td className="p-2 font-medium">{cs.corridor.name}</td>
                  <td className="p-2 text-center">
                    <span className={`inline-flex items-center gap-1 ${statusTextColor[cs.status]}`}>
                      <StatusIcon status={cs.status} />
                      {cs.label}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {cs.incidentCount > 0 ? (
                      <span className="font-bold">{cs.incidentCount}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {cs.tipoPredominante ? TIPO_LABELS[cs.tipoPredominante] || cs.tipoPredominante : '—'}
                  </td>
                  <td className="p-2 text-right text-muted-foreground">
                    {cs.ultimaActualizacion ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(cs.ultimaActualizacion), { addSuffix: true, locale: es })}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertOctagon, AlertTriangle, CheckCircle, Phone, Radio } from 'lucide-react';
import { IncidenteRRSS } from '@/hooks/useIncidentesRRSS';
import { HIGHWAY_CORRIDORS } from '@/lib/security/highwayCorridors';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface OperationalRecommendationsProps {
  incidentes: IncidenteRRSS[];
}

interface Recommendation {
  level: 'evitar' | 'precaucion' | 'normal';
  corridor: string;
  detail: string;
  timeAgo?: string;
}

const TIPO_LABELS: Record<string, string> = {
  robo_carga: 'robo de carga',
  robo_unidad: 'robo de unidad',
  bloqueo_carretera: 'bloqueo',
  asalto_transporte: 'asalto',
  accidente_trailer: 'accidente',
  secuestro_operador: 'secuestro',
  extorsion: 'extorsión',
};

export function OperationalRecommendations({ incidentes }: OperationalRecommendationsProps) {
  const recommendations = useMemo((): Recommendation[] => {
    const now = new Date();
    const hace4h = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const hace24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recs: Recommendation[] = [];

    for (const corridor of HIGHWAY_CORRIDORS) {
      const matched = incidentes.filter(inc => {
        const carreteraLower = (inc.carretera || '').toLowerCase();
        const corridorNameLower = corridor.name.toLowerCase();

        if (carreteraLower && (
          corridorNameLower.includes(carreteraLower) ||
          carreteraLower.includes(corridor.id.replace(/-/g, ' '))
        )) return true;

        if (inc.coordenadas_lat && inc.coordenadas_lng) {
          const lats = corridor.waypoints.map(w => w[1]);
          const lngs = corridor.waypoints.map(w => w[0]);
          const margin = 0.3;
          return (
            inc.coordenadas_lat >= Math.min(...lats) - margin &&
            inc.coordenadas_lat <= Math.max(...lats) + margin &&
            inc.coordenadas_lng >= Math.min(...lngs) - margin &&
            inc.coordenadas_lng <= Math.max(...lngs) + margin
          );
        }
        return false;
      });

      const matched4h = matched.filter(inc => new Date(inc.fecha_publicacion) >= hace4h);
      const matched24h = matched.filter(inc => new Date(inc.fecha_publicacion) >= hace24h);

      const hasCritical4h = matched4h.some(inc =>
        inc.severidad === 'critica' || inc.severidad === 'alta'
      );

      if (hasCritical4h || matched4h.length >= 2) {
        const tipos = matched4h.map(m => TIPO_LABELS[m.tipo_incidente] || m.tipo_incidente).filter(Boolean);
        const tipoStr = [...new Set(tipos)].slice(0, 2).join(', ') || 'incidente crítico';
        const timeAgo = matched4h[0] ? formatDistanceToNow(new Date(matched4h[0].fecha_publicacion), { locale: es }) : undefined;
        recs.push({
          level: 'evitar',
          corridor: corridor.name,
          detail: `${matched4h.length} ${tipoStr} activo${matched4h.length > 1 ? 's' : ''}`,
          timeAgo: timeAgo ? `hace ${timeAgo}` : undefined,
        });
      } else if (matched24h.length > 0) {
        const tipos = matched24h.map(m => TIPO_LABELS[m.tipo_incidente] || m.tipo_incidente).filter(Boolean);
        const tipoStr = [...new Set(tipos)].slice(0, 2).join(', ') || 'incidente';
        const timeAgo = matched24h[0] ? formatDistanceToNow(new Date(matched24h[0].fecha_publicacion), { locale: es }) : undefined;
        recs.push({
          level: 'precaucion',
          corridor: corridor.name,
          detail: `${tipoStr} reportado`,
          timeAgo: timeAgo ? `hace ${timeAgo}` : undefined,
        });
      }
    }

    // Sort: evitar first, then precaucion
    recs.sort((a, b) => (a.level === 'evitar' ? -1 : 1) - (b.level === 'evitar' ? -1 : 1));

    // If no recs, add a "normal" message
    if (recs.length === 0) {
      recs.push({
        level: 'normal',
        corridor: 'Todos los corredores',
        detail: 'Sin incidentes reportados en las últimas 24h',
      });
    }

    return recs.slice(0, 8); // Max 8 recommendations
  }, [incidentes]);

  const levelConfig = {
    evitar: {
      icon: AlertOctagon,
      label: 'EVITAR',
      className: 'bg-destructive/10 border-destructive/30 text-destructive',
      iconClassName: 'text-destructive',
    },
    precaucion: {
      icon: AlertTriangle,
      label: 'PRECAUCIÓN',
      className: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
      iconClassName: 'text-orange-500',
    },
    normal: {
      icon: CheckCircle,
      label: 'OPERACIÓN NORMAL',
      className: 'bg-green-500/10 border-green-500/30 text-green-600',
      iconClassName: 'text-green-500',
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Radio className="h-4 w-4" />
          Recomendaciones Operativas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.map((rec, idx) => {
          const config = levelConfig[rec.level];
          const Icon = config.icon;
          return (
            <div key={idx} className={`rounded-md border p-2.5 text-xs ${config.className}`}>
              <div className="flex items-start gap-2">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.iconClassName}`} />
                <div className="min-w-0">
                  <span className="font-bold">{config.label}:</span>{' '}
                  <span className="font-semibold">{rec.corridor}</span>
                  <span className="text-muted-foreground"> — {rec.detail}</span>
                  {rec.timeAgo && (
                    <span className="text-muted-foreground"> ({rec.timeAgo})</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Emergency contacts */}
        <div className="border-t pt-2 mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <strong>088</strong> Guardia Nacional
          </span>
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <strong>074</strong> CAPUFE
          </span>
          <span className="text-muted-foreground/70">
            Fuentes: @GN_Carreteras · @monitorcarrete1
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

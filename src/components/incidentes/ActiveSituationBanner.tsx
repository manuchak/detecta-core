import { AlertTriangle, Shield, Clock, MapPin } from 'lucide-react';
import { IncidenteRRSS } from '@/hooks/useIncidentesRRSS';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActiveSituationBannerProps {
  incidentes: IncidenteRRSS[] | undefined;
  isLoading: boolean;
}

export function ActiveSituationBanner({ incidentes, isLoading }: ActiveSituationBannerProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 animate-pulse">
        <div className="h-6 w-64 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded mt-2" />
      </div>
    );
  }

  const total = incidentes?.length || 0;
  const criticos = incidentes?.filter(i => i.severidad === 'critica' || i.severidad === 'alta') || [];
  const totalCriticos = criticos.length;

  // Agrupar por estado geográfico
  const porEstado: Record<string, number> = {};
  incidentes?.forEach(i => {
    if (i.estado) {
      // Extraer nombre del estado (campo 'estado' de la BD contiene la entidad federativa)
      const est = i.estado;
      porEstado[est] = (porEstado[est] || 0) + 1;
    }
  });
  const estadosAfectados = Object.entries(porEstado)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Tipo predominante
  const porTipo: Record<string, number> = {};
  incidentes?.forEach(i => {
    if (i.tipo_incidente && i.tipo_incidente !== 'sin_clasificar') {
      porTipo[i.tipo_incidente] = (porTipo[i.tipo_incidente] || 0) + 1;
    }
  });
  const tipoPredominante = Object.entries(porTipo).sort(([, a], [, b]) => b - a)[0];

  // Último incidente
  const ultimoIncidente = incidentes?.[0];

  const TIPO_LABELS: Record<string, string> = {
    robo_carga: 'Robo de Carga',
    robo_unidad: 'Robo de Unidad',
    robo_combustible: 'Robo de Combustible',
    asalto_transporte: 'Asalto a Transporte',
    bloqueo_carretera: 'Bloqueo Carretero',
    accidente_trailer: 'Accidente de Tráiler',
    secuestro_operador: 'Secuestro',
    extorsion: 'Extorsión',
    vandalismo_unidad: 'Vandalismo',
  };

  // Determinar nivel de alerta
  let alertLevel: 'green' | 'amber' | 'red' = 'green';
  if (totalCriticos > 0) alertLevel = 'red';
  else if (total > 0) alertLevel = 'amber';

  const bgClass = alertLevel === 'red'
    ? 'bg-destructive/10 border-destructive/50'
    : alertLevel === 'amber'
      ? 'bg-orange-500/10 border-orange-500/50'
      : 'bg-green-500/10 border-green-500/50';

  const iconClass = alertLevel === 'red'
    ? 'text-destructive'
    : alertLevel === 'amber'
      ? 'text-orange-500'
      : 'text-green-500';

  return (
    <div className={`rounded-lg border-2 p-4 ${bgClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {alertLevel === 'green' ? (
            <Shield className={`h-6 w-6 mt-0.5 ${iconClass}`} />
          ) : (
            <AlertTriangle className={`h-6 w-6 mt-0.5 ${iconClass} ${alertLevel === 'red' ? 'animate-pulse' : ''}`} />
          )}
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {alertLevel === 'green' && 'SITUACIÓN LIMPIA — Sin incidentes activos (4h)'}
              {alertLevel === 'amber' && `ATENCIÓN: ${total} incidente${total > 1 ? 's' : ''} en últimas 4 horas`}
              {alertLevel === 'red' && `⚠ ALERTA ACTIVA: ${totalCriticos} incidente${totalCriticos > 1 ? 's' : ''} crítico${totalCriticos > 1 ? 's' : ''} (4h)`}
            </h2>

            {total > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                {estadosAfectados.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {estadosAfectados.map(([est, count]) => (
                      <Badge key={est} variant="outline" className="text-xs font-medium">
                        {est} ({count})
                      </Badge>
                    ))}
                  </span>
                )}

                {tipoPredominante && (
                  <span className="text-xs">
                    · Tipo: <strong>{TIPO_LABELS[tipoPredominante[0]] || tipoPredominante[0]}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {ultimoIncidente && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            Últ. actualización:{' '}
            {formatDistanceToNow(new Date(ultimoIncidente.fecha_publicacion), { addSuffix: true, locale: es })}
          </div>
        )}
      </div>
    </div>
  );
}

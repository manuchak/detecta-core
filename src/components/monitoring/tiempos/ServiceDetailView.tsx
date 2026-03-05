import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { type ServiceTimeRow } from '@/hooks/useServiceTimesReport';
import { useEventosRuta, EVENTO_ICONS, type EventoRuta, type TipoEventoRuta } from '@/hooks/useEventosRuta';
import { ServiceDetailMap } from './ServiceDetailMap';
import { ServiceDetailPDFButton } from './ServiceDetailPDF';

interface Props {
  service: ServiceTimeRow;
  onBack: () => void;
}

const fmtTs = (iso: string | null) => {
  if (!iso) return '—';
  return format(new Date(iso), "dd/MM/yyyy HH:mm:ss", { locale: es });
};

const fmtDur = (seconds: number | null) => {
  if (!seconds) return null;
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const ServiceDetailView: React.FC<Props> = ({ service, onBack }) => {
  const { eventos, isLoading } = useEventosRuta(service.folio);

  const sorted = [...eventos].sort(
    (a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime()
  );

  const totalParadas = sorted.filter(
    e => e.duracion_segundos && !['inicio_servicio', 'fin_servicio', 'llegada_destino', 'liberacion_custodio'].includes(e.tipo_evento)
  ).length;

  const totalTiempoParadas = sorted
    .filter(e => e.duracion_segundos && !['inicio_servicio', 'fin_servicio', 'llegada_destino', 'liberacion_custodio'].includes(e.tipo_evento))
    .reduce((acc, e) => acc + (e.duracion_segundos || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">
            Bitácora Detallada — {service.folio}
          </h2>
          <p className="text-xs text-muted-foreground">
            {service.cliente} · {service.custodio} · {service.origen} → {service.destino}
          </p>
        </div>
        <ServiceDetailPDFButton
          service={service}
          eventos={sorted}
        />
      </div>

      {/* Time summary bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Cita', value: fmtTs(service.citaPlaneacion) },
          { label: 'Inicio', value: fmtTs(service.inicioMonitoreo) },
          { label: 'Llegada Destino', value: fmtTs(service.llegadaDestino) },
          { label: 'Liberación', value: fmtTs(service.liberacion) },
          { label: 'ΔOrigen', value: service.deltaOrigen !== null ? `${service.deltaOrigen} min` : '—', highlight: service.deltaOrigen !== null && service.deltaOrigen > 30 },
          { label: 'ΔDestino', value: service.deltaDestino !== null ? `${service.deltaDestino} min` : '—', highlight: service.deltaDestino !== null && service.deltaDestino > 30 },
        ].map((item, i) => (
          <Card key={i} className="p-2">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className={`text-xs font-semibold ${(item as any).highlight ? 'text-destructive' : ''}`}>
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Two columns: Map + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 500 }}>
        {/* Map */}
        <ServiceDetailMap eventos={sorted} />

        {/* Chronology */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>📋 Cronología ({sorted.length} eventos)</span>
              <span className="text-xs text-muted-foreground font-normal">
                {totalParadas} paradas · {fmtDur(totalTiempoParadas) || '0m'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay eventos registrados para este servicio
              </p>
            ) : (
              sorted.map((evento, idx) => {
                const info = EVENTO_ICONS[evento.tipo_evento as TipoEventoRuta] || EVENTO_ICONS.otro;
                return (
                  <div key={evento.id} className="flex gap-2 py-1.5 border-b border-border/40 last:border-0">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-0.5">
                      <span className="text-base leading-none">{info.icon}</span>
                      {idx < sorted.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold">
                          {format(new Date(evento.hora_inicio), 'HH:mm:ss')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{info.label}</span>
                        {evento.duracion_segundos != null && (
                          <span className="text-[10px] text-destructive ml-auto">
                            {fmtDur(evento.duracion_segundos)}
                          </span>
                        )}
                      </div>
                      {evento.descripcion && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {evento.descripcion}
                        </p>
                      )}
                      {evento.ubicacion_texto && (
                        <p className="text-[10px] text-muted-foreground italic">📍 {evento.ubicacion_texto}</p>
                      )}
                      {/* Photos */}
                      {evento.foto_urls && evento.foto_urls.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {evento.foto_urls.map((url, pi) => (
                            <a key={pi} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={`Foto ${pi + 1}`}
                                className="h-12 w-16 object-cover rounded border border-border"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ServicioEnSitio {
  id: string;
  id_servicio: string;
  nombre_cliente: string | null;
  custodio_asignado: string | null;
  origen: string | null;
  destino: string | null;
  hora_inicio_real: string;
  fecha_hora_cita: string | null;
}

interface BitacoraServiceSelectorProps {
  selectedServiceId: string | null;
  onSelect: (servicioId: string) => void;
}

export function BitacoraServiceSelector({ selectedServiceId, onSelect }: BitacoraServiceSelectorProps) {
  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ['servicios-en-sitio-bitacora'],
    queryFn: async () => {
      const ahora = new Date();
      const desde = new Date(ahora.getTime() - 16 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, id_servicio, nombre_cliente, custodio_asignado, origen, destino, hora_inicio_real, fecha_hora_cita')
        .not('hora_inicio_real', 'is', null)
        .not('estado_planeacion', 'in', '(cancelado,completado)')
        .gte('fecha_hora_cita', desde.toISOString())
        .order('hora_inicio_real', { ascending: false });

      if (error) throw error;
      return (data || []) as ServicioEnSitio[];
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Query event counts per service
  const serviceIds = servicios.map(s => s.id_servicio).filter(Boolean);
  const { data: eventCounts = {} } = useQuery({
    queryKey: ['bitacora-event-counts', serviceIds],
    queryFn: async () => {
      if (serviceIds.length === 0) return {};
      const { data, error } = await supabase
        .from('servicio_eventos_ruta')
        .select('servicio_id')
        .in('servicio_id', serviceIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach(row => {
        counts[row.servicio_id] = (counts[row.servicio_id] || 0) + 1;
      });
      return counts;
    },
    enabled: serviceIds.length > 0,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando servicios...
      </div>
    );
  }

  if (servicios.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
        No hay servicios en sitio en este momento
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          Servicios en Sitio
        </h3>
        <Badge variant="outline" className="text-xs">
          {servicios.length}
        </Badge>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-3">
          {servicios.map(servicio => {
            const isSelected = selectedServiceId === servicio.id_servicio;
            const count = eventCounts[servicio.id_servicio] || 0;
            const tiempoEnSitio = servicio.hora_inicio_real
              ? formatDistanceToNow(new Date(servicio.hora_inicio_real), { locale: es })
              : null;

            return (
              <button
                key={servicio.id}
                onClick={() => onSelect(servicio.id_servicio)}
                className={cn(
                  "w-full text-left rounded-lg p-3 transition-all border",
                  "hover:bg-accent/50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground line-clamp-1">
                    {servicio.nombre_cliente || 'Sin cliente'}
                  </span>
                  {count > 0 && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
                      {count}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">{servicio.custodio_asignado || 'Sin custodio'}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">
                    {servicio.origen || '?'} → {servicio.destino || '?'}
                  </span>
                </div>

                {tiempoEnSitio && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>En sitio hace {tiempoEnSitio}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

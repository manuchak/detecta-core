import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MapPin, User, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useCallback } from 'react';

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

  const serviceIds = servicios.map(s => s.id_servicio).filter(Boolean);
  const { data: eventCounts = {} } = useQuery({
    queryKey: ['bitacora-event-counts', serviceIds],
    queryFn: async () => {
      if (serviceIds.length === 0) return {};
      const { data, error } = await supabase
        .from('servicio_eventos_ruta')
        .select('servicio_id, tipo_evento')
        .in('servicio_id', serviceIds);
      if (error) throw error;
      const counts: Record<string, { total: number; incidencias: number }> = {};
      (data || []).forEach((row: any) => {
        if (!counts[row.servicio_id]) counts[row.servicio_id] = { total: 0, incidencias: 0 };
        counts[row.servicio_id].total++;
        if (row.tipo_evento === 'incidencia') counts[row.servicio_id].incidencias++;
      });
      return counts;
    },
    enabled: serviceIds.length > 0,
    refetchInterval: 30000,
  });

  // Auto-select first service
  useEffect(() => {
    if (!selectedServiceId && servicios.length > 0) {
      onSelect(servicios[0].id_servicio);
    }
  }, [servicios, selectedServiceId, onSelect]);

  const currentIndex = servicios.findIndex(s => s.id_servicio === selectedServiceId);

  const goNext = useCallback(() => {
    if (servicios.length === 0) return;
    const next = (currentIndex + 1) % servicios.length;
    onSelect(servicios[next].id_servicio);
  }, [currentIndex, servicios, onSelect]);

  const goPrev = useCallback(() => {
    if (servicios.length === 0) return;
    const prev = currentIndex <= 0 ? servicios.length - 1 : currentIndex - 1;
    onSelect(servicios[prev].id_servicio);
  }, [currentIndex, servicios, onSelect]);

  // Keyboard nav ← →
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) return;
      
      const hasDialog = document.body.dataset.dialogOpen === '1' ||
        !!document.querySelector('[role="dialog"][data-state="open"]');
      if (hasDialog) return;

      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3 text-muted-foreground text-sm">
        Cargando servicios...
      </div>
    );
  }

  if (servicios.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <MapPin className="h-6 w-6 mx-auto mb-1 opacity-40" />
        No hay servicios en sitio
      </div>
    );
  }

  const servicio = servicios[currentIndex >= 0 ? currentIndex : 0];
  if (!servicio) return null;
  
  const counts = eventCounts[servicio.id_servicio];
  const tiempoEnSitio = servicio.hora_inicio_real
    ? formatDistanceToNow(new Date(servicio.hora_inicio_real), { locale: es })
    : null;

  return (
    <div className="flex items-center gap-2">
      {/* Prev button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={goPrev}
        disabled={servicios.length <= 1}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Service card */}
      <div className="flex-1 min-w-0 rounded-lg border bg-card p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="font-semibold text-sm text-foreground truncate">
            {servicio.nombre_cliente || 'Sin cliente'}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {counts?.incidencias ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                {counts.incidencias}
              </Badge>
            ) : null}
            {counts?.total ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {counts.total} ev
              </Badge>
            ) : null}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
              {currentIndex + 1}/{servicios.length}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{servicio.custodio_asignado || 'Sin custodio'}</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[180px]">
              {servicio.origen || '?'} → {servicio.destino || '?'}
            </span>
          </span>
          {tiempoEnSitio && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tiempoEnSitio}
            </span>
          )}
        </div>
      </div>

      {/* Next button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={goNext}
        disabled={servicios.length <= 1}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

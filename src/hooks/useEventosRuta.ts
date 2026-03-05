import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRouteCalculation } from '@/hooks/security/useRouteCalculation';

export type TipoEventoRuta =
  | 'inicio_servicio' | 'fin_servicio'
  | 'combustible' | 'baño' | 'descanso' | 'pernocta'
  | 'checkpoint' | 'incidencia' | 'foto_evidencia' | 'otro'
  | 'llegada_destino' | 'liberacion_custodio';

export interface EventoRuta {
  id: string;
  servicio_id: string;
  tipo_evento: TipoEventoRuta;
  descripcion: string | null;
  hora_inicio: string;
  hora_fin: string | null;
  duracion_segundos: number | null;
  lat: number | null;
  lng: number | null;
  ubicacion_texto: string | null;
  foto_urls: string[];
  registrado_por: string | null;
  created_at: string;
}

export const EVENTO_ICONS: Record<TipoEventoRuta, { icon: string; label: string; color: string }> = {
  inicio_servicio: { icon: '🟢', label: 'Inicio', color: 'hsl(var(--chart-2))' },
  fin_servicio: { icon: '🔴', label: 'Fin', color: 'hsl(var(--destructive))' },
  combustible: { icon: '⛽', label: 'Combustible', color: 'hsl(var(--chart-4))' },
  baño: { icon: '🚻', label: 'Baño', color: 'hsl(var(--chart-3))' },
  descanso: { icon: '☕', label: 'Descanso', color: 'hsl(var(--chart-5))' },
  pernocta: { icon: '🛏️', label: 'Pernocta', color: 'hsl(var(--accent))' },
  checkpoint: { icon: '📍', label: 'Checkpoint', color: 'hsl(var(--chart-1))' },
  incidencia: { icon: '⚠️', label: 'Incidencia', color: 'hsl(var(--destructive))' },
  foto_evidencia: { icon: '📸', label: 'Foto', color: 'hsl(var(--muted-foreground))' },
  otro: { icon: '📝', label: 'Otro', color: 'hsl(var(--muted-foreground))' },
  llegada_destino: { icon: '🏁', label: 'Llegada Destino', color: 'hsl(var(--chart-2))' },
  liberacion_custodio: { icon: '✅', label: 'Liberación', color: 'hsl(var(--chart-2))' },
};

export function useEventosRuta(servicioId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['eventos-ruta', servicioId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<EventoRuta[]> => {
      if (!servicioId) return [];
      const { data, error } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .select('*')
        .eq('servicio_id', servicioId)
        .order('hora_inicio', { ascending: true });
      if (error) throw error;
      return (data || []) as EventoRuta[];
    },
    enabled: !!servicioId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!servicioId) return;
    const channel = supabase
      .channel(`eventos-ruta-${servicioId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'servicio_eventos_ruta',
        filter: `servicio_id=eq.${servicioId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [servicioId, queryClient]);

  const startEvent = useMutation({
    mutationFn: async (params: {
      tipo: TipoEventoRuta;
      descripcion?: string;
      lat?: number;
      lng?: number;
      ubicacion_texto?: string;
      foto_urls?: string[];
    }) => {
      if (!servicioId) throw new Error('No servicio selected');

      // Guard: unique events can only exist once per servicio
      const UNIQUE_EVENTS: TipoEventoRuta[] = ['inicio_servicio', 'llegada_destino', 'liberacion_custodio'];
      if (UNIQUE_EVENTS.includes(params.tipo)) {
        const { data: existing } = await (supabase as any)
          .from('servicio_eventos_ruta')
          .select('id')
          .eq('servicio_id', servicioId)
          .eq('tipo_evento', params.tipo)
          .limit(1);
        if (existing && existing.length > 0) {
          throw new Error(`Ya existe un evento "${EVENTO_ICONS[params.tipo].label}" para este servicio`);
        }
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .insert({
          servicio_id: servicioId,
          tipo_evento: params.tipo,
          descripcion: params.descripcion || null,
          lat: params.lat || null,
          lng: params.lng || null,
          ubicacion_texto: params.ubicacion_texto || null,
          foto_urls: params.foto_urls || [],
          registrado_por: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as EventoRuta;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const stopEvent = useMutation({
    mutationFn: async (eventoId: string) => {
      // Get current event to calculate duration
      const { data: evento, error: fetchErr } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .select('hora_inicio')
        .eq('id', eventoId)
        .single();
      if (fetchErr) throw fetchErr;

      const now = new Date();
      const start = new Date(evento.hora_inicio);
      const duracion = Math.round((now.getTime() - start.getTime()) / 1000);

      const { error } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .update({
          hora_fin: now.toISOString(),
          duracion_segundos: duracion,
        })
        .eq('id', eventoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const addPhoto = useMutation({
    mutationFn: async ({ eventoId, url }: { eventoId: string; url: string }) => {
      const { data: evento, error: fetchErr } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .select('foto_urls')
        .eq('id', eventoId)
        .single();
      if (fetchErr) throw fetchErr;

      const urls = [...(evento.foto_urls || []), url];
      const { error } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .update({ foto_urls: urls })
        .eq('id', eventoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventoId: string) => {
      const { error } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .delete()
        .eq('id', eventoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Active event = one without hora_fin
  const activeEvent = query.data?.find(e => !e.hora_fin) || null;

  return {
    eventos: query.data || [],
    isLoading: query.isLoading,
    activeEvent,
    startEvent,
    stopEvent,
    addPhoto,
    deleteEvent,
  };
}

// Hook to generate road-snapped trace using truck route engine
export function useBitacoraTraza() {
  const { calculate, result, isCalculating, error } = useRouteCalculation();

  const generateTraza = useCallback(async (eventos: EventoRuta[]) => {
    const points = eventos
      .filter(e => e.lat && e.lng)
      .sort((a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime())
      .map(e => [e.lng!, e.lat!] as [number, number]);

    if (points.length < 2) return null;

    const origin = points[0];
    const destination = points[points.length - 1];
    const waypoints = points.slice(1, -1);

    return calculate({
      origin,
      destination,
      waypoints,
      alley_bias: -1,
      exclude: ['unpaved', 'ferry'],
    });
  }, [calculate]);

  return { generateTraza, traza: result, isCalculating, error };
}

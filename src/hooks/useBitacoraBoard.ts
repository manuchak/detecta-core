import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EventoRuta, TipoEventoRuta } from './useEventosRuta';

/* ───────── Types ───────── */

export type ServicePhase = 'por_iniciar' | 'en_curso' | 'en_destino' | 'evento_especial';
export type AlertLevel = 'normal' | 'warning' | 'critical';

export interface BoardService {
  id: string;                     // UUID PK
  id_servicio: string;
  nombre_cliente: string;
  custodio_asignado: string | null;
  custodio_id: string | null;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  hora_inicio_real: string | null;
  hora_fin_real: string | null;
  estado_planeacion: string;
  en_destino: boolean;
  tipo_servicio: string | null;
  requiere_armado: boolean;
  // Computed
  phase: ServicePhase;
  activeEvent: EventoRuta | null;
  lastEventAt: Date | null;
  minutesSinceLastAction: number;
  alertLevel: AlertLevel;
}

export type SpecialEventType = 'combustible' | 'baño' | 'descanso' | 'pernocta' | 'incidencia';

const SPECIAL_EVENT_TYPES: SpecialEventType[] = ['combustible', 'baño', 'descanso', 'pernocta', 'incidencia'];

/* ───────── Hook ───────── */

export function useBitacoraBoard() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval>>();

  // Tick every 15s for timer updates
  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 15_000);

    // Recalculate on tab re-focus
    const onVisibility = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(tickRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  /* ── Q1: Pending services (Por Iniciar) ── */
  const pendingQuery = useQuery({
    queryKey: ['bitacora-board-pending'],
    queryFn: async () => {
      const windowHours = 1;
      const desde = new Date(Date.now() - windowHours * 3600_000);
      const hasta = new Date(Date.now() + windowHours * 3600_000);

      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, id_servicio, nombre_cliente, custodio_asignado, custodio_id, origen, destino, fecha_hora_cita, hora_inicio_real, hora_fin_real, estado_planeacion, en_destino, tipo_servicio, requiere_armado')
        .is('hora_inicio_real', null)
        .not('custodio_asignado', 'is', null)
        .in('estado_planeacion', ['confirmado', 'planificado'])
        .gte('fecha_hora_cita', desde.toISOString())
        .lte('fecha_hora_cita', hasta.toISOString())
        .order('fecha_hora_cita', { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  /* ── Q2: Active services (En Curso / En Destino) ── */
  const activeQuery = useQuery({
    queryKey: ['bitacora-board-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, id_servicio, nombre_cliente, custodio_asignado, custodio_id, origen, destino, fecha_hora_cita, hora_inicio_real, hora_fin_real, estado_planeacion, en_destino, tipo_servicio, requiere_armado')
        .not('hora_inicio_real', 'is', null)
        .gte('hora_inicio_real', new Date(Date.now() - 24 * 3600_000).toISOString())
        .is('hora_fin_real', null)
        .not('estado_planeacion', 'in', '(cancelado,completado)')
        .order('hora_inicio_real', { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  /* ── Q3: All events for active service IDs ── */
  const activeServiceIds = useMemo(
    () => (activeQuery.data || []).map((s: any) => s.id_servicio).filter(Boolean),
    [activeQuery.data]
  );

  const eventsQuery = useQuery({
    queryKey: ['bitacora-board-events', activeServiceIds],
    queryFn: async () => {
      if (activeServiceIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .select('*')
        .in('servicio_id', activeServiceIds)
        .order('hora_inicio', { ascending: false });
      if (error) throw error;
      return (data || []) as EventoRuta[];
    },
    enabled: activeServiceIds.length > 0,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  /* ── Realtime subscriptions ── */
  useEffect(() => {
    const ch = supabase
      .channel('bitacora-board-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios_planificados' }, () => {
        queryClient.invalidateQueries({ queryKey: ['bitacora-board-pending'] });
        queryClient.invalidateQueries({ queryKey: ['bitacora-board-active'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicio_eventos_ruta' }, () => {
        queryClient.invalidateQueries({ queryKey: ['bitacora-board-events'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  /* ── Computed board state ── */
  const allEvents = eventsQuery.data || [];

  const eventsByService = useMemo(() => {
    const map: Record<string, EventoRuta[]> = {};
    allEvents.forEach(e => {
      if (!map[e.servicio_id]) map[e.servicio_id] = [];
      map[e.servicio_id].push(e);
    });
    return map;
  }, [allEvents]);

  const computePhaseAndTimers = useCallback((svc: any): BoardService => {
    const events = eventsByService[svc.id_servicio] || [];
    const activeEvent = events.find(e => !e.hora_fin && SPECIAL_EVENT_TYPES.includes(e.tipo_evento as SpecialEventType)) || null;

    // Determine phase
    let phase: ServicePhase;
    if (!svc.hora_inicio_real) {
      phase = 'por_iniciar';
    } else if (activeEvent) {
      phase = 'evento_especial';
    } else if (svc.en_destino) {
      phase = 'en_destino';
    } else {
      phase = 'en_curso';
    }

    // Last event time — use the most recent timestamp across all events (hora_inicio OR hora_fin)
    const lastActionTime = events.reduce<Date | null>((latest, e) => {
      const start = new Date(e.hora_inicio);
      const end = e.hora_fin ? new Date(e.hora_fin) : null;
      const eventLatest = end && end > start ? end : start;
      return !latest || eventLatest > latest ? eventLatest : latest;
    }, null);
    const lastEventAt = lastActionTime || (svc.hora_inicio_real ? new Date(svc.hora_inicio_real) : null);
    const minutesSinceLastAction = lastEventAt ? Math.floor((now - lastEventAt.getTime()) / 60_000) : 0;

    // Alert level
    let alertLevel: AlertLevel = 'normal';
    if (phase === 'en_curso' || phase === 'en_destino') {
      if (minutesSinceLastAction >= 45) alertLevel = 'critical';
      else if (minutesSinceLastAction >= 30) alertLevel = 'warning';
    }

    return {
      id: svc.id,
      id_servicio: svc.id_servicio,
      nombre_cliente: svc.nombre_cliente,
      custodio_asignado: svc.custodio_asignado,
      custodio_id: svc.custodio_id,
      origen: svc.origen,
      destino: svc.destino,
      fecha_hora_cita: svc.fecha_hora_cita,
      hora_inicio_real: svc.hora_inicio_real,
      hora_fin_real: svc.hora_fin_real,
      estado_planeacion: svc.estado_planeacion,
      en_destino: svc.en_destino ?? false,
      tipo_servicio: svc.tipo_servicio,
      requiere_armado: svc.requiere_armado ?? false,
      phase,
      activeEvent,
      lastEventAt,
      minutesSinceLastAction,
      alertLevel,
    };
  }, [eventsByService, now]);

  const pendingServices = useMemo(
    () => (pendingQuery.data || []).map(computePhaseAndTimers),
    [pendingQuery.data, computePhaseAndTimers]
  );

  const activeServices = useMemo(
    () => (activeQuery.data || []).map(computePhaseAndTimers),
    [activeQuery.data, computePhaseAndTimers]
  );

  const enCursoServices = useMemo(
    () => activeServices
      .filter(s => s.phase === 'en_curso' || s.phase === 'en_destino')
      .sort((a, b) => b.minutesSinceLastAction - a.minutesSinceLastAction),
    [activeServices]
  );

  const eventoEspecialServices = useMemo(
    () => activeServices.filter(s => s.phase === 'evento_especial'),
    [activeServices]
  );

  /* ── Actions ── */

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['bitacora-board-pending'] });
    queryClient.invalidateQueries({ queryKey: ['bitacora-board-active'] });
    queryClient.invalidateQueries({ queryKey: ['bitacora-board-events'] });
  };

  const iniciarServicio = useMutation({
    mutationFn: async (serviceId: string) => {
      // Guard: check not already started
      const { data: svc, error: fetchErr } = await supabase
        .from('servicios_planificados')
        .select('hora_inicio_real, id_servicio')
        .eq('id', serviceId)
        .single();
      if (fetchErr) throw fetchErr;
      if (svc.hora_inicio_real) throw new Error('Servicio ya iniciado');

      const nowTs = new Date().toISOString();
      const { error } = await supabase
        .from('servicios_planificados')
        .update({ hora_inicio_real: nowTs } as any)
        .eq('id', serviceId);
      if (error) throw error;

      // Insert inicio_servicio event
      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from('servicio_eventos_ruta').insert({
        servicio_id: svc.id_servicio,
        tipo_evento: 'inicio_servicio',
        descripcion: 'Servicio iniciado',
        registrado_por: user?.id || null,
        foto_urls: [],
      });
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Servicio iniciado');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al iniciar servicio');
    },
  });

  const registrarCheckpoint = useMutation({
    mutationFn: async (params: {
      servicioIdServicio: string;
      descripcion?: string;
      lat?: number;
      lng?: number;
      ubicacion_texto?: string;
      foto_urls?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from('servicio_eventos_ruta').insert({
        servicio_id: params.servicioIdServicio,
        tipo_evento: 'checkpoint',
        descripcion: params.descripcion || null,
        lat: params.lat || null,
        lng: params.lng || null,
        ubicacion_texto: params.ubicacion_texto || null,
        foto_urls: params.foto_urls || [],
        registrado_por: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Checkpoint registrado');
    },
    onError: () => toast.error('Error al registrar checkpoint'),
  });

  const iniciarEventoEspecial = useMutation({
    mutationFn: async (params: { servicioIdServicio: string; tipo: SpecialEventType; descripcion?: string }) => {
      // Guard: check no active event
      const { data: existing } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .select('id')
        .eq('servicio_id', params.servicioIdServicio)
        .is('hora_fin', null)
        .in('tipo_evento', SPECIAL_EVENT_TYPES)
        .limit(1);

      if (existing && existing.length > 0) throw new Error('Ya existe un evento activo');

      // Guard: check not en_destino
      const { data: svc } = await supabase
        .from('servicios_planificados')
        .select('en_destino, id_servicio')
        .eq('id_servicio', params.servicioIdServicio)
        .single();
      if (svc?.en_destino) throw new Error('No se pueden crear eventos después de llegar a destino');

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from('servicio_eventos_ruta').insert({
        servicio_id: params.servicioIdServicio,
        tipo_evento: params.tipo,
        descripcion: params.descripcion || null,
        foto_urls: [],
        registrado_por: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Evento registrado');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al crear evento'),
  });

  const cerrarEventoEspecial = useMutation({
    mutationFn: async (eventoId: string) => {
      const { data: evento, error: fetchErr } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .select('hora_inicio')
        .eq('id', eventoId)
        .single();
      if (fetchErr) throw fetchErr;

      const nowDate = new Date();
      const dur = Math.round((nowDate.getTime() - new Date(evento.hora_inicio).getTime()) / 1000);

      const { error } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .update({ hora_fin: nowDate.toISOString(), duracion_segundos: dur })
        .eq('id', eventoId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Evento cerrado');
    },
    onError: () => toast.error('Error al cerrar evento'),
  });

  const registrarLlegadaDestino = useMutation({
    mutationFn: async (params: { serviceUUID: string; servicioIdServicio: string }) => {
      // Guard: no active special events
      const { data: activeEvts } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .select('id')
        .eq('servicio_id', params.servicioIdServicio)
        .is('hora_fin', null)
        .in('tipo_evento', SPECIAL_EVENT_TYPES)
        .limit(1);
      if (activeEvts && activeEvts.length > 0) throw new Error('Cierra los eventos especiales antes de registrar llegada');

      const { data: { user } } = await supabase.auth.getUser();

      // Insert llegada_destino event
      await (supabase as any).from('servicio_eventos_ruta').insert({
        servicio_id: params.servicioIdServicio,
        tipo_evento: 'llegada_destino',
        descripcion: 'Llegada a destino',
        foto_urls: [],
        registrado_por: user?.id || null,
      });

      // Set en_destino flag
      const { error } = await supabase
        .from('servicios_planificados')
        .update({ en_destino: true } as any)
        .eq('id', params.serviceUUID);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Llegada a destino registrada');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al registrar llegada'),
  });

  const liberarCustodio = useMutation({
    mutationFn: async (params: { serviceUUID: string; servicioIdServicio: string }) => {
      // Guard: must be en_destino
      const { data: svc } = await supabase
        .from('servicios_planificados')
        .select('en_destino')
        .eq('id', params.serviceUUID)
        .single();
      if (!svc?.en_destino) throw new Error('El servicio no ha llegado a destino');

      const { data: { user } } = await supabase.auth.getUser();
      const nowTs = new Date().toISOString();

      // Insert liberacion + fin events
      await (supabase as any).from('servicio_eventos_ruta').insert([
        {
          servicio_id: params.servicioIdServicio,
          tipo_evento: 'liberacion_custodio',
          descripcion: 'Custodio liberado',
          foto_urls: [],
          registrado_por: user?.id || null,
        },
        {
          servicio_id: params.servicioIdServicio,
          tipo_evento: 'fin_servicio',
          descripcion: 'Servicio completado',
          foto_urls: [],
          registrado_por: user?.id || null,
        },
      ]);

      // Update service to completed
      const { error } = await supabase
        .from('servicios_planificados')
        .update({
          hora_fin_real: nowTs,
          estado_planeacion: 'completado',
        } as any)
        .eq('id', params.serviceUUID);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Custodio liberado — servicio completado');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al liberar custodio'),
  });

  return {
    // Data
    pendingServices,
    enCursoServices,
    eventoEspecialServices,
    isLoading: pendingQuery.isLoading || activeQuery.isLoading,
    // Actions
    iniciarServicio,
    registrarCheckpoint,
    iniciarEventoEspecial,
    cerrarEventoEspecial,
    registrarLlegadaDestino,
    liberarCustodio,
    // Helpers
    getEventsForService: (idServicio: string) => eventsByService[idServicio] || [],
  };
}

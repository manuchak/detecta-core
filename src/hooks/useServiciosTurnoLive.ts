import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EventoRuta } from './useEventosRuta';
import type { ServicePhase, AlertLevel } from './useBitacoraBoard';
import { CIUDADES_PRINCIPALES, extraerCiudad } from '@/utils/geografico';

export type { ServicePhase, AlertLevel };

type SpecialEventType = 'combustible' | 'baño' | 'descanso' | 'pernocta' | 'incidencia';
const SPECIAL_EVENT_TYPES: SpecialEventType[] = ['combustible', 'baño', 'descanso', 'pernocta', 'incidencia'];

/* ───────── Types ───────── */

export interface RadarService {
  id: string;
  id_servicio: string;
  nombre_cliente: string;
  custodio_asignado: string | null;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tipo_servicio: string | null;
  // Computed
  phase: ServicePhase;
  alertLevel: AlertLevel;
  minutesSinceLastAction: number;
  activeEvent: { tipo: string; minutosActivo: number } | null;
  // GPS
  lat: number | null;
  lng: number | null;
  positionSource: 'gps' | 'geocoded';
}

export interface RadarResumen {
  enRuta: number;
  enEvento: number;
  alerta: number;
  porIniciar: number;
  completados: number;
}

export interface RadarSafePoint {
  id: string;
  lat: number;
  lng: number;
  type: string;
  certification_level: string | null;
}

/* ───────── Geocoding fallback ───────── */

function geocodificarOrigen(origen: string | null): { lat: number | null; lng: number | null } {
  if (!origen) return { lat: null, lng: null };
  const ciudadKey = extraerCiudad(origen);
  if (!ciudadKey) return { lat: null, lng: null };
  const info = CIUDADES_PRINCIPALES[ciudadKey as keyof typeof CIUDADES_PRINCIPALES];
  if (!info) return { lat: null, lng: null };
  const offset = () => (Math.random() - 0.5) * 0.02;
  return { lat: info.lat + offset(), lng: info.lng + offset() };
}

/* ───────── Hook ───────── */

export function useServiciosTurnoLive() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval>>();

  // Tick every 15s
  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 15_000);
    const onVis = () => { if (document.visibilityState === 'visible') setNow(Date.now()); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(tickRef.current); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  /* ── Q1: Active services (en curso, últimas 24h) ── */
  const activeQuery = useQuery({
    queryKey: ['radar-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, id_servicio, nombre_cliente, custodio_asignado, origen, destino, fecha_hora_cita, hora_inicio_real, hora_fin_real, estado_planeacion, en_destino, tipo_servicio')
        .not('hora_inicio_real', 'is', null)
        .is('hora_fin_real', null)
        .not('estado_planeacion', 'in', '(cancelado,completado)')
        .order('hora_inicio_real', { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  /* ── Q2: Pending services (±2h window) ── */
  const pendingQuery = useQuery({
    queryKey: ['radar-pending'],
    queryFn: async () => {
      const desde = new Date(Date.now() - 2 * 3600_000);
      const hasta = new Date(Date.now() + 2 * 3600_000);
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, id_servicio, nombre_cliente, custodio_asignado, origen, destino, fecha_hora_cita, hora_inicio_real, hora_fin_real, estado_planeacion, en_destino, tipo_servicio')
        .is('hora_inicio_real', null)
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

  /* ── Q3: Route events for active services ── */
  const activeServiceIds = useMemo(
    () => (activeQuery.data || []).map((s: any) => s.id_servicio).filter(Boolean),
    [activeQuery.data]
  );

  const eventsQuery = useQuery({
    queryKey: ['radar-events', activeServiceIds],
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

  /* ── Q4: Completed today (count) ── */
  const completedQuery = useQuery({
    queryKey: ['radar-completed'],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('servicios_planificados')
        .select('id', { count: 'exact', head: true })
        .eq('estado_planeacion', 'completado')
        .gte('hora_fin_real', todayStart.toISOString());
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  /* ── Q5: Safe points (cached 5min) ── */
  const safePointsQuery = useQuery({
    queryKey: ['radar-safe-points'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('safe_points')
        .select('id, lat, lng, type, certification_level')
        .eq('is_active', true)
        .or('type.eq.alerta,certification_level.in.(oro,plata)');
      if (error) throw error;
      return (data || []) as RadarSafePoint[];
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  /* ── Realtime ── */
  useEffect(() => {
    const ch = supabase
      .channel('radar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios_planificados' }, () => {
        queryClient.invalidateQueries({ queryKey: ['radar-active'] });
        queryClient.invalidateQueries({ queryKey: ['radar-pending'] });
        queryClient.invalidateQueries({ queryKey: ['radar-completed'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicio_eventos_ruta' }, () => {
        queryClient.invalidateQueries({ queryKey: ['radar-events'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  /* ── Computed ── */
  const allEvents = eventsQuery.data || [];

  const eventsByService = useMemo(() => {
    const map: Record<string, EventoRuta[]> = {};
    allEvents.forEach(e => {
      if (!map[e.servicio_id]) map[e.servicio_id] = [];
      map[e.servicio_id].push(e);
    });
    return map;
  }, [allEvents]);

  const computeRadarService = useCallback((svc: any, isActive: boolean): RadarService => {
    const events = eventsByService[svc.id_servicio] || [];
    const activeEvt = events.find(e => !e.hora_fin && SPECIAL_EVENT_TYPES.includes(e.tipo_evento as SpecialEventType)) || null;

    // Phase
    let phase: ServicePhase;
    if (!svc.hora_inicio_real) {
      phase = 'por_iniciar';
    } else if (activeEvt) {
      phase = 'evento_especial';
    } else if (svc.en_destino) {
      phase = 'en_destino';
    } else {
      phase = 'en_curso';
    }

    // Last action time
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

    // GPS: find last event with coordinates
    let lat: number | null = null;
    let lng: number | null = null;
    let positionSource: 'gps' | 'geocoded' = 'geocoded';

    if (isActive && events.length > 0) {
      // events are sorted desc by hora_inicio, find first with coords
      const withCoords = events.find(e => e.lat && e.lng);
      if (withCoords) {
        lat = withCoords.lat;
        lng = withCoords.lng;
        positionSource = 'gps';
      }
    }

    // Fallback to geocoding
    if (!lat || !lng) {
      const geo = geocodificarOrigen(svc.origen);
      lat = geo.lat;
      lng = geo.lng;
      positionSource = 'geocoded';
    }

    // Active event info
    let activeEvent: { tipo: string; minutosActivo: number } | null = null;
    if (activeEvt) {
      const evtStart = new Date(activeEvt.hora_inicio).getTime();
      activeEvent = {
        tipo: activeEvt.tipo_evento,
        minutosActivo: Math.floor((now - evtStart) / 60_000),
      };
    }

    return {
      id: svc.id,
      id_servicio: svc.id_servicio,
      nombre_cliente: svc.nombre_cliente || 'Sin cliente',
      custodio_asignado: svc.custodio_asignado,
      origen: svc.origen || '',
      destino: svc.destino || '',
      fecha_hora_cita: svc.fecha_hora_cita,
      tipo_servicio: svc.tipo_servicio,
      phase,
      alertLevel,
      minutesSinceLastAction,
      activeEvent,
      lat,
      lng,
      positionSource,
    };
  }, [eventsByService, now]);

  const activeServices = useMemo(
    () => (activeQuery.data || []).map(s => computeRadarService(s, true)),
    [activeQuery.data, computeRadarService]
  );

  const pendingServices = useMemo(
    () => (pendingQuery.data || []).map(s => computeRadarService(s, false)),
    [pendingQuery.data, computeRadarService]
  );

  const allServices = useMemo(
    () => [...activeServices, ...pendingServices],
    [activeServices, pendingServices]
  );

  const resumen = useMemo((): RadarResumen => ({
    enRuta: activeServices.filter(s => s.phase === 'en_curso' && s.alertLevel === 'normal').length,
    enEvento: activeServices.filter(s => s.phase === 'evento_especial').length,
    alerta: activeServices.filter(s => s.alertLevel === 'warning' || s.alertLevel === 'critical').length,
    porIniciar: pendingServices.length,
    completados: completedQuery.data || 0,
  }), [activeServices, pendingServices, completedQuery.data]);

  return {
    servicios: allServices,
    resumen,
    safePoints: safePointsQuery.data || [],
    eventsByService,
    isLoading: activeQuery.isLoading || pendingQuery.isLoading,
  };
}

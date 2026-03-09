import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrentTurno, type MonitoristaProfile } from './useMonitoristaAssignment';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceContext {
  servicio_id: string;
  assignment_id: string;
  cliente: string;
  fase: string;
  ultimo_evento?: string;
  ultimo_evento_time?: string;
  minutos_inactivo: number;
  tiene_incidente: boolean;
  incidentes: IncidenteResumen[];
  notas_servicio: string;
  /** Whether it was inferred (no formal assignment row) */
  inferred: boolean;
}

export interface IncidenteResumen {
  id: string;
  tipo: string;
  severidad: string;
  descripcion: string;
  estado: string;
}

export interface HandoffPayload {
  salientes: MonitoristaProfile[];
  entrantes: MonitoristaProfile[];
  turnoEntrante: string;
  servicios: ServiceContext[];
  /** Map: servicio_id → entrante monitorista_id */
  distribucion: Record<string, string>;
  notasGenerales: string;
  firmaDataUrl?: string;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Equitable round-robin distribution of services among monitoristas */
export function distributeEquitably(
  servicios: ServiceContext[],
  entranteIds: string[],
  currentLoad?: Record<string, number>,
): Record<string, string> {
  if (entranteIds.length === 0) return {};
  const load: Record<string, number> = {};
  for (const id of entranteIds) load[id] = currentLoad?.[id] ?? 0;

  const result: Record<string, string> = {};
  // Prioritize services with incidents (assign first so they get distributed evenly)
  const sorted = [...servicios].sort((a, b) => {
    if (a.tiene_incidente && !b.tiene_incidente) return -1;
    if (!a.tiene_incidente && b.tiene_incidente) return 1;
    return 0;
  });

  for (const s of sorted) {
    const target = entranteIds.reduce((a, b) => (load[a] <= load[b] ? a : b));
    result[s.servicio_id] = target;
    load[target]++;
  }
  return result;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useShiftHandoff(salientes: MonitoristaProfile[]) {
  const queryClient = useQueryClient();
  const salienteIds = salientes.map(m => m.id);

  // 1. Fetch all active assignments for outgoing monitoristas
  const assignmentsQuery = useQuery({
    queryKey: ['shift-handoff-assignments', salienteIds],
    enabled: salienteIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('*')
        .in('monitorista_id', salienteIds)
        .eq('activo', true);
      if (error) throw error;
      return data || [];
    },
  });

  // 2. Fetch service details for those assignments
  const serviceIds = (assignmentsQuery.data || []).map((a: any) => a.servicio_id);

  const servicesQuery = useQuery({
    queryKey: ['shift-handoff-services', serviceIds],
    enabled: serviceIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('servicios_planificados')
        .select('id_servicio, cliente_nombre, estado_planeacion, hora_cita')
        .in('id_servicio', serviceIds);
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Fetch last event per service
  const eventsQuery = useQuery({
    queryKey: ['shift-handoff-events', serviceIds],
    enabled: serviceIds.length > 0,
    queryFn: async () => {
      // Get latest event per service
      const { data, error } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .select('servicio_id, tipo_evento, descripcion, created_at')
        .in('servicio_id', serviceIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Deduplicate: keep only latest per service
      const map = new Map<string, any>();
      for (const e of (data || [])) {
        if (!map.has(e.servicio_id)) map.set(e.servicio_id, e);
      }
      return map;
    },
  });

  // 4. Fetch open incidents linked to these services
  const incidentsQuery = useQuery({
    queryKey: ['shift-handoff-incidents', serviceIds],
    enabled: serviceIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('incidentes_operativos')
        .select('id, tipo, severidad, descripcion, estado, servicio_planificado_id')
        .in('servicio_planificado_id', serviceIds)
        .in('estado', ['abierto', 'en_investigacion']);
      if (error) throw error;
      return (data || []) as (IncidenteResumen & { servicio_planificado_id: string })[];
    },
  });

  // Build enriched service contexts
  const serviciosContext: ServiceContext[] = (assignmentsQuery.data || []).map((a: any) => {
    const svc = (servicesQuery.data || []).find((s: any) => s.id_servicio === a.servicio_id);
    const lastEvent = eventsQuery.data?.get(a.servicio_id);
    const incidents = (incidentsQuery.data || []).filter(
      i => i.servicio_planificado_id === a.servicio_id,
    );

    const minutosInactivo = lastEvent
      ? Math.round((Date.now() - new Date(lastEvent.created_at).getTime()) / 60_000)
      : 999;

    return {
      servicio_id: a.servicio_id,
      assignment_id: a.id,
      cliente: svc?.cliente_nombre || a.servicio_id.slice(0, 12),
      fase: svc?.estado_planeacion || 'desconocido',
      ultimo_evento: lastEvent?.tipo_evento,
      ultimo_evento_time: lastEvent?.created_at,
      minutos_inactivo: minutosInactivo,
      tiene_incidente: incidents.length > 0,
      incidentes: incidents.map(i => ({
        id: i.id,
        tipo: i.tipo,
        severidad: i.severidad,
        descripcion: i.descripcion,
        estado: i.estado,
      })),
      notas_servicio: '',
      inferred: a.id?.startsWith('inferred-') || false,
    };
  });

  const totalIncidentes = serviciosContext.reduce((sum, s) => sum + s.incidentes.length, 0);

  // Execute handoff mutation
  const executeHandoff = useMutation({
    mutationFn: async (payload: HandoffPayload) => {
      const nowTs = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      const sixHoursAgo = new Date(Date.now() - 6 * 3600_000).toISOString();

      let closedCount = 0;
      let transferredCount = 0;
      const serviciosTransferidos: any[] = [];
      const serviciosCerrados: any[] = [];

      for (const svc of payload.servicios) {
        const targetMonitoristaId = payload.distribucion[svc.servicio_id];
        if (!targetMonitoristaId) continue;

        // Check for inactivity > 6h → auto-close
        const { data: recentEvents } = await (supabase as any)
          .from('servicio_eventos_ruta')
          .select('id')
          .eq('servicio_id', svc.servicio_id)
          .gte('hora_inicio', sixHoursAgo)
          .limit(1);

        if (!recentEvents || recentEvents.length === 0) {
          // Auto-close inactive service
          await (supabase as any)
            .from('servicios_planificados')
            .update({ hora_fin_real: nowTs, estado_planeacion: 'completado' })
            .eq('id_servicio', svc.servicio_id)
            .is('hora_fin_real', null);

          await (supabase as any)
            .from('servicio_eventos_ruta')
            .insert({
              servicio_id: svc.servicio_id,
              tipo_evento: 'fin_servicio',
              descripcion: 'Cerrado automáticamente en cambio de turno (>6h sin actividad)',
              registrado_por: user?.id || null,
              hora_inicio: nowTs,
              hora_fin: nowTs,
            });

          if (!svc.inferred) {
            await (supabase as any)
              .from('bitacora_asignaciones_monitorista')
              .update({ activo: false, fin_turno: nowTs, notas_handoff: svc.notas_servicio || payload.notasGenerales })
              .eq('id', svc.assignment_id);
          }

          serviciosCerrados.push({
            servicio_id: svc.servicio_id,
            cliente: svc.cliente,
            razon: 'inactividad_6h',
          });
          closedCount++;
        } else {
          // Transfer: close old assignment, create new one
          if (!svc.inferred) {
            await (supabase as any)
              .from('bitacora_asignaciones_monitorista')
              .update({ activo: false, fin_turno: nowTs, notas_handoff: svc.notas_servicio || payload.notasGenerales })
              .eq('id', svc.assignment_id);
          }

          const { error } = await (supabase as any)
            .from('bitacora_asignaciones_monitorista')
            .insert({
              servicio_id: svc.servicio_id,
              monitorista_id: targetMonitoristaId,
              asignado_por: user?.id || null,
              turno: payload.turnoEntrante,
              notas_handoff: svc.notas_servicio || payload.notasGenerales,
            });
          if (error) throw error;

          const targetName = payload.entrantes.find(e => e.id === targetMonitoristaId)?.display_name || '';
          serviciosTransferidos.push({
            servicio_id: svc.servicio_id,
            cliente: svc.cliente,
            fase: svc.fase,
            notas_servicio: svc.notas_servicio,
            asignado_a: targetName,
            incidentes: svc.incidentes.length,
          });
          transferredCount++;
        }
      }

      // Create acta de entrega
      const allIncidents = payload.servicios
        .flatMap(s => s.incidentes)
        .map(i => ({ incidente_id: i.id, tipo: i.tipo, severidad: i.severidad }));

      await (supabase as any)
        .from('bitacora_entregas_turno')
        .insert({
          turno_saliente: getCurrentTurno(),
          turno_entrante: payload.turnoEntrante,
          ejecutado_por: user?.id || null,
          monitoristas_salientes: payload.salientes.map(m => ({ id: m.id, display_name: m.display_name })),
          monitoristas_entrantes: payload.entrantes.map(m => ({ id: m.id, display_name: m.display_name })),
          servicios_transferidos: serviciosTransferidos,
          servicios_cerrados: serviciosCerrados,
          incidentes_abiertos: allIncidents,
          notas_generales: payload.notasGenerales,
          firma_data_url: payload.firmaDataUrl || null,
        });

      return { closedCount, transferredCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['monitorista-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-board-active'] });
      const parts: string[] = ['✅ Turno entregado'];
      if (result.transferredCount > 0) parts.push(`${result.transferredCount} transferidos`);
      if (result.closedCount > 0) parts.push(`${result.closedCount} cerrados por inactividad`);
      toast.success(parts.join(' · '));
    },
    onError: () => toast.error('Error en cambio de turno'),
  });

  return {
    serviciosContext,
    totalIncidentes,
    isLoading: assignmentsQuery.isLoading || servicesQuery.isLoading,
    executeHandoff,
  };
}

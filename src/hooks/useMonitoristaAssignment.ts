import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MonitoristaAssignment {
  id: string;
  servicio_id: string;
  monitorista_id: string;
  asignado_por: string | null;
  turno: string;
  activo: boolean;
  inicio_turno: string;
  fin_turno: string | null;
  notas_handoff: string | null;
  created_at: string;
  /** Whether this assignment was inferred from event activity (not formal) */
  inferred?: boolean;
}

export interface MonitoristaProfile {
  id: string;
  display_name: string;
  role: string;
  /** Derived: has real activity in recent hours OR formal assignment */
  en_turno: boolean;
  /** Timestamp of last registered event (ISO string) */
  last_activity?: string;
  /** Count of events registered today */
  event_count?: number;
}

/** Derive current turno from hour of day */
export function getCurrentTurno(): 'matutino' | 'vespertino' | 'nocturno' {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return 'matutino';
  if (h >= 14 && h < 22) return 'vespertino';
  return 'nocturno';
}

export function getTurnoLabel(turno: string): string {
  const map: Record<string, string> = {
    matutino: 'Matutino',
    vespertino: 'Vespertino',
    nocturno: 'Nocturno',
  };
  return map[turno] || turno;
}

interface RecentActivity {
  registrado_por: string;
  servicio_id: string;
  created_at: string;
}

export function useMonitoristaAssignment() {
  const queryClient = useQueryClient();
  const queryKey = ['monitorista-assignments'];

  // Get current user's active assignments
  const myAssignments = useQuery({
    queryKey: [...queryKey, 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('*')
        .eq('monitorista_id', user.id)
        .eq('activo', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MonitoristaAssignment[];
    },
    refetchInterval: 30_000,
  });

  // All active formal assignments (coordinator view)
  const allAssignments = useQuery({
    queryKey: [...queryKey, 'all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MonitoristaAssignment[];
    },
    refetchInterval: 30_000,
  });

  // Fetch users with monitoring roles + profiles
  const monitoristasQuery = useQuery({
    queryKey: [...queryKey, 'monitoristas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['monitoring', 'monitoring_supervisor'])
        .eq('is_active', true);
      if (error) throw error;
      if (!data || data.length === 0) return [] as MonitoristaProfile[];

      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);
      if (pErr) throw pErr;

      const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name]));
      const byUser = new Map<string, MonitoristaProfile>();
      for (const r of data) {
        const existing = byUser.get(r.user_id);
        if (!existing || r.role === 'monitoring_supervisor') {
          byUser.set(r.user_id, {
            id: r.user_id,
            display_name: profileMap.get(r.user_id) || r.user_id.slice(0, 8),
            role: r.role,
            en_turno: false, // Will be computed from heartbeat
          });
        }
      }
      return Array.from(byUser.values());
    },
    refetchInterval: 60_000,
  });

  // NEW: Heartbeat-based presence detection (replaces heuristic)
  const heartbeatQuery = useQuery({
    queryKey: [...queryKey, 'heartbeat'],
    queryFn: async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      const { data, error } = await (supabase as any)
        .from('monitorista_heartbeat')
        .select('user_id, last_ping')
        .gte('last_ping', fiveMinAgo);
      if (error) throw error;
      return new Set((data || []).map((r: any) => r.user_id as string));
    },
    refetchInterval: 30_000,
  });

  const onlineUserIds = heartbeatQuery.data || new Set<string>();

  // Fetch recent activity for inferred assignments (still needed for service mapping)
  const recentActivityQuery = useQuery({
    queryKey: [...queryKey, 'recent-activity'],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['monitoring', 'monitoring_supervisor'])
        .eq('is_active', true);
      if (rolesErr) throw rolesErr;
      const mIds = [...new Set((roles || []).map(r => r.user_id))];
      if (mIds.length === 0) return [] as RecentActivity[];

      const twoHoursAgo = new Date(Date.now() - 2 * 3600_000).toISOString();
      const { data, error } = await (supabase as any)
        .from('servicio_eventos_ruta')
        .select('registrado_por, servicio_id, created_at')
        .in('registrado_por', mIds)
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as RecentActivity[];
    },
    refetchInterval: 30_000,
  });

  // Compute activity stats from real event data
  const activityByMonitorista = new Map<string, { lastActivity: string; eventCount: number; serviceIds: Set<string> }>();
  for (const evt of (recentActivityQuery.data || [])) {
    const existing = activityByMonitorista.get(evt.registrado_por);
    if (!existing) {
      activityByMonitorista.set(evt.registrado_por, {
        lastActivity: evt.created_at,
        eventCount: 1,
        serviceIds: new Set([evt.servicio_id]),
      });
    } else {
      existing.eventCount++;
      existing.serviceIds.add(evt.servicio_id);
      if (evt.created_at > existing.lastActivity) {
        existing.lastActivity = evt.created_at;
      }
    }
  }

  // Formal assignment IDs for fallback
  const formallyAssignedUserIds = new Set(
    (allAssignments.data || []).filter(a => a.activo).map(a => a.monitorista_id)
  );

  // Triple fallback for en_turno detection
  const monitoristasIds = new Set((monitoristasQuery.data || []).map(m => m.id));
  const monitoristasOnline = new Set(
    [...onlineUserIds].filter((id: string) => monitoristasIds.has(id))
  );

  const monitoristas: MonitoristaProfile[] = (monitoristasQuery.data || []).map(m => {
    const activity = activityByMonitorista.get(m.id);
    let enTurno: boolean;

    if (monitoristasOnline.size > 0) {
      // Primary: heartbeat from actual monitoristas
      enTurno = monitoristasOnline.has(m.id);
    } else if (activityByMonitorista.size > 0) {
      // Fallback 1: recent event activity (last 10 min)
      const TEN_MIN = 10 * 60_000;
      enTurno = !!activity?.lastActivity &&
        (Date.now() - new Date(activity.lastActivity).getTime()) < TEN_MIN;
    } else {
      // Fallback 2: formal assignments
      enTurno = formallyAssignedUserIds.has(m.id);
    }

    return {
      ...m,
      en_turno: enTurno,
      last_activity: activity?.lastActivity,
      event_count: activity?.eventCount || 0,
    };
  });

  // Build inferred assignments from activity (service -> monitorista who last registered event)
  const inferredServiceMonitorista = new Map<string, string>();
  for (const evt of (recentActivityQuery.data || [])) {
    if (!inferredServiceMonitorista.has(evt.servicio_id)) {
      inferredServiceMonitorista.set(evt.servicio_id, evt.registrado_por);
    }
  }

  // Build combined assignments: formal + inferred
  const formalAssignedServiceIds = new Set((allAssignments.data || []).map(a => a.servicio_id));

  const inferredAssignments: MonitoristaAssignment[] = [];
  for (const [servicioId, monitoristaId] of inferredServiceMonitorista.entries()) {
    if (!formalAssignedServiceIds.has(servicioId)) {
      inferredAssignments.push({
        id: `inferred-${servicioId}`,
        servicio_id: servicioId,
        monitorista_id: monitoristaId,
        asignado_por: null,
        turno: getCurrentTurno(),
        activo: true,
        inicio_turno: new Date().toISOString(),
        fin_turno: null,
        notas_handoff: null,
        created_at: new Date().toISOString(),
        inferred: true,
      });
    }
  }

  const combinedAssignments = [...(allAssignments.data || []), ...inferredAssignments];

  // Compute assigned service IDs (formal + inferred)
  const assignedServiceIds = new Set(combinedAssignments.map(a => a.servicio_id));

  // Group assignments by monitorista (formal + inferred)
  const assignmentsByMonitorista = combinedAssignments.reduce<Record<string, MonitoristaAssignment[]>>(
    (acc, a) => {
      if (!acc[a.monitorista_id]) acc[a.monitorista_id] = [];
      acc[a.monitorista_id].push(a);
      return acc;
    },
    {}
  );

  // Map servicio_id -> monitorista for badge display
  const monitoristaByService = new Map<string, MonitoristaProfile>();
  for (const a of combinedAssignments) {
    const m = monitoristas.find(m => m.id === a.monitorista_id);
    if (m) monitoristaByService.set(a.servicio_id, m);
  }

  const assignService = useMutation({
    mutationFn: async (params: { servicioId: string; monitoristaId: string; turno?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const nowTs = new Date().toISOString();
      // Dedup: deactivate any existing active assignments for this service
      await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: nowTs })
        .eq('servicio_id', params.servicioId)
        .eq('activo', true);

      const { error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .insert({
          servicio_id: params.servicioId,
          monitorista_id: params.monitoristaId,
          asignado_por: user?.id || null,
          turno: params.turno || getCurrentTurno(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Servicio asignado');
    },
    onError: () => toast.error('Error al asignar servicio'),
  });

  // Auto-distribute: assign all unassigned services equitably
  const autoDistribute = useMutation({
    mutationFn: async (params: { unassignedServiceIds: string[]; monitoristaIds: string[] }) => {
      if (params.monitoristaIds.length === 0) throw new Error('No hay monitoristas en turno');
      if (params.unassignedServiceIds.length === 0) throw new Error('No hay servicios sin asignar');

      const { data: { user } } = await supabase.auth.getUser();
      const turno = getCurrentTurno();
      const nowTs = new Date().toISOString();

      // Dedup: deactivate existing active assignments for these services
      await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: nowTs })
        .in('servicio_id', params.unassignedServiceIds)
        .eq('activo', true);

      // Build load map from combined assignments
      const load: Record<string, number> = {};
      for (const mId of params.monitoristaIds) {
        load[mId] = (assignmentsByMonitorista[mId] || []).length;
      }

      const inserts: any[] = [];
      for (const sId of params.unassignedServiceIds) {
        const target = params.monitoristaIds.reduce((a, b) => (load[a] <= load[b] ? a : b));
        inserts.push({
          servicio_id: sId,
          monitorista_id: target,
          asignado_por: user?.id || null,
          turno,
        });
        load[target]++;
      }

      const { error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .insert(inserts);
      if (error) throw error;

      return inserts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${count} servicios distribuidos equitativamente`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al distribuir'),
  });

  // Reset & Redistribute: deactivate ALL assignments, then distribute ALL active services randomly
  const resetAndRedistribute = useMutation({
    mutationFn: async (params: { serviceIds: string[]; monitoristaIds: string[] }) => {
      if (params.monitoristaIds.length === 0) throw new Error('No hay monitoristas en turno');
      if (params.serviceIds.length === 0) throw new Error('No hay servicios activos');

      const { data: { user } } = await supabase.auth.getUser();
      const turno = getCurrentTurno();
      const nowTs = new Date().toISOString();

      // Step 1: Deactivate ALL active assignments
      await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: nowTs })
        .eq('activo', true);

      // Step 2: Shuffle services randomly
      const shuffled = [...params.serviceIds].sort(() => Math.random() - 0.5);

      // Step 3: Round-robin distribute
      const inserts: any[] = [];
      for (let i = 0; i < shuffled.length; i++) {
        inserts.push({
          servicio_id: shuffled[i],
          monitorista_id: params.monitoristaIds[i % params.monitoristaIds.length],
          asignado_por: user?.id || null,
          turno,
        });
      }

      const { error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .insert(inserts);
      if (error) throw error;

      // Log anomaly
      await (supabase as any).from('bitacora_anomalias_turno').insert({
        tipo: 'reset_redistribucion',
        descripcion: `Reset completo: ${inserts.length} servicios redistribuidos entre ${params.monitoristaIds.length} monitoristas`,
        ejecutado_por: user?.id || null,
        metadata: { total_services: inserts.length, total_staff: params.monitoristaIds.length },
      });

      return { total: inserts.length, perPerson: Math.round(inserts.length / params.monitoristaIds.length) };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`🔄 Reset completo: ${result.total} servicios redistribuidos (~${result.perPerson} c/u)`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al resetear distribución'),
  });

  const reassignService = useMutation({
    mutationFn: async (params: { assignmentId: string; newMonitoristaId: string; servicioId: string; turno: string }) => {
      const nowTs = new Date().toISOString();
      await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: nowTs })
        .eq('id', params.assignmentId);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .insert({
          servicio_id: params.servicioId,
          monitorista_id: params.newMonitoristaId,
          asignado_por: user?.id || null,
          turno: params.turno,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Servicio reasignado');
    },
    onError: () => toast.error('Error al reasignar servicio'),
  });

  const handoffTurno = useMutation({
    mutationFn: async (params: { fromMonitoristaId: string; toMonitoristaId: string; notas: string; turno: string }) => {
      const nowTs = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: activeAssignments, error: fetchErr } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('*')
        .eq('monitorista_id', params.fromMonitoristaId)
        .eq('activo', true);
      if (fetchErr) throw fetchErr;

      const sixHoursAgo = new Date(Date.now() - 6 * 3600_000).toISOString();
      let closedCount = 0;
      const assignmentsToTransfer: any[] = [];

      for (const a of (activeAssignments || [])) {
        const { data: recentEvents } = await (supabase as any)
          .from('servicio_eventos_ruta')
          .select('id')
          .eq('servicio_id', a.servicio_id)
          .gte('hora_inicio', sixHoursAgo)
          .limit(1);

        if (!recentEvents || recentEvents.length === 0) {
          await (supabase as any)
            .from('servicios_planificados')
            .update({ hora_fin_real: nowTs, estado_planeacion: 'completado' })
            .eq('id_servicio', a.servicio_id)
            .is('hora_fin_real', null);

          await (supabase as any)
            .from('servicio_eventos_ruta')
            .insert({
              servicio_id: a.servicio_id,
              tipo_evento: 'fin_servicio',
              descripcion: 'Cerrado automáticamente en cambio de turno (>6h sin actividad)',
              registrado_por: user?.id || null,
              hora_inicio: nowTs,
              hora_fin: nowTs,
            });

          await (supabase as any)
            .from('bitacora_asignaciones_monitorista')
            .update({ activo: false, fin_turno: nowTs, notas_handoff: params.notas })
            .eq('id', a.id);

          closedCount++;
        } else {
          assignmentsToTransfer.push(a);
        }
      }

      for (const a of assignmentsToTransfer) {
        await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .update({ activo: false, fin_turno: nowTs, notas_handoff: params.notas })
          .eq('id', a.id);

        const { error } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert({
            servicio_id: a.servicio_id,
            monitorista_id: params.toMonitoristaId,
            asignado_por: user?.id || null,
            turno: params.turno,
            notas_handoff: params.notas,
          });
        if (error) throw error;
      }

      return { closedCount, transferredCount: assignmentsToTransfer.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['bitacora-board-active'] });
      const parts: string[] = ['Turno entregado'];
      if (result.transferredCount > 0) parts.push(`${result.transferredCount} transferidos`);
      if (result.closedCount > 0) parts.push(`${result.closedCount} cerrados por inactividad`);
      toast.success(parts.join(' · '));
    },
    onError: () => toast.error('Error en cambio de turno'),
  });

  // ── BalanceGuard: batch rebalance across monitoristas ──
  const rebalanceLoad = useMutation({
    mutationFn: async (params: { reassignments: { fromAssignmentId: string; toMonitoristaId: string; servicioId: string }[] }) => {
      const nowTs = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      const turnoActual = getCurrentTurno();

      for (const r of params.reassignments) {
        // Deactivate old assignment
        await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .update({ activo: false, fin_turno: nowTs })
          .eq('id', r.fromAssignmentId);

        // Create new assignment
        const { error } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert({
            servicio_id: r.servicioId,
            monitorista_id: r.toMonitoristaId,
            asignado_por: user?.id || null,
            turno: turnoActual,
          });
        if (error) throw error;
      }

      // Log anomaly
      await (supabase as any).from('bitacora_anomalias_turno').insert({
        tipo: 'rebalanceo_por_incorporacion',
        descripcion: `Rebalanceo automático: ${params.reassignments.length} servicios redistribuidos`,
        ejecutado_por: user?.id || null,
        metadata: {
          reassignments: params.reassignments.map(r => ({
            servicio_id: r.servicioId,
            to: r.toMonitoristaId,
          })),
        },
      });

      return params.reassignments.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey });
      toast.info(`⚖️ Carga rebalanceada: ${count} servicios redistribuidos`);
    },
    onError: () => toast.error('Error al rebalancear carga'),
  });

  const endTurno = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: new Date().toISOString() })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    myAssignments: myAssignments.data || [],
    allAssignments: combinedAssignments,
    monitoristas,
    assignedServiceIds,
    assignmentsByMonitorista,
    monitoristaByService,
    isLoading: myAssignments.isLoading,
    assignService,
    autoDistribute,
    reassignService,
    rebalanceLoad,
    handoffTurno,
    endTurno,
  };
}

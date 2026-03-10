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
}

export interface MonitoristaProfile {
  id: string;
  display_name: string;
  role: string;
  /** Derived: has heartbeat OR formal assignment */
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
    let enTurno: boolean;

    if (monitoristasOnline.size > 0) {
      // Primary: heartbeat
      enTurno = monitoristasOnline.has(m.id);
    } else {
      // Fallback: formal assignments
      enTurno = formallyAssignedUserIds.has(m.id);
    }

    return {
      ...m,
      en_turno: enTurno,
    };
  });

  const formalAssignments = allAssignments.data || [];

  // Compute assigned service IDs (formal only)
  const assignedServiceIds = new Set(formalAssignments.map(a => a.servicio_id));

  // Group assignments by monitorista (formal only)
  const assignmentsByMonitorista = formalAssignments.reduce<Record<string, MonitoristaAssignment[]>>(
    (acc, a) => {
      if (!acc[a.monitorista_id]) acc[a.monitorista_id] = [];
      acc[a.monitorista_id].push(a);
      return acc;
    },
    {}
  );

  // Map servicio_id -> monitorista for badge display
  const monitoristaByService = new Map<string, MonitoristaProfile>();
  for (const a of formalAssignments) {
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
      // Unique constraint violation = another process already assigned → safe to ignore
      if (error && error.code === '23505') {
        console.log('[assignService] Duplicate caught by DB constraint, skipping');
        return;
      }
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Servicio asignado');
    },
    onError: () => toast.error('Error al asignar servicio'),
  });

  /**
   * Client-affinity distribution algorithm.
   * Priority 1: balanced workload. Priority 2: group same-client services together.
   */
  async function distributeWithAffinity(
    serviceIds: string[],
    monitoristaIds: string[],
    initialLoad: Record<string, number>,
    userId: string | null,
    turno: string,
  ) {
    // 1. Fetch client names for each service
    const { data: svcData } = await (supabase as any)
      .from('servicios_planificados')
      .select('id_servicio, nombre_cliente')
      .in('id_servicio', serviceIds);

    const clientByService = new Map<string, string>();
    for (const s of (svcData || [])) {
      clientByService.set(s.id_servicio, s.nombre_cliente || '__sin_cliente__');
    }

    // 2. Group services by client
    const clientGroups = new Map<string, string[]>();
    for (const sId of serviceIds) {
      const client = clientByService.get(sId) || '__sin_cliente__';
      if (!clientGroups.has(client)) clientGroups.set(client, []);
      clientGroups.get(client)!.push(sId);
    }

    // 3. Sort groups largest-first for better packing
    const sortedGroups = [...clientGroups.entries()].sort((a, b) => b[1].length - a[1].length);

    // 4. Max per agent = ceil(total / agents)
    const totalServices = serviceIds.length;
    const maxPerAgent = Math.ceil(totalServices / monitoristaIds.length);

    const load = { ...initialLoad };
    const inserts: any[] = [];

    const getLeastLoaded = () =>
      monitoristaIds.reduce((a, b) => (load[a] <= load[b] ? a : b));

    for (const [, groupServiceIds] of sortedGroups) {
      const target = getLeastLoaded();

      // How many can fit on this agent without exceeding max?
      const available = Math.max(0, maxPerAgent - load[target]);
      const fitCount = Math.min(groupServiceIds.length, available || 1); // at least 1

      // Assign the fitting portion to the primary target
      for (let i = 0; i < fitCount; i++) {
        inserts.push({
          servicio_id: groupServiceIds[i],
          monitorista_id: target,
          asignado_por: userId,
          turno,
        });
        load[target]++;
      }

      // Overflow: distribute remaining to next least-loaded agents
      for (let i = fitCount; i < groupServiceIds.length; i++) {
        const overflow = getLeastLoaded();
        inserts.push({
          servicio_id: groupServiceIds[i],
          monitorista_id: overflow,
          asignado_por: userId,
          turno,
        });
        load[overflow]++;
      }
    }

    return inserts;
  }

  // Auto-distribute: assign all unassigned services equitably with client affinity
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

      // Build current load from combined assignments
      const load: Record<string, number> = {};
      for (const mId of params.monitoristaIds) {
        load[mId] = (assignmentsByMonitorista[mId] || []).length;
      }

      const inserts = await distributeWithAffinity(
        params.unassignedServiceIds,
        params.monitoristaIds,
        load,
        user?.id || null,
        turno,
      );

      // Insert one by one to handle unique constraint violations gracefully
      let inserted = 0;
      for (const row of inserts) {
        const { error } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert(row);
        if (error && error.code === '23505') {
          console.log(`[autoDistribute] Duplicate for ${row.servicio_id}, skipping`);
          continue;
        }
        if (error) throw error;
        inserted++;
      }

      return inserted;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${count} servicios distribuidos (balanceo + afinidad por cliente)`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al distribuir'),
  });

  // Reset & Redistribute: deactivate ALL assignments, then distribute ALL with client affinity
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

      // Step 2: Distribute with affinity (starting from zero load)
      const load: Record<string, number> = {};
      for (const mId of params.monitoristaIds) load[mId] = 0;

      const inserts = await distributeWithAffinity(
        params.serviceIds,
        params.monitoristaIds,
        load,
        user?.id || null,
        turno,
      );

      // Insert one by one to handle unique constraint violations gracefully
      let insertedCount = 0;
      for (const row of inserts) {
        const { error } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert(row);
        if (error && error.code === '23505') {
          console.log(`[resetAndRedistribute] Duplicate for ${row.servicio_id}, skipping`);
          continue;
        }
        if (error) throw error;
        insertedCount++;
      }

      // Log anomaly
      await (supabase as any).from('bitacora_anomalias_turno').insert({
        tipo: 'reset_redistribucion',
        descripcion: `Reset completo: ${inserts.length} servicios redistribuidos con afinidad por cliente entre ${params.monitoristaIds.length} monitoristas`,
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
    allAssignments: formalAssignments,
    monitoristas,
    assignedServiceIds,
    assignmentsByMonitorista,
    monitoristaByService,
    isLoading: myAssignments.isLoading,
    assignService,
    autoDistribute,
    reassignService,
    rebalanceLoad,
    resetAndRedistribute,
    handoffTurno,
    endTurno,
  };
}

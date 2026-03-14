import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendCompletionNotifications } from '@/lib/lifecycleAutomations';

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

/** RLS write-verification helper */
function assertRowsAffected(data: any[] | null, operation: string) {
  if (!data || data.length === 0) {
    throw new Error(`Operación "${operation}" bloqueada — los datos no se persistieron. Contacte al administrador.`);
  }
}

/** Insert anomaly with soft warning (never blocks main flow) */
async function insertAnomaly(payload: Record<string, any>, context: string) {
  try {
    const { data, error } = await (supabase as any)
      .from('bitacora_anomalias_turno')
      .insert(payload)
      .select('id');
    if (error || !data || data.length === 0) {
      console.warn(`[${context}] Anomalía no se persistió:`, error?.message);
      toast.warning('Registro de anomalía no se guardó — revise bitácora manualmente.');
    }
  } catch (e) {
    console.warn(`[${context}] Error insertando anomalía:`, e);
    toast.warning('Registro de anomalía falló — revise bitácora manualmente.');
  }
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
            en_turno: false,
          });
        }
      }
      return Array.from(byUser.values());
    },
    refetchInterval: 60_000,
  });

  // Heartbeat-based presence detection
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

  const formallyAssignedUserIds = new Set(
    (allAssignments.data || []).filter(a => a.activo).map(a => a.monitorista_id)
  );

  const monitoristasIds = new Set((monitoristasQuery.data || []).map(m => m.id));
  const monitoristasOnline = new Set(
    [...onlineUserIds].filter((id: string) => monitoristasIds.has(id))
  );

  const monitoristas: MonitoristaProfile[] = (monitoristasQuery.data || []).map(m => {
    let enTurno: boolean;
    if (monitoristasOnline.size > 0) {
      enTurno = monitoristasOnline.has(m.id);
    } else {
      enTurno = formallyAssignedUserIds.has(m.id);
    }
    return { ...m, en_turno: enTurno };
  });

  const formalAssignments = allAssignments.data || [];
  const assignedServiceIds = new Set(formalAssignments.map(a => a.servicio_id));

  const assignmentsByMonitorista = formalAssignments.reduce<Record<string, MonitoristaAssignment[]>>(
    (acc, a) => {
      if (!acc[a.monitorista_id]) acc[a.monitorista_id] = [];
      acc[a.monitorista_id].push(a);
      return acc;
    },
    {}
  );

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
      const { data: deactivated } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: nowTs })
        .eq('servicio_id', params.servicioId)
        .eq('activo', true)
        .select('id');
      if (deactivated?.length) console.log(`[assignService] Deactivated ${deactivated.length} prior assignment(s)`);

      const { data, error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .insert({
          servicio_id: params.servicioId,
          monitorista_id: params.monitoristaId,
          asignado_por: user?.id || null,
          turno: params.turno || getCurrentTurno(),
        })
        .select('id');
      if (error && error.code === '23505') {
        console.log('[assignService] Duplicate caught by DB constraint, skipping');
        return;
      }
      if (error) throw error;
      assertRowsAffected(data, 'assignService');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Servicio asignado');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al asignar servicio'),
  });

  /**
   * Client-affinity distribution algorithm.
   */
  async function distributeWithAffinity(
    serviceIds: string[],
    monitoristaIds: string[],
    initialLoad: Record<string, number>,
    userId: string | null,
    turno: string,
  ) {
    const { data: svcData } = await (supabase as any)
      .from('servicios_planificados')
      .select('id_servicio, nombre_cliente')
      .in('id_servicio', serviceIds);

    const clientByService = new Map<string, string>();
    for (const s of (svcData || [])) {
      clientByService.set(s.id_servicio, s.nombre_cliente || '__sin_cliente__');
    }

    const clientGroups = new Map<string, string[]>();
    for (const sId of serviceIds) {
      const client = clientByService.get(sId) || '__sin_cliente__';
      if (!clientGroups.has(client)) clientGroups.set(client, []);
      clientGroups.get(client)!.push(sId);
    }

    const sortedGroups = [...clientGroups.entries()].sort((a, b) => b[1].length - a[1].length);

    const totalServices = serviceIds.length;
    const maxPerAgent = Math.ceil(totalServices / monitoristaIds.length);

    const load = { ...initialLoad };
    const inserts: any[] = [];

    const getLeastLoaded = () =>
      monitoristaIds.reduce((a, b) => (load[a] <= load[b] ? a : b));

    for (const [, groupServiceIds] of sortedGroups) {
      const target = getLeastLoaded();
      const available = Math.max(0, maxPerAgent - load[target]);
      const fitCount = Math.min(groupServiceIds.length, available || 1);

      for (let i = 0; i < fitCount; i++) {
        inserts.push({
          servicio_id: groupServiceIds[i],
          monitorista_id: target,
          asignado_por: userId,
          turno,
        });
        load[target]++;
      }

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
    mutationFn: async (params: { unassignedServiceIds: string[]; monitoristaIds: string[]; activeBoardServiceIds?: Set<string> }) => {
      if (params.monitoristaIds.length === 0) throw new Error('No hay monitoristas en turno');
      if (params.unassignedServiceIds.length === 0) throw new Error('No hay servicios sin asignar');

      const { data: { user } } = await supabase.auth.getUser();
      const turno = getCurrentTurno();
      const nowTs = new Date().toISOString();

      // Dedup: deactivate existing active assignments for these services
      const { data: deactivated } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: nowTs })
        .in('servicio_id', params.unassignedServiceIds)
        .eq('activo', true)
        .select('id');
      if (deactivated?.length) console.log(`[autoDistribute] Deactivated ${deactivated.length} prior assignment(s)`);

      const activeBoardIds = params.activeBoardServiceIds;
      const load: Record<string, number> = {};
      for (const mId of params.monitoristaIds) {
        const assignments = assignmentsByMonitorista[mId] || [];
        load[mId] = activeBoardIds
          ? assignments.filter(a => activeBoardIds.has(a.servicio_id)).length
          : assignments.length;
      }

      const inserts = await distributeWithAffinity(
        params.unassignedServiceIds,
        params.monitoristaIds,
        load,
        user?.id || null,
        turno,
      );

      let inserted = 0;
      for (const row of inserts) {
        const { data, error } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert(row)
          .select('id');
        if (error && error.code === '23505') {
          console.log(`[autoDistribute] Duplicate for ${row.servicio_id}, skipping`);
          continue;
        }
        if (error) throw error;
        assertRowsAffected(data, `autoDistribute(${row.servicio_id})`);
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

  // Reset & Redistribute
  const resetAndRedistribute = useMutation({
    mutationFn: async (params: { serviceIds: string[]; monitoristaIds: string[] }) => {
      if (params.monitoristaIds.length === 0) throw new Error('No hay monitoristas en turno');
      if (params.serviceIds.length === 0) throw new Error('No hay servicios activos');

      const { data: { user } } = await supabase.auth.getUser();
      const turno = getCurrentTurno();
      const nowTs = new Date().toISOString();

      // Step 1: Deactivate ALL active assignments
      const { data: deactivated } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: nowTs })
        .eq('activo', true)
        .select('id');
      console.log(`[resetAndRedistribute] Deactivated ${deactivated?.length || 0} assignments`);

      // Step 2: Distribute with affinity
      const load: Record<string, number> = {};
      for (const mId of params.monitoristaIds) load[mId] = 0;

      const inserts = await distributeWithAffinity(
        params.serviceIds,
        params.monitoristaIds,
        load,
        user?.id || null,
        turno,
      );

      let insertedCount = 0;
      for (const row of inserts) {
        const { data, error } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert(row)
          .select('id');
        if (error && error.code === '23505') {
          console.log(`[resetAndRedistribute] Duplicate for ${row.servicio_id}, skipping`);
          continue;
        }
        if (error) throw error;
        assertRowsAffected(data, `resetAndRedistribute(${row.servicio_id})`);
        insertedCount++;
      }

      // Log anomaly with verification
      await insertAnomaly({
        tipo: 'reset_redistribucion',
        descripcion: `Reset completo: ${inserts.length} servicios redistribuidos con afinidad por cliente entre ${params.monitoristaIds.length} monitoristas`,
        ejecutado_por: user?.id || null,
        metadata: { total_services: inserts.length, total_staff: params.monitoristaIds.length },
      }, 'resetAndRedistribute');

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
      // Deactivate ALL active assignments for this service
      const { data: deactivated } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: nowTs })
        .eq('servicio_id', params.servicioId)
        .eq('activo', true)
        .select('id');
      if (deactivated?.length) console.log(`[reassignService] Deactivated ${deactivated.length} prior assignment(s)`);

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .insert({
          servicio_id: params.servicioId,
          monitorista_id: params.newMonitoristaId,
          asignado_por: user?.id || null,
          turno: params.turno,
        })
        .select('id');
      if (error && error.code === '23505') {
        console.log(`[reassignService] Duplicate for ${params.servicioId}, skipping`);
        return;
      }
      if (error) throw error;
      assertRowsAffected(data, 'reassignService');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Servicio reasignado');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al reasignar servicio'),
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
      const twelveHoursAgo = new Date(Date.now() - 12 * 3600_000).toISOString();
      let closedCount = 0;
      let protectedCount = 0;
      const assignmentsToTransfer: any[] = [];

      for (const a of (activeAssignments || [])) {
        const { data: recentEvents } = await (supabase as any)
          .from('servicio_eventos_ruta')
          .select('id')
          .eq('servicio_id', a.servicio_id)
          .gte('hora_inicio', sixHoursAgo)
          .limit(1);

        const hasRecentActivity = recentEvents && recentEvents.length > 0;

        if (hasRecentActivity) {
          assignmentsToTransfer.push(a);
          continue;
        }

        // Check if service has protected state
        const { data: svcState } = await (supabase as any)
          .from('servicios_planificados')
          .select('en_destino, hora_inicio_real, id')
          .eq('id_servicio', a.servicio_id)
          .is('hora_fin_real', null)
          .limit(1)
          .single();

        // Check for active special events
        const { data: activeSpecialEvents } = await (supabase as any)
          .from('servicio_eventos_ruta')
          .select('id, tipo_evento')
          .eq('servicio_id', a.servicio_id)
          .is('hora_fin', null)
          .in('tipo_evento', ['combustible', 'baño', 'descanso', 'pernocta', 'incidencia', 'trafico'])
          .limit(1);

        const isEnDestino = svcState?.en_destino === true;
        const hasRecentStart = svcState?.hora_inicio_real && svcState.hora_inicio_real > twelveHoursAgo;
        const hasActiveSpecialEvent = activeSpecialEvents && activeSpecialEvents.length > 0;

        if (isEnDestino || hasRecentStart || hasActiveSpecialEvent) {
          console.log(`[Handoff] Servicio ${a.servicio_id} PROTEGIDO de cierre — en_destino=${isEnDestino}, inicio_reciente=${!!hasRecentStart}, evento_activo=${hasActiveSpecialEvent ? activeSpecialEvents[0].tipo_evento : 'none'}`);
          assignmentsToTransfer.push(a);
          protectedCount++;
          continue;
        }

        // Safe to close
        const { data: closeData } = await (supabase as any)
          .from('servicios_planificados')
          .update({ hora_fin_real: nowTs, estado_planeacion: 'completado' })
          .eq('id_servicio', a.servicio_id)
          .is('hora_fin_real', null)
          .select('id, custodio_telefono');

        // Insert fin_servicio event
        await (supabase as any)
          .from('servicio_eventos_ruta')
          .insert({
            servicio_id: a.servicio_id,
            tipo_evento: 'fin_servicio',
            descripcion: 'Cerrado automáticamente en cambio de turno (>6h sin actividad)',
            registrado_por: user?.id || null,
            foto_urls: [],
            hora_inicio: nowTs,
            hora_fin: nowTs,
          });

        // Deactivate assignment with verification
        const { data: deactData } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .update({ activo: false, fin_turno: nowTs, notas_handoff: params.notas })
          .eq('servicio_id', a.servicio_id)
          .eq('activo', true)
          .select('id');
        if (deactData?.length) console.log(`[handoffTurno] Deactivated ${deactData.length} assignment(s) for closed service ${a.servicio_id}`);

        // Log anomaly with verification
        await insertAnomaly({
          tipo: 'cierre_automatico_handoff',
          descripcion: `Servicio ${a.servicio_id} cerrado automáticamente durante handoff (>6h sin actividad)`,
          ejecutado_por: user?.id || null,
          servicio_id: a.servicio_id,
          monitorista_original: params.fromMonitoristaId,
          metadata: { turno_saliente: params.turno, motivo: 'inactividad_6h' },
        }, 'handoffTurno');

        // Completion notifications
        if (closeData && closeData.length > 0) {
          const svcUUID = closeData[0].id;
          const custodioTel = closeData[0].custodio_telefono;
          sendCompletionNotifications(a.servicio_id, svcUUID, custodioTel);
        }

        closedCount++;
      }

      for (const a of assignmentsToTransfer) {
        // Deactivate ALL active for this service with verification
        const { data: deactData } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .update({ activo: false, fin_turno: nowTs, notas_handoff: params.notas })
          .eq('servicio_id', a.servicio_id)
          .eq('activo', true)
          .select('id');
        if (deactData?.length) console.log(`[handoffTurno] Deactivated ${deactData.length} assignment(s) for transfer of ${a.servicio_id}`);

        const { data, error } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert({
            servicio_id: a.servicio_id,
            monitorista_id: params.toMonitoristaId,
            asignado_por: user?.id || null,
            turno: params.turno,
            notas_handoff: params.notas,
          })
          .select('id');
        if (error && error.code === '23505') {
          console.log(`[handoffTurno] Duplicate for ${a.servicio_id}, skipping`);
          continue;
        }
        if (error) throw error;
        assertRowsAffected(data, `handoffTurno.transfer(${a.servicio_id})`);
      }

      return { closedCount, transferredCount: assignmentsToTransfer.length, protectedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['bitacora-board-active'] });
      const parts: string[] = ['Turno entregado'];
      if (result.transferredCount > 0) parts.push(`${result.transferredCount} transferidos`);
      if (result.closedCount > 0) parts.push(`${result.closedCount} cerrados por inactividad`);
      if (result.protectedCount > 0) parts.push(`${result.protectedCount} protegidos de cierre`);
      toast.success(parts.join(' · '));
    },
    onError: (err: Error) => toast.error(err.message || 'Error en cambio de turno'),
  });

  // ── BalanceGuard: batch rebalance across monitoristas ──
  const rebalanceLoad = useMutation({
    mutationFn: async (params: { reassignments: { fromAssignmentId: string; toMonitoristaId: string; servicioId: string }[] }) => {
      const nowTs = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      const turnoActual = getCurrentTurno();

      for (const r of params.reassignments) {
        // Deactivate ALL active for this service with verification
        const { data: deactData } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .update({ activo: false, fin_turno: nowTs })
          .eq('servicio_id', r.servicioId)
          .eq('activo', true)
          .select('id');
        if (deactData?.length) console.log(`[rebalanceLoad] Deactivated ${deactData.length} assignment(s) for ${r.servicioId}`);

        // Create new assignment with verification
        const { data, error } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert({
            servicio_id: r.servicioId,
            monitorista_id: r.toMonitoristaId,
            asignado_por: user?.id || null,
            turno: turnoActual,
          })
          .select('id');
        if (error && error.code === '23505') {
          console.log(`[rebalanceLoad] Duplicate for ${r.servicioId}, skipping`);
          continue;
        }
        if (error) throw error;
        assertRowsAffected(data, `rebalanceLoad(${r.servicioId})`);
      }

      // Log anomaly with verification
      await insertAnomaly({
        tipo: 'rebalanceo_por_incorporacion',
        descripcion: `Rebalanceo automático: ${params.reassignments.length} servicios redistribuidos`,
        ejecutado_por: user?.id || null,
        metadata: {
          reassignments: params.reassignments.map(r => ({
            servicio_id: r.servicioId,
            to: r.toMonitoristaId,
          })),
        },
      }, 'rebalanceLoad');

      return params.reassignments.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey });
      toast.info(`⚖️ Carga rebalanceada: ${count} servicios redistribuidos`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al rebalancear carga'),
  });

  const endTurno = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: new Date().toISOString() })
        .eq('id', assignmentId)
        .select('id');
      if (error) throw error;
      assertRowsAffected(data, 'endTurno');
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

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMonitoristaAssignment, getCurrentTurno } from '@/hooks/useMonitoristaAssignment';
import { useBitacoraBoard } from '@/hooks/useBitacoraBoard';

/**
 * Standalone OrphanGuard + BalanceGuard hook.
 * Mount at page level (coordinators only) so it runs continuously.
 */
export function useOrphanGuard() {
  const {
    monitoristas, assignedServiceIds, assignmentsByMonitorista,
    autoDistribute, reassignService, rebalanceLoad,
  } = useMonitoristaAssignment();

  const { enCursoServices, eventoEspecialServices, pendingServices } = useBitacoraBoard();

  const turno = getCurrentTurno();
  const enTurno = monitoristas.filter(m => m.en_turno);
  const sinTurno = monitoristas.filter(m => !m.en_turno);

  const allActive = [...enCursoServices, ...eventoEspecialServices];
  const activeServiceIds = allActive.map(s => s.id_servicio);
  const pendingServiceIds = pendingServices.map(s => s.id_servicio);

  const serviceHoraCitaMap = Object.fromEntries(
    [...pendingServices, ...allActive].map(s => [s.id_servicio, s.fecha_hora_cita || ''])
  );

  // ── OrphanGuard ──
  const autoAssignedRef = useRef<Set<string>>(new Set());
  const orphanGuardRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (enTurno.length === 0 || autoDistribute.isPending) return;

    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const now = Date.now();

    // Rule 1: Pending services ≤2h from cita
    const eligiblePending = pendingServiceIds.filter(id => {
      if (assignedServiceIds.has(id) || autoAssignedRef.current.has(id)) return false;
      const citaStr = serviceHoraCitaMap[id];
      if (!citaStr) return false;
      const timeUntil = new Date(citaStr).getTime() - now;
      return timeUntil <= TWO_HOURS && timeUntil > -30 * 60 * 1000;
    });

    // Rule 2: Active services without any assignment
    const unassignedActive = activeServiceIds.filter(id =>
      !assignedServiceIds.has(id) && !autoAssignedRef.current.has(id)
    );

    const allEligible = [...new Set([...eligiblePending, ...unassignedActive])];

    if (allEligible.length > 0) {
      console.log(`[OrphanGuard] Auto-assigning ${allEligible.length} services:`, allEligible);
      allEligible.forEach(id => autoAssignedRef.current.add(id));
      autoDistribute.mutate(
        { unassignedServiceIds: allEligible, monitoristaIds: enTurno.map(m => m.id) },
        {
          onSuccess: (count) => toast.info(`${count} servicios auto-asignados`),
          onError: () => allEligible.forEach(id => autoAssignedRef.current.delete(id)),
        }
      );
    }

    // Rule 3: Services assigned to offline monitoristas → reassign
    const offlineWithServices = sinTurno.filter(m => {
      const assignments = (assignmentsByMonitorista[m.id] || []).filter(a => a.activo);
      return assignments.length > 0;
    });

    if (offlineWithServices.length > 0 && enTurno.length > 0) {
      for (const offlineM of offlineWithServices) {
        const assignments = (assignmentsByMonitorista[offlineM.id] || []).filter(a => a.activo);
        for (const assignment of assignments) {
          const guardKey = `${assignment.servicio_id}-${offlineM.id}`;
          if (orphanGuardRef.current.has(guardKey)) continue;
          orphanGuardRef.current.add(guardKey);

          const loads = enTurno.map(m => ({
            id: m.id,
            load: (assignmentsByMonitorista[m.id] || []).filter(a => a.activo).length,
          }));
          const target = loads.sort((a, b) => a.load - b.load)[0];
          if (!target) continue;

          reassignService.mutate(
            { assignmentId: assignment.id, newMonitoristaId: target.id, servicioId: assignment.servicio_id, turno },
            {
              onSuccess: () => {
                toast.warning(
                  `⚠️ Servicio ${assignment.servicio_id.slice(0, 8)} reasignado: ${offlineM.display_name} (offline) → monitorista en turno`,
                  { duration: 8000 }
                );
                supabase.auth.getUser().then(({ data: { user } }) => {
                  (supabase as any).from('bitacora_anomalias_turno').insert({
                    tipo: 'servicio_huerfano_auto_reasignado',
                    descripcion: `Servicio reasignado automáticamente porque ${offlineM.display_name} está fuera de turno`,
                    servicio_id: assignment.servicio_id,
                    monitorista_original: offlineM.id,
                    monitorista_reasignado: target.id,
                    ejecutado_por: user?.id || null,
                  });
                });
              },
              onError: () => orphanGuardRef.current.delete(guardKey),
            }
          );
        }
      }
    }
  }, [pendingServiceIds, activeServiceIds, assignedServiceIds, serviceHoraCitaMap, enTurno, sinTurno, assignmentsByMonitorista, autoDistribute, reassignService]);

  // ── BalanceGuard ──
  const prevEnTurnoRef = useRef<Set<string>>(new Set());
  const balanceCooldownRef = useRef<number>(0);
  const periodicCheckRef = useRef<number>(0);

  // Shared safe-rebalance logic: only moves "cold" services (no events from current monitorista)
  const executeSafeRebalance = useCallback(async (reason: string) => {
    if (enTurno.length < 2 || rebalanceLoad.isPending) return;

    const enCursoServiceIds = new Set(enCursoServices.map(s => s.id_servicio));
    const eventoServiceIds = new Set(eventoEspecialServices.map(s => s.id_servicio));

    // Gather all formal active assignments
    const allFormalActive: { assignmentId: string; servicioId: string; monitoristaId: string; horaCita: string; isEnCurso: boolean }[] = [];
    for (const m of enTurno) {
      for (const a of (assignmentsByMonitorista[m.id] || []).filter(x => x.activo)) {
        if (eventoServiceIds.has(a.servicio_id)) continue;
        allFormalActive.push({
          assignmentId: a.id,
          servicioId: a.servicio_id,
          monitoristaId: m.id,
          horaCita: serviceHoraCitaMap[a.servicio_id] || '',
          isEnCurso: enCursoServiceIds.has(a.servicio_id),
        });
      }
    }

    const totalServices = allFormalActive.length;
    if (totalServices === 0) return;

    const totalStaff = enTurno.length;
    const loadByM: Record<string, number> = {};
    for (const m of enTurno) loadByM[m.id] = 0;
    for (const a of allFormalActive) loadByM[a.monitoristaId]++;
    const loads = Object.values(loadByM);
    if (Math.max(...loads) - Math.min(...loads) < 2) return;

    // Query bitacora_eventos to find services with existing activity from their assigned monitorista
    const servicioIds = allFormalActive.map(a => a.servicioId);
    const { data: eventosData } = await supabase
      .from('bitacora_eventos' as any)
      .select('servicio_id, monitorista_id')
      .in('servicio_id', servicioIds);

    // Build set of "hot" service-monitorista pairs (services that have been touched)
    const hotPairs = new Set<string>();
    if (eventosData) {
      for (const e of eventosData as any[]) {
        hotPairs.add(`${e.servicio_id}::${e.monitorista_id}`);
      }
    }

    const targetLoad = Math.floor(totalServices / totalStaff);
    const remainder = totalServices % totalStaff;

    const targetByM: Record<string, number> = {};
    const sorted = enTurno.slice().sort((a, b) => (loadByM[b.id] || 0) - (loadByM[a.id] || 0));
    sorted.forEach((m, i) => { targetByM[m.id] = targetLoad + (i < remainder ? 1 : 0); });

    const reassignments: { fromAssignmentId: string; toMonitoristaId: string; servicioId: string }[] = [];
    for (const m of sorted) {
      const excess = loadByM[m.id] - targetByM[m.id];
      if (excess <= 0) continue;
      const mServices = allFormalActive
        .filter(a => a.monitoristaId === m.id)
        .filter(a => {
          // Only move "cold" services: not en_curso AND no events from this monitorista
          if (a.isEnCurso) return false;
          if (hotPairs.has(`${a.servicioId}::${a.monitoristaId}`)) return false;
          return true;
        })
        .sort((a, b) => (b.horaCita || '').localeCompare(a.horaCita || ''));
      // Take at most `excess` movable services
      const movable = mServices.slice(0, excess);

      const currentLoad = { ...loadByM };
      for (const service of movable) {
        const underloaded = sorted.filter(mm => currentLoad[mm.id] < targetByM[mm.id]);
        if (underloaded.length === 0) break;
        const dest = underloaded.sort((a, b) => currentLoad[a.id] - currentLoad[b.id])[0];
        reassignments.push({
          fromAssignmentId: service.assignmentId,
          toMonitoristaId: dest.id,
          servicioId: service.servicioId,
        });
        currentLoad[dest.id]++;
        currentLoad[service.monitoristaId]--;
      }
    }

    if (reassignments.length === 0) {
      console.log(`[BalanceGuard] ${reason}: Desbalance detected but no cold services to move`);
      return;
    }

    console.log(`[BalanceGuard] ${reason}: Rebalancing ${reassignments.length} cold services across ${totalStaff} monitoristas`);
    balanceCooldownRef.current = Date.now();

    const perPerson = Math.round(totalServices / totalStaff);
    rebalanceLoad.mutate({ reassignments }, {
      onSuccess: () => {
        toast.info(`⚖️ Carga rebalanceada: ~${perPerson} servicios c/u (${reassignments.length} movidos, solo fríos)`, { duration: 8000 });
      },
    });
  }, [enTurno, assignmentsByMonitorista, enCursoServices, eventoEspecialServices, serviceHoraCitaMap, rebalanceLoad]);

  useEffect(() => {
    if (enTurno.length < 2 || rebalanceLoad.isPending) return;
    if (Date.now() - balanceCooldownRef.current < 60_000) return;

    const currentIds = new Set(enTurno.map(m => m.id));
    const prevIds = prevEnTurnoRef.current;

    const newMembers = enTurno.filter(m => !prevIds.has(m.id));
    prevEnTurnoRef.current = currentIds;

    // Path A: New member joins with 0 load
    if (prevIds.size > 0 && newMembers.length > 0) {
      const newWithZero = newMembers.filter(m => {
        const assignments = (assignmentsByMonitorista[m.id] || []).filter(a => a.activo && !a.inferred);
        return assignments.length === 0;
      });
      if (newWithZero.length > 0) {
        executeSafeRebalance('New member joined');
        return;
      }
    }

    // Path B: Periodic check every 5 minutes
    const FIVE_MIN = 5 * 60_000;
    if (Date.now() - periodicCheckRef.current > FIVE_MIN) {
      periodicCheckRef.current = Date.now();
      executeSafeRebalance('Periodic check');
    }
  }, [enTurno, assignmentsByMonitorista, rebalanceLoad, executeSafeRebalance]);

  // Expose manual rebalance for the UI
  return { executeSafeRebalance };
}
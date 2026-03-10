import { useEffect, useRef } from 'react';
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
      const assignments = (assignmentsByMonitorista[m.id] || []).filter(a => a.activo && !a.inferred);
      return assignments.length > 0;
    });

    if (offlineWithServices.length > 0 && enTurno.length > 0) {
      for (const offlineM of offlineWithServices) {
        const assignments = (assignmentsByMonitorista[offlineM.id] || []).filter(a => a.activo && !a.inferred);
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

  useEffect(() => {
    if (enTurno.length < 2 || rebalanceLoad.isPending) return;
    if (Date.now() - balanceCooldownRef.current < 60_000) return;

    const currentIds = new Set(enTurno.map(m => m.id));
    const prevIds = prevEnTurnoRef.current;

    const newMembers = enTurno.filter(m => !prevIds.has(m.id));
    prevEnTurnoRef.current = currentIds;

    if (prevIds.size === 0 || newMembers.length === 0) return;

    const newWithZero = newMembers.filter(m => {
      const assignments = (assignmentsByMonitorista[m.id] || []).filter(a => a.activo && !a.inferred);
      return assignments.length === 0;
    });
    if (newWithZero.length === 0) return;

    const enCursoServiceIds = new Set(enCursoServices.map(s => s.id_servicio));
    const eventoServiceIds = new Set(eventoEspecialServices.map(s => s.id_servicio));

    const allFormalActive: { assignmentId: string; servicioId: string; monitoristaId: string; horaCita: string; isEnCurso: boolean }[] = [];
    for (const m of enTurno) {
      for (const a of (assignmentsByMonitorista[m.id] || []).filter(x => x.activo && !x.inferred)) {
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
    const targetLoad = Math.floor(totalServices / totalStaff);
    const remainder = totalServices % totalStaff;

    const loadByM: Record<string, number> = {};
    for (const m of enTurno) loadByM[m.id] = 0;
    for (const a of allFormalActive) loadByM[a.monitoristaId]++;
    const loads = Object.values(loadByM);
    if (Math.max(...loads) - Math.min(...loads) < 2) return;

    const targetByM: Record<string, number> = {};
    const sorted = enTurno.slice().sort((a, b) => (loadByM[b.id] || 0) - (loadByM[a.id] || 0));
    sorted.forEach((m, i) => { targetByM[m.id] = targetLoad + (i < remainder ? 1 : 0); });

    const reassignments: { fromAssignmentId: string; toMonitoristaId: string; servicioId: string }[] = [];
    const movable: typeof allFormalActive = [];
    for (const m of sorted) {
      const excess = loadByM[m.id] - targetByM[m.id];
      if (excess <= 0) continue;
      const mServices = allFormalActive
        .filter(a => a.monitoristaId === m.id)
        .sort((a, b) => {
          if (a.isEnCurso !== b.isEnCurso) return a.isEnCurso ? 1 : -1;
          return (b.horaCita || '').localeCompare(a.horaCita || '');
        });
      movable.push(...mServices.slice(0, excess));
    }

    const currentLoad = { ...loadByM };
    for (const service of movable) {
      const underloaded = sorted.filter(m => currentLoad[m.id] < targetByM[m.id]);
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

    if (reassignments.length === 0) return;

    console.log(`[BalanceGuard] Rebalancing ${reassignments.length} services across ${totalStaff} monitoristas`);
    balanceCooldownRef.current = Date.now();

    const perPerson = Math.round(totalServices / totalStaff);
    rebalanceLoad.mutate({ reassignments }, {
      onSuccess: () => {
        toast.info(`⚖️ Carga rebalanceada: ~${perPerson} servicios c/u entre ${totalStaff} monitoristas`, { duration: 8000 });
      },
    });
  }, [enTurno, assignmentsByMonitorista, enCursoServices, eventoEspecialServices, serviceHoraCitaMap, rebalanceLoad]);
}

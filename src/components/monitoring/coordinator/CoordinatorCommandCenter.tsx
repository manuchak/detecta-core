import React, { useMemo, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Radio, ArrowRightLeft, X, Activity, Users, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMonitoristaAssignment, getCurrentTurno, getTurnoLabel } from '@/hooks/useMonitoristaAssignment';
import { useBitacoraBoard } from '@/hooks/useBitacoraBoard';
import { MonitoristaCard } from './MonitoristaCard';
import { AutoDistributeButton } from './AutoDistributeButton';
import { CoordinatorAlertBar } from './CoordinatorAlertBar';
import { DestinoCorrectionSection } from './DestinoCorrectionSection';
import { GastosAprobacionSection } from './GastosAprobacionSection';
import { AbandonedServicesSection } from './AbandonedServicesSection';
import { HandoffRevertSection } from './HandoffRevertSection';
import { AnomaliasBadge } from './AnomaliasBadge';
import { ShiftHandoffDialog } from '@/components/monitoring/bitacora/ShiftHandoffDialog';
import { useRevertHandoff } from '@/hooks/useRevertHandoff';
import { cn } from '@/lib/utils';

interface Props {
  onClose?: () => void;
}

export const CoordinatorCommandCenter: React.FC<Props> = ({ onClose }) => {
  const {
    monitoristas, assignedServiceIds, assignmentsByMonitorista,
    assignService, autoDistribute, reassignService, rebalanceLoad,
  } = useMonitoristaAssignment();

  const { enCursoServices, eventoEspecialServices, pendingServices, revertirEnDestino } = useBitacoraBoard();
  const { entregas: entregasRevertibles } = useRevertHandoff();

  const [handoffOpen, setHandoffOpen] = React.useState(false);
  const [sinTurnoOpen, setSinTurnoOpen] = React.useState(false);
  const turno = getCurrentTurno();

  // Build active service data from the board
  const allActive = [...enCursoServices, ...eventoEspecialServices];
  const activeServiceIds = allActive.map(s => s.id_servicio);
  const boardLabelMap = Object.fromEntries(
    [...pendingServices, ...allActive].map(s => [
      s.id_servicio,
      `${s.id_servicio} — ${s.nombre_cliente || ''}`,
    ])
  );
  const serviceHoraCitaMap = Object.fromEntries(
    [...pendingServices, ...allActive].map(s => [s.id_servicio, s.fecha_hora_cita || ''])
  );

  // Detect assigned service IDs missing from board data
  const missingServiceIds = useMemo(() => {
    const allAssignedIds = Object.values(assignmentsByMonitorista)
      .flat()
      .filter(a => a.activo)
      .map(a => a.servicio_id);
    return [...new Set(allAssignedIds.filter(id => !boardLabelMap[id]))];
  }, [assignmentsByMonitorista, boardLabelMap]);

  // Fetch missing service labels from servicios_planificados
  const { data: missingLabels } = useQuery({
    queryKey: ['missing-service-labels', missingServiceIds],
    queryFn: async () => {
      if (missingServiceIds.length === 0) return [];
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id_servicio, nombre_cliente')
        .in('id_servicio', missingServiceIds);
      if (error) { console.error('Error fetching missing labels:', error); return []; }
      return data || [];
    },
    enabled: missingServiceIds.length > 0,
    staleTime: 60000,
  });

  // Merge board labels + supplemental labels
  const serviceLabelMap = useMemo(() => {
    const merged = { ...boardLabelMap };
    if (missingLabels) {
      for (const s of missingLabels) {
        merged[s.id_servicio] = `${s.id_servicio} — ${s.nombre_cliente || ''}`;
      }
    }
    return merged;
  }, [boardLabelMap, missingLabels]);

  const enTurno = monitoristas.filter(m => m.en_turno);
  const sinTurno = monitoristas.filter(m => !m.en_turno);

  // ── BalanceGuard: auto-rebalance when a new monitorista joins ──
  const prevEnTurnoRef = useRef<Set<string>>(new Set());
  const balanceCooldownRef = useRef<number>(0);

  useEffect(() => {
    if (enTurno.length < 2 || rebalanceLoad.isPending) return;
    // Cooldown check
    if (Date.now() - balanceCooldownRef.current < 60_000) return;

    const currentIds = new Set(enTurno.map(m => m.id));
    const prevIds = prevEnTurnoRef.current;

    // Detect new members
    const newMembers = enTurno.filter(m => !prevIds.has(m.id));
    prevEnTurnoRef.current = currentIds;

    // Only act if there's a genuinely new member (not initial load)
    if (prevIds.size === 0 || newMembers.length === 0) return;

    // Check if any new member has 0 formal assignments
    const newWithZero = newMembers.filter(m => {
      const assignments = (assignmentsByMonitorista[m.id] || []).filter(a => a.activo && !a.inferred);
      return assignments.length === 0;
    });
    if (newWithZero.length === 0) return;

    // Get all active formal assignments across en_turno monitoristas
    const allFormalActive: { assignmentId: string; servicioId: string; monitoristaId: string; horaCita: string; isEnCurso: boolean }[] = [];
    const enCursoServiceIds = new Set(enCursoServices.map(s => s.id_servicio));
    const eventoServiceIds = new Set(eventoEspecialServices.map(s => s.id_servicio));

    for (const m of enTurno) {
      for (const a of (assignmentsByMonitorista[m.id] || []).filter(x => x.activo && !x.inferred)) {
        // Never move services with active evento especial
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
    const target = Math.floor(totalServices / totalStaff);
    const remainder = totalServices % totalStaff;

    // Check if imbalance is significant (max - min >= 2)
    const loadByM: Record<string, number> = {};
    for (const m of enTurno) loadByM[m.id] = 0;
    for (const a of allFormalActive) loadByM[a.monitoristaId]++;
    const loads = Object.values(loadByM);
    if (Math.max(...loads) - Math.min(...loads) < 2) return;

    // Calculate how many each should have (first `remainder` get target+1)
    const targetByM: Record<string, number> = {};
    const sorted = enTurno.slice().sort((a, b) => (loadByM[b.id] || 0) - (loadByM[a.id] || 0));
    sorted.forEach((m, i) => { targetByM[m.id] = target + (i < remainder ? 1 : 0); });

    // Collect services to move: from overloaded, prioritize pending > en_curso, far cita first
    const reassignments: { fromAssignmentId: string; toMonitoristaId: string; servicioId: string }[] = [];

    // Pool of services available to move (from overloaded monitoristas)
    const movable: typeof allFormalActive = [];
    for (const m of sorted) {
      const excess = loadByM[m.id] - targetByM[m.id];
      if (excess <= 0) continue;
      const mServices = allFormalActive
        .filter(a => a.monitoristaId === m.id)
        // Prefer pending over en_curso
        .sort((a, b) => {
          if (a.isEnCurso !== b.isEnCurso) return a.isEnCurso ? 1 : -1;
          // Among same status, move farthest cita first
          return (b.horaCita || '').localeCompare(a.horaCita || '');
        });
      movable.push(...mServices.slice(0, excess));
    }

    // Assign movable services to under-loaded monitoristas
    const currentLoad = { ...loadByM };
    for (const service of movable) {
      // Find the most under-loaded monitorista
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

    console.log(`[BalanceGuard] Rebalancing ${reassignments.length} services across ${totalStaff} monitoristas (target: ~${target})`);
    balanceCooldownRef.current = Date.now();

    const perPerson = Math.round(totalServices / totalStaff);
    rebalanceLoad.mutate({ reassignments }, {
      onSuccess: () => {
        toast.info(`⚖️ Carga rebalanceada: ~${perPerson} servicios c/u entre ${totalStaff} monitoristas`, { duration: 8000 });
      },
    });
  }, [enTurno, assignmentsByMonitorista, enCursoServices, eventoEspecialServices, serviceHoraCitaMap, rebalanceLoad]);

  // ── OrphanGuard: consolidated auto-assignment ──
  const autoAssignedRef = useRef<Set<string>>(new Set());
  const orphanGuardRef = useRef<Set<string>>(new Set());
  const pendingServiceIds = pendingServices.map(s => s.id_servicio);

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

    // Rule 3: Services assigned to offline monitoristas → reassign + log anomaly
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

          // Round-robin: pick monitorista with least load
          const loads = enTurno.map(m => ({
            id: m.id,
            load: (assignmentsByMonitorista[m.id] || []).filter(a => a.activo).length,
          }));
          const target = loads.sort((a, b) => a.load - b.load)[0];
          if (!target) continue;

          // Reassign
          reassignService.mutate(
            { assignmentId: assignment.id, newMonitoristaId: target.id, servicioId: assignment.servicio_id, turno },
            {
              onSuccess: () => {
                toast.warning(
                  `⚠️ Servicio ${assignment.servicio_id.slice(0, 8)} reasignado: ${offlineM.display_name} (offline) → monitorista en turno`,
                  { duration: 8000 }
                );
                // Log anomaly
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

  const unassigned = activeServiceIds.filter(id => !assignedServiceIds.has(id))
    .sort((a, b) => (serviceHoraCitaMap[a] || '').localeCompare(serviceHoraCitaMap[b] || ''));

  const unassignedForPopover = unassigned.map(sId => ({
    id: sId,
    label: serviceLabelMap[sId] || sId.slice(0, 12),
    horaCita: serviceHoraCitaMap[sId],
  }));

  const maxLoad = Math.max(8, ...Object.values(assignmentsByMonitorista).map(a => a.length));

  const totalInferred = Object.values(assignmentsByMonitorista).flat().filter(a => a.inferred).length;

  // Counts for alert bar
  const enDestinoCount = enCursoServices.filter(s => s.phase === 'en_destino').length;
  const abandonedCount = sinTurno.reduce(
    (sum, m) => sum + (assignmentsByMonitorista[m.id] || []).filter(a => a.activo && !a.inferred).length,
    0
  );

  const isOverlay = !!onClose;

  const content = (
    <div className={cn(
      'flex flex-col',
      isOverlay ? 'h-full' : 'h-[calc(var(--content-height-with-tabs,calc(100vh-200px)))]',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-2.5">
          <Radio className="h-4 w-4 text-chart-2 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-tight">Coordinación Ops</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            Turno: {getTurnoLabel(turno)}
          </Badge>
          {totalInferred > 0 && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-dashed text-chart-2">
              <Activity className="h-2.5 w-2.5 mr-1" />
              {totalInferred} auto-detectados
            </Badge>
          )}
          {isOverlay && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable vertical sections */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">

          {/* ── Alert Bar ── */}
          <CoordinatorAlertBar
            unassignedCount={unassigned.length}
            correctionCount={enDestinoCount}
            gastosCount={0}
            handoffCount={entregasRevertibles.length}
            abandonedCount={abandonedCount}
          />
          <AnomaliasBadge />

          <div className="flex gap-2">
            <AutoDistributeButton
              unassignedCount={unassigned.length}
              monitoristaCount={enTurno.length}
              isPending={autoDistribute.isPending}
              onDistribute={() => autoDistribute.mutate({
                unassignedServiceIds: unassigned,
                monitoristaIds: enTurno.map(m => m.id),
              })}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-xs"
              onClick={() => setHandoffOpen(true)}
            >
              <ArrowRightLeft className="h-3 w-3" />
              Cambio de Turno
            </Button>
          </div>

          {/* ── Section 1: Monitoristas en turno ── */}
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3 px-5 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Equipo en Turno</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {enTurno.length} en turno · {allActive.length} activos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {enTurno.map(m => (
                  <MonitoristaCard
                    key={m.id}
                    monitorista={m}
                    assignments={assignmentsByMonitorista[m.id] || []}
                    maxLoad={maxLoad}
                    serviceLabelMap={serviceLabelMap}
                    unassignedServices={unassignedForPopover}
                    onAssign={(sid, mid) => assignService.mutate({ servicioId: sid, monitoristaId: mid })}
                    isAssigning={assignService.isPending}
                  />
                ))}
              </div>

              {enTurno.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No hay monitoristas en turno
                </p>
              )}

              {/* Sin turno — collapsible */}
              {sinTurno.length > 0 && (
                <Collapsible open={sinTurnoOpen} onOpenChange={setSinTurnoOpen}>
                  <CollapsibleTrigger className="w-full mt-3 pt-3 border-t border-border/40">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                      <span>Sin turno ({sinTurno.length})</span>
                      <ChevronDown className={cn('h-3 w-3 transition-transform', sinTurnoOpen && 'rotate-180')} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                      {sinTurno.map(m => (
                        <MonitoristaCard
                          key={m.id}
                          monitorista={m}
                          assignments={assignmentsByMonitorista[m.id] || []}
                          maxLoad={maxLoad}
                          serviceLabelMap={serviceLabelMap}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>

          {/* ── Section 2: Servicios Abandonados ── */}
          <AbandonedServicesSection
            monitoristas={monitoristas}
            assignmentsByMonitorista={assignmentsByMonitorista}
            serviceLabelMap={serviceLabelMap}
            onReassign={(p) => reassignService.mutate(p)}
            isReassigning={reassignService.isPending}
            currentTurno={turno}
          />

          {/* ── Section 3: Correcciones en Destino (conditional) ── */}
          {enDestinoCount > 0 && (
            <DestinoCorrectionSection
              services={enCursoServices}
              onRevert={(uuid, sid) => revertirEnDestino.mutate({ serviceUUID: uuid, servicioIdServicio: sid })}
              isReverting={revertirEnDestino.isPending}
            />
          )}

          {/* ── Section 3: Reversión de Entregas de Turno ── */}
          <HandoffRevertSection />

          {/* ── Section 4: Gastos Extraordinarios ── */}
          <GastosAprobacionSection />

        </div>
      </ScrollArea>

      <ShiftHandoffDialog open={handoffOpen} onOpenChange={setHandoffOpen} />
    </div>
  );

  if (isOverlay) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-background border-l shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
          {content}
        </div>
      </>
    );
  }

  return content;
};

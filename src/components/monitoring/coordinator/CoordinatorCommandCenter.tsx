import React, { useMemo, useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Radio, ArrowRightLeft, X, Users, ChevronDown, AlertTriangle, Scale, RotateCcw, Receipt, UserX, Shuffle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMonitoristaAssignment, getCurrentTurno, getTurnoLabel } from '@/hooks/useMonitoristaAssignment';
import { useBitacoraBoard } from '@/hooks/useBitacoraBoard';
import { MonitoristaCard } from './MonitoristaCard';
import { AutoDistributeButton } from './AutoDistributeButton';
import { DestinoCorrectionSection } from './DestinoCorrectionSection';
import { GastosAprobacionSection } from './GastosAprobacionSection';
import { AbandonedServicesSection } from './AbandonedServicesSection';
import { HandoffRevertSection } from './HandoffRevertSection';
import { AnomaliasBadge } from './AnomaliasBadge';
import { ShiftHandoffDialog } from '@/components/monitoring/bitacora/ShiftHandoffDialog';
import { useRevertHandoff } from '@/hooks/useRevertHandoff';
import { cn } from '@/lib/utils';
import { ConfirmTransitionDialog } from '@/components/monitoring/bitacora/ConfirmTransitionDialog';

interface Props {
  onClose?: () => void;
}

type DrawerPanel = 'corrections' | 'handoffs' | 'gastos' | 'abandoned' | null;

export const CoordinatorCommandCenter: React.FC<Props> = ({ onClose }) => {
  const {
    monitoristas, assignedServiceIds, assignmentsByMonitorista,
    assignService, autoDistribute, reassignService, rebalanceLoad, resetAndRedistribute,
  } = useMonitoristaAssignment();

  const { enCursoServices, eventoEspecialServices, pendingServices, revertirEnDestino } = useBitacoraBoard();
  const { entregas: entregasRevertibles } = useRevertHandoff();

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [sinTurnoOpen, setSinTurnoOpen] = useState(false);
  const [rebalanceConfirm, setRebalanceConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<DrawerPanel>(null);
  const turno = getCurrentTurno();

  const { data: gastosPendientes = 0 } = useQuery({
    queryKey: ['gastos-pendientes-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente');
      return count || 0;
    },
    refetchInterval: 30_000,
  });

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

  // Build set of active service IDs from the board (non-completed)
  const activeBoardServiceIds = useMemo(() => {
    return new Set([...pendingServices, ...allActive].map(s => s.id_servicio));
  }, [pendingServices, allActive]);

  // Phase breakdown by service ID for coordinator cards
  const servicePhaseMap = useMemo(() => {
    const map: Record<string, 'pending' | 'enCurso' | 'evento'> = {};
    for (const s of pendingServices) map[s.id_servicio] = 'pending';
    for (const s of enCursoServices) map[s.id_servicio] = 'enCurso';
    for (const s of eventoEspecialServices) map[s.id_servicio] = 'evento';
    return map;
  }, [pendingServices, enCursoServices, eventoEspecialServices]);

  // Filter assignmentsByMonitorista to only include services still on the board
  const filteredAssignmentsByMonitorista = useMemo(() => {
    const result: Record<string, typeof assignmentsByMonitorista[string]> = {};
    for (const [mId, assignments] of Object.entries(assignmentsByMonitorista)) {
      result[mId] = assignments.filter(a => a.activo && activeBoardServiceIds.has(a.servicio_id));
    }
    return result;
  }, [assignmentsByMonitorista, activeBoardServiceIds]);

  // Phase breakdown per monitorista
  const phaseBreakdownByMonitorista = useMemo(() => {
    const result: Record<string, { pending: number; enCurso: number; evento: number }> = {};
    for (const [mId, assignments] of Object.entries(filteredAssignmentsByMonitorista)) {
      const bd = { pending: 0, enCurso: 0, evento: 0 };
      for (const a of assignments) {
        const phase = servicePhaseMap[a.servicio_id];
        if (phase === 'pending') bd.pending++;
        else if (phase === 'enCurso') bd.enCurso++;
        else if (phase === 'evento') bd.evento++;
      }
      result[mId] = bd;
    }
    return result;
  }, [filteredAssignmentsByMonitorista, servicePhaseMap]);

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
  const eligibleForAssignment = enTurno.length > 0
    ? enTurno
    : monitoristas.filter(m => (m.event_count || 0) > 0);

  // ── Equity calculation ──
  const { loadGap, minLoad, maxLoad: maxLoadVal, equityLevel } = useMemo(() => {
    if (enTurno.length < 2) return { loadGap: 0, minLoad: 0, maxLoad: 0, equityLevel: 'balanced' as const };
    const loads = enTurno.map(m =>
      (filteredAssignmentsByMonitorista[m.id] || []).length
    );
    const min = Math.min(...loads);
    const max = Math.max(...loads);
    const gap = max - min;
    const level = gap <= 1 ? 'balanced' as const : gap <= 3 ? 'mild' as const : 'critical' as const;
    return { loadGap: gap, minLoad: min, maxLoad: max, equityLevel: level };
  }, [enTurno, filteredAssignmentsByMonitorista]);

  // ── Manual safe rebalance ──
  const handleManualRebalance = useCallback(async () => {
    if (enTurno.length < 2) return;

    const enCursoServiceIds = new Set(enCursoServices.map(s => s.id_servicio));
    const eventoServiceIds = new Set(eventoEspecialServices.map(s => s.id_servicio));

    const allFormalActive: { assignmentId: string; servicioId: string; monitoristaId: string; horaCita: string; isEnCurso: boolean }[] = [];
    for (const m of enTurno) {
      for (const a of (filteredAssignmentsByMonitorista[m.id] || []).filter(x => x.activo)) {
        if (eventoServiceIds.has(a.servicio_id)) continue;
        allFormalActive.push({
          assignmentId: a.id, servicioId: a.servicio_id, monitoristaId: m.id,
          horaCita: serviceHoraCitaMap[a.servicio_id] || '', isEnCurso: enCursoServiceIds.has(a.servicio_id),
        });
      }
    }

    const totalServices = allFormalActive.length;
    if (totalServices === 0) return;

    const totalStaff = enTurno.length;
    const loadByM: Record<string, number> = {};
    for (const m of enTurno) loadByM[m.id] = 0;
    for (const a of allFormalActive) loadByM[a.monitoristaId]++;

    const servicioIds = allFormalActive.map(a => a.servicioId);
    const { data: eventosData } = await supabase
      .from('bitacora_eventos' as any)
      .select('servicio_id, monitorista_id')
      .in('servicio_id', servicioIds);

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
    const currentLoad = { ...loadByM };
    for (const m of sorted) {
      const excess = currentLoad[m.id] - targetByM[m.id];
      if (excess <= 0) continue;
      const coldServices = allFormalActive
        .filter(a => a.monitoristaId === m.id && !a.isEnCurso && !hotPairs.has(`${a.servicioId}::${a.monitoristaId}`))
        .sort((a, b) => (b.horaCita || '').localeCompare(a.horaCita || ''));
      for (const service of coldServices.slice(0, excess)) {
        const underloaded = sorted.filter(mm => currentLoad[mm.id] < targetByM[mm.id]);
        if (underloaded.length === 0) break;
        const dest = underloaded.sort((a, b) => currentLoad[a.id] - currentLoad[b.id])[0];
        reassignments.push({ fromAssignmentId: service.assignmentId, toMonitoristaId: dest.id, servicioId: service.servicioId });
        currentLoad[dest.id]++;
        currentLoad[service.monitoristaId]--;
      }
    }

    if (reassignments.length === 0) {
      toast.info('No hay servicios fríos que mover. Los servicios activos están protegidos.');
      return;
    }

    const perPerson = Math.round(totalServices / totalStaff);
    rebalanceLoad.mutate({ reassignments }, {
      onSuccess: () => {
        toast.info(`⚖️ Carga rebalanceada: ~${perPerson} servicios c/u (${reassignments.length} fríos movidos)`, { duration: 8000 });
      },
    });
  }, [enTurno, filteredAssignmentsByMonitorista, enCursoServices, eventoEspecialServices, serviceHoraCitaMap, rebalanceLoad]);

  const unassigned = activeServiceIds.filter(id => !assignedServiceIds.has(id))
    .sort((a, b) => (serviceHoraCitaMap[a] || '').localeCompare(serviceHoraCitaMap[b] || ''));

  const unassignedForPopover = unassigned.map(sId => ({
    id: sId,
    label: serviceLabelMap[sId] || sId.slice(0, 12),
    horaCita: serviceHoraCitaMap[sId],
  }));

  const maxLoad = Math.max(8, ...Object.values(filteredAssignmentsByMonitorista).map(a => a.length));

  // Counts for footer pills
  const enDestinoCount = enCursoServices.filter(s => s.phase === 'en_destino').length;
  const abandonedCount = sinTurno.reduce(
    (sum, m) => sum + (filteredAssignmentsByMonitorista[m.id] || []).length,
    0
  );
  const handoffCount = entregasRevertibles.length;

  const isOverlay = !!onClose;

  // ── Pill button helper ──
  const FooterPill: React.FC<{
    icon: React.ReactNode;
    label: string;
    count: number;
    panel: DrawerPanel;
    variant?: 'default' | 'warning' | 'danger';
  }> = ({ icon, label, count, panel, variant = 'default' }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setActiveDrawer(panel)}
          className={cn(
            'relative flex items-center justify-center w-10 h-10 rounded-lg transition-all',
            'border hover:shadow-sm active:scale-[0.97]',
            variant === 'default' && 'border-border bg-card text-foreground hover:bg-accent',
            variant === 'warning' && 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10',
            variant === 'danger' && 'border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10',
          )}
        >
          {icon}
          {count > 0 && (
            <span className={cn(
              'absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold leading-none',
              variant === 'danger' ? 'bg-destructive text-destructive-foreground' :
              variant === 'warning' ? 'bg-amber-500 text-white' :
              'bg-muted text-muted-foreground',
            )}>
              {count}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );

  const content = (
    <TooltipProvider delayDuration={200}>
    <div className={cn(
      'flex flex-col',
      isOverlay ? 'h-full' : 'h-[calc(var(--content-height-with-tabs,calc(100vh-200px)))]',
    )}>
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b bg-card shrink-0">
        <div className="flex items-center gap-2.5">
          <Radio className="h-4 w-4 text-chart-2 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-tight">Coordinación Ops</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {getTurnoLabel(turno)}
          </Badge>
          {enTurno.length >= 2 && (
            <Badge
              variant={equityLevel === 'balanced' ? 'success' : equityLevel === 'mild' ? 'default' : 'destructive'}
              className="text-[10px] tabular-nums gap-1"
            >
              {equityLevel === 'balanced' && '⚖️'}
              {equityLevel === 'mild' && '⚠️'}
              {equityLevel === 'critical' && '🔴'}
              {minLoad}↔{maxLoadVal}
            </Badge>
          )}
          <AnomaliasBadge />
          {isOverlay && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ═══ ORPHAN BANNER (compact, fixed) ═══ */}
      {unassigned.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-destructive/8 border-b border-destructive/20 shrink-0">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs font-semibold text-destructive flex-1">
            {unassigned.length} sin monitorista
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-[11px] gap-1 px-2.5"
            disabled={autoDistribute.isPending || eligibleForAssignment.length === 0}
            onClick={() => autoDistribute.mutate({
              unassignedServiceIds: unassigned,
              monitoristaIds: eligibleForAssignment.map(m => m.id),
            })}
          >
            Asignar ahora
          </Button>
        </div>
      )}

      {/* ═══ MAIN AREA: Grid + Sidebar ═══ */}
      <div className="flex flex-1 min-h-0">
      {/* ═══ Agent Grid (scrollable) ═══ */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {/* Section header with action buttons */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold">Equipo en Turno</span>
              <Badge variant="outline" className="text-[10px] tabular-nums">
                {enTurno.length} · {allActive.length} activos
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <AutoDistributeButton
                unassignedCount={unassigned.length}
                monitoristaCount={eligibleForAssignment.length}
                isPending={autoDistribute.isPending}
                onDistribute={() => autoDistribute.mutate({
                  unassignedServiceIds: unassigned,
                  monitoristaIds: eligibleForAssignment.map(m => m.id),
                })}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-8 text-[11px]"
                disabled={loadGap < 2 || rebalanceLoad.isPending}
                onClick={() => setRebalanceConfirm(true)}
              >
                <Scale className="h-3 w-3" />
                Rebalancear
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-8 text-[11px] border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={resetAndRedistribute.isPending || allActive.length === 0 || eligibleForAssignment.length === 0}
                onClick={() => setResetConfirm(true)}
              >
                <Shuffle className="h-3 w-3" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-8 text-[11px]"
                onClick={() => setHandoffOpen(true)}
              >
                <ArrowRightLeft className="h-3 w-3" />
                Cambio Turno
              </Button>
            </div>
          </div>

          {/* Agent grid — expanded columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {enTurno.map(m => (
              <MonitoristaCard
                key={m.id}
                monitorista={m}
                assignments={filteredAssignmentsByMonitorista[m.id] || []}
                maxLoad={maxLoad}
                serviceLabelMap={serviceLabelMap}
                unassignedServices={unassignedForPopover}
                onAssign={(sid, mid) => assignService.mutate({ servicioId: sid, monitoristaId: mid })}
                isAssigning={assignService.isPending}
              />
            ))}
          </div>

          {enTurno.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay monitoristas en turno
            </p>
          )}

          {/* Sin turno — collapsible */}
          {sinTurno.length > 0 && (
            <Collapsible open={sinTurnoOpen} onOpenChange={setSinTurnoOpen}>
              <CollapsibleTrigger className="w-full mt-4 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                  <span>Sin turno ({sinTurno.length})</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform', sinTurnoOpen && 'rotate-180')} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mt-2">
                  {sinTurno.map(m => (
                    <MonitoristaCard
                      key={m.id}
                      monitorista={m}
                      assignments={filteredAssignmentsByMonitorista[m.id] || []}
                      maxLoad={maxLoad}
                      serviceLabelMap={serviceLabelMap}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>

      {/* Right: action pills sidebar */}
      <div className="flex flex-col gap-2 py-3 px-1.5 border-l bg-card/90 shrink-0">
        <FooterPill
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          label="Correcciones"
          count={enDestinoCount}
          panel="corrections"
          variant={enDestinoCount > 0 ? 'warning' : 'default'}
        />
        <FooterPill
          icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
          label="Entregas"
          count={handoffCount}
          panel="handoffs"
          variant={handoffCount > 0 ? 'warning' : 'default'}
        />
        <FooterPill
          icon={<Receipt className="h-3.5 w-3.5" />}
          label="Gastos"
          count={gastosPendientes}
          panel="gastos"
          variant={gastosPendientes > 0 ? 'warning' : 'default'}
        />
        <FooterPill
          icon={<UserX className="h-3.5 w-3.5" />}
          label="Abandonados"
          count={abandonedCount}
          panel="abandoned"
          variant={abandonedCount > 0 ? 'danger' : 'default'}
        />
      </div>
      </div>

      {/* ═══ SHEET DRAWERS ═══ */}
      <Sheet open={activeDrawer === 'corrections'} onOpenChange={(v) => !v && setActiveDrawer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-5 pt-4 pb-3 border-b">
            <SheetTitle className="text-sm">Correcciones en Destino</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-4">
              <DestinoCorrectionSection
                services={enCursoServices}
                onRevert={(uuid, sid) => revertirEnDestino.mutate({ serviceUUID: uuid, servicioIdServicio: sid })}
                isReverting={revertirEnDestino.isPending}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={activeDrawer === 'handoffs'} onOpenChange={(v) => !v && setActiveDrawer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-5 pt-4 pb-3 border-b">
            <SheetTitle className="text-sm">Entregas de Turno</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-4">
              <HandoffRevertSection />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={activeDrawer === 'gastos'} onOpenChange={(v) => !v && setActiveDrawer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-5 pt-4 pb-3 border-b">
            <SheetTitle className="text-sm">Gastos Extraordinarios</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-4">
              <GastosAprobacionSection />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={activeDrawer === 'abandoned'} onOpenChange={(v) => !v && setActiveDrawer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-5 pt-4 pb-3 border-b">
            <SheetTitle className="text-sm">Servicios Abandonados</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-4">
              <AbandonedServicesSection
                monitoristas={monitoristas}
                assignmentsByMonitorista={filteredAssignmentsByMonitorista}
                serviceLabelMap={serviceLabelMap}
                onReassign={(p) => reassignService.mutate(p)}
                isReassigning={reassignService.isPending}
                currentTurno={turno}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ShiftHandoffDialog open={handoffOpen} onOpenChange={setHandoffOpen} />

      <ConfirmTransitionDialog
        open={rebalanceConfirm}
        onOpenChange={setRebalanceConfirm}
        title="Rebalancear carga de servicios"
        description={`Se redistribuirán solo servicios "fríos" (sin eventos registrados) para equilibrar la carga. Rango actual: ${minLoad}↔${maxLoadVal}. Los servicios ya trabajados NO se moverán.`}
        confirmLabel="Rebalancear"
        isPending={rebalanceLoad.isPending}
        onConfirm={() => {
          handleManualRebalance();
          setRebalanceConfirm(false);
        }}
      />

      <ConfirmTransitionDialog
        open={resetConfirm}
        onOpenChange={setResetConfirm}
        title="Reset y redistribución completa"
        description={`Se desactivarán TODAS las asignaciones actuales y se redistribuirán ${allActive.length} servicios aleatoriamente entre ${eligibleForAssignment.length} monitoristas en turno. Esta acción no se puede deshacer.`}
        confirmLabel="Resetear y redistribuir"
        destructive
        isPending={resetAndRedistribute.isPending}
        requireDoubleConfirm
        doubleConfirmLabel="Confirmo que quiero resetear todas las asignaciones"
        onConfirm={() => {
          resetAndRedistribute.mutate({
            serviceIds: activeServiceIds,
            monitoristaIds: eligibleForAssignment.map(m => m.id),
          });
          setResetConfirm(false);
        }}
      />
    </div>
    </TooltipProvider>
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

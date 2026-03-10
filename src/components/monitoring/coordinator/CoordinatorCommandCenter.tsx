import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Radio, ArrowRightLeft, X, Activity, Users, ChevronDown, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
    assignService, autoDistribute, reassignService,
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
  // Fallback: if no one is en_turno, use monitoristas with recent activity for assignment eligibility
  const eligibleForAssignment = enTurno.length > 0
    ? enTurno
    : monitoristas.filter(m => (m.event_count || 0) > 0);

  // OrphanGuard + BalanceGuard moved to useOrphanGuard (mounted at page level)


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

          {/* ── Orphan Banner ── */}
          {unassigned.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border-2 border-destructive/30 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">
                  {unassigned.length} servicio{unassigned.length > 1 ? 's' : ''} sin monitorista asignado
                </p>
                <p className="text-[10px] text-muted-foreground">Requiere asignación inmediata</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1.5"
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

          <div className="flex gap-2">
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

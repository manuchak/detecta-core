import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Radio, ArrowRightLeft, X, Activity } from 'lucide-react';
import { useMonitoristaAssignment, getCurrentTurno, getTurnoLabel } from '@/hooks/useMonitoristaAssignment';
import { useBitacoraBoard } from '@/hooks/useBitacoraBoard';
import { MonitoristaCard } from './MonitoristaCard';
import { UnassignedServiceRow } from './UnassignedServiceRow';
import { AutoDistributeButton } from './AutoDistributeButton';
import { ShiftHandoffDialog } from '@/components/monitoring/bitacora/ShiftHandoffDialog';
import { cn } from '@/lib/utils';

interface Props {
  onClose?: () => void;
}

export const CoordinatorCommandCenter: React.FC<Props> = ({ onClose }) => {
  const {
    monitoristas, assignedServiceIds, assignmentsByMonitorista,
    assignService, autoDistribute,
  } = useMonitoristaAssignment();

  const { enCursoServices, eventoEspecialServices, pendingServices } = useBitacoraBoard();

  const [handoffOpen, setHandoffOpen] = React.useState(false);
  const turno = getCurrentTurno();

  // Build active service data from the board
  const allActive = [...enCursoServices, ...eventoEspecialServices];
  const activeServiceIds = allActive.map(s => s.id_servicio);
  const serviceLabelMap = Object.fromEntries(
    [...pendingServices, ...allActive].map(s => [
      s.id_servicio,
      `${s.nombre_cliente || s.id_servicio.slice(0, 8)}`,
    ])
  );
  const serviceHoraCitaMap = Object.fromEntries(
    [...pendingServices, ...allActive].map(s => [s.id_servicio, s.fecha_hora_cita || ''])
  );

  // Only truly unassigned = no formal assignment AND no inferred activity
  const unassigned = activeServiceIds.filter(id => !assignedServiceIds.has(id))
    .sort((a, b) => (serviceHoraCitaMap[a] || '').localeCompare(serviceHoraCitaMap[b] || ''));

  const enTurno = monitoristas.filter(m => m.en_turno);
  const sinTurno = monitoristas.filter(m => !m.en_turno);
  const maxLoad = Math.max(8, ...Object.values(assignmentsByMonitorista).map(a => a.length));

  // Count inferred vs formal
  const totalInferred = Object.values(assignmentsByMonitorista).flat().filter(a => a.inferred).length;
  const totalFormal = Object.values(assignmentsByMonitorista).flat().filter(a => !a.inferred).length;

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
          <h2 className="text-sm font-semibold tracking-tight">Coordinación C4</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            Turno: {getTurnoLabel(turno)}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            {allActive.length} activos · {unassigned.length} sin cobertura
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

      {/* Body: 2-column grid */}
      <div className="flex-1 grid grid-cols-[280px_1fr] min-h-0 border-x">
        {/* Left: Monitoristas */}
        <div className="border-r flex flex-col">
          <div className="px-4 py-2.5 border-b">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Monitoristas ({enTurno.length} activos)
            </h3>
          </div>
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-2">
              {enTurno.map(m => (
                <MonitoristaCard
                  key={m.id}
                  monitorista={m}
                  assignments={assignmentsByMonitorista[m.id] || []}
                  maxLoad={maxLoad}
                  serviceLabelMap={serviceLabelMap}
                />
              ))}
              {sinTurno.length > 0 && (
                <>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest pt-2 px-1">
                    Sin actividad reciente
                  </p>
                  {sinTurno.map(m => (
                    <MonitoristaCard
                      key={m.id}
                      monitorista={m}
                      assignments={assignmentsByMonitorista[m.id] || []}
                      maxLoad={maxLoad}
                      serviceLabelMap={serviceLabelMap}
                    />
                  ))}
                </>
              )}
              {monitoristas.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No hay monitoristas registrados
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Unassigned services (truly without coverage) */}
        <div className="flex flex-col">
          <div className="px-4 py-2.5 border-b flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sin cobertura ({unassigned.length})
            </h3>
          </div>
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-1.5">
              {unassigned.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 mx-auto text-chart-2/40 mb-2" />
                  <p className="text-xs text-muted-foreground">Todos los servicios tienen cobertura</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {totalFormal} asignados · {totalInferred} detectados por actividad
                  </p>
                </div>
              ) : (
                unassigned.map(sId => (
                  <UnassignedServiceRow
                    key={sId}
                    servicioId={sId}
                    label={serviceLabelMap[sId] || sId.slice(0, 12)}
                    horaCita={serviceHoraCitaMap[sId]}
                    monitoristas={monitoristas}
                    disabled={assignService.isPending}
                    onAssign={(sid, mid) => assignService.mutate({ servicioId: sid, monitoristaId: mid })}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Auto-distribute + Shift handoff */}
          <div className="px-3 py-3 border-t space-y-2">
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
              className="w-full gap-2 h-8 text-xs"
              onClick={() => setHandoffOpen(true)}
            >
              <ArrowRightLeft className="h-3 w-3" />
              Cambio de Turno
            </Button>
          </div>
        </div>
      </div>

      {/* Footer: distribution bar */}
      <div className="px-5 py-2.5 border rounded-b-lg bg-card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            Distribución
          </span>
          {monitoristas.filter(m => m.en_turno).map(m => {
            const assignments = assignmentsByMonitorista[m.id] || [];
            const inferredCount = assignments.filter(a => a.inferred).length;
            const formalCount = assignments.length - inferredCount;
            return (
              <div key={m.id} className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-foreground">
                  {m.display_name.split(' ')[0]}
                </span>
                <div className="flex gap-px">
                  {Array.from({ length: formalCount }).map((_, i) => (
                    <div key={`f-${i}`} className="h-2.5 w-1.5 rounded-sm bg-primary" />
                  ))}
                  {Array.from({ length: inferredCount }).map((_, i) => (
                    <div key={`i-${i}`} className="h-2.5 w-1.5 rounded-sm bg-chart-2/60 border border-chart-2/30" />
                  ))}
                  {assignments.length === 0 && <div className="h-2.5 w-1.5 rounded-sm bg-muted" />}
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">{assignments.length}</span>
              </div>
            );
          })}
        </div>
      </div>

      <ShiftHandoffDialog open={handoffOpen} onOpenChange={setHandoffOpen} />
    </div>
  );

  if (isOverlay) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background border-l shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
          {content}
        </div>
      </>
    );
  }

  return content;
};

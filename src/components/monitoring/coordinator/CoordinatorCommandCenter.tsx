import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Radio, ArrowRightLeft, X } from 'lucide-react';
import { useMonitoristaAssignment, getCurrentTurno, getTurnoLabel } from '@/hooks/useMonitoristaAssignment';
import { MonitoristaCard } from './MonitoristaCard';
import { UnassignedServiceRow } from './UnassignedServiceRow';
import { AutoDistributeButton } from './AutoDistributeButton';
import { ShiftHandoffDialog } from '@/components/monitoring/bitacora/ShiftHandoffDialog';
import { cn } from '@/lib/utils';

interface Props {
  activeServiceIds: string[];
  serviceLabelMap: Record<string, string>;
  /** hora_cita map for sorting unassigned */
  serviceHoraCitaMap?: Record<string, string>;
  onClose: () => void;
}

export const CoordinatorCommandCenter: React.FC<Props> = ({
  activeServiceIds, serviceLabelMap, serviceHoraCitaMap = {}, onClose,
}) => {
  const {
    monitoristas, assignedServiceIds, assignmentsByMonitorista,
    assignService, autoDistribute,
  } = useMonitoristaAssignment();

  const [handoffOpen, setHandoffOpen] = React.useState(false);
  const turno = getCurrentTurno();

  const unassigned = activeServiceIds.filter(id => !assignedServiceIds.has(id))
    .sort((a, b) => (serviceHoraCitaMap[a] || '').localeCompare(serviceHoraCitaMap[b] || ''));

  const enTurno = monitoristas.filter(m => m.en_turno);
  const sinTurno = monitoristas.filter(m => !m.en_turno);
  const maxLoad = Math.max(8, ...Object.values(assignmentsByMonitorista).map(a => a.length));

  // Distribution bar data
  const distData = monitoristas.map(m => ({
    name: m.display_name.split(' ')[0],
    count: (assignmentsByMonitorista[m.id] || []).length,
    enTurno: m.en_turno,
  }));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background border-l shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-card">
          <div className="flex items-center gap-2.5">
            <Radio className="h-4 w-4 text-chart-2 animate-pulse" />
            <h2 className="text-sm font-semibold tracking-tight">Coordinación C4</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              Turno: {getTurnoLabel(turno)}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body: 2-column grid */}
        <div className="flex-1 grid grid-cols-[280px_1fr] min-h-0">
          {/* Left: Monitoristas */}
          <div className="border-r flex flex-col">
            <div className="px-4 py-2.5 border-b">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Monitoristas ({enTurno.length} en turno)
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
                      Sin turno activo
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
              </div>
            </ScrollArea>
          </div>

          {/* Right: Unassigned services */}
          <div className="flex flex-col">
            <div className="px-4 py-2.5 border-b flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Sin asignar ({unassigned.length})
              </h3>
            </div>
            <ScrollArea className="flex-1 px-3 py-2">
              <div className="space-y-1.5">
                {unassigned.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">Todos los servicios están asignados</p>
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
        <div className="px-5 py-2.5 border-t bg-card">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              Distribución
            </span>
            {distData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className={cn('text-[10px] font-medium', d.enTurno ? 'text-foreground' : 'text-muted-foreground')}>
                  {d.name}
                </span>
                <div className="flex gap-px">
                  {Array.from({ length: Math.max(d.count, 0) }).map((_, i) => (
                    <div key={i} className="h-2.5 w-1.5 rounded-sm bg-primary" />
                  ))}
                  {d.count === 0 && <div className="h-2.5 w-1.5 rounded-sm bg-muted" />}
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ShiftHandoffDialog open={handoffOpen} onOpenChange={setHandoffOpen} />
    </>
  );
};

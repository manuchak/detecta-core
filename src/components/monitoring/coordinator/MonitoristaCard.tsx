import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Circle, Zap, Plus, Clock } from 'lucide-react';
import type { MonitoristaProfile, MonitoristaAssignment } from '@/hooks/useMonitoristaAssignment';
import { cn } from '@/lib/utils';

interface UnassignedService {
  id: string;
  label: string;
  horaCita?: string;
}

interface Props {
  monitorista: MonitoristaProfile;
  assignments: MonitoristaAssignment[];
  maxLoad: number;
  serviceLabelMap: Record<string, string>;
  unassignedServices?: UnassignedService[];
  onAssign?: (servicioId: string, monitoristaId: string) => void;
  isAssigning?: boolean;
}

function timeAgo(isoDate?: string): string {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h`;
}

function activityColor(lastActivity?: string): string {
  if (!lastActivity) return 'fill-muted text-muted';
  const diffMs = Date.now() - new Date(lastActivity).getTime();
  const mins = diffMs / 60_000;
  if (mins < 30) return 'fill-chart-2 text-chart-2';
  if (mins < 60) return 'fill-yellow-400 text-yellow-400';
  return 'fill-muted text-muted';
}

function loadBorderColor(count: number, maxLoad: number): string {
  if (maxLoad <= 0) return 'border-border';
  const ratio = count / maxLoad;
  if (ratio >= 0.9) return 'border-destructive/60';
  if (ratio >= 0.7) return 'border-amber-500/60';
  return 'border-border';
}

export const MonitoristaCard: React.FC<Props> = ({
  monitorista, assignments, maxLoad, serviceLabelMap,
  unassignedServices = [], onAssign, isAssigning,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const count = assignments.length;
  const ago = timeAgo(monitorista.last_activity);

  return (
    <div className={cn(
      'rounded-xl border bg-card p-3 transition-all',
      monitorista.en_turno
        ? loadBorderColor(count, maxLoad)
        : 'border-dashed border-muted-foreground/20 opacity-60',
    )}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold relative shrink-0',
          monitorista.en_turno
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground',
        )}>
          {monitorista.display_name.charAt(0).toUpperCase()}
          <Circle className={cn(
            'h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5',
            activityColor(monitorista.last_activity),
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">
              {monitorista.display_name.split(' ').slice(0, 2).join(' ')}
            </span>
            {ago && (
              <span className="text-[9px] text-muted-foreground shrink-0">{ago}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {count} servicio{count !== 1 ? 's' : ''}
            </span>
            {(monitorista.event_count || 0) > 0 && (
              <span className="text-[9px] text-chart-2 flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5" />
                {monitorista.event_count}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Assigned services — always visible */}
      <div className="space-y-0.5">
        {assignments.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-1">Sin servicios</p>
        ) : (
          assignments.map(a => {
            const rawLabel = serviceLabelMap[a.servicio_id] || a.servicio_id.slice(0, 12);
            const [folio, ...clienteParts] = rawLabel.split(' — ');
            const cliente = clienteParts.join(' — ');
            return (
            <div key={a.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground py-0.5">
              <User className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">
                <span className="font-mono font-medium text-foreground/80">{folio}</span>
                {cliente && <span className="ml-1">{cliente}</span>}
              </span>
              <div className="ml-auto flex items-center gap-1 shrink-0">
                {a.inferred && (
                  <Badge variant="outline" className="text-[7px] px-1 py-0 border-dashed text-chart-2">
                    auto
                  </Badge>
                )}
                <Badge variant="outline" className="text-[8px] px-1 py-0">{a.turno}</Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* +Asignar button with popover */}
      {monitorista.en_turno && unassignedServices.length > 0 && onAssign && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 h-7 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
            >
              <Plus className="h-3 w-3" />
              Asignar ({unassignedServices.length})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
              Servicios sin cobertura
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {unassignedServices.map(s => {
                const hora = s.horaCita
                  ? new Date(s.horaCita).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  : '—';
                return (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors text-xs disabled:opacity-50"
                    disabled={isAssigning}
                    onClick={() => {
                      onAssign(s.id, monitorista.id);
                      setPopoverOpen(false);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {hora}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

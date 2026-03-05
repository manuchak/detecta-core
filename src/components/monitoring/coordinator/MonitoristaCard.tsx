import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User, ChevronDown, Circle, Zap } from 'lucide-react';
import type { MonitoristaProfile, MonitoristaAssignment } from '@/hooks/useMonitoristaAssignment';
import { cn } from '@/lib/utils';

interface Props {
  monitorista: MonitoristaProfile;
  assignments: MonitoristaAssignment[];
  maxLoad: number;
  serviceLabelMap: Record<string, string>;
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
  if (mins < 30) return 'fill-chart-2 text-chart-2'; // green - active
  if (mins < 60) return 'fill-yellow-400 text-yellow-400'; // yellow - recent
  return 'fill-muted text-muted'; // grey - stale
}

export const MonitoristaCard: React.FC<Props> = ({
  monitorista, assignments, maxLoad, serviceLabelMap,
}) => {
  const [open, setOpen] = useState(false);
  const count = assignments.length;
  const loadPct = maxLoad > 0 ? Math.min((count / maxLoad) * 100, 100) : 0;
  const ago = timeAgo(monitorista.last_activity);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn(
        'rounded-xl border bg-card p-3 transition-all',
        monitorista.en_turno ? 'border-border' : 'border-dashed border-muted-foreground/20 opacity-60',
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold relative',
              monitorista.en_turno
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground',
            )}>
              {monitorista.display_name.charAt(0).toUpperCase()}
              {/* Activity pulse dot */}
              <Circle className={cn(
                'h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5',
                activityColor(monitorista.last_activity),
              )} />
            </div>

            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">
                  {monitorista.display_name.split(' ').slice(0, 2).join(' ')}
                </span>
                {ago && (
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {ago}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={loadPct} className="h-1.5 flex-1" />
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {count} serv.
                </span>
                {(monitorista.event_count || 0) > 0 && (
                  <span className="text-[9px] text-chart-2 flex items-center gap-0.5 shrink-0">
                    <Zap className="h-2.5 w-2.5" />
                    {monitorista.event_count}
                  </span>
                )}
              </div>
            </div>

            <ChevronDown className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0',
              open && 'rotate-180',
            )} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2 pt-2 border-t space-y-1">
            {assignments.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-1">Sin servicios</p>
            ) : (
              assignments.map(a => (
                <div key={a.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground py-0.5">
                  <User className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{serviceLabelMap[a.servicio_id] || a.servicio_id.slice(0, 12)}</span>
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

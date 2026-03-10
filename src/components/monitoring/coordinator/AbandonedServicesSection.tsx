import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmTransitionDialog } from '@/components/monitoring/bitacora/ConfirmTransitionDialog';
import { UserX, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MonitoristaProfile, MonitoristaAssignment } from '@/hooks/useMonitoristaAssignment';

interface AbandonedGroup {
  monitorista: MonitoristaProfile;
  assignments: MonitoristaAssignment[];
}

interface Props {
  monitoristas: MonitoristaProfile[];
  assignmentsByMonitorista: Record<string, MonitoristaAssignment[]>;
  serviceLabelMap: Record<string, string>;
  onReassign: (params: { assignmentId: string; newMonitoristaId: string; servicioId: string; turno: string }) => void;
  isReassigning: boolean;
  currentTurno: string;
}

export const AbandonedServicesSection: React.FC<Props> = ({
  monitoristas, assignmentsByMonitorista, serviceLabelMap,
  onReassign, isReassigning, currentTurno,
}) => {
  const [confirmTarget, setConfirmTarget] = useState<{
    assignment: MonitoristaAssignment;
    newMonitoristaId: string;
    originalName: string;
    newName: string;
    serviceName: string;
  } | null>(null);

  // Pending selection per assignment
  const [selectedMonitorista, setSelectedMonitorista] = useState<Record<string, string>>({});

  // Detect abandoned: monitoristas NOT en_turno but WITH active assignments
  const abandonedGroups: AbandonedGroup[] = useMemo(() => {
    const offDuty = monitoristas.filter(m => !m.en_turno);
    return offDuty
      .map(m => ({
        monitorista: m,
        assignments: (assignmentsByMonitorista[m.id] || []).filter(a => a.activo),
      }))
      .filter(g => g.assignments.length > 0);
  }, [monitoristas, assignmentsByMonitorista]);

  const totalAbandoned = abandonedGroups.reduce((sum, g) => sum + g.assignments.length, 0);
  const enTurno = monitoristas.filter(m => m.en_turno);

  if (totalAbandoned === 0) return null;

  const handleConfirmReassign = () => {
    if (!confirmTarget) return;
    onReassign({
      assignmentId: confirmTarget.assignment.id,
      newMonitoristaId: confirmTarget.newMonitoristaId,
      servicioId: confirmTarget.assignment.servicio_id,
      turno: currentTurno,
    });
    setConfirmTarget(null);
    setSelectedMonitorista(prev => {
      const next = { ...prev };
      delete next[confirmTarget.assignment.id];
      return next;
    });
  };

  return (
    <Card className="border-destructive/30 bg-destructive/[0.02] backdrop-blur-sm">
      <CardHeader className="pb-3 px-5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center">
              <UserX className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-sm font-semibold">Servicios Abandonados</CardTitle>
          </div>
          <Badge variant="destructive" className="text-[10px] tabular-nums">
            {totalAbandoned} huérfano{totalAbandoned !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-3">
        {abandonedGroups.map(group => (
          <div key={group.monitorista.id} className="space-y-1.5">
            {/* Monitorista header */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="line-through opacity-60">{group.monitorista.display_name}</span>
              <span>·</span>
              {group.monitorista.last_activity ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(group.monitorista.last_activity), { addSuffix: true, locale: es })}
                </span>
              ) : (
                <span className="text-destructive/70">sin actividad reciente</span>
              )}
            </div>

            {/* Service rows */}
            {group.assignments.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-background/60 px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {serviceLabelMap[a.servicio_id] || a.servicio_id.slice(0, 10)}
                  </p>
                </div>

                <Select
                  value={selectedMonitorista[a.id] || ''}
                  onValueChange={(val) => setSelectedMonitorista(prev => ({ ...prev, [a.id]: val }))}
                  disabled={isReassigning}
                >
                  <SelectTrigger className="w-[120px] h-7 text-[11px]">
                    <SelectValue placeholder="Reasignar a…" />
                  </SelectTrigger>
                  <SelectContent>
                    {enTurno.map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.display_name.split(' ')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-7 gap-1 text-[11px] border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={!selectedMonitorista[a.id] || isReassigning}
                  onClick={() => {
                    const newMId = selectedMonitorista[a.id];
                    const newM = enTurno.find(m => m.id === newMId);
                    setConfirmTarget({
                      assignment: a,
                      newMonitoristaId: newMId,
                      originalName: group.monitorista.display_name,
                      newName: newM?.display_name || '',
                      serviceName: serviceLabelMap[a.servicio_id] || a.servicio_id.slice(0, 10),
                    });
                  }}
                >
                  Reasignar
                </Button>
              </div>
            ))}
          </div>
        ))}
      </CardContent>

      <ConfirmTransitionDialog
        open={!!confirmTarget}
        onOpenChange={(v) => !v && setConfirmTarget(null)}
        title="Reasignar servicio abandonado"
        description={
          confirmTarget
            ? `¿Confirmas reasignar "${confirmTarget.serviceName}" de ${confirmTarget.originalName} (inactivo) a ${confirmTarget.newName}?`
            : ''
        }
        confirmLabel="Reasignar"
        destructive
        isPending={isReassigning}
        requireDoubleConfirm
        doubleConfirmLabel="Confirmo que este monitorista abandonó su turno sin entrega formal"
        onConfirm={handleConfirmReassign}
      />
    </Card>
  );
};

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Radio, UserPlus, ArrowRightLeft } from 'lucide-react';
import { useMonitoristaAssignment } from '@/hooks/useMonitoristaAssignment';
import { useUserRole } from '@/hooks/useUserRole';
import { CoordinatorAssignmentDialog } from './CoordinatorAssignmentDialog';
import { ShiftHandoffDialog } from './ShiftHandoffDialog';

interface Props {
  /** Active service IDs on the board for assignment dialog */
  activeServiceIds?: string[];
  /** Map servicio_id -> label */
  serviceLabelMap?: Record<string, string>;
}

const COORDINATOR_ROLES = ['monitoring_supervisor', 'coordinador_operaciones', 'admin', 'owner'] as const;

export const MonitoristaAssignmentBar: React.FC<Props> = ({
  activeServiceIds = [],
  serviceLabelMap = {},
}) => {
  const { myAssignments, isLoading, monitoristas, assignmentsByMonitorista } = useMonitoristaAssignment();
  const { hasAnyRole } = useUserRole();
  const isCoordinator = hasAnyRole(COORDINATOR_ROLES as any);

  const [assignOpen, setAssignOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);

  if (isLoading) return null;

  const turno = myAssignments.length > 0 ? myAssignments[0].turno : 'matutino';
  const turnoLabel: Record<string, string> = {
    matutino: 'Matutino',
    vespertino: 'Vespertino',
    nocturno: 'Nocturno',
  };

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card flex-wrap">
        {/* Left: title */}
        <div className="flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-chart-2 animate-pulse" />
          <span className="text-xs font-medium">Hoja de Seguimiento</span>
        </div>

        <div className="flex-1" />

        {/* Coordinator: monitorist chips */}
        {isCoordinator && monitoristas.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {monitoristas.map(m => {
              const count = (assignmentsByMonitorista[m.id] || []).length;
              return (
                <Badge key={m.id} variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                  <User className="h-2.5 w-2.5" />
                  {m.display_name.split(' ')[0]} · {count}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Coordinator: action buttons */}
        {isCoordinator && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setAssignOpen(true)}>
              <UserPlus className="h-3 w-3" /> Asignar
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setHandoffOpen(true)}>
              <ArrowRightLeft className="h-3 w-3" /> Cambio Turno
            </Button>
          </div>
        )}

        {/* Regular monitorist info */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
            <User className="h-2.5 w-2.5" />
            Turno: {turnoLabel[turno] || turno}
          </Badge>
          {myAssignments.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              {myAssignments.length} asignados
            </Badge>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CoordinatorAssignmentDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        activeServiceIds={activeServiceIds}
        serviceLabelMap={serviceLabelMap}
      />
      <ShiftHandoffDialog open={handoffOpen} onOpenChange={setHandoffOpen} />
    </>
  );
};

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Radio, UserPlus, ArrowRightLeft, LogOut } from 'lucide-react';
import { useMonitoristaAssignment, getCurrentTurno, getTurnoLabel } from '@/hooks/useMonitoristaAssignment';
import { useUserRole } from '@/hooks/useUserRole';
import { CoordinatorCommandCenter } from '../coordinator/CoordinatorCommandCenter';
import { ShiftHandoffDialog } from './ShiftHandoffDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Props {
  activeServiceIds?: string[];
  serviceLabelMap?: Record<string, string>;
  serviceHoraCitaMap?: Record<string, string>;
}

const COORDINATOR_ROLES = ['monitoring_supervisor', 'coordinador_operaciones', 'admin', 'owner'] as const;

export const MonitoristaAssignmentBar: React.FC<Props> = ({
  activeServiceIds = [],
  serviceLabelMap = {},
  serviceHoraCitaMap = {},
}) => {
  const { myAssignments, isLoading, monitoristas, assignmentsByMonitorista } = useMonitoristaAssignment();
  const { hasAnyRole } = useUserRole();
  const isCoordinator = hasAnyRole(COORDINATOR_ROLES as any);

  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [selfHandoffOpen, setSelfHandoffOpen] = useState(false);

  // Get current user id for self-handoff
  const currentUserQuery = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    staleTime: Infinity,
  });

  if (isLoading) return null;

  const turno = getCurrentTurno();
  const currentUserId = currentUserQuery.data;

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
            <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setCommandCenterOpen(true)}>
              <UserPlus className="h-3 w-3" /> Asignar
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setHandoffOpen(true)}>
              <ArrowRightLeft className="h-3 w-3" /> Cambio Turno
            </Button>
          </div>
        )}

        {/* Regular monitorist info + self-handoff */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
            <User className="h-2.5 w-2.5" />
            Turno: {getTurnoLabel(turno)}
          </Badge>
          {myAssignments.length > 0 && (
            <>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                {myAssignments.length} asignados
              </Badge>
              {!isCoordinator && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] gap-1 px-2"
                  onClick={() => setSelfHandoffOpen(true)}
                >
                  <LogOut className="h-3 w-3" /> Entregar mi turno
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Command Center as overlay */}
      {commandCenterOpen && (
        <CoordinatorCommandCenter onClose={() => setCommandCenterOpen(false)} />
      )}

      {/* Coordinator handoff (full control) */}
      <ShiftHandoffDialog open={handoffOpen} onOpenChange={setHandoffOpen} />

      {/* Self-handoff (monitorist only delivers their own services) */}
      {currentUserId && (
        <ShiftHandoffDialog
          open={selfHandoffOpen}
          onOpenChange={setSelfHandoffOpen}
          selfMonitoristaId={currentUserId}
        />
      )}
    </>
  );
};

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Radio, UserPlus, ArrowRightLeft, LogOut, Coffee, Bath, Eye, Play, Pause, ShieldCheck } from 'lucide-react';
import { useClaveNoAmago } from '@/hooks/useClaveNoAmago';
import { useMonitoristaAssignment, getCurrentTurno, getTurnoLabel } from '@/hooks/useMonitoristaAssignment';
import { useMonitoristaPause, type TipoPausa, getPauseLabel } from '@/hooks/useMonitoristaPause';
import { useUserRole } from '@/hooks/useUserRole';
import { CoordinatorCommandCenter } from '../coordinator/CoordinatorCommandCenter';
import { ShiftHandoffDialog } from './ShiftHandoffDialog';
import { PauseConfirmDialog } from './PauseConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Props {
  activeServiceIds?: string[];
  serviceLabelMap?: Record<string, string>;
  serviceHoraCitaMap?: Record<string, string>;
}

const COORDINATOR_ROLES = ['monitoring_supervisor', 'coordinador_operaciones', 'admin', 'owner'] as const;

function formatCountdown(totalSeconds: number | null): string {
  if (totalSeconds === null) return '';
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const sign = totalSeconds < 0 ? '+' : '';
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
}

export const MonitoristaAssignmentBar: React.FC<Props> = ({
  activeServiceIds = [],
  serviceLabelMap = {},
  serviceHoraCitaMap = {},
}) => {
  const { myAssignments, isLoading, monitoristas, assignmentsByMonitorista } = useMonitoristaAssignment();
  const { hasAnyRole } = useUserRole();
  const isCoordinator = hasAnyRole(COORDINATOR_ROLES as any);

  const {
    pausaActiva,
    segundosRestantes,
    excedido,
    iniciarPausa,
    finalizarPausa,
    previewRedistribution,
    pausasPorMonitorista,
  } = useMonitoristaPause();

  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [selfHandoffOpen, setSelfHandoffOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedPauseType, setSelectedPauseType] = useState<TipoPausa | null>(null);

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

  const handlePauseSelect = (tipo: TipoPausa) => {
    setSelectedPauseType(tipo);
    setPauseDialogOpen(true);
  };

  const handlePauseConfirm = (tipo: TipoPausa) => {
    iniciarPausa.mutate(tipo, {
      onSuccess: () => setPauseDialogOpen(false),
    });
  };

  const handleRetomar = () => {
    finalizarPausa.mutate();
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
              const pausa = pausasPorMonitorista.get(m.id);
              return (
                <Badge
                  key={m.id}
                  variant="outline"
                  className={`text-[10px] gap-1 px-2 py-0.5 ${
                    pausa
                      ? 'border-chart-4/50 bg-chart-4/10 text-chart-4'
                      : ''
                  }`}
                >
                  {pausa ? (
                    <Pause className="h-2.5 w-2.5" />
                  ) : (
                    <User className="h-2.5 w-2.5" />
                  )}
                  {m.display_name.split(' ')[0]}
                  {pausa
                    ? ` · ${getPauseLabel(pausa.tipo_pausa as TipoPausa)}`
                    : ` · ${count}`}
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

        {/* Regular monitorist info + pause + self-handoff */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
            <User className="h-2.5 w-2.5" />
            Turno: {getTurnoLabel(turno)}
          </Badge>

          {/* Active pause: show countdown + retomar */}
          {pausaActiva ? (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] gap-1 px-2 py-0.5 font-mono ${
                  excedido
                    ? 'border-destructive/50 bg-destructive/10 text-destructive animate-pulse'
                    : 'border-chart-4/50 bg-chart-4/10 text-chart-4'
                }`}
              >
                <Pause className="h-2.5 w-2.5" />
                {getPauseLabel(pausaActiva.tipo_pausa as TipoPausa)}: {formatCountdown(segundosRestantes)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1 px-2 border-chart-2/50 text-chart-2 hover:bg-chart-2/10"
                onClick={handleRetomar}
                disabled={finalizarPausa.isPending}
              >
                <Play className="h-3 w-3" />
                {finalizarPausa.isPending ? 'Retomando…' : 'Retomar'}
              </Button>
            </div>
          ) : (
            <>
              {myAssignments.length > 0 && (
                <>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    {myAssignments.length} asignados
                  </Badge>

                  {/* Pause dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2">
                        <Coffee className="h-3 w-3" /> Pausa
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[180px]">
                      <DropdownMenuItem onClick={() => handlePauseSelect('comida')} className="text-xs gap-2">
                        <Coffee className="h-3.5 w-3.5" /> Comida <span className="ml-auto text-muted-foreground">(máx 1h)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePauseSelect('bano')} className="text-xs gap-2">
                        <Bath className="h-3.5 w-3.5" /> Baño <span className="ml-auto text-muted-foreground">(máx 10m)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePauseSelect('descanso')} className="text-xs gap-2">
                        <Eye className="h-3.5 w-3.5" /> Descanso visual <span className="ml-auto text-muted-foreground">(máx 10m)</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

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

      {/* Pause confirmation dialog */}
      <PauseConfirmDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        tipoPausa={selectedPauseType}
        onConfirm={handlePauseConfirm}
        isPending={iniciarPausa.isPending}
        previewFn={previewRedistribution}
      />
    </>
  );
};

import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Check } from 'lucide-react';
import { useMonitoristaAssignment, MonitoristaProfile } from '@/hooks/useMonitoristaAssignment';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** IDs of active services on the board (en_curso / en_destino) */
  activeServiceIds: string[];
  /** Map servicio_id -> client label for display */
  serviceLabelMap: Record<string, string>;
}

export const CoordinatorAssignmentDialog: React.FC<Props> = ({
  open, onOpenChange, activeServiceIds, serviceLabelMap,
}) => {
  const {
    assignedServiceIds, assignmentsByMonitorista, monitoristas, assignService,
  } = useMonitoristaAssignment();

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedMonitorista, setSelectedMonitorista] = useState<string | null>(null);

  const unassigned = activeServiceIds.filter(id => !assignedServiceIds.has(id));

  const handleAssign = () => {
    if (!selectedService || !selectedMonitorista) return;
    assignService.mutate(
      { servicioId: selectedService, monitoristaId: selectedMonitorista },
      {
        onSuccess: () => {
          setSelectedService(null);
          setSelectedMonitorista(null);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Asignar Servicios
          </DialogTitle>
          <DialogDescription>
            Selecciona un servicio sin asignar y un monitorista para asignarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 min-h-[280px]">
          {/* Left: unassigned services */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sin asignar ({unassigned.length})
            </h4>
            <ScrollArea className="h-[240px] pr-2">
              {unassigned.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Todos los servicios están asignados
                </p>
              ) : (
                unassigned.map(sId => (
                  <button
                    key={sId}
                    onClick={() => setSelectedService(sId)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors border
                      ${selectedService === sId
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-transparent hover:bg-muted/60 text-foreground'}`}
                  >
                    {serviceLabelMap[sId] || sId.slice(0, 12)}
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Right: monitoristas */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monitoristas
            </h4>
            <ScrollArea className="h-[240px] pr-2">
              {monitoristas.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No hay monitoristas activos
                </p>
              ) : (
                monitoristas.map((m: MonitoristaProfile) => {
                  const count = (assignmentsByMonitorista[m.id] || []).length;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMonitorista(m.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors border flex items-center justify-between
                        ${selectedMonitorista === m.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-transparent hover:bg-muted/60 text-foreground'}`}
                    >
                      <span>{m.display_name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {count} serv.
                      </Badge>
                    </button>
                  );
                })
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedService || !selectedMonitorista || assignService.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

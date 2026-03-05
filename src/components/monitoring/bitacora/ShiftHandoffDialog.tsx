import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { useMonitoristaAssignment, MonitoristaProfile } from '@/hooks/useMonitoristaAssignment';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TURNOS = [
  { value: 'matutino', label: 'Matutino' },
  { value: 'vespertino', label: 'Vespertino' },
  { value: 'nocturno', label: 'Nocturno' },
];

export const ShiftHandoffDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { monitoristas, assignmentsByMonitorista, handoffTurno } = useMonitoristaAssignment();

  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [turno, setTurno] = useState<string>('matutino');
  const [notas, setNotas] = useState('');

  const fromAssignments = fromId ? (assignmentsByMonitorista[fromId] || []) : [];
  const hasServices = fromAssignments.length > 0;

  const handleHandoff = () => {
    if (!fromId || !toId || !notas.trim()) return;
    handoffTurno.mutate(
      { fromMonitoristaId: fromId, toMonitoristaId: toId, notas: notas.trim(), turno },
      {
        onSuccess: () => {
          setFromId('');
          setToId('');
          setNotas('');
          onOpenChange(false);
        },
      },
    );
  };

  const availableTo = monitoristas.filter((m: MonitoristaProfile) => m.id !== fromId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" /> Cambio de Turno
          </DialogTitle>
          <DialogDescription>
            Transfiere todos los servicios activos de un monitorista a otro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* From */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Monitorista saliente</label>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {monitoristas.map((m: MonitoristaProfile) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.display_name} ({(assignmentsByMonitorista[m.id] || []).length} serv.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active services of "from" */}
          {fromId && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Servicios a transferir ({fromAssignments.length})
              </label>
              <ScrollArea className="h-[100px] border rounded-md p-2">
                {fromAssignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Sin servicios activos</p>
                ) : (
                  fromAssignments.map(a => (
                    <div key={a.id} className="flex items-center gap-2 py-1 text-xs">
                      <Badge variant="outline" className="text-[10px]">{a.turno}</Badge>
                      <span className="truncate">{a.servicio_id.slice(0, 12)}</span>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          )}

          {/* To */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Monitorista entrante</label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {availableTo.map((m: MonitoristaProfile) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Turno */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Turno entrante</label>
            <Select value={turno} onValueChange={setTurno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TURNOS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              Notas de entrega
              {hasServices && <AlertTriangle className="h-3 w-3 text-warning" />}
            </label>
            <Textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Describe el estado actual de los servicios, eventos pendientes, etc."
              rows={3}
            />
            {hasServices && !notas.trim() && (
              <p className="text-[10px] text-destructive">Las notas son obligatorias cuando hay servicios activos.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleHandoff}
            disabled={
              !fromId || !toId || fromId === toId
              || (hasServices && !notas.trim())
              || handoffTurno.isPending
            }
          >
            Entregar Turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

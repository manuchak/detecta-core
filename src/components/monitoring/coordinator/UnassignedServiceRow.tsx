import React from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Clock } from 'lucide-react';
import type { MonitoristaProfile } from '@/hooks/useMonitoristaAssignment';

interface Props {
  servicioId: string;
  label: string;
  horaCita?: string;
  monitoristas: MonitoristaProfile[];
  onAssign: (servicioId: string, monitoristaId: string) => void;
  disabled?: boolean;
}

export const UnassignedServiceRow: React.FC<Props> = ({
  servicioId, label, horaCita, monitoristas, onAssign, disabled,
}) => {
  const hora = horaCita ? new Date(horaCita).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 group hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="h-2.5 w-2.5" /> {hora}
        </p>
      </div>

      <Select
        onValueChange={(mId) => onAssign(servicioId, mId)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[130px] h-7 text-[11px]">
          <SelectValue placeholder="Asignar a..." />
        </SelectTrigger>
        <SelectContent>
          {monitoristas.filter(m => m.en_turno).map(m => (
            <SelectItem key={m.id} value={m.id} className="text-xs">
              {m.display_name.split(' ')[0]}
            </SelectItem>
          ))}
          {monitoristas.filter(m => !m.en_turno).length > 0 && (
            <>
              <div className="px-2 py-1 text-[9px] text-muted-foreground uppercase">Sin turno</div>
              {monitoristas.filter(m => !m.en_turno).map(m => (
                <SelectItem key={m.id} value={m.id} className="text-xs opacity-60">
                  {m.display_name.split(' ')[0]}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

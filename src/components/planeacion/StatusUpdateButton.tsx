import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPinCheck, RotateCcw, ChevronDown, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCDMXTime } from '@/utils/cdmxTimezone';

export type OperationalStatus = 'sin_asignar' | 'programado' | 'armado_pendiente' | 'pendiente_inicio' | 'en_sitio' | 'en_curso' | 'completado';

interface StatusUpdateButtonProps {
  serviceId: string;
  currentStatus: OperationalStatus;
  onStatusChange: (serviceId: string, action: 'mark_on_site' | 'revert_to_scheduled') => Promise<void>;
  disabled?: boolean;
  /** @deprecated Use local loading — this prop is ignored now */
  isLoading?: boolean;
  className?: string;
  /** Hora real de llegada del custodio para mostrar en badge "Arribado" */
  horaLlegadaCustodio?: string | null;
}

/**
 * Botón para cambiar el estado operativo de un servicio.
 * Usa loading LOCAL por servicio para no bloquear otros botones.
 */
export function StatusUpdateButton({
  serviceId,
  currentStatus,
  onStatusChange,
  disabled = false,
  className,
  horaLlegadaCustodio
}: StatusUpdateButtonProps) {
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const canMarkOnSite = ['programado', 'armado_pendiente', 'pendiente_inicio', 'en_curso'].includes(currentStatus);
  const canRevert = currentStatus === 'en_sitio';
  
  if (!canMarkOnSite && !canRevert) {
    return null;
  }

  const handleAction = async (action: 'mark_on_site' | 'revert_to_scheduled') => {
    setIsLocalLoading(true);
    try {
      await onStatusChange(serviceId, action);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLocalLoading(false);
    }
  };

  // Si puede marcar como "En sitio"
  if (canMarkOnSite) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleAction('mark_on_site');
        }}
        disabled={disabled || isLocalLoading}
        className={cn(
          "h-7 px-2 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30",
          className
        )}
      >
        <MapPinCheck className="w-3 h-3" />
        {isLocalLoading ? 'Marcando...' : 'En sitio'}
      </Button>
    );
  }

  // Si está "En sitio" → Badge "Arribado" prominente + dropdown para revertir
  if (canRevert) {
    const arrivalTimeDisplay = horaLlegadaCustodio
      ? horaLlegadaCustodio.substring(0, 5)
      : null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isLocalLoading}
            className={cn(
              "h-7 px-2 text-xs gap-1 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/50 font-medium",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <CheckCircle className="w-3 h-3" />
            Arribado{arrivalTimeDisplay ? ` ${arrivalTimeDisplay}` : ''}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleAction('revert_to_scheduled');
            }}
            className="text-xs gap-2 text-amber-600 dark:text-amber-400"
          >
            <RotateCcw className="w-3 h-3" />
            Revertir a Programado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}

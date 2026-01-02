import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPinCheck, RotateCcw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OperationalStatus = 'sin_asignar' | 'programado' | 'armado_pendiente' | 'pendiente_inicio' | 'en_sitio' | 'completado';

interface StatusUpdateButtonProps {
  serviceId: string;
  currentStatus: OperationalStatus;
  onStatusChange: (serviceId: string, action: 'mark_on_site' | 'revert_to_scheduled') => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

/**
 * Botón para cambiar el estado operativo de un servicio.
 * Permite marcar como "En sitio" o revertir a "Programado".
 */
export function StatusUpdateButton({
  serviceId,
  currentStatus,
  onStatusChange,
  disabled = false,
  isLoading = false,
  className
}: StatusUpdateButtonProps) {
  // Solo mostrar para estados donde el cambio manual tiene sentido
  const canMarkOnSite = ['programado', 'armado_pendiente', 'pendiente_inicio'].includes(currentStatus);
  const canRevert = currentStatus === 'en_sitio';
  
  // No mostrar para estados que no permiten cambio manual
  if (!canMarkOnSite && !canRevert) {
    return null;
  }

  const handleAction = async (action: 'mark_on_site' | 'revert_to_scheduled') => {
    try {
      await onStatusChange(serviceId, action);
    } catch (error) {
      console.error('Error updating status:', error);
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
        disabled={disabled || isLoading}
        className={cn(
          "h-7 px-2 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30",
          className
        )}
      >
        <MapPinCheck className="w-3 h-3" />
        En sitio
      </Button>
    );
  }

  // Si está "En sitio" y puede revertir
  if (canRevert) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isLoading}
            className={cn(
              "h-7 px-2 text-xs gap-1 border-slate-200 dark:border-slate-700",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MapPinCheck className="w-3 h-3 text-blue-500" />
            En sitio
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

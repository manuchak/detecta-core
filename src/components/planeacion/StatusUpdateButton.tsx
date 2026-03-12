import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPinCheck, RotateCcw, ChevronDown, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OperationalStatus = 'sin_asignar' | 'programado' | 'armado_pendiente' | 'pendiente_inicio' | 'en_sitio' | 'en_curso' | 'completado';

interface StatusUpdateButtonProps {
  serviceId: string;
  currentStatus: OperationalStatus;
  onStatusChange: (serviceId: string, action: 'mark_on_site' | 'revert_to_scheduled') => Promise<void>;
  onOptimisticChange?: (serviceId: string, arrival: string | null) => void;
  disabled?: boolean;
  /** @deprecated Use local loading — this prop is ignored now */
  isLoading?: boolean;
  className?: string;
  horaLlegadaCustodio?: string | null;
}

export function StatusUpdateButton({
  serviceId,
  currentStatus,
  onStatusChange,
  disabled = false,
  className,
  horaLlegadaCustodio
}: StatusUpdateButtonProps) {
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [optimisticArrival, setOptimisticArrival] = useState<string | null>(null);

  const getNowCDMX = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-GB', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });
  };

  // Optimistic: show "Arribado" immediately or when server confirms
  const showArribado = optimisticArrival || currentStatus === 'en_sitio';
  const canMarkOnSite = !showArribado && ['programado', 'armado_pendiente', 'pendiente_inicio', 'en_curso'].includes(currentStatus);
  const canRevert = currentStatus === 'en_sitio' || !!optimisticArrival;

  if (!canMarkOnSite && !showArribado) {
    return null;
  }

  const handleMarkOnSite = async () => {
    const arrivalTime = getNowCDMX();
    setOptimisticArrival(arrivalTime);
    setIsLocalLoading(true);
    try {
      await onStatusChange(serviceId, 'mark_on_site');
    } catch (error) {
      console.error('Error updating status:', error);
      setOptimisticArrival(null); // revert on failure
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleRevert = async () => {
    setIsLocalLoading(true);
    setOptimisticArrival(null);
    try {
      await onStatusChange(serviceId, 'revert_to_scheduled');
    } catch (error) {
      console.error('Error reverting status:', error);
    } finally {
      setIsLocalLoading(false);
    }
  };

  if (canMarkOnSite) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleMarkOnSite();
        }}
        disabled={disabled || isLocalLoading}
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

  // Show "Arribado" badge — use server time if available, else optimistic
  if (showArribado) {
    const arrivalTimeDisplay = horaLlegadaCustodio
      ? horaLlegadaCustodio.substring(0, 5)
      : optimisticArrival ?? null;

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
              handleRevert();
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

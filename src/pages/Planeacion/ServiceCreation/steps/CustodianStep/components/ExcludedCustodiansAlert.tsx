/**
 * ExcludedCustodiansAlert - Inline banner showing why custodians are excluded from search
 * Only visible when there's an active search AND excluded custodians exist
 */

import { Info, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface RechazadoDetail {
  id: string;
  nombre: string;
  vigencia_hasta: string;
  motivo: string | null;
}

interface ExcludedCustodiansAlertProps {
  searchTerm: string;
  rechazadosCount: number;
  conflictoCount: number;
  /** Rechazados whose name matches the current search */
  rechazadosMatchingSearch: RechazadoDetail[];
  onViewConflicts?: () => void;
}

export function ExcludedCustodiansAlert({
  searchTerm,
  rechazadosCount,
  conflictoCount,
  rechazadosMatchingSearch,
  onViewConflicts,
}: ExcludedCustodiansAlertProps) {
  // Only show when there's an active search AND exclusions exist
  if (!searchTerm.trim()) return null;
  if (rechazadosCount === 0 && conflictoCount === 0) return null;

  const totalExcluded = rechazadosCount + conflictoCount;
  const hasMatchingRechazados = rechazadosMatchingSearch.length > 0;

  return (
    <Alert className="border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30">
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        {hasMatchingRechazados && rechazadosMatchingSearch.length === 1 ? (
          // Specific message: exactly 1 rejected custodian matches search
          <div className="space-y-1">
            <p className="font-medium">
              "{searchTerm}" coincide con un custodio excluido
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-semibold">{rechazadosMatchingSearch[0].nombre}</span>
              {' — '}
              Rechazo vigente hasta{' '}
              {format(new Date(rechazadosMatchingSearch[0].vigencia_hasta), "d 'de' MMM", { locale: es })}
              {rechazadosMatchingSearch[0].motivo && (
                <span className="text-amber-600 dark:text-amber-400">
                  {' · '}{rechazadosMatchingSearch[0].motivo}
                </span>
              )}
            </p>
          </div>
        ) : (
          // Generic message: multiple exclusions
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p>
              <span className="font-medium">{totalExcluded} custodio{totalExcluded > 1 ? 's' : ''} no visible{totalExcluded > 1 ? 's' : ''}</span>
              {': '}
              {rechazadosCount > 0 && (
                <span>{rechazadosCount} con rechazo vigente</span>
              )}
              {rechazadosCount > 0 && conflictoCount > 0 && ', '}
              {conflictoCount > 0 && (
                <span>{conflictoCount} con conflicto horario</span>
              )}
            </p>
            {conflictoCount > 0 && onViewConflicts && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50 h-7 px-2"
                onClick={onViewConflicts}
              >
                <Eye className="h-3.5 w-3.5" />
                Ver en conflictos
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

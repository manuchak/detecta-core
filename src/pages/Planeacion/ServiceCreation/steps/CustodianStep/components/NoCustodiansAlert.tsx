/**
 * NoCustodiansAlert - Diagnostic alert when no custodians are visible
 * Helps planners understand WHY the list is empty and provides recovery actions
 */

import { AlertTriangle, RefreshCw, Filter, Users, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NoCustodiansAlertProps {
  /** Counts from the categorized data */
  counts: {
    disponibles: number;
    parcialmenteOcupados: number;
    ocupados: number;
    noDisponibles: number;
  };
  /** Whether filters are currently active */
  hasActiveFilters: boolean;
  /** Current search term if any */
  searchTerm: string;
  /** Callback to reset filters */
  onResetFilters: () => void;
  /** Callback to scroll to conflict section */
  onScrollToConflicts: () => void;
  /** Callback to refetch data */
  onRefetch: () => void;
  /** Is data loading? */
  isLoading: boolean;
}

export function NoCustodiansAlert({
  counts,
  hasActiveFilters,
  searchTerm,
  onResetFilters,
  onScrollToConflicts,
  onRefetch,
  isLoading,
}: NoCustodiansAlertProps) {
  const totalLibres = counts.disponibles + counts.parcialmenteOcupados + counts.ocupados;
  const allInConflict = totalLibres === 0 && counts.noDisponibles > 0;
  const noDataAtAll = totalLibres === 0 && counts.noDisponibles === 0;
  const filteredOut = !noDataAtAll && !allInConflict;

  // Scenario 1: All custodians are in conflict - MOST CRITICAL
  if (allInConflict) {
    return (
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">
          Todos los custodios ({counts.noDisponibles}) tienen conflicto
        </AlertTitle>
        <AlertDescription className="space-y-3 text-amber-700 dark:text-amber-300">
          <p>
            No hay custodios disponibles sin conflicto para este horario. Puedes:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Asignar uno con <strong>override y justificación</strong> (para viajes de retorno, etc.)</li>
            <li>Cambiar la fecha/hora del servicio desde el paso anterior</li>
            <li>Contactar a Recursos Humanos para disponibilidad adicional</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button 
              variant="default"
              size="sm"
              onClick={onScrollToConflicts}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <ChevronDown className="h-4 w-4" />
              Ver {counts.noDisponibles} custodio{counts.noDisponibles > 1 ? 's' : ''} con conflicto
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={onRefetch}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Scenario 2: Filters are hiding everything
  if (filteredOut && (hasActiveFilters || searchTerm)) {
    return (
      <Alert className="border-muted">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <AlertTitle>Filtros activos ocultando resultados</AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-muted-foreground">
            {searchTerm && `Búsqueda: "${searchTerm}". `}
            Los filtros actuales no muestran ningún custodio.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Restablecer filtros
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Scenario 3: No data at all (rare - possible RLS or connectivity issue)
  if (noDataAtAll) {
    return (
      <Alert variant="destructive">
        <Users className="h-5 w-5" />
        <AlertTitle>Sin datos de custodios</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            No se encontraron custodios en el sistema. Esto puede indicar un problema de permisos o conectividad.
          </p>
          <div className="text-xs bg-destructive/10 p-2 rounded space-y-1">
            <p>Diagnóstico:</p>
            <ul className="list-disc pl-4">
              <li>Disponibles: {counts.disponibles}</li>
              <li>Parciales: {counts.parcialmenteOcupados}</li>
              <li>Ocupados: {counts.ocupados}</li>
              <li>En conflicto: {counts.noDisponibles}</li>
            </ul>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={onRefetch}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reintentar carga
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Default: shouldn't reach here, but show generic message
  return (
    <Alert>
      <Users className="h-5 w-5 text-muted-foreground" />
      <AlertTitle>No hay custodios visibles</AlertTitle>
      <AlertDescription>
        Ajusta los filtros o actualiza la lista.
        <Button 
          variant="link"
          size="sm"
          onClick={onResetFilters}
          className="pl-1"
        >
          Restablecer filtros
        </Button>
      </AlertDescription>
    </Alert>
  );
}

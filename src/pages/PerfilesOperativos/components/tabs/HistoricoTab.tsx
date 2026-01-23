import { useState, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, History, RefreshCw } from 'lucide-react';
import { useProfileTimeline, TimelineEventType } from '../../hooks/useProfileTimeline';
import { TimelineEventCard } from './historico/TimelineEventCard';
import { TimelineFilters } from './historico/TimelineFilters';
import { TimelineStatsCard } from './historico/TimelineStatsCard';
import { PendingSubsystemsCard } from './historico/PendingSubsystemsCard';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoricoTabProps {
  custodioId: string;
  nombre: string;
  telefono?: string;
}

export function HistoricoTab({ custodioId, nombre, telefono }: HistoricoTabProps) {
  const [selectedTypes, setSelectedTypes] = useState<TimelineEventType[]>([]);
  const [periodo, setPeriodo] = useState('180d');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showPendingSystems, setShowPendingSystems] = useState(false);

  // Calculate date range based on periodo
  const calculatedDateRange = useMemo(() => {
    const now = new Date();
    
    if (periodo === 'custom') {
      return dateRange;
    }
    
    switch (periodo) {
      case '7d':
        return { from: subDays(now, 7), to: now };
      case '30d':
        return { from: subDays(now, 30), to: now };
      case '90d':
        return { from: subDays(now, 90), to: now };
      case '180d':
        return { from: subMonths(now, 6), to: now };
      case '365d':
        return { from: subYears(now, 1), to: now };
      case 'all':
        return {};
      default:
        return { from: subMonths(now, 6), to: now };
    }
  }, [periodo, dateRange]);

  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useProfileTimeline(custodioId, nombre, telefono, {
    tipos: selectedTypes.length > 0 ? selectedTypes : undefined,
    fechaDesde: calculatedDateRange.from,
    fechaHasta: calculatedDateRange.to,
    limite: 100
  });

  // Group events by date
  const groupedEvents = useMemo(() => {
    if (!data?.events) return {};
    
    const groups: { [key: string]: typeof data.events } = {};
    
    data.events.forEach(event => {
      const dateKey = format(new Date(event.fecha), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    
    return groups;
  }, [data?.events]);

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar el historial: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Historial del Custodio</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPendingSystems(!showPendingSystems)}
          >
            {showPendingSystems ? 'Ocultar pendientes' : 'Ver pendientes'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Pending Systems Card */}
      {showPendingSystems && <PendingSubsystemsCard />}

      {/* Stats */}
      <TimelineStatsCard stats={data?.stats || {
        serviciosCompletados: 0,
        serviciosRechazados: 0,
        serviciosCancelados: 0,
        ticketsCreados: 0,
        ticketsResueltos: 0,
        csatPromedio: null
      }} isLoading={isLoading} />

      {/* Filters */}
      <TimelineFilters
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
      />

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="flex-1 h-24" />
            </div>
          ))}
        </div>
      ) : data?.events.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontraron eventos en el período seleccionado. 
            Intenta ampliar el rango de fechas o cambiar los filtros.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur py-2 mb-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {format(new Date(dateKey), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </h4>
              </div>
              
              {/* Events for this date */}
              <div className="pl-2">
                {groupedEvents[dateKey].map((event, index) => (
                  <TimelineEventCard
                    key={event.id}
                    event={event}
                    isLast={index === groupedEvents[dateKey].length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {data?.events && data.events.length >= 100 && (
        <div className="text-center py-4">
          <Button variant="outline" disabled>
            Mostrando los últimos 100 eventos
          </Button>
        </div>
      )}
    </div>
  );
}

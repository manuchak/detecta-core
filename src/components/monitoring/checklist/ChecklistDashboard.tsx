/**
 * Dashboard de monitoreo de checklists con tarjetas de resumen
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle,
  ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ResumenChecklists, FiltroChecklist } from '@/types/checklist';
import type { FiltrosChecklist } from './ChecklistFilters';

interface ChecklistDashboardProps {
  resumen: ResumenChecklists;
  isLoading: boolean;
  filtroActivo: FiltroChecklist;
  onFiltroChange: (filtro: FiltroChecklist) => void;
  timeWindow: number;
  filtrosAvanzados?: FiltrosChecklist;
}

interface MetricCardProps {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
  colorClase: string;
  bgClase: string;
  activo: boolean;
  onClick: () => void;
  pulsante?: boolean;
}

function MetricCard({
  titulo,
  valor,
  icono,
  colorClase,
  bgClase,
  activo,
  onClick,
  pulsante,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        activo && 'ring-2 ring-primary',
        pulsante && valor > 0 && 'animate-pulse'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{titulo}</p>
            <p className={cn('text-3xl font-bold', colorClase)}>{valor}</p>
          </div>
          <div className={cn('p-3 rounded-full', bgClase)}>{icono}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTituloPeriodo(filtros?: FiltrosChecklist, timeWindow?: number): string {
  if (!filtros || filtros.preset === 'turno_actual') return 'Checklists del Turno';
  if (filtros.preset === 'hoy') return 'Checklists de Hoy';
  if (filtros.preset === 'ayer') return 'Checklists de Ayer';
  if (filtros.preset === 'esta_semana') return 'Checklists de la Semana';
  if (filtros.fechaSeleccionada) {
    return `Checklists del ${format(filtros.fechaSeleccionada, "d 'de' MMMM yyyy", { locale: es })}`;
  }
  return 'Checklists del Turno';
}

function getSubtituloPeriodo(filtros?: FiltrosChecklist, timeWindow?: number): string | null {
  if (!filtros || filtros.preset === 'turno_actual') return `±${timeWindow}h`;
  if (filtros.horaDesde && filtros.horaHasta) return `${filtros.horaDesde} - ${filtros.horaHasta}`;
  return null;
}

export function ChecklistDashboard({
  resumen,
  isLoading,
  filtroActivo,
  onFiltroChange,
  timeWindow,
  filtrosAvanzados,
}: ChecklistDashboardProps) {
  const titulo = getTituloPeriodo(filtrosAvanzados, timeWindow);
  const subtitulo = getSubtituloPeriodo(filtrosAvanzados, timeWindow);
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{titulo}</h2>
          {subtitulo && <Badge variant="outline">{subtitulo}</Badge>}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      id: 'completos' as FiltroChecklist,
      titulo: 'Completos',
      valor: resumen.completos,
      icono: <CheckCircle2 className="h-6 w-6 text-success" />,
      colorClase: 'text-success',
      bgClase: 'bg-success/10',
      pulsante: false,
    },
    {
      id: 'pendientes' as FiltroChecklist,
      titulo: 'Pendientes',
      valor: resumen.pendientes,
      icono: <Clock className="h-6 w-6 text-warning" />,
      colorClase: 'text-warning',
      bgClase: 'bg-warning/10',
      pulsante: false,
    },
    {
      id: 'sin_checklist' as FiltroChecklist,
      titulo: 'Sin Checklist',
      valor: resumen.sinChecklist,
      icono: <XCircle className="h-6 w-6 text-destructive" />,
      colorClase: 'text-destructive',
      bgClase: 'bg-destructive/10',
      pulsante: true,
    },
    {
      id: 'alertas' as FiltroChecklist,
      titulo: 'Con Alertas',
      valor: resumen.conAlertas,
      icono: <AlertTriangle className="h-6 w-6 text-orange-500" />,
      colorClase: 'text-orange-500',
      bgClase: 'bg-orange-500/10',
      pulsante: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{titulo}</h2>
          {subtitulo && <Badge variant="outline">{subtitulo}</Badge>}
        </div>
        <button
          className={cn(
            'text-sm px-3 py-1 rounded-md transition-colors',
            filtroActivo === 'todos'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          )}
          onClick={() => onFiltroChange('todos')}
        >
          Ver todos ({resumen.total})
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            titulo={metric.titulo}
            valor={metric.valor}
            icono={metric.icono}
            colorClase={metric.colorClase}
            bgClase={metric.bgClase}
            activo={filtroActivo === metric.id}
            onClick={() =>
              onFiltroChange(filtroActivo === metric.id ? 'todos' : metric.id)
            }
            pulsante={metric.pulsante}
          />
        ))}
      </div>
    </div>
  );
}
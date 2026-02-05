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
import { cn } from '@/lib/utils';
import type { ResumenChecklists, FiltroChecklist } from '@/types/checklist';

interface ChecklistDashboardProps {
  resumen: ResumenChecklists;
  isLoading: boolean;
  filtroActivo: FiltroChecklist;
  onFiltroChange: (filtro: FiltroChecklist) => void;
  timeWindow: number;
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

export function ChecklistDashboard({
  resumen,
  isLoading,
  filtroActivo,
  onFiltroChange,
  timeWindow,
}: ChecklistDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Checklists del Turno</h2>
          <Badge variant="outline">±{timeWindow}h</Badge>
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
          <h2 className="text-lg font-semibold">Checklists del Turno</h2>
          <Badge variant="outline">±{timeWindow}h</Badge>
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
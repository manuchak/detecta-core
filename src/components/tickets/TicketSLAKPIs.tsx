import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, MessageCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SLAInfo } from '@/hooks/useTicketSLA';
import { TicketMetrics, formatDuration } from '@/hooks/useTicketMetrics';

interface TicketSLAKPIsProps {
  tickets: Array<{ sla: SLAInfo; status: string }>;
  loading?: boolean;
  ticketMetrics?: TicketMetrics | null;
}

export const TicketSLAKPIs = ({ tickets, loading, ticketMetrics }: TicketSLAKPIsProps) => {
  const activeTickets = tickets.filter(t => !['resuelto', 'cerrado'].includes(t.status));
  const vencidos = activeTickets.filter(t => t.sla.estadoGeneral === 'vencido').length;
  const proximosVencer = activeTickets.filter(t => t.sla.estadoGeneral === 'proximo_vencer').length;
  const enTiempo = activeTickets.filter(t => t.sla.estadoGeneral === 'en_tiempo').length;

  const csatResponseRate = ticketMetrics && ticketMetrics.csatTotalTickets > 0
    ? Math.round((ticketMetrics.csatResponseCount / ticketMetrics.csatTotalTickets) * 100)
    : 0;

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-28 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      {/* Hero Card 1: Tickets Activos */}
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300',
        vencidos > 0 && 'shadow-lg shadow-destructive/10'
      )}>
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          vencidos > 0 ? 'from-red-500 to-orange-500' : 'from-emerald-500 to-green-600'
        )} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-muted-foreground">Tickets Activos</p>
            <div className={cn(
              'p-2 rounded-lg bg-gradient-to-br',
              vencidos > 0 ? 'from-red-500 to-orange-500' : 'from-emerald-500 to-green-600'
            )}>
              <Clock className="h-4 w-4 text-white" />
            </div>
          </div>
          <p className={cn(
            'text-3xl font-bold tracking-tight',
            vencidos > 0 && 'text-destructive'
          )}>
            {activeTickets.length}
          </p>
          <div className="flex items-center gap-3 mt-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">{vencidos} vencidos</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">{proximosVencer} próximos</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">{enTiempo} en tiempo</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Hero Card 2: Tiempo de Respuesta */}
      <Card className="relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-muted-foreground">Tiempo de Respuesta</p>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {ticketMetrics?.avgFirstResponseTime
              ? formatDuration(ticketMetrics.avgFirstResponseTime)
              : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Promedio 1ra respuesta · Meta: 2h
          </p>
        </CardContent>
      </Card>

      {/* Hero Card 3: CSAT */}
      <Card className="relative overflow-hidden transition-all duration-300">
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          ticketMetrics?.avgCsat && ticketMetrics.avgCsat >= 4
            ? 'from-amber-400 to-yellow-500'
            : ticketMetrics?.avgCsat && ticketMetrics.avgCsat >= 3
              ? 'from-amber-500 to-orange-500'
              : 'from-muted to-muted-foreground/30'
        )} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-muted-foreground">CSAT</p>
            <div className={cn(
              'p-2 rounded-lg bg-gradient-to-br',
              ticketMetrics?.avgCsat && ticketMetrics.avgCsat >= 4
                ? 'from-amber-400 to-yellow-500'
                : 'from-muted to-muted-foreground/50'
            )}>
              <Star className="h-4 w-4 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {ticketMetrics?.avgCsat ? `${ticketMetrics.avgCsat.toFixed(1)}/5` : '—'}
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{ticketMetrics?.csatResponseCount ?? 0}/{ticketMetrics?.csatTotalTickets ?? 0} encuestas</span>
              <span>{csatResponseRate}%</span>
            </div>
            <Progress value={csatResponseRate} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketSLAKPIs;

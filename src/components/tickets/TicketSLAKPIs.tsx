import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, Timer, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SLAInfo } from '@/hooks/useTicketSLA';

interface TicketSLAKPIsProps {
  tickets: Array<{ sla: SLAInfo; status: string }>;
  loading?: boolean;
}

export const TicketSLAKPIs = ({ tickets, loading }: TicketSLAKPIsProps) => {
  // Calculate KPIs
  const activeTickets = tickets.filter(t => !['resuelto', 'cerrado'].includes(t.status));
  
  const vencidos = activeTickets.filter(t => t.sla.estadoGeneral === 'vencido').length;
  const proximosVencer = activeTickets.filter(t => t.sla.estadoGeneral === 'proximo_vencer').length;
  const enTiempo = activeTickets.filter(t => t.sla.estadoGeneral === 'en_tiempo').length;
  
  // Calculate SLA compliance for resolved tickets this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const resolvedThisMonth = tickets.filter(t => 
    ['resuelto', 'cerrado'].includes(t.status) && 
    t.sla.estadoResolucion !== 'sin_sla'
  );
  const cumplidos = resolvedThisMonth.filter(t => t.sla.estadoResolucion === 'cumplido').length;
  const cumplimientoSLA = resolvedThisMonth.length > 0 
    ? Math.round((cumplidos / resolvedThisMonth.length) * 100) 
    : 100;

  const kpis = [
    {
      label: 'SLA Vencidos',
      value: vencidos,
      icon: AlertTriangle,
      className: vencidos > 0 
        ? 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
        : 'text-muted-foreground bg-muted/50',
      pulse: vencidos > 0,
      highlight: vencidos > 0
    },
    {
      label: 'Próximos a vencer',
      value: proximosVencer,
      icon: Timer,
      className: proximosVencer > 0 
        ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' 
        : 'text-muted-foreground bg-muted/50',
      subtitle: '< 4 horas'
    },
    {
      label: 'En tiempo',
      value: enTiempo,
      icon: Clock,
      className: 'text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
    },
    {
      label: 'Cumplimiento SLA',
      value: `${cumplimientoSLA}%`,
      icon: TrendingUp,
      className: cumplimientoSLA >= 90 
        ? 'text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
        : cumplimientoSLA >= 75 
          ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
          : 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
      subtitle: 'Este mes'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card 
            key={index}
            className={cn(
              'border transition-all',
              kpi.className,
              kpi.pulse && 'animate-pulse'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80">{kpi.label}</p>
                  {kpi.subtitle && (
                    <p className="text-[10px] opacity-60">{kpi.subtitle}</p>
                  )}
                  <p className={cn(
                    'text-2xl font-bold mt-1',
                    kpi.highlight && 'text-red-600 dark:text-red-400'
                  )}>
                    {kpi.value}
                  </p>
                </div>
                <Icon className={cn(
                  'h-8 w-8 opacity-40',
                  kpi.highlight && 'opacity-80 animate-bounce'
                )} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TicketSLAKPIs;

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, Timer, TrendingUp } from 'lucide-react';
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
      gradient: vencidos > 0 
        ? 'from-red-500 to-rose-600' 
        : 'from-gray-400 to-gray-500',
      bgGlow: vencidos > 0 ? 'shadow-red-500/20' : '',
      highlight: vencidos > 0,
      pulse: vencidos > 0
    },
    {
      label: 'Próximos a vencer',
      value: proximosVencer,
      icon: Timer,
      gradient: proximosVencer > 0 
        ? 'from-amber-500 to-orange-500' 
        : 'from-gray-400 to-gray-500',
      bgGlow: proximosVencer > 0 ? 'shadow-amber-500/20' : '',
      subtitle: '< 4 horas'
    },
    {
      label: 'En tiempo',
      value: enTiempo,
      icon: Clock,
      gradient: 'from-emerald-500 to-green-600',
      bgGlow: 'shadow-emerald-500/20'
    },
    {
      label: 'Cumplimiento SLA',
      value: `${cumplimientoSLA}%`,
      icon: TrendingUp,
      gradient: cumplimientoSLA >= 90 
        ? 'from-emerald-500 to-green-600'
        : cumplimientoSLA >= 75 
          ? 'from-amber-500 to-orange-500'
          : 'from-red-500 to-rose-600',
      bgGlow: cumplimientoSLA >= 90 
        ? 'shadow-emerald-500/20' 
        : cumplimientoSLA >= 75 
          ? 'shadow-amber-500/20' 
          : 'shadow-red-500/20',
      subtitle: 'Este mes'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <Skeleton className="h-5 w-28 mb-3" />
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card 
            key={index}
            className={cn(
              'relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
              kpi.bgGlow && `shadow-lg ${kpi.bgGlow}`,
              kpi.pulse && 'animate-pulse'
            )}
            style={{ animationDuration: '2s' }}
          >
            {/* Gradient accent top border */}
            <div className={cn(
              'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
              kpi.gradient
            )} />
            
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </p>
                  {kpi.subtitle && (
                    <p className="text-xs text-muted-foreground/70">{kpi.subtitle}</p>
                  )}
                  <p className={cn(
                    'text-4xl font-bold tracking-tight mt-2',
                    kpi.highlight && 'text-red-600 dark:text-red-400'
                  )}>
                    {kpi.value}
                  </p>
                </div>
                
                <div className={cn(
                  'p-3 rounded-xl bg-gradient-to-br',
                  kpi.gradient
                )}>
                  <Icon className={cn(
                    'h-6 w-6 text-white',
                    kpi.highlight && 'animate-bounce'
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TicketSLAKPIs;

import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  CalendarDays, 
  CalendarRange, 
  TrendingUp,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { startOfDay, startOfWeek, startOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface Ticket {
  created_at: string;
  sla_deadline_resolucion?: string | null;
  resolved_at?: string | null;
  status: string;
}

interface TicketSLAMetricsByPeriodProps {
  tickets: Ticket[];
  loading?: boolean;
}

interface PeriodMetrics {
  total: number;
  onTime: number;
  overdue: number;
  compliance: number;
}

export const TicketSLAMetricsByPeriod: React.FC<TicketSLAMetricsByPeriodProps> = ({
  tickets,
  loading = false
}) => {
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const monthStart = startOfMonth(now);

    const calculatePeriodMetrics = (startDate: Date): PeriodMetrics => {
      const periodTickets = tickets.filter(t => {
        const createdAt = parseISO(t.created_at);
        return isWithinInterval(createdAt, { start: startDate, end: now });
      });

      let onTime = 0;
      let overdue = 0;

      periodTickets.forEach(ticket => {
        if (ticket.sla_deadline_resolucion) {
          const deadline = parseISO(ticket.sla_deadline_resolucion);
          if (ticket.resolved_at) {
            const resolvedAt = parseISO(ticket.resolved_at);
            if (resolvedAt <= deadline) onTime++;
            else overdue++;
          } else if (now > deadline) {
            overdue++;
          } else {
            onTime++;
          }
        } else {
          onTime++;
        }
      });

      const total = periodTickets.length;
      const compliance = total > 0 ? (onTime / total) * 100 : 100;

      return { total, onTime, overdue, compliance };
    };

    return {
      today: calculatePeriodMetrics(todayStart),
      week: calculatePeriodMetrics(weekStart),
      month: calculatePeriodMetrics(monthStart)
    };
  }, [tickets]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (compliance >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getComplianceBg = (compliance: number) => {
    if (compliance >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (compliance >= 70) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-red-50 dark:bg-red-950/30';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* SLA Hoy */}
      <Card className={cn("border-l-4 border-l-primary", getComplianceBg(metrics.today.compliance))}>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">SLA Hoy</span>
          </div>
          <p className={cn("text-xl font-bold", getComplianceColor(metrics.today.compliance))}>
            {metrics.today.compliance.toFixed(0)}%
          </p>
        </CardContent>
      </Card>

      {/* SLA Semana */}
      <Card className={cn("border-l-4 border-l-blue-500", getComplianceBg(metrics.week.compliance))}>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground">SLA Semana</span>
          </div>
          <p className={cn("text-xl font-bold", getComplianceColor(metrics.week.compliance))}>
            {metrics.week.compliance.toFixed(0)}%
          </p>
        </CardContent>
      </Card>

      {/* SLA Mes */}
      <Card className={cn("border-l-4 border-l-purple-500", getComplianceBg(metrics.month.compliance))}>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarRange className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground">SLA Mes</span>
          </div>
          <p className={cn("text-xl font-bold", getComplianceColor(metrics.month.compliance))}>
            {metrics.month.compliance.toFixed(0)}%
          </p>
        </CardContent>
      </Card>

      {/* Tickets Hoy */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">Tickets Hoy</span>
          </div>
          <p className="text-xl font-bold text-foreground">{metrics.today.total}</p>
        </CardContent>
      </Card>

      {/* Tickets Semana */}
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Semana</span>
          </div>
          <p className="text-xl font-bold text-foreground">{metrics.week.total}</p>
        </CardContent>
      </Card>

      {/* Tickets Mes */}
      <Card className="border-l-4 border-l-rose-500">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-xs font-medium text-muted-foreground">Mes</span>
          </div>
          <p className="text-xl font-bold text-foreground">{metrics.month.total}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketSLAMetricsByPeriod;

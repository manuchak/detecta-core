import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CalendarDays, CalendarRange, Calendar, Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval, parseISO } from 'date-fns';

interface Ticket {
  created_at: string;
  calificacion_csat?: number | null;
}

interface TicketCSATByPeriodProps {
  tickets: Ticket[];
  loading?: boolean;
}

interface PeriodCSAT {
  avg: number | null;
  responded: number;
  total: number;
}

// Quarter start helper
const startOfQuarter = (date: Date): Date => {
  const month = date.getMonth();
  const quarterStartMonth = month - (month % 3);
  return new Date(date.getFullYear(), quarterStartMonth, 1);
};

export const TicketCSATByPeriod: React.FC<TicketCSATByPeriodProps> = ({
  tickets,
  loading = false
}) => {
  const metrics = useMemo(() => {
    const now = new Date();

    const calcPeriod = (startDate: Date): PeriodCSAT => {
      const periodTickets = tickets.filter(t => {
        const createdAt = parseISO(t.created_at);
        return isWithinInterval(createdAt, { start: startDate, end: now });
      });
      const withCsat = periodTickets.filter(t => t.calificacion_csat != null && t.calificacion_csat > 0);
      const avg = withCsat.length > 0
        ? withCsat.reduce((s, t) => s + (t.calificacion_csat || 0), 0) / withCsat.length
        : null;
      return { avg, responded: withCsat.length, total: periodTickets.length };
    };

    return {
      today: calcPeriod(startOfDay(now)),
      week: calcPeriod(startOfWeek(now, { weekStartsOn: 1 })),
      month: calcPeriod(startOfMonth(now)),
      quarter: calcPeriod(startOfQuarter(now)),
      year: calcPeriod(new Date(now.getFullYear(), 0, 1))
    };
  }, [tickets]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
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

  const getColor = (avg: number | null) => {
    if (avg === null) return { text: 'text-muted-foreground', bg: '', border: 'border-l-muted' };
    if (avg >= 4) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-l-emerald-500' };
    if (avg >= 3) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-l-amber-500' };
    return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-l-red-500' };
  };

  const periods = [
    { key: 'today', label: 'CSAT Hoy', icon: Clock, data: metrics.today, borderColor: 'border-l-primary' },
    { key: 'week', label: 'CSAT Semana', icon: CalendarDays, data: metrics.week, borderColor: 'border-l-blue-500' },
    { key: 'month', label: 'CSAT Mes', icon: CalendarRange, data: metrics.month, borderColor: 'border-l-purple-500' },
    { key: 'quarter', label: 'CSAT Trimestre', icon: Calendar, data: metrics.quarter, borderColor: 'border-l-amber-500' },
    { key: 'year', label: 'CSAT Anual', icon: Star, data: metrics.year, borderColor: 'border-l-rose-500' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {periods.map(({ key, label, icon: Icon, data, borderColor }) => {
        const colors = getColor(data.avg);
        return (
          <Card key={key} className={cn("border-l-4", borderColor, colors.bg)}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
              <p className={cn("text-xl font-bold", colors.text)}>
                {data.avg !== null ? `${data.avg.toFixed(1)}/5` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {data.responded}/{data.total} respondidas
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TicketCSATByPeriod;

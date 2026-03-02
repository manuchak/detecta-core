import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval, parseISO, differenceInMinutes } from 'date-fns';
import { formatDuration } from '@/hooks/useTicketMetrics';

interface Ticket {
  created_at: string;
  sla_deadline_resolucion?: string | null;
  resolved_at?: string | null;
  status: string;
  calificacion_csat?: number | null;
  first_response_at?: string | null;
}

interface TicketPeriodSummaryTableProps {
  tickets: Ticket[];
  loading?: boolean;
}

interface PeriodRow {
  label: string;
  total: number;
  slaCompliance: number;
  csatAvg: number | null;
  csatResponded: number;
  csatTotal: number;
  avgResponseMin: number | null;
}

const startOfQuarter = (date: Date): Date => {
  const month = date.getMonth();
  return new Date(date.getFullYear(), month - (month % 3), 1);
};

export const TicketPeriodSummaryTable: React.FC<TicketPeriodSummaryTableProps> = ({
  tickets,
  loading = false
}) => {
  const rows = useMemo(() => {
    const now = new Date();

    const periods: { label: string; start: Date }[] = [
      { label: 'Hoy', start: startOfDay(now) },
      { label: 'Semana', start: startOfWeek(now, { weekStartsOn: 1 }) },
      { label: 'Mes', start: startOfMonth(now) },
      { label: 'Trimestre', start: startOfQuarter(now) },
      { label: 'Anual', start: startOfYear(now) },
    ];

    return periods.map(({ label, start }): PeriodRow => {
      const filtered = tickets.filter(t => {
        const d = parseISO(t.created_at);
        return isWithinInterval(d, { start, end: now });
      });

      let onTime = 0;
      let overdue = 0;
      let csatSum = 0;
      let csatCount = 0;
      let responseSum = 0;
      let responseCount = 0;

      filtered.forEach(t => {
        // SLA
        if (t.sla_deadline_resolucion) {
          const deadline = parseISO(t.sla_deadline_resolucion);
          if (t.resolved_at) {
            if (parseISO(t.resolved_at) <= deadline) onTime++;
            else overdue++;
          } else if (now > deadline) {
            overdue++;
          } else {
            onTime++;
          }
        } else {
          onTime++;
        }

        // CSAT
        if (t.calificacion_csat != null && t.calificacion_csat > 0) {
          csatSum += t.calificacion_csat;
          csatCount++;
        }

        // Response time
        if (t.first_response_at) {
          responseSum += differenceInMinutes(parseISO(t.first_response_at), parseISO(t.created_at));
          responseCount++;
        }
      });

      const total = filtered.length;
      const slaCompliance = total > 0 ? (onTime / total) * 100 : 100;

      return {
        label,
        total,
        slaCompliance,
        csatAvg: csatCount > 0 ? csatSum / csatCount : null,
        csatResponded: csatCount,
        csatTotal: total,
        avgResponseMin: responseCount > 0 ? responseSum / responseCount : null,
      };
    });
  }, [tickets]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSlaColor = (v: number) => {
    if (v >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (v >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSlaDot = (v: number) => {
    if (v >= 90) return 'bg-emerald-500';
    if (v >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getCsatColor = (v: number | null) => {
    if (v === null) return 'text-muted-foreground';
    if (v >= 4) return 'text-emerald-600 dark:text-emerald-400';
    if (v >= 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Resumen por Período
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs h-9">Período</TableHead>
                <TableHead className="text-xs text-right h-9">Tickets</TableHead>
                <TableHead className="text-xs text-right h-9">SLA %</TableHead>
                <TableHead className="text-xs text-right h-9">CSAT</TableHead>
                <TableHead className="text-xs text-right h-9">Encuestas</TableHead>
                <TableHead className="text-xs text-right h-9">T. Respuesta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.label} className="hover:bg-muted/30">
                  <TableCell className="py-2 text-sm font-medium">{row.label}</TableCell>
                  <TableCell className="py-2 text-sm text-right font-semibold">{row.total}</TableCell>
                  <TableCell className="py-2 text-right">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                      <span className={cn('h-2 w-2 rounded-full', getSlaDot(row.slaCompliance))} />
                      <span className={getSlaColor(row.slaCompliance)}>{row.slaCompliance.toFixed(0)}%</span>
                    </span>
                  </TableCell>
                  <TableCell className={cn('py-2 text-sm text-right font-semibold', getCsatColor(row.csatAvg))}>
                    {row.csatAvg !== null ? `${row.csatAvg.toFixed(1)}/5` : '—'}
                  </TableCell>
                  <TableCell className="py-2 text-sm text-right text-muted-foreground">
                    {row.csatResponded}/{row.csatTotal}
                  </TableCell>
                  <TableCell className="py-2 text-sm text-right text-muted-foreground">
                    {row.avgResponseMin !== null ? formatDuration(row.avgResponseMin) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: Card list */}
        <div className="md:hidden divide-y">
          {rows.map(row => (
            <div key={row.label} className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{row.label}</span>
                <span className="text-sm font-bold">{row.total} tickets</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">SLA</p>
                  <p className={cn('font-semibold', getSlaColor(row.slaCompliance))}>
                    {row.slaCompliance.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">CSAT</p>
                  <p className={cn('font-semibold', getCsatColor(row.csatAvg))}>
                    {row.csatAvg !== null ? `${row.csatAvg.toFixed(1)}/5` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Resp.</p>
                  <p className="font-semibold">
                    {row.avgResponseMin !== null ? formatDuration(row.avgResponseMin) : '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketPeriodSummaryTable;

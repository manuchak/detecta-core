import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ReferenceLine } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface TicketDashboardChartsProps {
  ticketsByDay: { date: string; created: number; resolved: number }[];
  ticketsByDepartment: { departamento: string; count: number; avgResolution: number; slaCompliance: number }[];
  loading?: boolean;
}

const DEPARTMENT_COLORS: Record<string, string> = {
  finanzas: 'hsl(var(--chart-1))',
  planeacion: 'hsl(var(--chart-2))',
  instaladores: 'hsl(var(--chart-3))',
  supply: 'hsl(var(--chart-4))',
  soporte: 'hsl(var(--chart-5))',
  'Sin asignar': 'hsl(var(--muted-foreground))'
};

const DEPARTMENT_LABELS: Record<string, string> = {
  finanzas: 'Finanzas',
  planeacion: 'Planeación',
  instaladores: 'Instaladores',
  supply: 'Supply',
  soporte: 'Soporte',
  'Sin asignar': 'Sin asignar'
};

export const TicketDashboardCharts: React.FC<TicketDashboardChartsProps> = ({
  ticketsByDay,
  ticketsByDepartment,
  loading = false
}) => {
  const { formattedDayData, avgCreated } = useMemo(() => {
    const now = new Date();
    const start = subDays(now, 29);
    const allDays = eachDayOfInterval({ start, end: now });
    
    const dayMap = new Map<string, { created: number; resolved: number }>();
    ticketsByDay.forEach(d => dayMap.set(d.date, { created: d.created, resolved: d.resolved }));
    
    const data = allDays.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const d = dayMap.get(dateKey) || { created: 0, resolved: 0 };
      return { date: dateKey, ...d, dateLabel: format(day, 'd MMM', { locale: es }) };
    });

    const totalCreated = data.reduce((s, d) => s + d.created, 0);
    const avg = data.length > 0 ? totalCreated / data.length : 0;

    return { formattedDayData: data, avgCreated: Math.round(avg * 10) / 10 };
  }, [ticketsByDay]);

  const { pieData, totalTickets } = useMemo(() => {
    const filtered = ticketsByDepartment.filter(d => d.count > 0);
    const total = filtered.reduce((s, d) => s + d.count, 0);
    return {
      pieData: filtered.map(d => ({
        name: DEPARTMENT_LABELS[d.departamento] || d.departamento,
        value: d.count,
        color: DEPARTMENT_COLORS[d.departamento] || 'hsl(var(--muted-foreground))'
      })),
      totalTickets: total
    };
  }, [ticketsByDepartment]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-[220px] w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Area Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Tickets por Día
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              Prom: {avgCreated}/día
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedDayData}>
                <defs>
                  <linearGradient id="colorCreatedDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolvedDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine
                  y={avgCreated}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <Area type="monotone" dataKey="created" name="Creados" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCreatedDash)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Resueltos" stroke="hsl(142, 76%, 36%)" fillOpacity={1} fill="url(#colorResolvedDash)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Donut Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Distribución por Área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] relative">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos disponibles</div>
            ) : (
              <>
                {/* Central label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalTickets}</p>
                    <p className="text-[10px] text-muted-foreground">tickets</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`${value} tickets`, 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDashboardCharts;

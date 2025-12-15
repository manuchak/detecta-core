import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
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
  const formattedDayData = ticketsByDay.map(d => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'd MMM', { locale: es })
  }));

  const pieData = ticketsByDepartment
    .filter(d => d.count > 0)
    .map(d => ({
      name: DEPARTMENT_LABELS[d.departamento] || d.departamento,
      value: d.count,
      color: DEPARTMENT_COLORS[d.departamento] || 'hsl(var(--muted-foreground))'
    }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Daily Tickets Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Tickets por Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {formattedDayData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sin datos disponibles
              </div>
            ) : (
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
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Creados"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorCreatedDash)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resueltos"
                    stroke="hsl(142, 76%, 36%)"
                    fillOpacity={1}
                    fill="url(#colorResolvedDash)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distribution by Department Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Distribución por Área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sin datos disponibles
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDashboardCharts;

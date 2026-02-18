import React from 'react';
import { useIncidentAnalytics } from '@/hooks/security/useIncidentAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { AlertTriangle, Clock, Target, ShieldCheck, TrendingUp } from 'lucide-react';
import { IncidentTrendChart } from './IncidentTrendChart';
import { NearMissCorrelation } from './NearMissCorrelation';

const SEVERITY_COLORS: Record<string, string> = {
  'critica': 'hsl(0 84% 60%)',
  'crítica': 'hsl(0 84% 60%)',
  'alta': 'hsl(25 95% 53%)',
  'media': 'hsl(45 93% 47%)',
  'baja': 'hsl(142 71% 45%)',
};

const PIE_COLORS = ['hsl(0 84% 60%)', 'hsl(25 95% 53%)', 'hsl(45 93% 47%)', 'hsl(142 71% 45%)', 'hsl(215 20% 65%)'];

export function IncidentAnalytics() {
  const { data, isLoading } = useIncidentAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  if (!data || data.totalIncidents === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-muted-foreground/25">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">Sin datos de incidentes</p>
          <p className="text-xs">Registra incidentes operativos para ver analítica</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={AlertTriangle} label="Total Incidentes" value={data.totalIncidents} />
        <KpiCard icon={Clock} label="Resolución Promedio" value={`${data.avgResolutionDays}d`} />
        <KpiCard icon={Target} label="Tasa Atribuibilidad" value={`${data.atribuibilityRate}%`} sub="operación vs externo" />
        <KpiCard icon={ShieldCheck} label="Control Efectivo" value={`${data.controlEffectivenessRate}%`} sub="controles activos" />
      </div>

      {/* Charts row 1: Trend + Severity pie */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IncidentTrendChart data={data.byMonth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribución por Severidad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.bySeverity} dataKey="count" nameKey="severidad" cx="50%" cy="50%" outerRadius={70} label={({ severidad, count }) => `${severidad} (${count})`} labelLine={false}>
                  {data.bySeverity.map((entry, i) => (
                    <Cell key={i} fill={SEVERITY_COLORS[entry.severidad.toLowerCase()] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: By type + By zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Tipo de Incidente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byType.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="tipo" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Zonas con Incidentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byZone} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="zona" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(25 95% 53%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 3: Day of week + Hour heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Incidentes por Día de Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.byDayOfWeek}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Incidentes por Hora del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.byHour}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(h) => `${h}h`} />
                <YAxis />
                <Tooltip labelFormatter={(h) => `${h}:00`} />
                <Bar dataKey="count" fill="hsl(45 93% 47%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Near-miss correlation */}
      <NearMissCorrelation />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

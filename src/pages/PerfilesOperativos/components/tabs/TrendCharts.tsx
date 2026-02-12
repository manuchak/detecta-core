import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Activity, MapPin, DollarSign, Clock, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend, ComposedChart
} from 'recharts';
import { useProfileTrends, type MonthlyTrendData } from '../../hooks/useProfileTrends';

interface TrendChartsProps {
  custodioId: string;
  nombre: string;
  telefono?: string | null;
}

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

export function TrendCharts({ custodioId, nombre, telefono }: TrendChartsProps) {
  const { data: trends, isLoading, isError } = useProfileTrends(custodioId, nombre, telefono);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando tendencias...</span>
      </div>
    );
  }

  if (isError || !trends) return null;

  const hasData = trends.some(t => 
    t.serviciosAsignados > 0 || t.kmRecorridos > 0 || t.ingresos > 0 || t.puntualidadTotal > 0
  );

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencias (Últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No hay datos suficientes para mostrar tendencias
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasPuntualidad = trends.some(t => t.puntualidadTotal > 0);
  const hasRechazos = trends.some(t => t.rechazos > 0) || true; // Always show (0 is informative)
  const hasChecklists = trends.some(t => t.serviciosFinalizados > 0);

  return (
    <div className="space-y-6">
      {/* 1. Evolución de Puntualidad */}
      {hasPuntualidad && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Evolución de Puntualidad (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="count" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                  <Bar yAxisId="count" dataKey="puntualidadATiempo" name="A tiempo" stackId="punt" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar yAxisId="count" dataKey="puntualidadRetrasoLeve" name="Retraso leve" stackId="punt" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar yAxisId="count" dataKey="puntualidadRetrasoGrave" name="Retraso grave" stackId="punt" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="pct" type="monotone" dataKey="scorePuntualidad" name="% Puntualidad" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Rechazos por Mes */}
      {hasRechazos && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Rechazos por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [value, 'Rechazos']} />
                  <Bar dataKey="rechazos" name="Rechazos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Cumplimiento Checklist */}
      {hasChecklists && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-amber-500" />
              Cumplimiento Checklist (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorChecklist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [`${value}%`, 'Checklist']} />
                  <Area type="monotone" dataKey="scoreChecklist" stroke="#f59e0b" strokeWidth={2} fill="url(#colorChecklist)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Servicios por Mes (existing) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Evolución de Servicios (6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                <Bar dataKey="serviciosAsignados" name="Asignados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="serviciosConfirmados" name="Confirmados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="serviciosCancelados" name="Cancelados" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 5-6. KM e Ingresos (existing) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-500" />
              Kilómetros por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [`${value.toLocaleString()} km`, 'Recorridos']} />
                  <Line type="monotone" dataKey="kmRecorridos" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Ingresos por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()} MXN`, 'Ingresos']} />
                  <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} fill="url(#colorIngresos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

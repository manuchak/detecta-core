import React from 'react';
import { useSiniestrosHistorico } from '@/hooks/security/useSiniestrosHistorico';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ShieldAlert, TrendingUp, Calendar, MapPin, User } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';

export function SiniestroHistoryPanel() {
  const { siniestros, fillRate, totalSiniestros, totalEventosNoCriticos, tasaSiniestralidad, monthlyTrend, isLoading, error } = useSiniestrosHistorico();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive">Error cargando siniestros: {error.message}</p>;
  }

  // Build chart data from fill rate
  const chartData = fillRate
    .filter(m => m.fecha >= '2024-01-01')
    .map(m => ({
      month: m.fecha.slice(0, 7),
      siniestros: m.siniestros,
      noCriticos: m.eventos_no_criticos,
    }));

  // Clients affected
  const clientCount: Record<string, number> = {};
  siniestros.forEach(s => {
    if (s.cliente_nombre) clientCount[s.cliente_nombre] = (clientCount[s.cliente_nombre] || 0) + 1;
  });
  const topClients = Object.entries(clientCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Total Siniestros</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{totalSiniestros}</span>
            <p className="text-[10px] text-muted-foreground mt-1">Feb 2024 — presente</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Eventos No Críticos</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{totalEventosNoCriticos}</span>
            <p className="text-[10px] text-muted-foreground mt-1">Fallas, retenes, bloqueos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Tasa Siniestralidad</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              {tasaSiniestralidad > 0 ? `${tasaSiniestralidad}‰` : 'N/D'}
            </span>
            <p className="text-[10px] text-muted-foreground mt-1">Siniestros / 1,000 servicios</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Clientes Afectados</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{topClients.length}</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {topClients.slice(0, 3).map(([name, count]) => (
                <Badge key={name} variant="outline" className="text-[9px]">{name} ({count})</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart: Monthly trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tendencia Mensual — Siniestros vs Eventos No Críticos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="siniestros" name="Siniestros" fill="hsl(0 84% 60%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="noCriticos" name="No Críticos" fill="hsl(45 93% 47%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline de Siniestros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {siniestros.map((s) => (
              <div key={s.id} className="flex gap-3 pb-3 border-b border-border/50 last:border-0">
                {/* Date column */}
                <div className="shrink-0 w-16 text-center">
                  <div className="text-xs font-bold text-foreground">
                    {new Date(s.fecha_incidente).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(s.fecha_incidente).getFullYear()}
                  </div>
                </div>

                {/* Severity dot */}
                <div className="shrink-0 mt-1">
                  <div className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    s.severidad === 'critica' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                      {s.tipo}
                    </Badge>
                    {s.cliente_nombre && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {s.cliente_nombre}
                      </Badge>
                    )}
                    {s.zona && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {s.zona}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.descripcion}</p>
                  {s.acciones_tomadas && (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 line-clamp-1">
                      → {s.acciones_tomadas}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

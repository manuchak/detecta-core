import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCSQuejaStats } from '@/hooks/useCSQuejas';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CSLoyaltyFunnel } from './CSLoyaltyFunnel';
import { CSPlaybooks } from './CSPlaybooks';

const TIPO_LABELS: Record<string, string> = {
  calidad_servicio: 'Calidad del servicio',
  facturacion: 'Facturación',
  cobertura: 'Cobertura',
  seguridad: 'Seguridad',
  consignas: 'Consignas',
  otro: 'Otro',
};

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
];

export function CSDashboard() {
  const { data: stats, isLoading } = useCSQuejaStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse"><CardContent className="p-6 h-24" /></Card>
        ))}
      </div>
    );
  }

  const pieData = Object.entries(stats?.porTipo || {}).map(([name, value]) => ({
    name: TIPO_LABELS[name] || name,
    value,
  }));

  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quejas Abiertas</p>
                <p className="text-3xl font-bold">{stats?.abiertas || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cerradas este mes</p>
                <p className="text-3xl font-bold">{stats?.cerradasMes || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CSAT Promedio</p>
                <p className="text-3xl font-bold">
                  {stats?.csatPromedio ? stats.csatPromedio.toFixed(1) : '—'}
                  <span className="text-sm text-muted-foreground font-normal">/5</span>
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-3xl font-bold">
                  {stats?.slaCompliance ? `${stats.slaCompliance.toFixed(0)}%` : '—'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Funnel + Playbooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CSLoyaltyFunnel />
        <CSPlaybooks />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quejas por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Sin datos aún</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen ISO 9001</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm font-medium">8.2.1 Comunicación con cliente</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Touchpoints</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm font-medium">9.1.2 Satisfacción del cliente</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  CSAT {stats?.csatPromedio ? stats.csatPromedio.toFixed(1) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm font-medium">10.2 No conformidad</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">CAPA</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm font-medium">10.3 Mejora continua</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {stats?.total || 0} registros
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

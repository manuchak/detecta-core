import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCSRetentionMetrics } from '@/hooks/useCSRetentionMetrics';
import { useCSLoyaltyFunnel, type LoyaltyStage } from '@/hooks/useCSLoyaltyFunnel';
import { CSLoyaltyFunnel } from './CSLoyaltyFunnel';
import { CSLoyaltyBadge } from './CSLoyaltyBadge';
import { CSClienteProfileModal } from './CSClienteProfileModal';
import { CSPlaybooks } from './CSPlaybooks';
import { TrendingUp, TrendingDown, Users, MessageSquare, Heart, BarChart3, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const PIE_COLORS: Record<LoyaltyStage, string> = {
  nuevo: 'hsl(217, 91%, 60%)',
  activo: 'hsl(0, 0%, 60%)',
  leal: 'hsl(142, 76%, 36%)',
  promotor: 'hsl(45, 85%, 47%)',
  embajador: 'hsl(262, 83%, 58%)',
  en_riesgo: 'hsl(0, 65%, 48%)',
};

export function CSRetentionDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useCSRetentionMetrics();
  const { data: loyalty, isLoading: loyaltyLoading } = useCSLoyaltyFunnel();
  const [selectedStage, setSelectedStage] = useState<LoyaltyStage | null>(null);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  const isLoading = metricsLoading || loyaltyLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Calculate leales+ from loyalty data
  const lealesPlus = loyalty
    ? loyalty.funnel
        .filter(f => ['leal', 'promotor', 'embajador'].includes(f.stage))
        .reduce((s, f) => s + f.count, 0)
    : 0;
  const pctLealesPlus = loyalty && loyalty.total > 0
    ? Math.round((lealesPlus / loyalty.total) * 100)
    : 0;

  // Pie chart data
  const pieData = loyalty?.funnel
    .filter(f => f.count > 0)
    .map(f => ({ name: f.label, value: f.count, stage: f.stage })) || [];

  // Clients filtered by selected stage
  const filteredClients = selectedStage
    ? loyalty?.clients.filter(c => c.stage === selectedStage) || []
    : [];

  // At risk clients
  const atRiskClients = loyalty?.clients
    .filter(c => c.stage === 'en_riesgo' || c.dias_sin_contacto > 30 || c.quejas_abiertas > 0)
    .sort((a, b) => b.quejas_abiertas - a.quejas_abiertas || b.dias_sin_contacto - a.dias_sin_contacto)
    .slice(0, 8) || [];

  // Top GMV clients
  const topClients = [...(loyalty?.clients || [])]
    .sort((a, b) => b.gmv_total - a.gmv_total)
    .slice(0, 8);

  return (
    <div className="space-y-6 mt-4">
      {/* KPIs Hero Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">NRR</span>
            </div>
            <p className="text-2xl font-bold">
              {metrics?.nrr ? `${metrics.nrr.toFixed(0)}%` : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Churn</span>
            </div>
            <p className="text-2xl font-bold">
              {metrics ? `${metrics.churnRate.toFixed(0)}%` : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">CSAT</span>
            </div>
            <p className="text-2xl font-bold">
              {metrics?.csatPromedio ? metrics.csatPromedio.toFixed(1) : '—'}
              <span className="text-sm text-muted-foreground font-normal">/5</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Clientes</span>
            </div>
            <p className="text-2xl font-bold">{loyalty?.total || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Días s/contacto</span>
            </div>
            <p className="text-2xl font-bold">
              {metrics ? metrics.diasPromedioSinContacto : '—'}
              <span className="text-sm text-muted-foreground font-normal">d</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Leales+</span>
            </div>
            <p className="text-2xl font-bold">
              {pctLealesPlus}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Playbooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CSLoyaltyFunnel onStageClick={setSelectedStage} selectedStage={selectedStage} />
        <CSPlaybooks />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Distribución Loyalty Ladder</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.stage} fill={PIE_COLORS[entry.stage as LoyaltyStage]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                Sin datos de clasificación
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tendencia */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tendencia de Clientes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.tendencia && metrics.tendencia.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={metrics.tendencia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="activos"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.15}
                    name="Activos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                Sin datos de tendencia
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Clients */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Clientes por GMV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topClients.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClienteId(c.id)}
                  className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.nombre_comercial}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.total_servicios} servicios
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium">
                      ${(c.gmv_total / 1000000).toFixed(1)}M
                    </span>
                    <CSLoyaltyBadge stage={c.stage} />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* At Risk */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atRiskClients.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Todos los clientes están al día ✓
              </div>
            ) : (
              <div className="space-y-2">
                {atRiskClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClienteId(c.id)}
                    className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/30 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.nombre_comercial}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {c.quejas_abiertas > 0 && (
                          <span className="text-destructive">{c.quejas_abiertas} quejas</span>
                        )}
                        {c.dias_sin_contacto > 30 && c.dias_sin_contacto < 999 && (
                          <span>{c.dias_sin_contacto}d sin contacto</span>
                        )}
                        {c.dias_sin_contacto >= 999 && (
                          <span>Sin contacto registrado</span>
                        )}
                      </div>
                    </div>
                    <CSLoyaltyBadge stage={c.stage} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtered clients by stage */}
      {selectedStage && filteredClients.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Clientes — <CSLoyaltyBadge stage={selectedStage} size="md" />
              <span className="text-sm text-muted-foreground font-normal ml-2">
                {filteredClients.length} clientes
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClienteId(c.id)}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.nombre_comercial}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.total_servicios} servicios · GMV ${(c.gmv_total / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {c.csat_promedio ? `CSAT ${c.csat_promedio.toFixed(1)}` : ''}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Modal */}
      <CSClienteProfileModal
        clienteId={selectedClienteId}
        onClose={() => setSelectedClienteId(null)}
      />
    </div>
  );
}

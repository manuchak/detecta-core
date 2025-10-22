import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SystemChange } from "@/hooks/useVersionControl";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface VersionMetricsProps {
  changes: SystemChange[];
}

const COLORS = {
  feature: 'hsl(var(--success))',
  bugfix: 'hsl(var(--warning))',
  enhancement: 'hsl(var(--info))',
  breaking_change: 'hsl(var(--destructive))',
  security: 'hsl(var(--secondary))',
  performance: 'hsl(var(--primary))',
  documentation: 'hsl(var(--muted))'
};

const IMPACT_COLORS = {
  critical: 'hsl(var(--destructive))',
  high: 'hsl(var(--warning))',
  medium: 'hsl(var(--info))',
  low: 'hsl(var(--success))'
};

export const VersionMetrics = ({ changes }: VersionMetricsProps) => {
  // Agrupar cambios por tipo
  const changesByType = changes.reduce((acc, change) => {
    acc[change.change_type] = (acc[change.change_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(changesByType).map(([name, value]) => ({
    name,
    value
  }));

  // Agrupar cambios por impacto
  const changesByImpact = changes.reduce((acc, change) => {
    acc[change.impact_level] = (acc[change.impact_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const impactData = Object.entries(changesByImpact).map(([name, value]) => ({
    name,
    value
  }));

  // Módulos más afectados
  const moduleStats = changes.reduce((acc, change) => {
    acc[change.module] = (acc[change.module] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topModules = Object.entries(moduleStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Estadísticas generales
  const stats = {
    total: changes.length,
    critical: changes.filter(c => c.impact_level === 'critical').length,
    withRollback: changes.filter(c => c.rollback_plan).length,
    withTests: changes.filter(c => c.testing_notes).length
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cambios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Con Rollback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.withRollback}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((stats.withRollback / stats.total) * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Con Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.withTests}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((stats.withTests / stats.total) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribución por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Impacto */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Impacto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={impactData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {impactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={IMPACT_COLORS[entry.name as keyof typeof IMPACT_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Módulos Más Afectados */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Módulos Más Afectados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topModules.map(([module, count]) => (
              <div key={module} className="flex items-center justify-between">
                <span className="text-sm font-medium">{module}</span>
                <Badge variant="outline">{count} cambios</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

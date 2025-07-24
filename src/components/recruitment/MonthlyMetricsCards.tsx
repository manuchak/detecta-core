import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, CheckCircle, Target } from 'lucide-react';
import { useRecruitmentMonthlyMetrics } from '@/hooks/useRecruitmentMonthlyMetrics';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export const MonthlyMetricsCards = () => {
  const { monthlyData, loading, error } = useRecruitmentMonthlyMetrics();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error al cargar las métricas mensuales
      </div>
    );
  }

  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const getTrend = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta resumen CPA */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">CPA Actual</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {currentMonth ? formatCurrency(currentMonth.cpa) : 'N/A'}
                  </span>
                  {currentMonth && previousMonth && (
                    <span className={`text-xs ${
                      getTrend(currentMonth.cpa, previousMonth.cpa) < 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {getTrend(currentMonth.cpa, previousMonth.cpa) > 0 ? '+' : ''}
                      {getTrend(currentMonth.cpa, previousMonth.cpa).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta resumen Tasa de Aprobación */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tasa Aprobación</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {currentMonth ? formatPercentage(currentMonth.tasaAprobacion) : 'N/A'}
                  </span>
                  {currentMonth && previousMonth && (
                    <span className={`text-xs ${
                      getTrend(currentMonth.tasaAprobacion, previousMonth.tasaAprobacion) > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {getTrend(currentMonth.tasaAprobacion, previousMonth.tasaAprobacion) > 0 ? '+' : ''}
                      {getTrend(currentMonth.tasaAprobacion, previousMonth.tasaAprobacion).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta resumen Inversión */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Inversión Mensual</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {currentMonth ? formatCurrency(currentMonth.inversion) : 'N/A'}
                  </span>
                  {currentMonth && previousMonth && (
                    <span className={`text-xs ${
                      getTrend(currentMonth.inversion, previousMonth.inversion) > 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {getTrend(currentMonth.inversion, previousMonth.inversion) > 0 ? '+' : ''}
                      {getTrend(currentMonth.inversion, previousMonth.inversion).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta resumen Costo por Lead */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Costo por Lead</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {currentMonth ? formatCurrency(currentMonth.costoPortLead) : 'N/A'}
                  </span>
                  {currentMonth && previousMonth && (
                    <span className={`text-xs ${
                      getTrend(currentMonth.costoPortLead, previousMonth.costoPortLead) < 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {getTrend(currentMonth.costoPortLead, previousMonth.costoPortLead) > 0 ? '+' : ''}
                      {getTrend(currentMonth.costoPortLead, previousMonth.costoPortLead).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos detallados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico CPA y Costo por Lead */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Evolución CPA y Costo por Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'cpa' ? 'CPA' : 'Costo por Lead'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpa" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="cpa"
                />
                <Line 
                  type="monotone" 
                  dataKey="costoPortLead" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  name="costoPortLead"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Tasa de Aprobación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tasa de Aprobación Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [formatPercentage(value), 'Tasa de Aprobación']}
                />
                <Bar 
                  dataKey="tasaAprobacion" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Inversión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Inversión Mensual en Marketing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Inversión']}
                />
                <Bar 
                  dataKey="inversion" 
                  fill="hsl(var(--secondary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Leads vs Aprobados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads vs Aprobados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar 
                  dataKey="totalLeads" 
                  fill="hsl(var(--muted))"
                  radius={[4, 4, 0, 0]}
                  name="Total Leads"
                />
                <Bar 
                  dataKey="aprobados" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Aprobados"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
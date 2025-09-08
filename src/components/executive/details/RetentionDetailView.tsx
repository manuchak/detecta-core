import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';
import { useRetentionDetails } from '@/hooks/useRetentionDetails';
import { DynamicRetentionMetrics } from './DynamicRetentionMetrics';

export function RetentionDetailView() {
  const retentionData = useRetentionDetails();
  const { dynamicMetrics, loading } = retentionData;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="h-80 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Dynamic Metrics */}
      {dynamicMetrics && (
        <div className="mb-6">
          <DynamicRetentionMetrics metrics={dynamicMetrics} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Retención Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(retentionData.yearlyData.retentionPromedio)}
            </div>
            <p className="text-xs text-muted-foreground">
              Último período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Custodios Retenidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {retentionData.yearlyData.totalCustodiosRetenidos.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total del período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tiempo Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {retentionData.yearlyData.tiempoPromedioPermanenciaGeneral.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              meses de permanencia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatPercentage(retentionData.currentMonthData.tasaRetencion)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mes actual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Retention Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Evolución de la Retención Mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={retentionData.monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="monthName" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retención']}
              />
              <Bar 
                dataKey="tasaRetencion" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lifetime Evolution and Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Lifetime Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Evolución del Tiempo de Permanencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={retentionData.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="monthName" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} meses`, 'Tiempo Promedio']}
                />
                <Line 
                  type="monotone" 
                  dataKey="tiempoPromedioPermanencia" 
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumen de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {retentionData.monthlyBreakdown.slice(-4).reverse().map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{month.monthName}</div>
                    <div className="text-sm text-muted-foreground">
                      {month.custodiosAnterior} custodios • {month.tiempoPromedioPermanencia.toFixed(1)} meses
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {formatPercentage(month.tasaRetencion)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {month.custodiosRetenidos} retenidos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis de Cohortes - Retención por Mes de Incorporación
          </CardTitle>
          <CardDescription>
            Porcentaje de custodios que permanecen activos después de N meses desde su incorporación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Cohorte</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Mes 0</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Mes 1</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Mes 2</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Mes 3</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Mes 4</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Mes 5</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Mes 6</th>
                </tr>
              </thead>
              <tbody>
                {retentionData.cohortAnalysis.map((cohort, index) => {
                  const monthName = new Date(cohort.cohortMonth).toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'short' 
                  });
                  
                  return (
                    <tr key={index} className="border-b hover:bg-muted/20">
                      <td className="py-3 px-3 font-medium">{monthName}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          {cohort.month0}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month1 >= 90 ? 'bg-green-100 text-green-800' :
                          cohort.month1 >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month1}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month2 >= 80 ? 'bg-green-100 text-green-800' :
                          cohort.month2 >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month2}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month3 >= 70 ? 'bg-green-100 text-green-800' :
                          cohort.month3 >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month3}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month4 >= 65 ? 'bg-green-100 text-green-800' :
                          cohort.month4 >= 55 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month4}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month5 >= 60 ? 'bg-green-100 text-green-800' :
                          cohort.month5 >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month5}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month6 >= 55 ? 'bg-green-100 text-green-800' :
                          cohort.month6 >= 45 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month6}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Cohort Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span className="text-muted-foreground">Excelente (≥80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 rounded"></div>
              <span className="text-muted-foreground">Bueno (60-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 rounded"></div>
              <span className="text-muted-foreground">Necesita Mejora (&lt;60%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
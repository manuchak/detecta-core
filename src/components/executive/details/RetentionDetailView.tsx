import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, LabelList } from 'recharts';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';
import { useRetentionDetails } from '@/hooks/useRetentionDetails';
import { DynamicRetentionMetrics } from './DynamicRetentionMetrics';

// Función para calcular línea de tendencia usando regresión lineal
const calculateTrendline = (data: { tiempoPromedioPermanencia: number }[]) => {
  const n = data.length;
  if (n < 2) return data; // Necesitamos al menos 2 puntos
  
  // x = índice (0, 1, 2, ..., n-1)
  // y = tiempoPromedioPermanencia
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  
  data.forEach((point, index) => {
    const x = index;
    const y = point.tiempoPromedioPermanencia;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });
  
  // Calcular pendiente (b) e intercepto (a)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generar puntos de la línea de tendencia
  return data.map((point, index) => ({
    ...point,
    trendValue: intercept + slope * index
  }));
};

export function RetentionDetailView() {
  const retentionData = useRetentionDetails();
  const { dynamicMetrics, loading } = retentionData;

  // Calcular línea de tendencia para el gráfico de permanencia
  const dataWithTrend = useMemo(() => 
    calculateTrendline(retentionData.monthlyBreakdown), 
    [retentionData.monthlyBreakdown]
  );

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
          <DynamicRetentionMetrics metrics={dynamicMetrics} quarterlyData={retentionData.quarterlyData} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="min-h-[140px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-3.5 w-3.5" />
              Retención Promedio
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold text-emerald-600">
              {formatPercentage(retentionData.yearlyData.retentionPromedio)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos {retentionData.yearlyData.mesesConDatos} meses completos
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[140px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Custodios {retentionData.yearlyData.labelUltimoQCompletado}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold text-blue-600">
              {retentionData.yearlyData.custodiosUltimoQCompletado.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Último trimestre completado
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[140px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Tiempo Promedio
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold text-purple-600">
              {retentionData.yearlyData.tiempoPromedioPermanenciaGeneral.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              meses de permanencia
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[140px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold text-orange-600">
              {formatPercentage(retentionData.currentMonthData.tasaRetencion)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa de retención
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
              >
                <LabelList 
                  dataKey="tasaRetencion"
                  position="top"
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  style={{ fontSize: '11px', fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                />
              </Bar>
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
              <LineChart data={dataWithTrend}>
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
                  formatter={(value: number, name: string) => {
                    if (name === 'trendValue') return [null, null]; // Ocultar tendencia en tooltip
                    return [`${value.toFixed(1)} meses`, 'Tiempo Promedio'];
                  }}
                />
                
                {/* Línea de tendencia - PRIMERO (debajo) */}
                <Line 
                  type="monotone" 
                  dataKey="trendValue" 
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeOpacity={0.4}
                  dot={false}
                  name="trendValue"
                />
                
                {/* Línea de datos reales - SEGUNDO (encima) */}
                <Line 
                  type="monotone" 
                  dataKey="tiempoPromedioPermanencia" 
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                  name="Tiempo Promedio"
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
                  
                  // Calcular custodios nuevos (aproximación basada en custodios nuevos del mes)
                  const custodiosNuevos = retentionData.monthlyBreakdown.find(m => m.month === cohort.cohortMonth)?.custodiosNuevos || 
                                        Math.round((retentionData.monthlyBreakdown.find(m => m.month === cohort.cohortMonth)?.custodiosActual || 50) * 0.3);
                  
                  return (
                    <tr key={index} className="border-b hover:bg-muted/20">
                      <td className="py-3 px-3 font-medium">{monthName}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          <div>{cohort.month0}%</div>
                          <div className="text-[10px] opacity-70">{custodiosNuevos}</div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {cohort.month1 > 0 ? (
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            cohort.month1 >= 80 ? 'bg-green-100 text-green-800' :
                            cohort.month1 >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            <div>{cohort.month1}%</div>
                            <div className="text-[10px] opacity-70">{Math.round(custodiosNuevos * cohort.month1 / 100)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {cohort.month2 > 0 ? (
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            cohort.month2 >= 80 ? 'bg-green-100 text-green-800' :
                            cohort.month2 >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            <div>{cohort.month2}%</div>
                            <div className="text-[10px] opacity-70">{Math.round(custodiosNuevos * cohort.month2 / 100)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {cohort.month3 > 0 ? (
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            cohort.month3 >= 80 ? 'bg-green-100 text-green-800' :
                            cohort.month3 >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            <div>{cohort.month3}%</div>
                            <div className="text-[10px] opacity-70">{Math.round(custodiosNuevos * cohort.month3 / 100)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {cohort.month4 > 0 ? (
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            cohort.month4 >= 80 ? 'bg-green-100 text-green-800' :
                            cohort.month4 >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            <div>{cohort.month4}%</div>
                            <div className="text-[10px] opacity-70">{Math.round(custodiosNuevos * cohort.month4 / 100)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {cohort.month5 > 0 ? (
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            cohort.month5 >= 80 ? 'bg-green-100 text-green-800' :
                            cohort.month5 >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            <div>{cohort.month5}%</div>
                            <div className="text-[10px] opacity-70">{Math.round(custodiosNuevos * cohort.month5 / 100)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {cohort.month6 > 0 ? (
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            cohort.month6 >= 80 ? 'bg-green-100 text-green-800' :
                            cohort.month6 >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            <div>{cohort.month6}%</div>
                            <div className="text-[10px] opacity-70">{Math.round(custodiosNuevos * cohort.month6 / 100)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
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
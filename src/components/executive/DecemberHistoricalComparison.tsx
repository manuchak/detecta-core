/**
 * Componente para visualizar comparativa histórica de diciembre
 * Incluye gráfico de líneas, tabla de calibración de feriados y proyecciones
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, ReferenceArea 
} from 'recharts';
import { 
  Calendar, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, ArrowRight, RefreshCw, Database
} from 'lucide-react';
import { useDecemberHistoricalComparison } from '@/hooks/useDecemberHistoricalComparison';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DecemberHistoricalComparison = () => {
  const { dailyData, summary, holidayImpacts, isLoading } = useDecemberHistoricalComparison();
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCorrections = async () => {
    setIsApplying(true);
    try {
      // Aplicar correcciones a calendario_feriados_mx
      for (const impact of holidayImpacts) {
        if (impact.recommendation !== 'correct') {
          const { error } = await supabase
            .from('calendario_feriados_mx')
            .update({ 
              factor_ajuste: impact.suggestedFactor,
              impacto_observado_pct: Math.round((1 - impact.suggestedFactor) * 100),
              notas: `Corregido ${new Date().toISOString().split('T')[0]} basado en datos históricos 2023-2024`
            })
            .eq('fecha', impact.date);

          if (error) {
            console.error('Error updating holiday:', error);
          }
        }
      }
      
      toast.success('Factores de feriados actualizados correctamente');
    } catch (error) {
      toast.error('Error al aplicar correcciones');
      console.error(error);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Preparar datos para el gráfico
  const chartData = dailyData.map(d => ({
    day: d.day,
    dayLabel: `${d.day} ${d.dayName}`,
    '2023': d.year2023.services,
    '2024': d.year2024.services,
    '2025': d.year2025.services,
    isHoliday: d.isHoliday,
    holidayName: d.holidayName
  }));

  // Calcular diferencia entre proyecciones
  const projectionDiff = summary.projectedCorrected.services - summary.projected2025.services;
  const gmvDiff = (summary.projectedCorrected.gmv - summary.projected2025.gmv) / 1000000;

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Comparativa Diciembre Histórico
          </h3>
          <p className="text-sm text-muted-foreground">
            Análisis día por día de diciembre 2023 vs 2024 vs 2025
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Datos al día {summary.total2025.daysWithData} de diciembre
        </Badge>
      </div>

      {/* Tarjetas de resumen Nov vs Dic */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dic 2023
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total2023.services.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs">
              {summary.novVsDec2023 >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={summary.novVsDec2023 >= 0 ? 'text-green-600' : 'text-red-600'}>
                {summary.novVsDec2023 >= 0 ? '+' : ''}{summary.novVsDec2023.toFixed(1)}% vs Nov
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dic 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total2024.services.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs">
              {summary.novVsDec2024 >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={summary.novVsDec2024 >= 0 ? 'text-green-600' : 'text-red-600'}>
                {summary.novVsDec2024 >= 0 ? '+' : ''}{summary.novVsDec2024.toFixed(1)}% vs Nov
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dic 2025 (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.total2025.services.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.total2025.daysWithData} días completados
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Proyección Dic 2025
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {summary.projectedCorrected.services.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              GMV: ${(summary.projectedCorrected.gmv / 1000000).toFixed(2)}M
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Servicios por Día - Diciembre</CardTitle>
          <CardDescription>
            Comparación histórica con zonas sombreadas para feriados principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => value.toString()}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    const dayData = dailyData.find(d => d.day === label);
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">
                          Día {label} {dayData?.dayName}
                          {dayData?.isHoliday && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {dayData.holidayName}
                            </Badge>
                          )}
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex justify-between gap-4">
                              <span style={{ color: entry.color }}>{entry.name}:</span>
                              <span className="font-medium">{entry.value ?? '-'} servicios</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />
                
                {/* Áreas sombreadas para feriados */}
                <ReferenceArea x1={11.5} x2={12.5} fill="hsl(var(--muted))" fillOpacity={0.3} />
                <ReferenceArea x1={23.5} x2={25.5} fill="hsl(var(--destructive))" fillOpacity={0.15} />
                <ReferenceArea x1={30.5} x2={31.5} fill="hsl(var(--destructive))" fillOpacity={0.15} />
                
                <Line 
                  type="monotone" 
                  dataKey="2023" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="2024" 
                  stroke="hsl(220 90% 56%)" 
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line 
                  type="monotone" 
                  dataKey="2025" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de calibración de feriados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Calibración de Factores de Feriados
              </CardTitle>
              <CardDescription>
                Comparación entre factores configurados y factores reales históricos
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              onClick={handleApplyCorrections}
              disabled={isApplying || holidayImpacts.every(h => h.recommendation === 'correct')}
            >
              {isApplying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aplicar Correcciones
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Feriado</th>
                  <th className="text-center py-2 px-3 font-medium">Configurado</th>
                  <th className="text-center py-2 px-3 font-medium">Real 2023</th>
                  <th className="text-center py-2 px-3 font-medium">Real 2024</th>
                  <th className="text-center py-2 px-3 font-medium">Promedio Real</th>
                  <th className="text-center py-2 px-3 font-medium">Estado</th>
                  <th className="text-center py-2 px-3 font-medium">Sugerido</th>
                </tr>
              </thead>
              <tbody>
                {holidayImpacts.map((impact) => (
                  <tr key={impact.date} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">{impact.name}</td>
                    <td className="py-2 px-3 text-center">
                      <Badge variant="secondary">
                        {(impact.configuredFactor * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {(impact.realFactor2023 * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      {(impact.realFactor2024 * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-center font-medium">
                      {(impact.avgRealFactor * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      {impact.recommendation === 'correct' ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      ) : impact.recommendation === 'overestimated' ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Exceso
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Falta
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {impact.recommendation !== 'correct' && (
                        <div className="flex items-center justify-center gap-1">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="border-primary text-primary">
                            {(impact.suggestedFactor * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Impacto en proyección */}
      {projectionDiff !== 0 && (
        <Alert className="border-primary/50 bg-primary/5">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>Impacto de corrección:</strong> La proyección calibrada es{' '}
            <span className="font-bold text-primary">
              {projectionDiff > 0 ? '+' : ''}{projectionDiff.toLocaleString()} servicios
            </span>{' '}
            ({gmvDiff > 0 ? '+' : ''}{gmvDiff.toFixed(2)}M GMV) respecto a la proyección actual.
            Esto indica que el sistema actual <strong>subestima</strong> el rendimiento de diciembre.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DecemberHistoricalComparison;

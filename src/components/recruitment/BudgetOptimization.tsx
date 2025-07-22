
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar } from 'recharts';
import { TrendingUp, AlertTriangle, Target, DollarSign, Users, Zap } from 'lucide-react';
import { useUnifiedRecruitmentMetrics } from '@/hooks/useUnifiedRecruitmentMetrics';
import { RecruitmentMathEngine } from '@/lib/RecruitmentMathEngine';

interface ChannelEfficiency {
  id: string;
  name: string;
  cpa: number;
  roi: number;
  volume: number;
  efficiency: number;
  current_budget: number;
  optimal_budget: number;
  improvement_potential: number;
}

export const BudgetOptimization = () => {
  const { metrics, loading } = useUnifiedRecruitmentMetrics();
  const [budgetAdjustments, setBudgetAdjustments] = useState<Record<string, number>>({});
  
  // Procesar datos de canales para análisis
  const channelData = useMemo((): ChannelEfficiency[] => {
    if (!metrics || !metrics.financialMetrics.roiByChannel) return [];

    const channels = Object.entries(metrics.financialMetrics.roiByChannel).map(([channelId, roi]) => {
      const cpa = metrics.financialMetrics.realCPA || 3500;
      const volume = Math.random() * 100 + 20; // Simulated volume data
      const efficiency = roi / cpa;
      const current_budget = metrics.financialMetrics.totalInvestment / Object.keys(metrics.financialMetrics.roiByChannel).length;
      
      return {
        id: channelId,
        name: channelId.charAt(0).toUpperCase() + channelId.slice(1),
        cpa,
        roi,
        volume,
        efficiency,
        current_budget,
        optimal_budget: current_budget * (1 + (efficiency - 1) * 0.3),
        improvement_potential: ((efficiency - 1) * 30)
      };
    });

    return channels.sort((a, b) => b.efficiency - a.efficiency);
  }, [metrics]);

  // Cálculos de optimización
  const optimizationMetrics = useMemo(() => {
    if (channelData.length === 0) return null;

    const totalCurrentBudget = channelData.reduce((sum, channel) => sum + channel.current_budget, 0);
    const totalOptimalBudget = channelData.reduce((sum, channel) => sum + channel.optimal_budget, 0);
    const totalCurrentROI = channelData.reduce((sum, channel) => sum + (channel.roi * channel.current_budget), 0) / totalCurrentBudget;
    const totalOptimalROI = channelData.reduce((sum, channel) => sum + (channel.roi * channel.optimal_budget), 0) / totalOptimalBudget;
    const improvementPotential = ((totalOptimalROI - totalCurrentROI) / totalCurrentROI) * 100;

    return {
      totalCurrentBudget,
      totalOptimalBudget,
      totalCurrentROI,
      totalOptimalROI,
      improvementPotential,
      topChannel: channelData[0],
      worstChannel: channelData[channelData.length - 1]
    };
  }, [channelData]);

  // Datos para gráfico de eficiencia (Scatter)
  const efficiencyData = channelData.map(channel => ({
    name: channel.name,
    cpa: channel.cpa,
    roi: channel.roi,
    volume: channel.volume,
    efficiency: channel.efficiency
  }));

  // Datos para distribución óptima (Pie)
  const distributionData = channelData.map(channel => ({
    name: channel.name,
    value: channel.optimal_budget,
    color: channel.efficiency > 1.2 ? '#22c55e' : channel.efficiency > 1 ? '#f59e0b' : '#ef4444'
  }));

  // Colores para gráficos
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs de Optimización */}
      {optimizationMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Mejora Potencial</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                +{optimizationMetrics.improvementPotential.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">ROI total</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">ROI Actual</span>
              </div>
              <div className="text-2xl font-bold">
                {optimizationMetrics.totalCurrentROI.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs {optimizationMetrics.totalOptimalROI.toFixed(0)}% óptimo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Mejor Canal</span>
              </div>
              <div className="text-lg font-bold">{optimizationMetrics.topChannel.name}</div>
              <p className="text-xs text-muted-foreground">
                {optimizationMetrics.topChannel.efficiency.toFixed(2)}x eficiencia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Necesita Atención</span>
              </div>
              <div className="text-lg font-bold">{optimizationMetrics.worstChannel.name}</div>
              <p className="text-xs text-muted-foreground">
                {optimizationMetrics.worstChannel.efficiency.toFixed(2)}x eficiencia
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs para diferentes análisis */}
      <Tabs defaultValue="efficiency" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="efficiency">Eficiencia por Canal</TabsTrigger>
          <TabsTrigger value="distribution">Distribución Óptima</TabsTrigger>
          <TabsTrigger value="simulator">Simulador</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensibilidad</TabsTrigger>
        </TabsList>

        {/* Análisis de Eficiencia */}
        <TabsContent value="efficiency">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Eficiencia por Canal: CPA vs ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="cpa" 
                      name="CPA"
                      label={{ value: 'Costo por Adquisición ($)', position: 'bottom' }}
                    />
                    <YAxis 
                      dataKey="roi" 
                      name="ROI"
                      label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'roi' ? `${value}%` : `$${value}`,
                        name === 'roi' ? 'ROI' : 'CPA'
                      ]}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return data ? `${data.name} - Volumen: ${data.volume.toFixed(0)}` : '';
                      }}
                    />
                    <Scatter 
                      dataKey="roi" 
                      fill="hsl(var(--primary))"
                      r={(entry) => Math.max(5, entry.volume / 10)}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                * El tamaño de las burbujas representa el volumen del canal. 
                Canales más hacia arriba y la izquierda son más eficientes.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribución Óptima */}
        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución Actual vs Óptima</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channelData.map((channel, index) => (
                    <div key={channel.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{channel.name}</span>
                        <Badge 
                          variant={channel.improvement_potential > 0 ? "default" : "secondary"}
                        >
                          {channel.improvement_potential > 0 ? '+' : ''}{channel.improvement_potential.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Actual: ${channel.current_budget.toLocaleString()}</span>
                          <span>Óptimo: ${channel.optimal_budget.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(channel.current_budget / Math.max(...channelData.map(c => c.optimal_budget))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución Óptima de Presupuesto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Presupuesto']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Simulador */}
        <TabsContent value="simulator">
          <Card>
            <CardHeader>
              <CardTitle>Simulador de Presupuesto Interactivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {channelData.map((channel) => (
                  <div key={channel.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{channel.name}</span>
                      <span className="text-sm font-mono">
                        ${(budgetAdjustments[channel.id] ?? channel.current_budget).toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      value={[budgetAdjustments[channel.id] ?? channel.current_budget]}
                      onValueChange={([value]) => 
                        setBudgetAdjustments(prev => ({ ...prev, [channel.id]: value }))
                      }
                      min={0}
                      max={channel.current_budget * 3}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$0</span>
                      <span>Actual: ${channel.current_budget.toLocaleString()}</span>
                      <span>${(channel.current_budget * 3).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Proyección con Ajustes</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Custodios Proyectados:</span>
                      <span className="font-bold ml-2">
                        {Math.round(Object.values(budgetAdjustments).reduce((sum, budget, index) => {
                          const channel = channelData[index];
                          return sum + (budget || channel?.current_budget || 0) / (channel?.cpa || 3500);
                        }, 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">ROI Estimado:</span>
                      <span className="font-bold ml-2">
                        {(Object.values(budgetAdjustments).reduce((sum, budget, index) => {
                          const channel = channelData[index];
                          return sum + ((budget || channel?.current_budget || 0) * (channel?.roi || 0) / 100);
                        }, 0) / Object.values(budgetAdjustments).reduce((sum, budget, index) => {
                          const channel = channelData[index];
                          return sum + (budget || channel?.current_budget || 0);
                        }, 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análisis de Sensibilidad */}
        <TabsContent value="sensitivity">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Sensibilidad por Canal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[-50, 50]} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Sensibilidad']}
                      labelFormatter={(label) => `Canal: ${label}`}
                    />
                    <Bar 
                      dataKey="improvement_potential" 
                      fill={(entry) => entry.improvement_potential > 0 ? '#22c55e' : '#ef4444'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                * Valores positivos indican potencial de mejora, negativos indican sobre-inversión
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertas y Recomendaciones */}
      {optimizationMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Recomendaciones Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-medium text-green-900">✅ Acción Recomendada</div>
                <div className="text-sm text-green-700">
                  Incrementar presupuesto en {optimizationMetrics.topChannel.name} (+
                  {((optimizationMetrics.topChannel.optimal_budget - optimizationMetrics.topChannel.current_budget) / optimizationMetrics.topChannel.current_budget * 100).toFixed(0)}%) 
                  para maximizar ROI
                </div>
              </div>
              
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="font-medium text-orange-900">⚠️ Atención Requerida</div>
                <div className="text-sm text-orange-700">
                  Revisar estrategia en {optimizationMetrics.worstChannel.name} - 
                  eficiencia por debajo del promedio ({optimizationMetrics.worstChannel.efficiency.toFixed(2)}x)
                </div>
              </div>

              {optimizationMetrics.improvementPotential > 10 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-blue-900">💡 Oportunidad</div>
                  <div className="text-sm text-blue-700">
                    Potencial de mejora del {optimizationMetrics.improvementPotential.toFixed(1)}% 
                    aplicando redistribución óptima de presupuesto
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

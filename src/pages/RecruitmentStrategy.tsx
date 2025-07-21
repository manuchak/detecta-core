import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNationalRecruitment } from '@/hooks/useNationalRecruitment';
import { useRealNationalRecruitment } from '@/hooks/useRealNationalRecruitment';
import { useAdvancedRecruitmentPrediction } from '@/hooks/useAdvancedRecruitmentPrediction';
import { AlertTriangle, Users, MapPin, TrendingUp, Target, Zap, Database, TestTube } from 'lucide-react';
import { NationalMap } from '@/components/recruitment/NationalMap';
import { RealDataMap } from '@/components/recruitment/RealDataMap';
import { AlertsPanel } from '@/components/recruitment/AlertsPanel';
import { CandidatesPipeline } from '@/components/recruitment/CandidatesPipeline';
import { MetricsOverview } from '@/components/recruitment/MetricsOverview';
import FinancialROIDashboard from '@/components/recruitment/FinancialROIDashboard';
import { TemporalPatternsPanel } from "@/components/recruitment/temporal/TemporalPatternsPanel";
import { MachineLearningPanel } from "@/components/recruitment/ml/MachineLearningPanel";
import { ScenarioSimulationPanel } from "@/components/recruitment/simulation/ScenarioSimulationPanel";

const RecruitmentStrategy = () => {
  // Usar siempre datos reales por defecto
  const [useRealData] = useState(true);
  
  // Hooks para datos simulados
  const {
    loading: loadingSimulado,
    zonas: zonasSimuladas,
    metricas: metricasSimuladas,
    alertas: alertasSimuladas,
    candidatos: candidatosSimulados,
    alertasCriticas: alertasCriticasSimuladas,
    alertasPreventivas: alertasPreventivasSimuladas,
    alertasEstrategicas: alertasEstrategicasSimuladas,
    totalDeficit: totalDeficitSimulado,
    zonasPrioritarias: zonasPrioritariasSimuladas,
    candidatosActivos: candidatosActivosSimulados,
    generarAlertasAutomaticas,
    fetchAll: fetchAllSimulado
  } = useNationalRecruitment();

  // Hooks para datos reales
  const {
    loading: loadingReal,
    zonasReales,
    metricasReales,
    alertasReales,
    candidatosReales,
    alertasCriticas: alertasCriticasReales,
    alertasPreventivas: alertasPreventivasReales,
    alertasEstrategicas: alertasEstrategicasReales,
    totalDeficit: totalDeficitReal,
    zonasPrioritarias: zonasPrioritariasReales,
    candidatosActivos: candidatosActivosReales,
    generarAlertasBasadasEnDatos,
    fetchAllReal
  } = useRealNationalRecruitment();

  // Hook para predicciones avanzadas con rotación
  const {
    loading: loadingPrediction,
    kpis: kpisPrediction,
    deficitConRotacion,
    datosRotacion,
    refreshData: refreshPredictionData
  } = useAdvancedRecruitmentPrediction();

  // Usar siempre datos reales
  const loading = loadingReal;
  const alertasCriticas = alertasCriticasReales;
  const alertasPreventivas = alertasPreventivasReales;
  const alertasEstrategicas = alertasEstrategicasReales;
  const totalDeficit = totalDeficitReal;
  const zonasPrioritarias = zonasPrioritariasReales;
  const candidatosActivos = candidatosActivosReales;

  const handleRefreshData = () => {
    fetchAllReal();
    refreshPredictionData();
  };

  const handleGenerateAlerts = () => {
    generarAlertasBasadasEnDatos();
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Estrategia Nacional de Reclutamiento
          </h1>
          <p className="text-muted-foreground mt-2">
            Sistema inteligente de adquisición y gestión de custodios a nivel nacional
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefreshData}
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar Datos'}
          </Button>
          <Button
            onClick={handleGenerateAlerts}
            disabled={loading}
          >
            <Zap className="w-4 h-4 mr-2" />
            Analizar Datos
          </Button>
        </div>
      </div>

      {/* KPIs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alertas Críticas</p>
              <p className="text-2xl font-bold text-destructive">{alertasCriticas}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alertas Preventivas</p>
              <p className="text-2xl font-bold text-warning">{alertasPreventivas}</p>
            </div>
            <Target className="h-8 w-8 text-warning" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Oportunidades</p>
              <p className="text-2xl font-bold text-success">{alertasEstrategicas}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-success" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Déficit Total</p>
              <p className="text-2xl font-bold text-destructive">{totalDeficit}</p>
            </div>
            <Users className="h-8 w-8 text-destructive" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Zonas Prioritarias</p>
              <p className="text-2xl font-bold text-warning">{zonasPrioritarias}</p>
            </div>
            <MapPin className="h-8 w-8 text-warning" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Candidatos Activos</p>
              <p className="text-2xl font-bold text-primary">{candidatosActivos}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="mapa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="mapa">Mapa Nacional</TabsTrigger>
          <TabsTrigger value="alertas">Sistema de Alertas</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline de Candidatos</TabsTrigger>
          <TabsTrigger value="metricas">Métricas y Análisis</TabsTrigger>
          <TabsTrigger value="rotacion">Análisis de Rotación</TabsTrigger>
          <TabsTrigger value="temporal">Patrones Temporales</TabsTrigger>
          <TabsTrigger value="ml">Machine Learning</TabsTrigger>
          <TabsTrigger value="simulation">Simulación</TabsTrigger>
          <TabsTrigger value="roi">ROI y Presupuestos</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Vista Nacional Interactiva</h2>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {zonasReales.length} Zonas Operativas
                </Badge>
                <Badge variant="outline">
                  {metricasReales.length} Métricas Calculadas
                </Badge>
              </div>
            </div>
            <RealDataMap 
              zonasReales={zonasReales}
              metricasReales={metricasReales}
              alertasReales={alertasReales}
              candidatosReales={candidatosReales}
            />
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4">
              {alertasReales.map((alerta, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{alerta.titulo}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{alerta.descripcion}</p>
                      <Badge variant={
                        alerta.tipo_alerta === 'critica' ? 'destructive' :
                        alerta.tipo_alerta === 'preventiva' ? 'default' : 'secondary'
                      } className="mt-2">
                        {alerta.tipo_alerta.toUpperCase()}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      Prioridad {alerta.prioridad}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Pipeline de Candidatos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['lead', 'contactado', 'entrevista', 'aprobado'].map(estado => {
                  const count = candidatosReales.filter(c => c.estado_proceso === estado).length;
                  return (
                    <Card key={estado} className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{count}</div>
                        <div className="text-sm text-muted-foreground capitalize">{estado}</div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Candidatos por Fuente</h3>
                <div className="space-y-2">
                  {Object.entries(
                    candidatosReales.reduce((acc, c) => {
                      const fuente = c.fuente_reclutamiento || 'Directo';
                      acc[fuente] = (acc[fuente] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([fuente, count]) => (
                    <div key={fuente} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="capitalize">{fuente}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metricas" className="space-y-6">
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Métricas por Zona</h2>
              <div className="space-y-4">
                {metricasReales.map((metrica, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <h3 className="font-semibold">{metrica.zona_nombre}</h3>
                        <p className="text-sm text-muted-foreground">Zona operativa</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{metrica.custodios_activos}</div>
                        <div className="text-xs text-muted-foreground">Custodios Activos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-warning">{metrica.deficit_custodios}</div>
                        <div className="text-xs text-muted-foreground">Déficit</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{metrica.servicios_promedio_dia}</div>
                        <div className="text-xs text-muted-foreground">Servicios/Día</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rotacion" className="space-y-6">
          <div className="space-y-4">
            {/* Header con métricas de rotación */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-orange-800">Análisis de Rotación e Impacto en Reclutamiento</h2>
                <Badge variant="outline" className="bg-orange-100 text-orange-700">
                  {datosRotacion.length} Zonas Analizadas
                </Badge>
              </div>
              
              {/* KPIs de Rotación */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-white rounded border border-orange-200">
                  <div className="text-2xl font-bold text-red-600">
                    {kpisPrediction.custodiosEnRiesgo || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Custodios en Riesgo</div>
                  <div className="text-xs text-red-600">30-60 días sin servicio</div>
                </div>
                <div className="text-center p-3 bg-white rounded border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">
                    {kpisPrediction.rotacionProyectada || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Egresos Proyectados</div>
                  <div className="text-xs text-orange-600">Próximos 30 días</div>
                </div>
                <div className="text-center p-3 bg-white rounded border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">
                    {kpisPrediction.tasaRotacionPromedio || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Tasa Rotación</div>
                  <div className="text-xs text-yellow-600">Promedio mensual</div>
                </div>
                <div className="text-center p-3 bg-white rounded border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {kpisPrediction.totalDeficit || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Necesidad Total</div>
                  <div className="text-xs text-green-600">Con rotación incluida</div>
                </div>
              </div>
            </Card>

            {/* Análisis por zona con impacto de rotación */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Impacto de Rotación por Zona Operativa</h3>
              <div className="space-y-4">
                {deficitConRotacion.map((zona, index) => (
                  <Card key={index} className="p-4 border-l-4 border-l-orange-500">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-base">{zona.zona_nombre}</h4>
                        <p className="text-sm text-muted-foreground">
                          Urgencia: {zona.urgencia_score}/10
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {zona.deficit_total}
                        </div>
                        <div className="text-xs text-muted-foreground">Déficit Original</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          +{zona.deficit_por_rotacion}
                        </div>
                        <div className="text-xs text-muted-foreground">Por Rotación</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {zona.deficit_total_con_rotacion}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Necesario</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">
                          {zona.custodios_en_riesgo}
                        </div>
                        <div className="text-xs text-muted-foreground">En Riesgo</div>
                      </div>
                    </div>
                    
                    {/* Plan de Reclutamiento para 3 Meses */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-sm text-blue-800">
                          📅 Plan de Reclutamiento - Próximos 3 Meses
                        </h5>
                        <Badge 
                          variant={
                            zona.plan_reclutamiento_3_meses.prioridad_urgencia === 'alta' ? 'destructive' :
                            zona.plan_reclutamiento_3_meses.prioridad_urgencia === 'media' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {zona.plan_reclutamiento_3_meses.prioridad_urgencia.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="text-lg font-bold text-blue-600">
                            {zona.plan_reclutamiento_3_meses.mes_1}
                          </div>
                          <div className="text-xs text-gray-600">Mes 1</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="text-lg font-bold text-green-600">
                            {zona.plan_reclutamiento_3_meses.mes_2}
                          </div>
                          <div className="text-xs text-gray-600">Mes 2</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="text-lg font-bold text-orange-600">
                            {zona.plan_reclutamiento_3_meses.mes_3}
                          </div>
                          <div className="text-xs text-gray-600">Mes 3</div>
                        </div>
                        <div className="text-center p-2 bg-gradient-to-r from-blue-100 to-green-100 rounded border-2 border-blue-300">
                          <div className="text-lg font-bold text-blue-800">
                            {zona.plan_reclutamiento_3_meses.total_3_meses}
                          </div>
                          <div className="text-xs text-blue-700 font-medium">Total</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                        <span className="font-medium">💡 Distribución basada en urgencia:</span>
                        {zona.plan_reclutamiento_3_meses.prioridad_urgencia === 'alta' && 
                          " 60% primer mes, 30% segundo mes, 10% tercer mes"}
                        {zona.plan_reclutamiento_3_meses.prioridad_urgencia === 'media' && 
                          " 40% primer mes, 40% segundo mes, 20% tercer mes"}
                        {zona.plan_reclutamiento_3_meses.prioridad_urgencia === 'baja' && 
                          " Distribución uniforme en 3 meses"}
                      </div>
                    </div>
                    
                    {/* Recomendaciones específicas */}
                    {zona.recomendaciones.length > 0 && (
                      <div className="mt-3 p-3 bg-orange-50 rounded">
                        <p className="text-xs font-medium text-orange-800 mb-2">
                          🎯 Acciones Recomendadas:
                        </p>
                        <ul className="text-xs space-y-1">
                          {zona.recomendaciones.slice(0, 3).map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-orange-600">•</span>
                              <span className="text-orange-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </Card>

            {/* Comparativa antes/después */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comparativa: Modelo Tradicional vs. Con Rotación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded">
                  <h4 className="font-medium text-blue-800 mb-3">Modelo Tradicional (Solo Demanda)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total de custodios necesarios:</span>
                      <span className="font-bold text-blue-600">
                        {deficitConRotacion.reduce((sum, z) => sum + z.deficit_total, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Zonas prioritarias:</span>
                      <span className="font-bold text-blue-600">
                        {deficitConRotacion.filter(z => z.urgencia_score >= 7).length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded">
                  <h4 className="font-medium text-green-800 mb-3">Modelo Mejorado (Con Rotación)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total de custodios necesarios:</span>
                      <span className="font-bold text-green-600">
                        {deficitConRotacion.reduce((sum, z) => sum + z.deficit_total_con_rotacion, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Adicional por rotación:</span>
                      <span className="font-bold text-green-600">
                        +{deficitConRotacion.reduce((sum, z) => sum + z.deficit_por_rotacion, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Necesidad retención:</span>
                      <span className="font-bold text-green-600">
                        {deficitConRotacion.reduce((sum, z) => sum + z.necesidad_retencion, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="temporal" className="space-y-6">`
          <TemporalPatternsPanel />
        </TabsContent>

        <TabsContent value="ml" className="space-y-6">
          <MachineLearningPanel />
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6">
          <ScenarioSimulationPanel />
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Dashboard Financiero ROI</h2>
              <Badge variant="outline">
                Sistema de Gastos Externos Integrado
              </Badge>
            </div>
            <FinancialROIDashboard />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecruitmentStrategy;
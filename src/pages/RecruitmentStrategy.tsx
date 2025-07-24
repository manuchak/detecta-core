import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NavigationSidebar } from '@/components/recruitment/ui/NavigationSidebar';
import { MinimalSectionHeader } from '@/components/recruitment/ui/MinimalSectionHeader';
import { MinimalCard } from '@/components/recruitment/ui/MinimalCard';
import { MinimalGrid } from '@/components/recruitment/ui/MinimalGrid';
import { useNationalRecruitment } from '@/hooks/useNationalRecruitment';
import { useRealNationalRecruitment } from '@/hooks/useRealNationalRecruitment';
import { useAdvancedRecruitmentPrediction } from '@/hooks/useAdvancedRecruitmentPrediction';
import { useMultiMonthRecruitmentPrediction } from '@/hooks/useMultiMonthRecruitmentPrediction';
import { useRegionalRotationDistribution } from '@/hooks/useRegionalRotationDistribution';
import { 
  AlertTriangle, 
  Users, 
  Target, 
  Zap, 
  Calendar,
  TrendingUp,
  RefreshCw,
  BarChart3,
  MapPin
} from 'lucide-react';
import { NationalMap } from '@/components/recruitment/NationalMap';
import { RealDataMap } from '@/components/recruitment/RealDataMap';
import { MultiMonthTimeline } from '@/components/recruitment/MultiMonthTimeline';
import { TemporalPatternsPanel } from "@/components/recruitment/temporal/TemporalPatternsPanel";
import { MachineLearningPanel } from "@/components/recruitment/ml/MachineLearningPanel";
import { ScenarioSimulationPanel } from "@/components/recruitment/simulation/ScenarioSimulationPanel";
import { ScenarioSimulator } from '@/components/recruitment/ScenarioSimulator';
import FinancialROIDashboard from '@/components/recruitment/FinancialROIDashboard';
import { ExecutiveDashboard } from '@/components/recruitment/ExecutiveDashboard';
import { MonthlyMetricsCards } from '@/components/recruitment/MonthlyMetricsCards';
import { IntelligentAlerts } from '@/components/recruitment/IntelligentAlerts';
import { IntelligentSimulator } from '@/components/recruitment/IntelligentSimulator';
import { FinancialTrackingSystem } from '@/components/recruitment/FinancialTrackingSystem';
import { ExpenseForm } from '@/components/recruitment/ExpenseForm';
import { ExpensesList } from '@/components/recruitment/ExpensesList';
import { UnifiedFinancialDashboard } from '@/components/financial/UnifiedFinancialDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealFinancialPerformance } from '@/hooks/useRealFinancialPerformance';
import { AIInsightsPanel } from '@/components/recruitment/AIInsightsPanel';
import { SmartAlertsPanel } from '@/components/recruitment/SmartAlertsPanel';
import { useUnifiedRecruitmentMetrics } from '@/hooks/useUnifiedRecruitmentMetrics';
import { RecruitmentErrorBoundary } from '@/components/recruitment/ErrorBoundary';
import { useReliableMetrics } from '@/hooks/useReliableMetrics';
import { useRotationAnalysisPage } from '@/hooks/useRotationAnalysisPage';
import { 
  IncomeDistributionHistogram,
  ActivationMetricsCard,
  CohortRetentionHeatMap,
  ProductivityChart
} from '@/components/recruitment/cohort-analytics';

const RecruitmentStrategy = () => {
  const [activeSection, setActiveSection] = useState('planificacion');
  
  // Obtener datos financieros reales para costo por custodio correcto
  const financialData = useRealFinancialPerformance();
  
  // Calcular el costo real por custodio usando datos consistentes y seguros
  const realCostPerCustodian = React.useMemo(() => {
    if (financialData.loading) return 4209; // Valor mientras carga
    
    const totalCustodios = financialData.roiByChannel.reduce((sum, channel) => sum + (channel.custodios || 0), 0);
    const calculatedCost = financialData.totalInvestment > 0 && totalCustodios > 0 
      ? Math.round(financialData.totalInvestment / totalCustodios)
      : 4209;
      
    console.log('💰 Cost per custodian calculation:', {
      totalInvestment: financialData.totalInvestment,
      totalCustodios,
      calculatedCost,
      loading: financialData.loading
    });
    
    return calculatedCost;
  }, [financialData]);

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

  const {
    loading: loadingPrediction,
    kpis: kpisPrediction,
    deficitConRotacion,
    datosRotacion,
    refreshData: refreshPredictionData
  } = useAdvancedRecruitmentPrediction();

  const {
    loading: loadingMultiMonth,
    multiMonthData,
    refreshData: refreshMultiMonthData
  } = useMultiMonthRecruitmentPrediction();

  // Unified metrics integration with fallback
  const {
    metrics: unifiedMetrics,
    loading: loadingUnified,
    fetchAll: fetchUnified
  } = useUnifiedRecruitmentMetrics();

  // Reliable metrics como fallback
  const {
    metrics: reliableMetrics,
    loading: loadingReliable,
    reliability
  } = useReliableMetrics();

  // Hook específico para Análisis de Rotación (NUEVO - no afecta nada más)
  const {
    loading: rotationAnalysisLoading,
    kpis: rotationKpis,
    datosRotacion: rotationData,
    refreshData: refreshRotationAnalysis
  } = useRotationAnalysisPage();

  // Hook para datos de rotación regional
  const { regionalData } = useRegionalRotationDistribution();

  // Usar siempre datos reales
  const loading = loadingReal;
  const alertasCriticas = alertasCriticasReales;
  const alertasPreventivas = alertasPreventivasReales;
  const alertasEstrategicas = alertasEstrategicasReales;
  const totalDeficit = totalDeficitReal;
  const zonasPrioritarias = zonasPrioritariasReales;
  const candidatosActivos = candidatosActivosReales;

  const handleRefreshData = () => {
    try {
      fetchAllReal();
      refreshPredictionData();
      refreshMultiMonthData();
      fetchUnified();
    } catch (error) {
      console.error('Error refreshing data:', error);
      // El error boundary manejará cualquier falla
    }
  };

  const handleGenerateAlerts = () => {
    generarAlertasBasadasEnDatos();
  };

  // Get section metadata
  const getSectionInfo = () => {
    switch (activeSection) {
      case 'planificacion':
        return {
          title: 'Planificación Multi-Mes',
          description: 'Timeline estratégico y planificación a 3-6 meses para reclutamiento nacional',
          icon: Calendar,
          breadcrumbs: ['Estrategia', 'Planificación Multi-Mes']
        };
      case 'mapa':
        return {
          title: 'Mapa Nacional Interactivo',
          description: 'Vista geográfica completa del estado del reclutamiento por zonas',
          icon: MapPin,
          breadcrumbs: ['Estrategia', 'Mapa Nacional']
        };
      case 'alertas':
        return {
          title: 'Sistema de Alertas',
          description: 'Monitoreo en tiempo real de situaciones críticas y preventivas',
          icon: AlertTriangle,
          breadcrumbs: ['Operaciones', 'Alertas']
        };
      case 'pipeline':
        return {
          title: 'Pipeline de Candidatos',
          description: 'Seguimiento del flujo de reclutamiento y estado de candidatos',
          icon: Users,
          breadcrumbs: ['Operaciones', 'Pipeline']
        };
      case 'metricas':
        return {
          title: 'Métricas Operativas',
          description: 'KPIs y métricas de rendimiento por zona operativa',
          icon: BarChart3,
          breadcrumbs: ['Operaciones', 'Métricas']
        };
      case 'rotacion':
        return {
          title: 'Análisis de Rotación',
          description: 'Impacto de la rotación en las necesidades de reclutamiento',
          icon: TrendingUp,
          breadcrumbs: ['Análisis', 'Rotación']
        };
      case 'temporal':
        return {
          title: 'Patrones Temporales',
          description: 'Análisis de estacionalidad y tendencias temporales',
          icon: BarChart3,
          breadcrumbs: ['Análisis', 'Patrones Temporales']
        };
      case 'ml':
        return {
          title: 'Machine Learning',
          description: 'Predicciones e insights basados en inteligencia artificial',
          icon: Target,
          breadcrumbs: ['Análisis', 'Machine Learning']
        };
      case 'simulation':
        return {
          title: 'Simulación de Escenarios',
          description: 'Modelado y análisis de diferentes estrategias de reclutamiento',
          icon: Target,
          breadcrumbs: ['Simulación', 'Escenarios']
        };
      case 'roi':
        return {
          title: 'ROI y Análisis Financiero',
          description: 'Retorno de inversión y análisis de costos de reclutamiento',
          icon: TrendingUp,
          breadcrumbs: ['Simulación', 'ROI']
        };
      case 'executive':
        return {
          title: 'Dashboard Ejecutivo',
          description: 'Vista consolidada para toma de decisiones estratégicas',
          icon: Target,
          breadcrumbs: ['Executive', 'Dashboard']
        };
      case 'financial':
        return {
          title: 'Sistema Financiero',
          description: 'Seguimiento de gastos y ROI de reclutamiento',
          icon: TrendingUp,
          breadcrumbs: ['Executive', 'Financiero']
        };
      case 'simulator':
        return {
          title: 'Simulador Inteligente',
          description: 'Simulación avanzada de escenarios de reclutamiento',
          icon: Target,
          breadcrumbs: ['Executive', 'Simulador']
        };
      case 'alerts':
        return {
          title: 'Alertas Inteligentes',
          description: 'Sistema de alertas basado en IA y correlaciones',
          icon: AlertTriangle,
          breadcrumbs: ['Executive', 'Alertas']
        };
      case 'ai':
        return {
          title: 'Análisis AI',
          description: 'Insights inteligentes y recomendaciones basadas en IA',
          icon: Target,
          breadcrumbs: ['Executive', 'Análisis AI']
        };
      case 'cohort':
        return {
          title: 'Análisis de Cohortes',
          description: 'Retención, activación y productividad de custodios por cohortes',
          icon: BarChart3,
          breadcrumbs: ['Executive', 'Cohortes']
        };
      case 'monthly-metrics':
        return {
          title: 'Métricas Mensuales',
          description: 'Evolución de CPA, tasa de aprobación, inversión y costo por lead',
          icon: TrendingUp,
          breadcrumbs: ['Executive', 'Métricas Mensuales']
        };
      default:
        return {
          title: 'Estrategia Nacional',
          description: 'Sistema de reclutamiento nacional',
          icon: Target,
          breadcrumbs: ['Inicio']
        };
    }
  };

  const sectionInfo = getSectionInfo();

  // Render main metrics for each section
  const renderSectionMetrics = () => {
    if (loading) {
      return (
        <MinimalGrid columns={3}>
          {[1, 2, 3].map(i => (
            <MinimalCard
              key={i}
              title="Cargando"
              value=""
              loading={true}
            />
          ))}
        </MinimalGrid>
      );
    }

    switch (activeSection) {
      case 'planificacion':
        return (
          <MinimalGrid columns={3}>
            <MinimalCard
              title="Agosto 2025"
              value={multiMonthData?.targetMonth?.totalNeed || totalDeficit}
              subtitle="Custodios necesarios"
              preview={{
                label: "Septiembre",
                value: multiMonthData?.nextMonth?.totalNeed || 0
              }}
              variant="primary"
            />
            <MinimalCard
              title="Presupuesto Total"
              value={multiMonthData?.targetMonth?.totalNeed 
                ? new Intl.NumberFormat('es-MX', { 
                    style: 'currency', 
                    currency: 'MXN',
                    notation: 'compact',
                     maximumFractionDigits: 0
                   }).format((multiMonthData.targetMonth.totalNeed || totalDeficit) * realCostPerCustodian)
                 : new Intl.NumberFormat('es-MX', { 
                     style: 'currency', 
                     currency: 'MXN',
                     notation: 'compact',
                     maximumFractionDigits: 0
                   }).format(totalDeficit * realCostPerCustodian)
               }
               subtitle={`$${Math.round(realCostPerCustodian).toLocaleString()} por custodio`}
            />
            <MinimalCard
              title="Tiempo Disponible"
              value={multiMonthData?.kpis?.daysUntilAction || '10'}
              subtitle="días para actuar"
              variant="subtle"
            />
          </MinimalGrid>
        );
      
      case 'mapa':
        return (
          <MinimalGrid columns={3}>
            <MinimalCard
              title="Zonas Operativas"
              value={zonasReales.length}
              subtitle="Total activas"
            />
            <MinimalCard
              title="Alertas Activas"
              value={alertasReales.length}
              subtitle="Requieren atención"
              variant="subtle"
            />
            <MinimalCard
              title="Cobertura Nacional"
              value="100%"
              subtitle="Zonas monitoreadas"
              variant="primary"
            />
          </MinimalGrid>
        );

      case 'pipeline':
        const pipelineStats = {
          lead: candidatosReales.filter(c => c.estado_proceso === 'lead').length,
          contactado: candidatosReales.filter(c => c.estado_proceso === 'contactado').length,
          entrevista: candidatosReales.filter(c => c.estado_proceso === 'entrevista').length,
          aprobado: candidatosReales.filter(c => c.estado_proceso === 'aprobado').length,
        };
        
        return (
          <MinimalGrid columns={4}>
            <MinimalCard
              title="Leads"
              value={pipelineStats.lead}
              subtitle="Candidatos nuevos"
            />
            <MinimalCard
              title="Contactados"
              value={pipelineStats.contactado}
              subtitle="En proceso inicial"
            />
            <MinimalCard
              title="En Entrevista"
              value={pipelineStats.entrevista}
              subtitle="Evaluación activa"
              variant="subtle"
            />
            <MinimalCard
              title="Aprobados"
              value={pipelineStats.aprobado}
              subtitle="Listos para contratación"
              variant="primary"
            />
          </MinimalGrid>
         );

      case 'cohort':
        return (
          <MinimalGrid columns={4}>
            <MinimalCard
              title="Target 30K+"
              value="30.9%"
              subtitle="Custodios que alcanzan objetivo mensual"
              variant="primary"
            />
            <MinimalCard
              title="Activación Promedio"
              value="12 días"
              subtitle="Contrato → Primer servicio"
              variant="subtle"
            />
            <MinimalCard
              title="Retención Mes 3"
              value="65%"
              subtitle="Custodios activos al 3er mes"
            />
            <MinimalCard
              title="Productividad"
              value="8.5"
              subtitle="Servicios promedio/custodio/mes"
            />
          </MinimalGrid>
        );

      case 'simulation':
        return (
          <MinimalGrid columns={4}>
            <MinimalCard
              title="Custodios Activos"
              value="69"
              subtitle="Base actual del sistema"
              variant="primary"
            />
            <MinimalCard
              title="Egresos Mensuales"
              value="7"
              subtitle="Promedio histórico"
            />
            <MinimalCard
              title="Tasa Rotación"
              value="10.14%"
              subtitle="Mensual promedio"
            />
            <MinimalCard
              title="Déficit Proyectado"
              value="21"
              subtitle="Con rotación incluida"
              variant="subtle"
            />
          </MinimalGrid>
        );

      default:
        return null;
    }
  };

  // Renderizado de contenido basado en sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'planificacion':
        return loadingMultiMonth ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="text-lg text-muted-foreground">Calculando predicciones multi-mes...</div>
            </div>
          </Card>
        ) : multiMonthData ? (
          <MultiMonthTimeline 
            data={multiMonthData} 
            onRefresh={refreshMultiMonthData}
            loading={loadingMultiMonth}
          />
        ) : (
          <Card className="p-8">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
              <h3 className="text-lg font-semibold">Datos de planificación no disponibles</h3>
              <p className="text-muted-foreground">
                Los datos necesarios para la planificación multi-mes aún se están procesando.
              </p>
              <Button onClick={refreshMultiMonthData} variant="outline">
                Reintentar Carga
              </Button>
            </div>
          </Card>
        );
      
      case 'mapa':
        return (
          <Card className="p-6">
            <RealDataMap 
              multiMonthData={multiMonthData}
              zonasReales={zonasReales}
              metricasReales={metricasReales}
              alertasReales={alertasReales}
              candidatosReales={candidatosReales}
            />
          </Card>
        );
      
        case 'alertas':
          return (
            <RecruitmentErrorBoundary>
              <SmartAlertsPanel />
            </RecruitmentErrorBoundary>
          );
        
      case 'pipeline':
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Candidatos por Fuente de Reclutamiento</h3>
              <div className="space-y-3">
                {Object.entries(
                  candidatosReales.reduce((acc, c) => {
                    const fuente = c.fuente_reclutamiento || 'Directo';
                    acc[fuente] = (acc[fuente] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([fuente, count]) => (
                  <div key={fuente} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="capitalize font-medium">{fuente}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
        
      case 'temporal':
        return <TemporalPatternsPanel />;
        
      case 'ml':
        return <MachineLearningPanel />;
        
      case 'simulation':
        return <ScenarioSimulator />;
        
      case 'metricas':
        return (
          <div className="space-y-4">
            {metricasReales.map((metrica, index) => (
              <Card key={index} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg">{metrica.zona_nombre}</h3>
                    <p className="text-sm text-muted-foreground">Zona operativa</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{metrica.custodios_activos}</div>
                    <div className="text-sm text-muted-foreground">Custodios Activos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">{metrica.deficit_custodios}</div>
                    <div className="text-sm text-muted-foreground">Déficit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{metrica.servicios_promedio_dia}</div>
                    <div className="text-sm text-muted-foreground">Servicios/Día</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case 'rotacion':
        return (
          <div className="space-y-8">
            <MinimalGrid columns={5}>
              <MinimalCard
                title="Custodios en Riesgo"
                value={rotationKpis.custodiosEnRiesgo}
                subtitle="30-60 días sin servicio"
                variant="subtle"
              />
              <MinimalCard
                title="Egresos Proyectados"
                value={rotationKpis.rotacionProyectada}
                subtitle="Próximos 30 días"
              />
              <MinimalCard
                title="Tasa Rotación"
                value={`${rotationKpis.tasaRotacionPromedio}%`}
                subtitle="Promedio mensual"
                breakdown={{
                  activos: 75,
                  inactivos: 19
                }}
              />
              <MinimalCard
                title="Necesidad Total"
                value={rotationKpis.totalDeficit}
                subtitle="Con rotación incluida"
                variant="primary"
              />
              <MinimalCard
                title="Tiempo de Vida"
                value={`${rotationKpis.tiempoVidaPromedio} meses`}
                subtitle="Promedio custodios"
                variant="subtle"
              />
            </MinimalGrid>

            <div className="space-y-4">
              {rotationData.map((zona, index) => (
                <Card key={index} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <h3 className="font-semibold">{zona.zona_id}</h3>
                      <p className="text-sm text-muted-foreground">Zona operativa</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{zona.custodiosActivos}</div>
                      <div className="text-xs text-muted-foreground">Activos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-destructive">{zona.custodiosEnRiesgo}</div>
                      <div className="text-xs text-muted-foreground">En Riesgo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-warning">{zona.tasaRotacionMensual}%</div>
                      <div className="text-xs text-muted-foreground">Rotación</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{zona.egresosProyectados30Dias}</div>
                      <div className="text-xs text-muted-foreground">Egresos 30d</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{zona.retencionNecesaria}%</div>
                      <div className="text-xs text-muted-foreground">Retención</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'roi':
        return (
          <Card className="p-6">
            <FinancialROIDashboard />
          </Card>
        );

        case 'executive':
          return (
            <RecruitmentErrorBoundary>
              <ExecutiveDashboard />
            </RecruitmentErrorBoundary>
          );

      case 'financial':
        return (
          <div className="space-y-6">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                <TabsTrigger value="dashboard" className="text-sm">
                  Dashboard Financiero
                </TabsTrigger>
                <TabsTrigger value="expenses" className="text-sm">
                  Registrar Gastos
                </TabsTrigger>
                <TabsTrigger value="history" className="text-sm">
                  Historial
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="mt-6">
                <UnifiedFinancialDashboard />
              </TabsContent>
              
              <TabsContent value="expenses" className="mt-6">
                <div className="max-w-4xl">
                  <ExpenseForm />
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="mt-6">
                <div className="max-w-6xl">
                  <ExpensesList />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 'simulator':
        return <IntelligentSimulator />;

      case 'alerts':
        return <IntelligentAlerts />;

      case 'ai':
        return <AIInsightsPanel />;

      case 'cohort':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IncomeDistributionHistogram />
              <ActivationMetricsCard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CohortRetentionHeatMap />
              <ProductivityChart />
            </div>
          </div>
        );

      case 'monthly-metrics':
        return (
          <div className="space-y-6">
            <MonthlyMetricsCards />
          </div>
        );
        
      default:
        return (
          <Card className="p-8">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Sección no encontrada</h3>
              <p className="text-muted-foreground">
                La sección solicitada no está disponible.
              </p>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="h-screen flex w-full bg-gray-50 font-apple">
      {/* Navigation Sidebar */}
      <NavigationSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        criticalAlerts={multiMonthData?.kpis?.criticalClusters || alertasCriticas}
        urgentClusters={multiMonthData?.kpis?.urgentClusters || alertasPreventivas}
        totalDeficit={multiMonthData?.targetMonth?.totalNeed || totalDeficit}
        activeCandidates={candidatosActivos}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-12 space-y-12 max-w-7xl mx-auto">
            {/* Section Header */}
            <MinimalSectionHeader
              title={sectionInfo.title}
              description={sectionInfo.description}
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshData}
                    disabled={loading}
                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    {loading ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGenerateAlerts}
                    disabled={loading}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Analizar
                  </Button>
                </>
              }
            />

            {/* Section Metrics */}
            {renderSectionMetrics()}

            {/* Main Content */}
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentStrategy;

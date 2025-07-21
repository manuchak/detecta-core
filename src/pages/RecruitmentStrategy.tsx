import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NavigationSidebar } from '@/components/recruitment/ui/NavigationSidebar';
import { SectionHeader } from '@/components/recruitment/ui/SectionHeader';
import { MetricCard } from '@/components/recruitment/ui/MetricCard';
import { ContentGrid } from '@/components/recruitment/ui/ContentGrid';
import { useNationalRecruitment } from '@/hooks/useNationalRecruitment';
import { useRealNationalRecruitment } from '@/hooks/useRealNationalRecruitment';
import { useAdvancedRecruitmentPrediction } from '@/hooks/useAdvancedRecruitmentPrediction';
import { useMultiMonthRecruitmentPrediction } from '@/hooks/useMultiMonthRecruitmentPrediction';
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
import FinancialROIDashboard from '@/components/recruitment/FinancialROIDashboard';

const RecruitmentStrategy = () => {
  const [activeSection, setActiveSection] = useState('planificacion');
  
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
    refreshMultiMonthData();
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
        <ContentGrid columns={4}>
          {[1, 2, 3, 4].map(i => (
            <MetricCard
              key={i}
              title=""
              value=""
              icon={Target}
              loading={true}
            />
          ))}
        </ContentGrid>
      );
    }

    switch (activeSection) {
      case 'planificacion':
        return (
          <ContentGrid columns={4}>
            <MetricCard
              title="Necesidad Total"
              value={multiMonthData?.targetMonth?.totalNeed || totalDeficit}
              subtitle="Custodios a reclutar"
              icon={Target}
              variant="critical"
            />
            <MetricCard
              title="Presupuesto Requerido"
              value={multiMonthData?.kpis?.budgetRequired 
                ? new Intl.NumberFormat('es-MX', { 
                    style: 'currency', 
                    currency: 'MXN',
                    notation: 'compact',
                    maximumFractionDigits: 0
                  }).format(multiMonthData.kpis.budgetRequired)
                : '--'
              }
              subtitle="Inversión total"
              icon={TrendingUp}
              variant="info"
            />
            <MetricCard
              title="Días para Actuar"
              value={multiMonthData?.kpis?.daysUntilAction || '--'}
              subtitle="Tiempo límite"
              icon={Calendar}
              variant="warning"
            />
            <MetricCard
              title="Clusters Críticos"
              value={multiMonthData?.kpis?.criticalClusters || alertasCriticas}
              subtitle="Requieren acción inmediata"
              icon={AlertTriangle}
              variant="critical"
            />
          </ContentGrid>
        );
      
      case 'mapa':
        return (
          <ContentGrid columns={4}>
            <MetricCard
              title="Zonas Operativas"
              value={zonasReales.length}
              subtitle="Total activas"
              icon={MapPin}
              variant="info"
            />
            <MetricCard
              title="Métricas Calculadas"
              value={metricasReales.length}
              subtitle="Datos disponibles"
              icon={BarChart3}
              variant="success"
            />
            <MetricCard
              title="Alertas Activas"
              value={alertasReales.length}
              subtitle="Requieren atención"
              icon={AlertTriangle}
              variant="warning"
            />
            <MetricCard
              title="Cobertura Nacional"
              value="100%"
              subtitle="Zonas monitoreadas"
              icon={Target}
              variant="success"
            />
          </ContentGrid>
        );

      case 'pipeline':
        const pipelineStats = {
          lead: candidatosReales.filter(c => c.estado_proceso === 'lead').length,
          contactado: candidatosReales.filter(c => c.estado_proceso === 'contactado').length,
          entrevista: candidatosReales.filter(c => c.estado_proceso === 'entrevista').length,
          aprobado: candidatosReales.filter(c => c.estado_proceso === 'aprobado').length,
        };
        
        return (
          <ContentGrid columns={4}>
            <MetricCard
              title="Leads"
              value={pipelineStats.lead}
              subtitle="Candidatos nuevos"
              icon={Users}
              variant="info"
            />
            <MetricCard
              title="Contactados"
              value={pipelineStats.contactado}
              subtitle="En proceso inicial"
              icon={Users}
              variant="default"
            />
            <MetricCard
              title="En Entrevista"
              value={pipelineStats.entrevista}
              subtitle="Evaluación activa"
              icon={Users}
              variant="warning"
            />
            <MetricCard
              title="Aprobados"
              value={pipelineStats.aprobado}
              subtitle="Listos para contratación"
              icon={Users}
              variant="success"
            />
          </ContentGrid>
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
              zonasReales={zonasReales}
              metricasReales={metricasReales}
              alertasReales={alertasReales}
              candidatosReales={candidatosReales}
            />
          </Card>
        );
      
      case 'alertas':
        return (
          <div className="space-y-4">
            {alertasReales.map((alerta, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{alerta.titulo}</h3>
                    <p className="text-muted-foreground">{alerta.descripcion}</p>
                    <Badge variant={
                      alerta.tipo_alerta === 'critica' ? 'destructive' :
                      alerta.tipo_alerta === 'preventiva' ? 'default' : 'secondary'
                    }>
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
        return <ScenarioSimulationPanel />;
        
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
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <ContentGrid columns={4}>
                <MetricCard
                  title="Custodios en Riesgo"
                  value={kpisPrediction.custodiosEnRiesgo || 0}
                  subtitle="30-60 días sin servicio"
                  icon={AlertTriangle}
                  variant="critical"
                  size="sm"
                />
                <MetricCard
                  title="Egresos Proyectados"
                  value={kpisPrediction.rotacionProyectada || 0}
                  subtitle="Próximos 30 días"
                  icon={TrendingUp}
                  variant="warning"
                  size="sm"
                />
                <MetricCard
                  title="Tasa Rotación"
                  value={`${kpisPrediction.tasaRotacionPromedio || 0}%`}
                  subtitle="Promedio mensual"
                  icon={BarChart3}
                  variant="info"
                  size="sm"
                />
                <MetricCard
                  title="Necesidad Total"
                  value={kpisPrediction.totalDeficit || 0}
                  subtitle="Con rotación incluida"
                  icon={Target}
                  variant="success"
                  size="sm"
                />
              </ContentGrid>
            </Card>

            <div className="space-y-4">
              {datosRotacion.map((zona, index) => (
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
                      <div className="text-lg font-bold text-orange-600">{zona.proyeccionEgresos30Dias}</div>
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
    <div className="h-screen flex w-full bg-background">
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
          <div className="p-8 space-y-8">
            {/* Section Header */}
            <SectionHeader
              title={sectionInfo.title}
              description={sectionInfo.description}
              icon={sectionInfo.icon}
              breadcrumbs={sectionInfo.breadcrumbs}
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshData}
                    disabled={loading}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    {loading ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGenerateAlerts}
                    disabled={loading}
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

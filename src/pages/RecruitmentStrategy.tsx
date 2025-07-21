import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecruitmentNavigation } from '@/components/recruitment/RecruitmentNavigation';
import { useNationalRecruitment } from '@/hooks/useNationalRecruitment';
import { useRealNationalRecruitment } from '@/hooks/useRealNationalRecruitment';
import { useAdvancedRecruitmentPrediction } from '@/hooks/useAdvancedRecruitmentPrediction';
import { useMultiMonthRecruitmentPrediction } from '@/hooks/useMultiMonthRecruitmentPrediction';
import { AlertTriangle, Users, MapPin, TrendingUp, Target, Zap, Database, TestTube, Calendar } from 'lucide-react';
import { NationalMap } from '@/components/recruitment/NationalMap';
import { RealDataMap } from '@/components/recruitment/RealDataMap';
import { MultiMonthTimeline } from '@/components/recruitment/MultiMonthTimeline';
import { TemporalPatternsPanel } from "@/components/recruitment/temporal/TemporalPatternsPanel";
import { MachineLearningPanel } from "@/components/recruitment/ml/MachineLearningPanel";
import { ScenarioSimulationPanel } from "@/components/recruitment/simulation/ScenarioSimulationPanel";
import FinancialROIDashboard from '@/components/recruitment/FinancialROIDashboard';

const RecruitmentStrategy = () => {
  // Estado para navegación
  const [activeSection, setActiveSection] = useState('planificacion');
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

  // Nuevo hook para predicciones multi-mes
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

  // Renderizado de contenido basado en sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'planificacion':
        return loadingMultiMonth ? (
          <Card className="p-6">
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
          <Card className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Datos de planificación no disponibles</h3>
              <p className="text-muted-foreground mb-4">
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
        );
      
      case 'alertas':
        return (
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
        );
        
      case 'pipeline':
        return (
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
        );
        
      case 'temporal':
        return <TemporalPatternsPanel />;
        
      case 'ml':
        return <MachineLearningPanel />;
        
      case 'simulation':
        return <ScenarioSimulationPanel />;
        
      case 'metricas':
        return (
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
        );

      case 'rotacion':
        return (
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

            {/* Detalles por zona */}
            <div className="grid gap-4">
              {datosRotacion.map((zona, index) => (
                <Card key={index} className="p-4">
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Dashboard Financiero ROI</h2>
              <Badge variant="outline">
                Sistema de Gastos Externos Integrado
              </Badge>
            </div>
            <FinancialROIDashboard />
          </Card>
        );
        
      default:
        return (
          <Card className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sección no encontrada</h3>
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
      {/* Sidebar Navigation */}
      <RecruitmentNavigation 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        criticalAlerts={multiMonthData?.kpis?.criticalClusters || alertasCriticas}
        urgentClusters={multiMonthData?.kpis?.urgentClusters || alertasPreventivas}
        totalDeficit={multiMonthData?.targetMonth?.totalNeed || totalDeficit}
        activeCandidates={candidatosActivos}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-card/50 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Estrategia Nacional de Reclutamiento
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sistema inteligente de adquisición y gestión de custodios a nivel nacional
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={loading}
              >
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
            </div>
          </div>

          {/* KPIs compactos */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <div className="bg-card border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Inmediato</p>
                  <p className="text-lg font-bold text-destructive">
                    {multiMonthData?.targetMonth?.totalNeed || totalDeficit}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Críticos</p>
                  <p className="text-lg font-bold text-destructive">
                    {multiMonthData?.kpis?.criticalClusters || alertasCriticas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Urgentes</p>
                  <p className="text-lg font-bold text-warning">
                    {multiMonthData?.kpis?.urgentClusters || alertasPreventivas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Días</p>
                  <p className="text-lg font-bold text-warning">
                    {multiMonthData?.kpis?.daysUntilAction || '--'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Presupuesto</p>
                  <p className="text-sm font-bold text-green-600">
                    {multiMonthData?.kpis?.budgetRequired 
                      ? new Intl.NumberFormat('es-MX', { 
                          style: 'currency', 
                          currency: 'MXN',
                          notation: 'compact',
                          maximumFractionDigits: 0
                        }).format(multiMonthData.kpis.budgetRequired)
                      : '--'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Candidatos</p>
                  <p className="text-lg font-bold text-primary">{candidatosActivos}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default RecruitmentStrategy;

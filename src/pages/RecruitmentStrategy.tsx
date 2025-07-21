import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNationalRecruitment } from '@/hooks/useNationalRecruitment';
import { useRealNationalRecruitment } from '@/hooks/useRealNationalRecruitment';
import { AlertTriangle, Users, MapPin, TrendingUp, Target, Zap, Database, TestTube } from 'lucide-react';
import { NationalMap } from '@/components/recruitment/NationalMap';
import { RealDataMap } from '@/components/recruitment/RealDataMap';
import { AlertsPanel } from '@/components/recruitment/AlertsPanel';
import { CandidatesPipeline } from '@/components/recruitment/CandidatesPipeline';
import { MetricsOverview } from '@/components/recruitment/MetricsOverview';
import FinancialROIDashboard from '@/components/recruitment/FinancialROIDashboard';
import { TemporalPatternsPanel } from "@/components/recruitment/temporal/TemporalPatternsPanel";

const RecruitmentStrategy = () => {
  const [useRealData, setUseRealData] = useState(true);
  
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

  // Para datos simulados
  const loading = useRealData ? loadingReal : loadingSimulado;
  const alertasCriticas = useRealData ? alertasCriticasReales : alertasCriticasSimuladas;
  const alertasPreventivas = useRealData ? alertasPreventivasReales : alertasPreventivasSimuladas;
  const alertasEstrategicas = useRealData ? alertasEstrategicasReales : alertasEstrategicasSimuladas;
  const totalDeficit = useRealData ? totalDeficitReal : totalDeficitSimulado;
  const zonasPrioritarias = useRealData ? zonasPrioritariasReales : zonasPrioritariasSimuladas;
  const candidatosActivos = useRealData ? candidatosActivosReales : candidatosActivosSimulados;

  const handleRefreshData = () => {
    if (useRealData) {
      fetchAllReal();
    } else {
      fetchAllSimulado();
    }
  };

  const handleGenerateAlerts = () => {
    if (useRealData) {
      generarAlertasBasadasEnDatos();
    } else {
      generarAlertasAutomaticas();
    }
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
          
          {/* Control de modo de datos */}
          <div className="flex items-center gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TestTube className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="data-mode" className="text-sm font-medium">
                Datos Simulados
              </Label>
            </div>
            <Switch
              id="data-mode"
              checked={useRealData}
              onCheckedChange={setUseRealData}
            />
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-primary" />
              <Label htmlFor="data-mode" className="text-sm font-medium">
                Datos Reales
              </Label>
            </div>
            <Badge variant={useRealData ? "default" : "secondary"} className="ml-2">
              {useRealData ? `${candidatosReales.length} candidatos reales` : 'Datos de prueba'}
            </Badge>
          </div>
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
            {useRealData ? 'Analizar Datos Reales' : 'Generar Alertas'}
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="mapa">Mapa Nacional</TabsTrigger>
          <TabsTrigger value="alertas">Sistema de Alertas</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline de Candidatos</TabsTrigger>
          <TabsTrigger value="metricas">Métricas y Análisis</TabsTrigger>
          <TabsTrigger value="temporal">Patrones Temporales</TabsTrigger>
          <TabsTrigger value="roi">ROI y Presupuestos</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Vista Nacional Interactiva</h2>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {useRealData ? `${zonasReales.length} Zonas Reales` : `${zonasSimuladas.length} Zonas Operativas`}
                </Badge>
                <Badge variant="outline">
                  {useRealData ? `${metricasReales.length} Métricas Calculadas` : `${metricasSimuladas.length} Con Métricas Activas`}
                </Badge>
              </div>
            </div>
            {useRealData ? (
              <RealDataMap 
                zonasReales={zonasReales}
                metricasReales={metricasReales}
                alertasReales={alertasReales}
                candidatosReales={candidatosReales}
              />
            ) : (
              <NationalMap 
                zonas={zonasSimuladas}
                metricas={metricasSimuladas}
                alertas={alertasSimuladas}
                candidatos={candidatosSimulados}
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6">
          {useRealData ? (
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
          ) : (
            <AlertsPanel alertas={alertasSimuladas} loading={loading} />
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          {useRealData ? (
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Pipeline de Candidatos Reales</h2>
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
          ) : (
            <CandidatesPipeline candidatos={candidatosSimulados} zonas={zonasSimuladas} loading={loading} />
          )}
        </TabsContent>

        <TabsContent value="metricas" className="space-y-6">
          {useRealData ? (
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Métricas por Zona (Datos Reales)</h2>
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
          ) : (
            <MetricsOverview 
              metricas={metricasSimuladas}
              zonas={zonasSimuladas}
              loading={loading}
            />
          )}
        </TabsContent>

        <TabsContent value="temporal" className="space-y-6">
          <TemporalPatternsPanel />
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
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNationalRecruitment } from '@/hooks/useNationalRecruitment';
import { AlertTriangle, Users, MapPin, TrendingUp, Target, Zap } from 'lucide-react';
import { NationalMap } from '@/components/recruitment/NationalMap';
import { AlertsPanel } from '@/components/recruitment/AlertsPanel';
import { CandidatesPipeline } from '@/components/recruitment/CandidatesPipeline';
import { MetricsOverview } from '@/components/recruitment/MetricsOverview';
import FinancialROIDashboard from '@/components/recruitment/FinancialROIDashboard';

const RecruitmentStrategy = () => {
  const {
    loading,
    zonas,
    metricas,
    alertas,
    candidatos,
    alertasCriticas,
    alertasPreventivas,
    alertasEstrategicas,
    totalDeficit,
    zonasPrioritarias,
    candidatosActivos,
    generarAlertasAutomaticas,
    fetchAll
  } = useNationalRecruitment();

  const handleRefreshData = () => {
    fetchAll();
  };

  const handleGenerateAlerts = () => {
    generarAlertasAutomaticas();
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
            Generar Alertas
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mapa">Mapa Nacional</TabsTrigger>
          <TabsTrigger value="alertas">Sistema de Alertas</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline de Candidatos</TabsTrigger>
          <TabsTrigger value="metricas">Métricas y Análisis</TabsTrigger>
          <TabsTrigger value="roi">ROI y Presupuestos</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Vista Nacional Interactiva</h2>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {zonas.length} Zonas Operativas
                </Badge>
                <Badge variant="outline">
                  {metricas.length} Con Métricas Activas
                </Badge>
              </div>
            </div>
            <NationalMap 
              zonas={zonas}
              metricas={metricas}
              alertas={alertas}
              candidatos={candidatos}
            />
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6">
          <AlertsPanel alertas={alertas} loading={loading} />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <CandidatesPipeline candidatos={candidatos} zonas={zonas} loading={loading} />
        </TabsContent>

        <TabsContent value="metricas" className="space-y-6">
          <MetricsOverview 
            metricas={metricas}
            zonas={zonas}
            loading={loading}
          />
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
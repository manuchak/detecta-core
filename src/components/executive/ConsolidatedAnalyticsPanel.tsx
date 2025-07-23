import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MinimalGrid } from '@/components/recruitment/ui/MinimalGrid';
import { MinimalCard } from '@/components/recruitment/ui/MinimalCard';
import { useRotationAnalysisPage } from '@/hooks/useRotationAnalysisPage';
import { useRegionalRotationDistribution } from '@/hooks/useRegionalRotationDistribution';

export function ConsolidatedAnalyticsPanel() {
  const { kpis: rotationKpis, loading: rotationLoading } = useRotationAnalysisPage();
  const { regionalData, loading: regionalLoading } = useRegionalRotationDistribution();

  return (
    <Card className="p-6 shadow-apple">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Análisis Consolidado</h2>
          <div className="text-sm text-muted-foreground">
            Vista unificada de métricas clave
          </div>
        </div>

        <Tabs defaultValue="rotation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rotation">Análisis de Rotación</TabsTrigger>
            <TabsTrigger value="regional">Distribución Regional</TabsTrigger>
            <TabsTrigger value="trends">Tendencias Temporales</TabsTrigger>
          </TabsList>

          <TabsContent value="rotation" className="space-y-6">
            <MinimalGrid columns={4}>
              <MinimalCard
                title="Custodios en Riesgo"
                value={rotationKpis?.custodiosEnRiesgo || 0}
                subtitle="Próximos 30 días"
                variant="default"
                loading={rotationLoading}
              />
              
              <MinimalCard
                title="Rotación Proyectada"
                value={`${rotationKpis?.rotacionProyectada || 0}%`}
                subtitle="Tasa mensual estimada"
                variant="default"
                loading={rotationLoading}
              />
              
              <MinimalCard
                title="Tasa Promedio"
                value={`${rotationKpis?.tasaRotacionPromedio || 0}%`}
                subtitle="Últimos 3 meses"
                variant="default"
                loading={rotationLoading}
              />
              
              <MinimalCard
                title="Déficit Total"
                value={rotationKpis?.totalDeficit || 0}
                subtitle="Custodios necesarios"
                variant="primary"
                loading={rotationLoading}
              />
            </MinimalGrid>
          </TabsContent>

          <TabsContent value="regional" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {regionalData?.distribucionRegional.map((region, index) => (
                <MinimalCard
                  key={index}
                  title={region.region}
                  value={region.custodiosRotados}
                  subtitle={`${region.tasaRotacionRegional}% rotación`}
                  preview={{
                    label: "Distribución",
                    value: `${(region.porcentajeDistribucion * 100).toFixed(0)}%`
                  }}
                  variant="subtle"
                  loading={regionalLoading}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4 shadow-apple">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Tendencia de Activación</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Este mes</span>
                      <span className="font-medium text-green-600">+12%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Mes anterior</span>
                      <span className="font-medium text-muted-foreground">+8%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Promedio Q4</span>
                      <span className="font-medium text-muted-foreground">+10%</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 shadow-apple">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Eficiencia de Retención</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Q4 2024</span>
                      <span className="font-medium text-green-600">95%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Q3 2024</span>
                      <span className="font-medium text-muted-foreground">92%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Meta anual</span>
                      <span className="font-medium text-primary">90%</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 shadow-apple">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Correlación ROI-CPA</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Correlación</span>
                      <span className="font-medium text-green-600">0.75</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Predicción</span>
                      <span className="font-medium text-muted-foreground">Optimista</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confianza</span>
                      <span className="font-medium text-primary">85%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
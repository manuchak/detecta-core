import React from 'react';
import { ExecutiveDashboard } from '@/components/recruitment/ExecutiveDashboard';
import { IntelligentAlerts } from '@/components/recruitment/IntelligentAlerts';
import { MonthlyMetricsCards } from '@/components/recruitment/MonthlyMetricsCards';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExecutiveRecruitmentDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard Ejecutivo de Reclutamiento</h1>
        <p className="text-muted-foreground">
          Vista consolidada de métricas, correlaciones y alertas inteligentes para toma de decisiones estratégicas
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard Ejecutivo</TabsTrigger>
          <TabsTrigger value="monthly">Métricas Mensuales</TabsTrigger>
          <TabsTrigger value="alerts">Alertas Inteligentes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ExecutiveDashboard />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <MonthlyMetricsCards />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="p-6">
            <IntelligentAlerts />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveRecruitmentDashboard;
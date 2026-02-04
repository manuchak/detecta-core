import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Workflow, HandCoins, Settings2, Activity } from 'lucide-react';
import { WorkflowMetricsBar } from './WorkflowMetricsBar';
import { ActiveWorkflowsPanel } from './ActiveWorkflowsPanel';
import { PromesasPagoPanel } from './PromesasPagoPanel';
import { WorkflowConfigPanel } from './WorkflowConfigPanel';

export function CobranzaWorkflowTab() {
  return (
    <div className="space-y-4">
      {/* Metrics Bar */}
      <WorkflowMetricsBar />

      {/* Main Content */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows" className="gap-1.5">
            <Workflow className="h-4 w-4" />
            Workflows Activos
          </TabsTrigger>
          <TabsTrigger value="promesas" className="gap-1.5">
            <HandCoins className="h-4 w-4" />
            Promesas de Pago
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ActiveWorkflowsPanel />
            </div>
            <div className="lg:col-span-1">
              <PromesasPagoPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="promesas" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PromesasPagoPanel />
            <div className="space-y-4">
              {/* Promesas stats could go here */}
              <div className="p-8 border rounded-lg border-dashed flex flex-col items-center justify-center text-muted-foreground">
                <Activity className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">Análisis de Promesas</p>
                <p className="text-sm text-center mt-1">
                  Estadísticas de cumplimiento y tendencias de promesas de pago
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-0">
          <div className="max-w-2xl">
            <WorkflowConfigPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

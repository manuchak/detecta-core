import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Route, BarChart3, ClipboardCheck, Radio } from 'lucide-react';
import { SecurityDashboard } from '@/components/security/dashboard/SecurityDashboard';
import { RouteRiskIntelligence } from '@/components/security/routes/RouteRiskIntelligence';

const SecurityPage = () => {
  const [activeTab, setActiveTab] = useState('posture');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Módulo de Seguridad</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inteligencia de riesgo, cumplimiento y respuesta — ISO 28000 / ISO 31000
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-10">
          <TabsTrigger value="posture" className="flex items-center gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" />
            Risk Posture
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-1.5 text-xs">
            <Route className="h-3.5 w-3.5" />
            Rutas y Zonas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-1.5 text-xs">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Cumplimiento
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-1.5 text-xs">
            <Radio className="h-3.5 w-3.5" />
            Inteligencia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posture" className="mt-4">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="routes" className="mt-4">
          <RouteRiskIntelligence />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-muted-foreground/25">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Análisis de Incidentes</p>
              <p className="text-xs">Fase 3 — Próximamente</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-muted-foreground/25">
            <div className="text-center text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Cumplimiento y Protocolos</p>
              <p className="text-xs">Fase 2 — Próximamente</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="mt-4">
          <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-muted-foreground/25">
            <div className="text-center text-muted-foreground">
              <Radio className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Inteligencia de Amenazas</p>
              <p className="text-xs">Fase 4 — Próximamente</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityPage;

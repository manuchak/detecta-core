import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Route, BarChart3, ClipboardCheck, Radio } from 'lucide-react';
import { SecurityDashboard } from '@/components/security/dashboard/SecurityDashboard';
import { RouteRiskIntelligence } from '@/components/security/routes/RouteRiskIntelligence';
import { ComplianceTracker } from '@/components/security/compliance/ComplianceTracker';
import { IncidentAnalytics } from '@/components/security/analytics/IncidentAnalytics';
import { ThreatIntelFeed } from '@/components/security/intelligence/ThreatIntelFeed';

const SecurityPage = () => {
  const [activeTab, setActiveTab] = useState('posture');

  return (
    <div style={{ zoom: 1 / 0.7 }} className="flex flex-col h-screen overflow-hidden">
      <div className="shrink-0 px-0 pt-0 pb-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Módulo de Seguridad</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Inteligencia de riesgo, cumplimiento y respuesta — ISO 28000 / ISO 31000
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 grid w-full grid-cols-5 h-9">
          <TabsTrigger value="posture" className="flex items-center gap-1 text-[11px]">
            <Shield className="h-3 w-3" />
            Risk Posture
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-1 text-[11px]">
            <Route className="h-3 w-3" />
            Rutas y Zonas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 text-[11px]">
            <BarChart3 className="h-3 w-3" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-1 text-[11px]">
            <ClipboardCheck className="h-3 w-3" />
            Cumplimiento
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-1 text-[11px]">
            <Radio className="h-3 w-3" />
            Inteligencia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posture" className="mt-3">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="routes" className="flex-1 min-h-0 mt-3">
          <RouteRiskIntelligence />
        </TabsContent>

        <TabsContent value="analytics" className="mt-3">
          <IncidentAnalytics />
        </TabsContent>

        <TabsContent value="compliance" className="mt-3">
          <ComplianceTracker />
        </TabsContent>

        <TabsContent value="intelligence" className="mt-3">
          <ThreatIntelFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityPage;

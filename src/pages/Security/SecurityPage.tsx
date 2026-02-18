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
    <div style={{ zoom: 1 / 0.7 }} className="space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Módulo de Seguridad</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Inteligencia de riesgo, cumplimiento y respuesta — ISO 28000 / ISO 31000
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-9">
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

        <TabsContent value="routes" className="mt-3 h-[calc(100vh-120px)]">
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

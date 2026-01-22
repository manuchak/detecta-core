import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, BarChart3, CalendarCheck, Target, Building2, Scale, MapPin, LineChart, XCircle } from 'lucide-react';
import { CustomBreadcrumb } from '@/components/ui/custom-breadcrumb';
import AreaPerformanceDashboard from './components/AreaPerformanceDashboard';
import PlanificadoresPerformanceDashboard from './components/PlanificadoresPerformanceDashboard';
import AdoptionDashboard from './components/AdoptionDashboard';
import ProveedoresExternosDashboard from './components/ProveedoresExternosDashboard';
import ProveedoresExternosBIDashboard from './components/ProveedoresExternosBIDashboard';
import ArmadosInternosDashboard from './components/ArmadosInternosDashboard';
import FairnessAuditDashboard from './components/FairnessAuditDashboard';
import RejectionsDashboard from './components/RejectionsDashboard';

export default function ReportesHub() {
  const [activeTab, setActiveTab] = useState('adopcion');
  
  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb 
        items={[
          { label: 'Planeación', href: '/planeacion', icon: CalendarCheck },
          { label: 'Reportes', icon: BarChart3 }
        ]}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-corporate-blue" />
          <h1 className="text-3xl font-bold">Reportes de Planeación</h1>
        </div>
        <p className="text-muted-foreground">
          Análisis de adopción, performance, control de costos y auditoría de equidad
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 bg-background/95 backdrop-blur-apple supports-[backdrop-filter]:bg-background/80 shadow-apple-soft border border-border/50">
          <TabsTrigger value="adopcion" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white text-xs lg:text-sm">
            <Target className="h-4 w-4" />
            <span className="hidden md:inline">Adopción</span>
          </TabsTrigger>
          <TabsTrigger value="area" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white text-xs lg:text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden md:inline">Área</span>
          </TabsTrigger>
          <TabsTrigger value="planificadores" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white text-xs lg:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Planificadores</span>
          </TabsTrigger>
          <TabsTrigger value="rechazos" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white text-xs lg:text-sm">
            <XCircle className="h-4 w-4" />
            <span className="hidden md:inline">Rechazos</span>
          </TabsTrigger>
          <TabsTrigger value="proveedores-externos" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white text-xs lg:text-sm">
            <Building2 className="h-4 w-4" />
            <span className="hidden md:inline">Prov. Ext.</span>
          </TabsTrigger>
          <TabsTrigger value="proveedores-bi" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white text-xs lg:text-sm">
            <LineChart className="h-4 w-4" />
            <span className="hidden md:inline">BI Prov.</span>
          </TabsTrigger>
          <TabsTrigger value="armados-internos" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white text-xs lg:text-sm">
            <MapPin className="h-4 w-4" />
            <span className="hidden md:inline">Armados</span>
          </TabsTrigger>
          <TabsTrigger value="auditoria-equidad" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white text-xs lg:text-sm">
            <Scale className="h-4 w-4" />
            <span className="hidden md:inline">Equidad</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="adopcion"><AdoptionDashboard /></TabsContent>
        <TabsContent value="area"><AreaPerformanceDashboard /></TabsContent>
        <TabsContent value="planificadores"><PlanificadoresPerformanceDashboard /></TabsContent>
        <TabsContent value="rechazos"><RejectionsDashboard /></TabsContent>
        <TabsContent value="proveedores-externos"><ProveedoresExternosDashboard /></TabsContent>
        <TabsContent value="proveedores-bi"><ProveedoresExternosBIDashboard /></TabsContent>
        <TabsContent value="armados-internos"><ArmadosInternosDashboard /></TabsContent>
        <TabsContent value="auditoria-equidad"><FairnessAuditDashboard /></TabsContent>
      </Tabs>
    </div>
  );
}

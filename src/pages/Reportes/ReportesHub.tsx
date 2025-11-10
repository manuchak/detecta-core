import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, BarChart3, CalendarCheck } from 'lucide-react';
import { CustomBreadcrumb } from '@/components/ui/custom-breadcrumb';
import AreaPerformanceDashboard from './components/AreaPerformanceDashboard';
import PlanificadoresPerformanceDashboard from './components/PlanificadoresPerformanceDashboard';

export default function ReportesHub() {
  const [activeTab, setActiveTab] = useState('area');
  
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <CustomBreadcrumb 
        items={[
          { label: 'Planeación', href: '/planeacion', icon: CalendarCheck },
          { label: 'Reportes', icon: BarChart3 }
        ]}
      />

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-corporate-blue" />
          <h1 className="text-3xl font-bold">Reportes de Planeación</h1>
        </div>
        <p className="text-muted-foreground">
          Análisis detallado de performance del área y planificadores individuales
        </p>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-background/95 backdrop-blur-apple supports-[backdrop-filter]:bg-background/80 shadow-apple-soft border border-border/50">
          <TabsTrigger 
            value="area"
            className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200"
          >
            <TrendingUp className="h-4 w-4" />
            Performance del Área
          </TabsTrigger>
          <TabsTrigger 
            value="planificadores"
            className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            Performance de Planificadores
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="area" className="space-y-6">
          <AreaPerformanceDashboard />
        </TabsContent>
        
        <TabsContent value="planificadores" className="space-y-6">
          <PlanificadoresPerformanceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

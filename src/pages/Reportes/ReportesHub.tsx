import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRole } from '@/hooks/useUserRole';
import { REPORTES_FULL_ACCESS_ROLES } from '@/constants/accessControl';
import { 
  TrendingUp, Users, BarChart3, CalendarCheck, Target, Building2, 
  Scale, MapPin, LineChart, XCircle, Shield, User, Route 
} from 'lucide-react';
import { CustomBreadcrumb } from '@/components/ui/custom-breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

// Dashboard imports
import AreaPerformanceDashboard from './components/AreaPerformanceDashboard';
import PlanificadoresPerformanceDashboard from './components/PlanificadoresPerformanceDashboard';
import AdoptionDashboard from './components/AdoptionDashboard';
import ProveedoresExternosDashboard from './components/ProveedoresExternosDashboard';
import ProveedoresExternosBIDashboard from './components/ProveedoresExternosBIDashboard';
import ArmadosInternosDashboard from './components/ArmadosInternosDashboard';
import FairnessAuditDashboard from './components/FairnessAuditDashboard';
import ArmadosFairnessAuditDashboard from './components/ArmadosFairnessAuditDashboard';
import RejectionsDashboard from './components/RejectionsDashboard';
import MyPerformanceDashboard from './components/MyPerformanceDashboard';
import AuditoriaKmDashboard from './components/AuditoriaKmDashboard';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: 'all' | 'full' | string[];
  component: React.ComponentType;
}

export default function ReportesHub() {
  const { primaryRole, hasAnyRole, loading } = useUserRole();
  const hasFullAccess = hasAnyRole([...REPORTES_FULL_ACCESS_ROLES]);
  const isPlanificador = primaryRole === 'planificador';
  
  // Define all tabs with their permissions
  const allTabs: TabConfig[] = useMemo(() => [
    { id: 'mi-performance', label: 'Mi Performance', icon: User, roles: ['planificador'], component: MyPerformanceDashboard },
    { id: 'adopcion', label: 'Adopción', icon: Target, roles: 'full', component: AdoptionDashboard },
    { id: 'area', label: 'Área', icon: TrendingUp, roles: 'full', component: AreaPerformanceDashboard },
    { id: 'planificadores', label: 'Planificadores', icon: Users, roles: 'full', component: PlanificadoresPerformanceDashboard },
    { id: 'rechazos', label: 'Rechazos', icon: XCircle, roles: 'all', component: RejectionsDashboard },
    { id: 'proveedores-externos', label: 'Prov. Ext.', icon: Building2, roles: 'full', component: ProveedoresExternosDashboard },
    { id: 'proveedores-bi', label: 'BI Prov.', icon: LineChart, roles: 'full', component: ProveedoresExternosBIDashboard },
    { id: 'armados-internos', label: 'Armados', icon: MapPin, roles: 'all', component: ArmadosInternosDashboard },
    { id: 'auditoria-km', label: 'Auditoría KM', icon: Route, roles: 'full', component: AuditoriaKmDashboard },
    { id: 'auditoria-equidad', label: 'Equidad', icon: Scale, roles: 'all', component: FairnessAuditDashboard },
    { id: 'equidad-armados', label: 'Eq. Armados', icon: Shield, roles: 'all', component: ArmadosFairnessAuditDashboard },
  ], []);
  
  // Filter tabs based on user role
  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => {
      if (tab.roles === 'all') return true;
      if (tab.roles === 'full') return hasFullAccess;
      if (Array.isArray(tab.roles)) return tab.roles.includes(primaryRole || '');
      return false;
    });
  }, [allTabs, hasFullAccess, primaryRole]);
  
  // Default tab based on role
  const defaultTab = isPlanificador ? 'mi-performance' : 'adopcion';
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Update active tab if current selection is not visible
  useMemo(() => {
    if (!visibleTabs.find(t => t.id === activeTab) && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);
  
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  // Calculate dynamic grid columns
  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
  };
  const gridClass = gridColsMap[visibleTabs.length] || 'grid-cols-5';
  
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
          {isPlanificador 
            ? 'Tu performance personal y métricas operativas'
            : 'Análisis de adopción, performance, control de costos y auditoría de equidad'
          }
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${gridClass} bg-background/95 backdrop-blur-apple supports-[backdrop-filter]:bg-background/80 shadow-apple-soft border border-border/50`}>
          {visibleTabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white text-xs lg:text-sm"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Render tab contents */}
        {visibleTabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

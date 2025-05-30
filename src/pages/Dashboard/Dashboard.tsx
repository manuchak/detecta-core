
import { useState } from "react";
import { 
  useDashboardData, 
  TimeframeOption, 
  ServiceTypeOption 
} from "@/hooks/useDashboardData";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { GmvChart } from "@/components/dashboard/GmvChart";
import { ServiceStatusChart } from "@/components/dashboard/ServiceStatusChart";
import { SecondaryCharts } from "@/components/dashboard/SecondaryCharts";
import { GmvProgress } from "@/components/dashboard/GmvProgress";
import { ServicesCalendar } from "@/components/dashboard/ServicesCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Dashboard = () => {
  const { userRole, isOwner, user, assignRole, refetchRole, roleLoading } = useAuth();

  const [timeframe, setTimeframe] = useState<TimeframeOption>("month");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeOption>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "calendar">("overview");
  const [assigningRole, setAssigningRole] = useState(false);
  
  const {
    isLoading: dataLoading,
    error: dataError,
    dashboardData,
    monthlyGmvData,
    serviceStatusData,
    serviceTypesData,
    dailyServiceData,
    topClientsData,
    refreshAllData
  } = useDashboardData(timeframe, serviceTypeFilter);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "overview" | "calendar");
  };

  const handleAssignOwnerRole = async () => {
    if (!user?.id) return;
    
    setAssigningRole(true);
    try {
      const success = await assignRole(user.id, 'owner');
      if (success) {
        await refetchRole();
      }
    } finally {
      setAssigningRole(false);
    }
  };

  const handleRefreshRole = async () => {
    await refetchRole();
  };

  // Si hay un error crítico, mostrar mensaje de error
  if (dataError) {
    console.error('Dashboard data error:', dataError);
    return (
      <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in">
        <div className="py-6">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Rendimiento de Servicios</p>
        </div>
        
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error cargando datos</AlertTitle>
          <AlertDescription className="text-red-700">
            Ocurrió un error al cargar los datos del dashboard. Por favor, intenta recargar la página.
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="ml-4"
            >
              Recargar página
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Si está cargando, mostrar indicador
  if (dataLoading || !dashboardData) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in">
        <div className="py-6">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Rendimiento de Servicios</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando datos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in">
      <div className="py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Rendimiento de Servicios
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshRole}
          disabled={roleLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${roleLoading ? 'animate-spin' : ''}`} />
          Actualizar rol
        </Button>
      </div>
      
      {!isOwner && !roleLoading && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Validación de rol requerida</AlertTitle>
          <AlertDescription className="text-yellow-700">
            No tienes el rol de 'owner' asignado. Este rol es necesario para acceder a todas las funcionalidades del sistema.
            Tu rol actual es: {userRole || 'Sin rol asignado'}
            <Button 
              variant="outline" 
              className="ml-4 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              onClick={handleAssignOwnerRole}
              disabled={assigningRole}
            >
              {assigningRole ? 'Asignando rol...' : 'Asignar rol de Owner'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isOwner && (
        <Alert className="bg-green-50 border-green-200">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Rol de Owner verificado</AlertTitle>
          <AlertDescription className="text-green-700">
            Tienes acceso completo al sistema con el rol de 'owner'.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="overview" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <DashboardFilters
            timeframe={timeframe}
            serviceTypeFilter={serviceTypeFilter}
            onTimeframeChange={setTimeframe}
            onServiceTypeChange={setServiceTypeFilter}
            onRefresh={refreshAllData}
          />
          
          <MetricsCards metrics={dashboardData} isLoading={dataLoading} />
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
            <GmvChart data={monthlyGmvData} />
            <ServiceStatusChart data={serviceStatusData} metrics={dashboardData} />
          </div>
          
          <SecondaryCharts
            dailyServiceData={dailyServiceData}
            serviceTypesData={serviceTypesData}
            topClientsData={topClientsData}
          />
          
          <GmvProgress totalGMV={dashboardData.totalGMV} />
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-8">
          <ServicesCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;

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
import { useAuth, useToast } from "@/hooks";
import { useEffect } from "react";

export const Dashboard = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Display a toast with user role information to help debug
    if (userRole) {
      toast({
        title: "Información de Sesión",
        description: `Rol actual: ${userRole}`,
        duration: 5000,
      });
    } else {
      toast({
        title: "Advertencia",
        description: "No se detectó un rol de usuario. Es posible que necesite cerrar sesión y volver a iniciar sesión, o asignar un rol desde el panel de administración.",
        variant: "destructive",
        duration: 10000,
      });
    }
  }, [userRole, toast]);

  const [timeframe, setTimeframe] = useState<TimeframeOption>("month");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeOption>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "calendar">("overview");
  
  const {
    isLoading,
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in">
      <div className="py-6">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Rendimiento de Servicios
        </p>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          {/* Timeframe and service type filters */}
          <DashboardFilters
            timeframe={timeframe}
            serviceTypeFilter={serviceTypeFilter}
            onTimeframeChange={setTimeframe}
            onServiceTypeChange={setServiceTypeFilter}
            onRefresh={refreshAllData}
          />
          
          {/* Key metrics cards */}
          <MetricsCards metrics={dashboardData} isLoading={isLoading} />
          
          {/* Main charts */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
            <GmvChart data={monthlyGmvData} />
            <ServiceStatusChart data={serviceStatusData} metrics={dashboardData} />
          </div>
          
          {/* Secondary charts */}
          <SecondaryCharts
            dailyServiceData={dailyServiceData}
            serviceTypesData={serviceTypesData}
            topClientsData={topClientsData}
          />
          
          {/* GMV Progress */}
          <GmvProgress totalGMV={dashboardData.totalGMV} />
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-8">
          {/* Calendar view */}
          <ServicesCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;

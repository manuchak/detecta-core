
import { useState, useEffect } from "react";
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
import { useRoleValidation } from "@/hooks/useRoleValidation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Dashboard = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const { validateUserRole, ensureOwnerRole, isOwner, currentRole } = useRoleValidation();
  const [isValidating, setIsValidating] = useState(false);

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

  useEffect(() => {
    // Display a toast with user role information to help debug
    if (userRole) {
      toast({
        title: "Información de Sesión",
        description: `Rol actual: ${userRole}`,
        duration: 5000,
      });
    }
  }, [userRole, toast]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "overview" | "calendar");
  };

  const handleEnsureOwnerRole = async () => {
    setIsValidating(true);
    try {
      await ensureOwnerRole();
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in">
      <div className="py-6">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Rendimiento de Servicios
        </p>
      </div>
      
      {!isOwner && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Validación de rol requerida</AlertTitle>
          <AlertDescription className="text-yellow-700">
            No tienes el rol de 'owner' asignado. Este rol es necesario para acceder a todas las funcionalidades del sistema.
            <Button 
              variant="outline" 
              className="ml-4 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              onClick={handleEnsureOwnerRole}
              disabled={isValidating}
            >
              {isValidating ? (
                <>Asignando rol...</>
              ) : (
                <>Asignar rol de Owner</>
              )}
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

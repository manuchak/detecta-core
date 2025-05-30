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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Dashboard = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("month");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeOption>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "calendar">("overview");
  
  const {
    isLoading: dataLoading,
    error: dataError,
    dashboardData,
    serviceStatusData,
    serviceTypesData,
    dailyServiceData,
    topClientsData,
    refreshAllData
  } = useDashboardData(timeframe, serviceTypeFilter);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "overview" | "calendar");
  };

  // Si hay un error crítico, mostrar mensaje de error
  if (dataError) {
    console.error('Dashboard data error:', dataError);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
              Dashboard de Servicios
            </h1>
            <p className="text-lg text-slate-600">Monitoreo y análisis de servicios de custodia</p>
          </div>
          
          <Alert className="bg-red-50 border-red-200 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 text-lg">Error al cargar datos</AlertTitle>
            <AlertDescription className="text-red-700">
              No se pudieron cargar los datos del dashboard. Por favor, verifica tu conexión e intenta nuevamente.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
              >
                Recargar página
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Si está cargando, mostrar indicador
  if (dataLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
              Dashboard de Servicios
            </h1>
            <p className="text-lg text-slate-600">Monitoreo y análisis de servicios de custodia</p>
          </div>
          
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg text-slate-600">Cargando datos del dashboard...</p>
              <p className="text-sm text-slate-500 mt-2">Esto puede tomar unos segundos</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
        {/* Header mejorado */}
        <div className="text-center py-8 border-b border-slate-200">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Dashboard de Servicios
          </h1>
          <p className="text-lg text-slate-600">
            Monitoreo y análisis en tiempo real de servicios de custodia
          </p>
        </div>
        
        <Tabs defaultValue="overview" onValueChange={handleTabChange} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white shadow-lg border border-slate-200">
              <TabsTrigger 
                value="overview" 
                className="px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Vista General
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Calendario
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview" className="space-y-8">
            {/* Filtros con mejor diseño */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <DashboardFilters
                timeframe={timeframe}
                serviceTypeFilter={serviceTypeFilter}
                onTimeframeChange={setTimeframe}
                onServiceTypeChange={setServiceTypeFilter}
                onRefresh={refreshAllData}
              />
            </div>
            
            {/* Tarjetas de métricas rediseñadas */}
            <MetricsCards metrics={dashboardData} isLoading={dataLoading} />
            
            {/* Gráficos principales */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <GmvChart />
              </div>
              <div className="lg:col-span-4">
                <ServiceStatusChart data={serviceStatusData} metrics={dashboardData} />
              </div>
            </div>
            
            {/* Gráficos secundarios */}
            <SecondaryCharts
              dailyServiceData={dailyServiceData}
              serviceTypesData={serviceTypesData}
              topClientsData={topClientsData}
            />
            
            {/* Progreso de GMV */}
            <GmvProgress totalGMV={dashboardData.totalGMV} />
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <ServicesCalendar />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;


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

export const Dashboard = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("month");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeOption>("all");
  
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in">
      <div className="py-6">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Rendimiento de Servicios
        </p>
      </div>
      
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
    </div>
  );
};

export default Dashboard;

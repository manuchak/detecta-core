
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { GmvChart } from "@/components/dashboard/GmvChart";
import { ServicesCalendar } from "@/components/dashboard/ServicesCalendar";
import { ServiceStatusChart } from "@/components/dashboard/ServiceStatusChart";
import { SecondaryCharts } from "@/components/dashboard/SecondaryCharts";
import WorkflowBanner from "@/components/dashboard/WorkflowBanner";
import { useDashboardDataCorrected } from "@/hooks/useDashboardDataCorrected";

const Dashboard = () => {
  const { 
    dashboardData, 
    serviceStatusData, 
    dailyServiceData, 
    serviceTypesData, 
    topClientsData, 
    isLoading 
  } = useDashboardDataCorrected();

  // Provide default data structure to prevent component errors
  const defaultMetrics = {
    totalServices: 0,
    totalGMV: 0,
    activeClients: 0,
    averageServiceValue: 0,
    yearlyGrowth: 0,
    completedServices: 0,
    ongoingServices: 0,
    cancelledServices: 0,
    pendingServices: 0,
    totalServicesGrowth: 0,
    totalGMVGrowth: 0,
    activeClientsGrowth: 0,
    averageServiceValueGrowth: 0,
    completedServicesPercentage: 0,
    ongoingServicesPercentage: 0,
    cancelledServicesPercentage: 0,
    pendingServicesPercentage: 0
  };

  const defaultServiceStatusData = [
    { name: 'Activos', value: 0, color: '#22c55e' },
    { name: 'Pendientes', value: 0, color: '#f59e0b' },
    { name: 'Instalando', value: 0, color: '#3b82f6' },
    { name: 'Suspendidos', value: 0, color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Vista general del sistema de monitoreo GPS</p>
        </div>

        {/* Banner de Workflow */}
        <WorkflowBanner />

        {/* Métricas principales - Grid expandido para mejor visualización */}
        <div className="w-full">
          <MetricsCards 
            metrics={dashboardData || defaultMetrics} 
            isLoading={isLoading} 
          />
        </div>

        {/* Gráficos principales - Layout mejorado */}
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="w-full">
            <GmvChart />
          </div>
          <div className="w-full">
            <ServiceStatusChart 
              data={serviceStatusData || defaultServiceStatusData}
              metrics={dashboardData || defaultMetrics}
            />
          </div>
        </div>

        {/* Calendario y gráficos secundarios - Layout optimizado */}
        <div className="grid gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2 w-full">
            <ServicesCalendar />
          </div>
          <div className="w-full">
            <SecondaryCharts 
              dailyServiceData={dailyServiceData || []}
              serviceTypesData={serviceTypesData || []}
              topClientsData={topClientsData || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

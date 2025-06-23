
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { GmvAnalysisChart } from "@/components/dashboard/GmvAnalysisChart";
import { ServicesCalendar } from "@/components/dashboard/ServicesCalendar";
import { ServiceStatusChart } from "@/components/dashboard/ServiceStatusChart";
import { SecondaryCharts } from "@/components/dashboard/SecondaryCharts";
import { ForecastCard } from "@/components/dashboard/ForecastCard";
import WorkflowBanner from "@/components/dashboard/WorkflowBanner";
import { useDashboardDataCorrected } from "@/hooks/useDashboardDataCorrected";

const Dashboard = () => {
  const { 
    dashboardData, 
    serviceStatusData, 
    dailyServiceData, 
    serviceTypesData, 
    topClientsData, 
    isLoading,
    error
  } = useDashboardDataCorrected();

  // Provide default data structure to prevent component errors
  const defaultMetrics = {
    totalServices: 0,
    totalGMV: 0,
    activeClients: 0,
    averageServiceValue: 0,
    completedServices: 0,
    ongoingServices: 0,
    pendingServices: 0,
    cancelledServices: 0,
    yearlyGrowth: 0,
    totalServicesGrowth: 0,
    totalGMVGrowth: 0,
    activeClientsGrowth: 0,
    averageServiceValueGrowth: 0,
    completedServicesPercentage: 0,
    ongoingServicesPercentage: 0,
    pendingServicesPercentage: 0,
    cancelledServicesPercentage: 0
  };

  const defaultServiceStatusData = [
    { name: 'Activos', value: 0, color: '#22c55e' },
    { name: 'Pendientes', value: 0, color: '#f59e0b' },
    { name: 'Instalando', value: 0, color: '#3b82f6' },
    { name: 'Suspendidos', value: 0, color: '#ef4444' }
  ];

  const currentMetrics = dashboardData || defaultMetrics;

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6 space-y-10">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-lg text-gray-600">Vista general del sistema de monitoreo GPS</p>
        </div>

        {/* Banner de Workflow */}
        <div className="mb-8">
          <WorkflowBanner />
        </div>

        {/* Métricas principales - Con más espacio vertical */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Métricas Principales</h2>
          <MetricsCards 
            metrics={currentMetrics} 
            isLoading={isLoading} 
          />
        </div>

        {/* Forecast Card - Sección dedicada */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pronósticos y Proyecciones</h2>
          <ForecastCard 
            totalServices={currentMetrics.totalServices}
            totalGMV={currentMetrics.totalGMV}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Gráficos principales - Layout mejorado con más espacio */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Análisis de Rendimiento</h2>
          <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-2">
            <div className="w-full">
              <GmvAnalysisChart />
            </div>
            <div className="w-full">
              <ServiceStatusChart 
                data={serviceStatusData || defaultServiceStatusData}
                metrics={currentMetrics}
              />
            </div>
          </div>
        </div>

        {/* Calendario y gráficos secundarios - Layout optimizado */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Calendario y Estadísticas Detalladas</h2>
          <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-5">
            <div className="xl:col-span-3 w-full">
              <ServicesCalendar />
            </div>
            <div className="xl:col-span-2 w-full">
              <SecondaryCharts 
                dailyServiceData={dailyServiceData || []}
                serviceTypesData={serviceTypesData || []}
                topClientsData={topClientsData || []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

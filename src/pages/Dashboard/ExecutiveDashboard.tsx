
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { GmvAnalysisChart } from "@/components/dashboard/GmvAnalysisChart";
import { ServiceStatusChart } from "@/components/dashboard/ServiceStatusChart";
import { SecondaryCharts } from "@/components/dashboard/SecondaryCharts";
import { ForecastCard } from "@/components/dashboard/ForecastCard";
import WorkflowBanner from "@/components/dashboard/WorkflowBanner";
import { DashboardFilters, TimeframeOption, ServiceTypeOption } from "@/components/dashboard/DashboardFilters";
import { useDashboardDataCorrected } from "@/hooks/useDashboardDataCorrected";

const ExecutiveDashboard = () => {
  // Estados para los filtros - Mes hasta la fecha como default
  const [timeframe, setTimeframe] = useState<TimeframeOption>("monthToDate");
  const [serviceType, setServiceType] = useState<ServiceTypeOption>("all");

  const { 
    dashboardData, 
    serviceStatusData, 
    dailyServiceData, 
    serviceTypesData, 
    topClientsData, 
    isLoading,
    error
  } = useDashboardDataCorrected(timeframe, serviceType);

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

  const getTimeframeDescription = (tf: TimeframeOption): string => {
    const descriptions: Record<TimeframeOption, string> = {
      day: "datos de hoy",
      week: "de esta semana",
      thisMonth: "del mes en curso",
      lastMonth: "del mes anterior",
      thisQuarter: "del trimestre actual",
      lastQuarter: "del trimestre anterior",
      last7Days: "de los últimos 7 días",
      last30Days: "de los últimos 30 días",
      last90Days: "de los últimos 90 días",
      yearToDate: "del año a la fecha",
      monthToDate: "del mes hasta la fecha",
      month: "del último mes",
      quarter: "del último trimestre",
      year: "del último año",
      custom: "del período personalizado"
    };
    return descriptions[tf] || "del período seleccionado";
  };

  const getServiceTypeDescription = (st: ServiceTypeOption): string => {
    const descriptions: Record<ServiceTypeOption, string> = {
      all: "todos los servicios",
      local: "servicios locales",
      foraneo: "servicios foráneos"
    };
    return descriptions[st];
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Ejecutivo</h1>
          <p className="text-lg text-gray-600">
            Vista financiera y análisis avanzado {getTimeframeDescription(timeframe)} - {getServiceTypeDescription(serviceType)}
          </p>
        </div>

        {/* Filtros del Dashboard */}
        <DashboardFilters
          timeframe={timeframe}
          serviceType={serviceType}
          onTimeframeChange={setTimeframe}
          onServiceTypeChange={setServiceType}
        />

        {/* Banner de Workflow */}
        <div className="mb-8">
          <WorkflowBanner />
        </div>

        {/* Métricas principales */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Métricas Financieras</h2>
          <MetricsCards 
            metrics={currentMetrics} 
            isLoading={isLoading} 
          />
        </div>

        {/* Forecast Card */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pronósticos y Proyecciones</h2>
          <ForecastCard 
            totalServices={currentMetrics.totalServices}
            totalGMV={currentMetrics.totalGMV}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Gráficos principales */}
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

        {/* Gráficos secundarios - Layout expandido para ocupar todo el ancho */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Estadísticas Detalladas</h2>
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

export default ExecutiveDashboard;

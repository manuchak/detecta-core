import { useState, useEffect } from "react";
import { 
  useDashboardDataCorrected as useDashboardData, 
  TimeframeOption, 
  ServiceTypeOption 
} from "@/hooks/useDashboardDataCorrected";
import { useGmvDiagnostic } from "@/hooks/useGmvDiagnostic";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { GmvChart } from "@/components/dashboard/GmvChart";
import { ServiceStatusChart } from "@/components/dashboard/ServiceStatusChart";
import { SecondaryCharts } from "@/components/dashboard/SecondaryCharts";
import { ForecastCard } from "@/components/dashboard/ForecastCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, BarChart3, TrendingUp, Activity, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForensicAuditPanel } from "@/components/dashboard/ForensicAuditPanel";

export const Dashboard = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("month");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeOption>("all");
  
  // Ejecutar diagnóstico GMV
  const { diagnosticResult } = useGmvDiagnostic();
  
  // Mostrar resultados del diagnóstico en consola cuando estén listos
  useEffect(() => {
    if (diagnosticResult) {
      console.log('🎯 === RESUMEN DIAGNÓSTICO GMV ===');
      console.log(`Total servicios Ene-May: ${diagnosticResult.totalServicios}`);
      console.log(`Servicios con cobro válido: ${diagnosticResult.serviciosConCobro}`);
      console.log(`GMV sin filtros estado: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(diagnosticResult.gmvTotalSinFiltros)}`);
      console.log(`GMV solo "Finalizado": ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(diagnosticResult.gmvSoloFinalizados)}`);
      console.log(`Diferencia vs 22M (sin filtros): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(diagnosticResult.diferenciaSinFiltros)}`);
      console.log(`Diferencia vs 22M (finalizados): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(diagnosticResult.diferenciaFinalizados)}`);
    }
  }, [diagnosticResult]);
  
  // Datos filtrados para gráficos
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

  // Datos anuales globales SOLO para el Forecast (sin filtros)
  const {
    isLoading: forecastDataLoading,
    error: forecastDataError,
    dashboardData: forecastMetrics,
    refreshAllData: refreshForecastData
  } = useDashboardData("year", "all");

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

  const handleRefresh = () => {
    refreshAllData();
    refreshForecastData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
        {/* Header mejorado y más atractivo */}
        <div className="relative">
          {/* Fondo decorativo */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-indigo-700/90 rounded-2xl"></div>
          
          {/* Contenido del header */}
          <div className="relative px-8 py-12 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mr-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Dashboard de Servicios
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  Monitoreo y análisis en tiempo real
                </p>
              </div>
            </div>

            {/* Indicadores rápidos */}
            <div className="flex items-center justify-center space-x-8 mt-8">
              <div className="flex items-center text-white/90">
                <Activity className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Datos en tiempo real</span>
              </div>
              <div className="flex items-center text-white/90">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Análisis avanzado</span>
              </div>
              <div className="flex items-center text-white/90">
                <BarChart3 className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Visualización completa</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Alerta de diagnóstico GMV */}
        {diagnosticResult && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Diagnóstico GMV Activo</AlertTitle>
            <AlertDescription className="text-yellow-800">
              <strong>Análisis completado:</strong> Revisa la consola para ver el diagnóstico detallado del GMV.
              <br />
              <strong>GMV sin filtros estado:</strong> {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(diagnosticResult.gmvTotalSinFiltros)}
              <br />
              <strong>GMV solo "Finalizado":</strong> {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(diagnosticResult.gmvSoloFinalizados)}
              <br />
              <strong>Diferencia vs 22M:</strong> {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(diagnosticResult.diferenciaSinFiltros)}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Panel de Auditoría Forense */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Auditoría Forense de Datos
          </h2>
          <ForensicAuditPanel />
        </div>
        
        {/* Filtros con mejor diseño */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <DashboardFilters
            timeframe={timeframe}
            serviceTypeFilter={serviceTypeFilter}
            onTimeframeChange={(value) => setTimeframe(value)}
            onServiceTypeChange={(value) => setServiceTypeFilter(value)}
            onRefresh={handleRefresh}
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
        
        {/* Forecast Card - Usando datos anuales sin filtros */}
        <ForecastCard 
          totalServices={forecastMetrics?.totalServices || 0} 
          totalGMV={forecastMetrics?.totalGMV || 0}
          isLoading={forecastDataLoading}
          error={forecastDataError}
        />
      </div>
    </div>
  );
};

export default Dashboard;

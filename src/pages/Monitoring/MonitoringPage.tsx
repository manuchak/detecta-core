import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import ShiftSummaryCards from "@/components/monitoring/ShiftSummaryCards";
import ShiftServicesMap from "@/components/monitoring/ShiftServicesMap";
import ShiftServicesTable from "@/components/monitoring/ShiftServicesTable";
import WeatherWidget from "@/components/monitoring/WeatherWidget";
import TwitterFeed from "@/components/monitoring/TwitterFeed";
import ServiceDetailModal from "@/components/monitoring/ServiceDetailModal";
import { useServiciosTurno, ServicioTurno, EstadoVisual } from "@/hooks/useServiciosTurno";
import { useServiciosTurnoRealtime } from "@/hooks/useServiciosTurnoRealtime";
import { useChecklistMonitoreo } from "@/hooks/useChecklistMonitoreo";
import {
  ChecklistDashboard,
  ChecklistServicesTable,
  ChecklistDetailModal,
  ChecklistAlertPanel,
  ChecklistFilters,
} from "@/components/monitoring/checklist";
import type { FiltrosChecklist } from "@/components/monitoring/checklist/ChecklistFilters";
import type { ServicioConChecklist, FiltroChecklist } from "@/types/checklist";
import AdoptionDashboard from "@/components/monitoring/adoption/AdoptionDashboard";
import AdoptionTable from "@/components/monitoring/adoption/AdoptionTable";
import { useAdopcionDigital, type FiltroAdopcion } from "@/hooks/useAdopcionDigital";
import { IncidentListPanel } from "@/components/monitoring/incidents";
import { useIncidenteResumen } from "@/hooks/useIncidentesOperativos";
import PerformanceDashboard from "@/components/monitoring/performance/PerformanceDashboard";

const MonitoringPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<EstadoVisual | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [timeWindow, setTimeWindow] = useState(8);
  const [activeTab, setActiveTab] = useState(
    tabFromUrl || 'performance'
  );
  
  // Sync tab with URL param
  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);
  
  // Checklist state
  const [filtroChecklist, setFiltroChecklist] = useState<FiltroChecklist>("todos");
  const [filtrosAvanzados, setFiltrosAvanzados] = useState<FiltrosChecklist>({ preset: 'turno_actual' });
  const [servicioChecklistSeleccionado, setServicioChecklistSeleccionado] = 
    useState<ServicioConChecklist | null>(null);
  const [isChecklistDetailOpen, setIsChecklistDetailOpen] = useState(false);
  const [filtroAdopcion, setFiltroAdopcion] = useState<FiltroAdopcion>("todos");
  
  const { data, isLoading, refetch, dataUpdatedAt } = useServiciosTurno(timeWindow);
  const { 
    data: checklistData, 
    isLoading: isLoadingChecklists,
    refetch: refetchChecklists 
  } = useChecklistMonitoreo({ timeWindow, filtros: filtrosAvanzados });
  const {
    data: adopcionData,
    isLoading: isLoadingAdopcion,
    refetch: refetchAdopcion,
  } = useAdopcionDigital();
  const { data: resumenIncidentes } = useIncidenteResumen();
  const servicios = data?.servicios || [];
  const resumen = data?.resumen || {
    enSitio: 0,
    proximos: 0,
    asignados: 0,
    sinAsignar: 0,
    total: 0
  };
  
  const serviciosChecklist = checklistData?.servicios || [];
  const resumenChecklists = checklistData?.resumen || {
    completos: 0,
    pendientes: 0,
    sinChecklist: 0,
    conAlertas: 0,
    total: 0,
  };

  const custodiasAdopcion = adopcionData?.custodios || [];
  const resumenAdopcion = adopcionData?.resumen || { total: 0, conCuenta: 0, conRol: 0, sinCuenta: 0 };

  // Hook de alertas en tiempo real
  useServiciosTurnoRealtime(servicios);

  const handleServiceClick = (servicio: ServicioTurno) => {
    setSelectedService(servicio.id);
    setIsDetailOpen(true);
  };

  const handleRefresh = () => {
    refetch();
    refetchChecklists();
    refetchAdopcion();
  };

  const handleVerChecklistDetalle = (servicio: ServicioConChecklist) => {
    setServicioChecklistSeleccionado(servicio);
    setIsChecklistDetailOpen(true);
    setSearchParams(prev => {
      prev.set('checklistId', servicio.servicioId);
      return prev;
    });
  };

  const handleChecklistDetailClose = (open: boolean) => {
    setIsChecklistDetailOpen(open);
    if (!open) {
      setSearchParams(prev => {
        prev.delete('checklistId');
        return prev;
      });
    }
  };

  // Restaurar checklist seleccionado desde URL
  useEffect(() => {
    const checklistId = searchParams.get('checklistId');
    if (checklistId && serviciosChecklist.length > 0 && !isChecklistDetailOpen) {
      const found = serviciosChecklist.find(s => s.servicioId === checklistId);
      if (found) {
        setServicioChecklistSeleccionado(found);
        setIsChecklistDetailOpen(true);
      }
    }
  }, [serviciosChecklist]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Centro de Monitoreo
          </h1>
          <p className="text-muted-foreground">
            Panel integral de operaciones, performance y seguimiento
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="gap-2" 
          disabled={isLoading || isLoadingChecklists}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading || isLoadingChecklists ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="posicionamiento">Posicionamiento</TabsTrigger>
          <TabsTrigger value="checklists" className="relative">
            Checklists
            {resumenChecklists.conAlertas > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {resumenChecklists.conAlertas}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="adopcion">Adopción Digital</TabsTrigger>
          <TabsTrigger value="incidentes" className="relative">
            Incidentes
            {(resumenIncidentes?.abiertos || 0) + (resumenIncidentes?.en_investigacion || 0) > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {(resumenIncidentes?.abiertos || 0) + (resumenIncidentes?.en_investigacion || 0)}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Performance */}
        <TabsContent value="performance" className="space-y-6 mt-0">
          <PerformanceDashboard />
        </TabsContent>

        {/* Tab: Posicionamiento */}
        <TabsContent value="posicionamiento" className="space-y-6 mt-0">
          {/* Summary Cards */}
          <ShiftSummaryCards 
            resumen={resumen}
            isLoading={isLoading}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
            onFilterChange={setFilterEstado}
            activeFilter={filterEstado}
            timeWindow={timeWindow}
            onTimeWindowChange={setTimeWindow}
          />

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map column - takes 2/3 on large screens */}
            <div className="lg:col-span-2 space-y-4">
              <ShiftServicesMap 
                servicios={servicios}
                className="h-[450px] lg:h-[500px]"
                onServiceClick={handleServiceClick}
                selectedServiceId={selectedService}
                filterEstado={filterEstado}
              />
              {/* Weather Widget - Debajo del mapa para mayor visibilidad */}
              <WeatherWidget />
            </div>

            {/* Side panel - services list */}
            <div className="lg:col-span-1">
              <ShiftServicesTable 
                servicios={servicios}
                onServiceClick={handleServiceClick}
                selectedServiceId={selectedService}
                filterEstado={filterEstado}
                onFilterChange={setFilterEstado}
              />
            </div>
          </div>

          {/* Alertas de Ruta - Full width */}
          <TwitterFeed />
        </TabsContent>

        {/* Tab: Checklists */}
        <TabsContent value="checklists" className="space-y-6 mt-0">
          {/* Dashboard de métricas */}
          <ChecklistDashboard
            resumen={resumenChecklists}
            isLoading={isLoadingChecklists}
            filtroActivo={filtroChecklist}
            onFiltroChange={setFiltroChecklist}
            timeWindow={timeWindow}
            filtrosAvanzados={filtrosAvanzados}
          />

          {/* Filtros avanzados */}
          <ChecklistFilters
            filtros={filtrosAvanzados}
            onFiltrosChange={setFiltrosAvanzados}
            timeWindow={timeWindow}
          />

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabla de servicios - 2/3 */}
            <div className="lg:col-span-2">
              <ChecklistServicesTable
                servicios={serviciosChecklist}
                isLoading={isLoadingChecklists}
                filtro={filtroChecklist}
                onVerDetalle={handleVerChecklistDetalle}
              />
            </div>

            {/* Panel de alertas - 1/3 */}
            <div className="lg:col-span-1">
              <ChecklistAlertPanel
                servicios={serviciosChecklist}
                onVerDetalle={handleVerChecklistDetalle}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab: Adopción Digital */}
        <TabsContent value="adopcion" className="space-y-6 mt-0">
          <AdoptionDashboard
            resumen={resumenAdopcion}
            isLoading={isLoadingAdopcion}
            filtroActivo={filtroAdopcion}
            onFiltroChange={setFiltroAdopcion}
          />
          <AdoptionTable
            custodios={custodiasAdopcion}
            isLoading={isLoadingAdopcion}
            filtro={filtroAdopcion}
          />
        </TabsContent>

        {/* Tab: Incidentes */}
        <TabsContent value="incidentes" className="space-y-6 mt-0">
          <IncidentListPanel />
        </TabsContent>
      </Tabs>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        serviceId={selectedService}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Checklist Detail Modal */}
      <ChecklistDetailModal
        servicio={servicioChecklistSeleccionado}
        open={isChecklistDetailOpen}
        onOpenChange={handleChecklistDetailClose}
      />
    </div>
  );
};

export default MonitoringPage;

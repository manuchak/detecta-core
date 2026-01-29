import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import ShiftSummaryCards from "@/components/monitoring/ShiftSummaryCards";
import ShiftServicesMap from "@/components/monitoring/ShiftServicesMap";
import ShiftServicesTable from "@/components/monitoring/ShiftServicesTable";
import WeatherWidget from "@/components/monitoring/WeatherWidget";
import TwitterFeed from "@/components/monitoring/TwitterFeed";
import { useServiciosTurno, ServicioTurno, EstadoVisual } from "@/hooks/useServiciosTurno";
import { useServiciosTurnoRealtime } from "@/hooks/useServiciosTurnoRealtime";

const MonitoringPage = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<EstadoVisual | null>(null);
  
  const { data, isLoading, refetch, dataUpdatedAt } = useServiciosTurno();
  
  const servicios = data?.servicios || [];
  const resumen = data?.resumen || {
    enSitio: 0,
    proximos: 0,
    asignados: 0,
    sinAsignar: 0,
    total: 0
  };

  // Hook de alertas en tiempo real
  useServiciosTurnoRealtime(servicios);

  const handleServiceClick = (servicio: ServicioTurno) => {
    setSelectedService(servicio.id === selectedService ? null : servicio.id);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Control de Posicionamiento
          </h1>
          <p className="text-muted-foreground">
            Seguimiento de custodios en ruta hacia sus puntos de origen
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="gap-2" 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <ShiftSummaryCards 
        resumen={resumen}
        isLoading={isLoading}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
        onFilterChange={setFilterEstado}
        activeFilter={filterEstado}
      />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map - takes 2/3 on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <ShiftServicesMap 
            servicios={servicios}
            className="h-[450px] lg:h-[500px]"
            onServiceClick={handleServiceClick}
            selectedServiceId={selectedService}
            filterEstado={filterEstado}
          />
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

      {/* Additional widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeatherWidget />
        <TwitterFeed />
      </div>
    </div>
  );
};

export default MonitoringPage;

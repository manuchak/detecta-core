import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MonitoringMobileShell } from './MonitoringMobileShell';
import type { MobileTab } from './MobileTabSelector';
import { BarChart3, MapPin, ClipboardCheck, Users, AlertTriangle, BookOpenText, Timer, Radio, FlaskConical, BookOpen, ShieldCheck } from 'lucide-react';

import PerformanceDashboard from '@/components/monitoring/performance/PerformanceDashboard';
import ShiftSummaryCards from '@/components/monitoring/ShiftSummaryCards';
import ShiftServicesMap from '@/components/monitoring/ShiftServicesMap';
import ShiftServicesTable from '@/components/monitoring/ShiftServicesTable';
import WeatherWidget from '@/components/monitoring/WeatherWidget';
import TwitterFeed from '@/components/monitoring/TwitterFeed';
import ServiceDetailModal from '@/components/monitoring/ServiceDetailModal';
import {
  ChecklistDashboard,
  ChecklistServicesTable,
  ChecklistDetailModal,
  ChecklistAlertPanel,
  ChecklistFilters,
} from '@/components/monitoring/checklist';
import type { FiltrosChecklist } from '@/components/monitoring/checklist/ChecklistFilters';
import type { ServicioConChecklist, FiltroChecklist } from '@/types/checklist';
import AdoptionDashboard from '@/components/monitoring/adoption/AdoptionDashboard';
import AdoptionTable from '@/components/monitoring/adoption/AdoptionTable';
import { IncidentListPanel } from '@/components/monitoring/incidents';
import { MobileBitacoraBoard } from './MobileBitacoraBoard';
import { CoordinatorCommandCenter } from '@/components/monitoring/coordinator/CoordinatorCommandCenter';
import { ServiceTimesPanel } from '@/components/monitoring/tiempos/ServiceTimesPanel';
import { CommTestPanel } from '@/components/monitoring/comm/CommTestPanel';
import { SystemRulesGuide } from '@/components/monitoring/rules/SystemRulesGuide';

import { useServiciosTurno, type ServicioTurno, type EstadoVisual } from '@/hooks/useServiciosTurno';
import { useServiciosTurnoRealtime } from '@/hooks/useServiciosTurnoRealtime';
import { useChecklistMonitoreo } from '@/hooks/useChecklistMonitoreo';
import { useAdopcionDigital, type FiltroAdopcion } from '@/hooks/useAdopcionDigital';
import { useIncidenteResumen } from '@/hooks/useIncidentesOperativos';
import { useUserRole } from '@/hooks/useUserRole';

const COORDINATOR_ROLES = ['monitoring_supervisor', 'coordinador_operaciones', 'admin', 'owner'] as const;

interface MobileMonitoringPageProps {
  /** Keep hooks that already run in parent alive */
}

export const MobileMonitoringPage: React.FC<MobileMonitoringPageProps> = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const { hasAnyRole } = useUserRole();
  const isCoordinator = hasAnyRole(COORDINATOR_ROLES as any);

  const [activeTab, setActiveTab] = useState(tabFromUrl || 'bitacora');
  const [timeWindow] = useState(8);
  const [filterEstado, setFilterEstado] = useState<EstadoVisual | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Checklist state
  const [filtroChecklist, setFiltroChecklist] = useState<FiltroChecklist>('todos');
  const [filtrosAvanzados, setFiltrosAvanzados] = useState<FiltrosChecklist>({ preset: 'turno_actual' });
  const [servicioChecklistSeleccionado, setServicioChecklistSeleccionado] = useState<ServicioConChecklist | null>(null);
  const [isChecklistDetailOpen, setIsChecklistDetailOpen] = useState(false);
  const [filtroAdopcion, setFiltroAdopcion] = useState<FiltroAdopcion>('todos');

  const { data, isLoading, refetch, dataUpdatedAt } = useServiciosTurno(timeWindow);
  const { data: checklistData, isLoading: isLoadingChecklists, refetch: refetchChecklists } = useChecklistMonitoreo({ timeWindow, filtros: filtrosAvanzados });
  const { data: adopcionData, isLoading: isLoadingAdopcion, refetch: refetchAdopcion } = useAdopcionDigital();
  const { data: resumenIncidentes } = useIncidenteResumen();

  const servicios = data?.servicios || [];
  const resumen = data?.resumen || { enSitio: 0, proximos: 0, asignados: 0, sinAsignar: 0, total: 0 };
  const serviciosChecklist = checklistData?.servicios || [];
  const resumenChecklists = checklistData?.resumen || { completos: 0, pendientes: 0, sinChecklist: 0, conAlertas: 0, total: 0 };
  const custodiasAdopcion = adopcionData?.custodios || [];
  const resumenAdopcion = adopcionData?.resumen || { total: 0, conCuenta: 0, conRol: 0, sinCuenta: 0 };

  useServiciosTurnoRealtime(servicios);

  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleRefresh = () => {
    refetch();
    refetchChecklists();
    refetchAdopcion();
  };

  const handleServiceClick = (servicio: ServicioTurno) => {
    setSelectedService(servicio.id);
    setIsDetailOpen(true);
  };

  const handleVerChecklistDetalle = (servicio: ServicioConChecklist) => {
    setServicioChecklistSeleccionado(servicio);
    setIsChecklistDetailOpen(true);
  };

  const incidentBadge = (resumenIncidentes?.abiertos || 0) + (resumenIncidentes?.en_investigacion || 0);

  const tabs: MobileTab[] = [
    { id: 'bitacora', label: 'Bitácora', icon: <BookOpenText className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} /> },
    { id: 'posicionamiento', label: 'Mapa', icon: <MapPin className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} /> },
    { id: 'performance', label: 'Performance', icon: <BarChart3 className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} /> },
    { id: 'checklists', label: 'Checklists', icon: <ClipboardCheck className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} />, badge: resumenChecklists.conAlertas || undefined },
    { id: 'incidentes', label: 'Incidentes', icon: <AlertTriangle className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} />, badge: incidentBadge || undefined },
    { id: 'tiempos', label: 'Tiempos', icon: <Timer className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} /> },
    { id: 'adopcion', label: 'Adopción', icon: <Users className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} /> },
    { id: 'coordinacion', label: 'C4', icon: <Radio className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} />, hidden: !isCoordinator },
    { id: 'comm-test', label: 'Comm', icon: <FlaskConical className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} />, hidden: !isCoordinator },
    { id: 'reglas', label: 'Reglas', icon: <BookOpen className="h-3.5 w-3.5" style={{ transform: 'translateZ(0)' }} />, hidden: !isCoordinator },
  ];

  return (
    <MonitoringMobileShell
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={handleRefresh}
      isRefreshing={isLoading || isLoadingChecklists}
    >
      {/* Bitácora */}
      {activeTab === 'bitacora' && <MobileBitacoraBoard />}

      {/* Posicionamiento */}
      {activeTab === 'posicionamiento' && (
        <div className="space-y-4 py-2">
          <ShiftSummaryCards
            resumen={resumen}
            isLoading={isLoading}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
            onFilterChange={setFilterEstado}
            activeFilter={filterEstado}
            timeWindow={timeWindow}
            onTimeWindowChange={() => {}}
          />
          <ShiftServicesMap
            servicios={servicios}
            className="h-[250px] rounded-xl"
            onServiceClick={handleServiceClick}
            selectedServiceId={selectedService}
            filterEstado={filterEstado}
          />
          <ShiftServicesTable
            servicios={servicios}
            onServiceClick={handleServiceClick}
            selectedServiceId={selectedService}
            filterEstado={filterEstado}
            onFilterChange={setFilterEstado}
          />
          <WeatherWidget />
          <TwitterFeed />
        </div>
      )}

      {/* Performance */}
      {activeTab === 'performance' && (
        <div className="py-2">
          <PerformanceDashboard />
        </div>
      )}

      {/* Checklists */}
      {activeTab === 'checklists' && (
        <div className="space-y-4 py-2">
          <ChecklistDashboard
            resumen={resumenChecklists}
            isLoading={isLoadingChecklists}
            filtroActivo={filtroChecklist}
            onFiltroChange={setFiltroChecklist}
            timeWindow={timeWindow}
            filtrosAvanzados={filtrosAvanzados}
          />
          <ChecklistFilters
            filtros={filtrosAvanzados}
            onFiltrosChange={setFiltrosAvanzados}
            timeWindow={timeWindow}
          />
          <ChecklistServicesTable
            servicios={serviciosChecklist}
            isLoading={isLoadingChecklists}
            filtro={filtroChecklist}
            onVerDetalle={handleVerChecklistDetalle}
          />
          <ChecklistAlertPanel
            servicios={serviciosChecklist}
            onVerDetalle={handleVerChecklistDetalle}
          />
        </div>
      )}

      {/* Adopción */}
      {activeTab === 'adopcion' && (
        <div className="space-y-4 py-2">
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
        </div>
      )}

      {/* Incidentes */}
      {activeTab === 'incidentes' && (
        <div className="py-2">
          <IncidentListPanel />
        </div>
      )}

      {/* Tiempos */}
      {activeTab === 'tiempos' && (
        <div className="py-2">
          <ServiceTimesPanel />
        </div>
      )}

      {/* C4 */}
      {activeTab === 'coordinacion' && isCoordinator && (
        <div className="py-2">
          <CoordinatorCommandCenter />
        </div>
      )}

      {/* Comm Test */}
      {activeTab === 'comm-test' && isCoordinator && (
        <div className="py-2">
          <CommTestPanel />
        </div>
      )}

      {/* Reglas */}
      {activeTab === 'reglas' && isCoordinator && (
        <div className="py-2">
          <SystemRulesGuide />
        </div>
      )}

      {/* Service Detail Modal */}
      <ServiceDetailModal
        serviceId={selectedService}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
      <ChecklistDetailModal
        servicio={servicioChecklistSeleccionado}
        open={isChecklistDetailOpen}
        onOpenChange={setIsChecklistDetailOpen}
      />
    </MonitoringMobileShell>
  );
};

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin,
  TrendingUp,
  MessageSquare,
  FileText,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useServiciosHoy, useCustodiosDisponibles, useZonasOperativas } from '@/hooks/useServiciosHoy';
import { useServiciosAyer } from '@/hooks/useServiciosAyer';
import { usePendingFolioCount } from '@/hooks/usePendingFolioCount';
import { useCustodiosActivos30d } from '@/hooks/useCustodiosActivos30d';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { PendingAssignmentModal } from '@/components/planeacion/PendingAssignmentModal';
import { ContextualEditModal } from '@/components/planeacion/ContextualEditModal';
import { CoverageRing } from '@/components/planeacion/CoverageRing';
import { TrendBadge } from '@/components/planeacion/TrendBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useQueryClient } from '@tanstack/react-query';

export function OperationalDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-ES'));
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  
  // Estado para modal de edición de folio
  const [editFolioModalOpen, setEditFolioModalOpen] = useState(false);
  const [selectedFolioService, setSelectedFolioService] = useState<any>(null);
  
  const { data: serviciosHoy = [], isLoading: loadingServicios, refetch: refetchServicios } = useServiciosHoy();
  const { data: custodiosDisponibles = [], isLoading: loadingCustodios } = useCustodiosDisponibles();
  const { data: zonasOperativas = [], isLoading: loadingZonas } = useZonasOperativas();
  const { data: folioStats, isLoading: loadingFolio } = usePendingFolioCount();
  const { data: datosAyer } = useServiciosAyer();
  const { data: custodiosActivos, isLoading: loadingActivos } = useCustodiosActivos30d();
  
  const { updateServiceConfiguration } = useServiciosPlanificados();
  const queryClient = useQueryClient();

  // Update time every second - with dialog protection
  useEffect(() => {
    const timer = setInterval(() => {
      const hasDialogFlag = document.body.dataset.dialogOpen === "1" || 
                           document.body.dataset.dialogTransitioning === "1";
      const hasOpenDialog = !!document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'
      );
      
      if (hasDialogFlag || hasOpenDialog) return;
      setCurrentTime(new Date().toLocaleTimeString('es-ES'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // KPIs operativos reales
  const serviciosSinCustodio = serviciosHoy.filter(s => 
    !s.custodio_asignado || s.custodio_asignado === ''
  );

  // Servicios con folio temporal (UUID = 36 caracteres) que necesitan folio de Saphiro
  const serviciosSinFolio = serviciosHoy.filter(s => 
    s.id_servicio && s.id_servicio.length === 36
  );

  const serviciosAsignados = serviciosHoy.filter(s => 
    s.custodio_asignado && s.custodio_asignado !== ''
  );

  const serviciosProximosVencer = serviciosHoy.filter(s => {
    if (!s.fecha_hora_cita) return false;
    const fechaServicio = new Date(s.fecha_hora_cita);
    const ahora = new Date();
    const diffHoras = (fechaServicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    return diffHoras > 0 && diffHoras < 4 && !s.custodio_asignado;
  });

  // Métricas derivadas - Fase 1 & 2
  const porcentajeAsignacion = serviciosHoy.length > 0
    ? Math.round((serviciosAsignados.length / serviciosHoy.length) * 100)
    : 100;

  // Ordenar por urgencia (tiempo restante) - Fase 1
  const accionesPrioritarias = [...serviciosSinCustodio].sort((a, b) => {
    if (!a.fecha_hora_cita) return 1;
    if (!b.fecha_hora_cita) return -1;
    return new Date(a.fecha_hora_cita).getTime() - new Date(b.fecha_hora_cita).getTime();
  });

  // Helper para calcular tiempo restante
  const getTiempoRestante = (fechaCita: string | null) => {
    if (!fechaCita) return null;
    const ahora = new Date();
    const cita = new Date(fechaCita);
    const diffMs = cita.getTime() - ahora.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 0) return { text: 'Vencido', urgency: 'critical' };
    if (diffMins < 60) return { text: `${diffMins} min`, urgency: 'critical' };
    if (diffMins < 240) return { text: `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`, urgency: 'warning' };
    return { text: `${Math.floor(diffMins / 60)}h`, urgency: 'normal' };
  };

  const isLoading = loadingServicios || loadingCustodios || loadingZonas;
  const hasCriticalPending = serviciosSinCustodio.length > 0;

  return (
    <div className="apple-layout">
      {/* Header */}
      <div className="apple-header">
        <div>
          <h1 className="apple-title">Dashboard Operacional</h1>
          <p className="apple-subtitle">
            {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })} • {currentTime}
          </p>
        </div>
      </div>

      {/* Hero Metrics - Nueva jerarquía visual */}
      <div className="apple-metrics-hero">
        {/* Card Destacada - Sin Asignar (Fase 1: Prominencia) */}
        {hasCriticalPending ? (
          <div className="apple-metric-featured">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Requiere Acción</span>
                </div>
                <div className="text-5xl font-bold text-destructive mb-1">
                  {serviciosSinCustodio.length}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Servicios Sin Asignar
                </div>
                {datosAyer && (
                  <TrendBadge 
                    current={serviciosSinCustodio.length} 
                    previous={datosAyer.sinAsignar}
                    invertColors={true}
                  />
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <CoverageRing percentage={porcentajeAsignacion} size={72} />
                <span className="text-xs text-muted-foreground">Asignados</span>
              </div>
            </div>
            <Button 
              className="w-full mt-4" 
              variant="destructive"
              onClick={() => {
                if (accionesPrioritarias[0]) {
                  const servicio = accionesPrioritarias[0];
                  setSelectedService({
                    id: servicio.id,
                    id_servicio: servicio.id_servicio || '',
                    nombre_cliente: servicio.nombre_cliente || 'Sin cliente',
                    origen: servicio.origen || '',
                    destino: servicio.destino || '',
                    fecha_hora_cita: servicio.fecha_hora_cita || '',
                    tipo_servicio: 'custodia',
                    requiere_armado: servicio.requiere_armado ?? false,
                    observaciones: '',
                    created_at: servicio.created_at || new Date().toISOString(),
                    custodio_asignado: servicio.custodio_asignado || undefined,
                    armado_asignado: servicio.armado_asignado || undefined,
                    estado: servicio.estado_planeacion || 'pendiente'
                  });
                  setAssignmentModalOpen(true);
                }
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Asignar Más Urgente
            </Button>
          </div>
        ) : (
          <div className="apple-metric-success-hero">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium text-success">Todo Asignado</span>
                </div>
                <div className="text-5xl font-bold text-success mb-1">
                  100%
                </div>
                <div className="text-sm text-muted-foreground">
                  Cobertura Completa
                </div>
              </div>
              <CoverageRing percentage={100} size={72} />
            </div>
          </div>
        )}

        {/* Métricas Secundarias */}
        <div className="apple-metric apple-metric-primary">
          <div className="apple-metric-icon">
            <Clock className="h-6 w-6" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">
              {isLoading ? '...' : serviciosHoy.length}
            </div>
            <div className="apple-metric-label">Servicios Hoy</div>
            {datosAyer && (
              <TrendBadge current={serviciosHoy.length} previous={datosAyer.total} />
            )}
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="apple-metric apple-metric-success cursor-help">
              <div className="apple-metric-icon">
                <Users className="h-6 w-6" />
              </div>
              <div className="apple-metric-content">
                <div className="apple-metric-value">
                  {loadingActivos ? '...' : custodiosActivos?.activos || 0}
                </div>
                <div className="apple-metric-label">Custodios Activos</div>
                <span className="text-xs text-muted-foreground">
                  últimos 30 días
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Custodios distintos con servicios asignados</p>
            <p className="text-xs text-muted-foreground">
              {custodiosActivos?.activos || 0} de {custodiosActivos?.totalPool || 0} del pool total
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="apple-metric apple-metric-warning">
          <div className="apple-metric-icon">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">
              {isLoading ? '...' : serviciosProximosVencer.length}
            </div>
            <div className="apple-metric-label">Por Vencer (4h)</div>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="apple-metric apple-metric-info cursor-help">
              <div className="apple-metric-icon">
                <FileText className="h-6 w-6" />
              </div>
              <div className="apple-metric-content">
                <div className="apple-metric-value">
                  {loadingFolio ? '...' : folioStats?.pendientes || 0}
                </div>
                <div className="apple-metric-label">Pend. Folio</div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Servicios con folio temporal del sistema</p>
            <p className="text-xs text-muted-foreground">
              {folioStats?.porcentajePendiente || 0}% requiere folio de Saphiro
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Priority Actions */}
      <div className="apple-actions">
        <div className="apple-card">
          <div className="apple-section-header">
            <h3 className="apple-section-title flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Acciones Prioritarias
            </h3>
            <p className="apple-section-description">
              Ordenadas por urgencia de cita
            </p>
          </div>
          <div className="apple-list">
            {accionesPrioritarias.length > 0 ? (
              accionesPrioritarias.slice(0, 5).map((servicio) => {
                const tiempoRestante = getTiempoRestante(servicio.fecha_hora_cita);
                return (
                  <div key={servicio.id} className="apple-list-item">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Indicador de urgencia */}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          tiempoRestante?.urgency === 'critical' ? 'bg-destructive animate-pulse' :
                          tiempoRestante?.urgency === 'warning' ? 'bg-warning' : 'bg-success'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="apple-list-title truncate">
                            {servicio.nombre_cliente || servicio.id_servicio || 'Sin identificar'}
                          </p>
                          <p className="apple-list-description truncate">
                            {servicio.origen && servicio.destino 
                              ? `${servicio.origen} → ${servicio.destino}` 
                              : servicio.destino || servicio.origen || 'Sin ruta'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Tiempo restante */}
                        <div className={`text-xs font-medium px-2 py-1 rounded ${
                          tiempoRestante?.urgency === 'critical' 
                            ? 'bg-destructive/10 text-destructive' 
                            : tiempoRestante?.urgency === 'warning'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {servicio.fecha_hora_cita 
                            ? format(new Date(servicio.fecha_hora_cita), 'HH:mm') 
                            : '--:--'}
                          {tiempoRestante && (
                            <span className="ml-1 opacity-75">({tiempoRestante.text})</span>
                          )}
                        </div>
                        <div className="apple-list-actions">
                          <Button 
                            size="sm" 
                            className="apple-button"
                            onClick={() => {
                              setSelectedService({
                                id: servicio.id,
                                id_servicio: servicio.id_servicio || '',
                                nombre_cliente: servicio.nombre_cliente || 'Sin cliente',
                                origen: servicio.origen || '',
                                destino: servicio.destino || '',
                                fecha_hora_cita: servicio.fecha_hora_cita || '',
                                tipo_servicio: 'custodia',
                                requiere_armado: servicio.requiere_armado ?? false,
                                observaciones: '',
                                created_at: servicio.created_at || new Date().toISOString(),
                                custodio_asignado: servicio.custodio_asignado || undefined,
                                armado_asignado: servicio.armado_asignado || undefined,
                                estado: servicio.estado_planeacion || 'pendiente'
                              });
                              setAssignmentModalOpen(true);
                            }}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Asignar
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="apple-empty-state">
                <CheckCircle className="h-10 w-10 text-success mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {serviciosHoy.length > 0 
                    ? 'Todos los servicios tienen custodio asignado' 
                    : 'No hay servicios programados para hoy'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pendientes de Folio Saphiro - NUEVA SECCIÓN */}
        {serviciosSinFolio.length > 0 && (
          <div className="apple-card">
            <div className="apple-section-header">
              <h3 className="apple-section-title flex items-center gap-2">
                <FileText className="h-5 w-5 text-warning" />
                Pendientes de Folio Saphiro
                <Badge variant="secondary" className="ml-2">
                  {serviciosSinFolio.length}
                </Badge>
              </h3>
              <p className="apple-section-description">
                Servicios con ID temporal del sistema
              </p>
            </div>
            <div className="apple-list">
              {serviciosSinFolio.slice(0, 5).map((servicio) => {
                const tiempoRestante = getTiempoRestante(servicio.fecha_hora_cita);
                return (
                  <div key={servicio.id} className="apple-list-item">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Indicador de advertencia */}
                        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-warning" />
                        <div className="flex-1 min-w-0">
                          <p className="apple-list-title truncate">
                            {servicio.nombre_cliente || 'Sin cliente'}
                          </p>
                          <p className="apple-list-description truncate">
                            {servicio.origen && servicio.destino 
                              ? `${servicio.origen} → ${servicio.destino}` 
                              : servicio.destino || servicio.origen || 'Sin ruta'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Hora de cita */}
                        <div className={`text-xs font-medium px-2 py-1 rounded ${
                          tiempoRestante?.urgency === 'critical' 
                            ? 'bg-destructive/10 text-destructive' 
                            : tiempoRestante?.urgency === 'warning'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {servicio.fecha_hora_cita 
                            ? format(new Date(servicio.fecha_hora_cita), 'HH:mm') 
                            : '--:--'}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7"
                          onClick={() => {
                            setSelectedFolioService({
                              id: servicio.id,
                              id_servicio: servicio.id_servicio || '',
                              nombre_cliente: servicio.nombre_cliente || 'Sin cliente',
                              origen: servicio.origen || '',
                              destino: servicio.destino || '',
                              fecha_hora_cita: servicio.fecha_hora_cita || '',
                              tipo_servicio: 'custodia',
                              requiere_armado: servicio.requiere_armado ?? false,
                              custodio_asignado: servicio.custodio_asignado || undefined,
                              armado_asignado: servicio.armado_asignado || undefined,
                              estado_planeacion: servicio.estado_planeacion || 'pendiente'
                            });
                            setEditFolioModalOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {serviciosSinFolio.length > 5 && (
                <div className="text-center py-2">
                  <span className="text-xs text-muted-foreground">
                    +{serviciosSinFolio.length - 5} servicios más pendientes de folio
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="apple-card">
          <div className="apple-section-header">
            <h3 className="apple-section-title flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Resumen por Zona
            </h3>
            <p className="apple-section-description">
              Disponibilidad de custodios por zona
            </p>
          </div>
          <div className="apple-zones">
            {zonasOperativas.length > 0 ? (
              zonasOperativas.slice(0, 4).map((zona) => (
                <div key={zona.zona} className="apple-zone-card">
                  <div className="apple-zone-header">
                    <span className="apple-zone-title">{zona.zona}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      zona.porcentaje > 70 ? 'bg-success' : 
                      zona.porcentaje > 30 ? 'bg-warning' : 'bg-destructive'
                    }`} />
                  </div>
                  <div className="apple-zone-percentage">
                    {zona.porcentaje}%
                  </div>
                  <div className="apple-zone-availability">
                    {zona.disponibles} de {zona.total} disponibles
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-4 text-muted-foreground">
                {isLoading ? 'Cargando zonas...' : 'Sin datos de zonas'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Asignación */}
      <PendingAssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        service={selectedService}
        onAssignmentComplete={() => {
          setAssignmentModalOpen(false);
          setSelectedService(null);
        }}
      />

      {/* Modal de Edición de Folio */}
      <ContextualEditModal
        open={editFolioModalOpen}
        onOpenChange={setEditFolioModalOpen}
        service={selectedFolioService}
        onSave={async (id, data) => {
          await updateServiceConfiguration({ id, data });
          await Promise.all([
            refetchServicios(),
            queryClient.invalidateQueries({ queryKey: ['pending-folio-count'] })
          ]);
          setEditFolioModalOpen(false);
          setSelectedFolioService(null);
        }}
      />
    </div>
  );
}

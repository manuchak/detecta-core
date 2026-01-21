import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useScheduledServices } from '@/hooks/useScheduledServices';
import { usePendingServices } from '@/hooks/usePendingServices';
import { usePendingArmadoServices } from '@/hooks/usePendingArmadoServices';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { useServiceTransformations } from '@/hooks/useServiceTransformations';
import { PendingAssignmentModal } from '@/components/planeacion/PendingAssignmentModal';
import { EditServiceModal, type EditableService } from '@/components/planeacion/EditServiceModal';
import { ReassignmentModal, type ServiceForReassignment } from '@/components/planeacion/ReassignmentModal';
import { ServiceHistoryModal } from '@/components/planeacion/ServiceHistoryModal';
import { SimplifiedArmedAssignment } from '@/components/planeacion/SimplifiedArmedAssignment';
import { AirlineDateSelector } from '@/components/planeacion/AirlineDateSelector';
import { Clock, MapPin, User, Car, Shield, CheckCircle2, AlertCircle, Users, Timer, Edit, RefreshCw, History, Copy, Info } from 'lucide-react';
import { CancelServiceButton } from '@/components/planeacion/CancelServiceButton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCDMXDate, formatCDMXTime } from '@/utils/cdmxTimezone';

export function ScheduledServicesTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: summary, isLoading: loading, error, refetch } = useScheduledServices(selectedDate);
  const { summary: pendingSummary, loading: pendingLoading, refetch: refetchPending } = usePendingServices();
  const { summary: pendingArmadoSummary, loading: pendingArmadoLoading, refetch: refetchPendingArmado } = usePendingArmadoServices();
  const { 
    updateServiceConfiguration, 
    isUpdatingConfiguration,
    reassignCustodian,
    reassignArmedGuard,
    removeAssignment,
    isReassigning
  } = useServiciosPlanificados();
  const { servicioToPending } = useServiceTransformations();
  
  // Estado para el modal de asignación
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedPendingService, setSelectedPendingService] = useState<any>(null);
  
  // Estado para el modal de edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditService, setSelectedEditService] = useState<EditableService | null>(null);
  
  // Estado para modales de Sprint 2 y 3
  const [reassignmentModalOpen, setReassignmentModalOpen] = useState(false);
  const [reassignmentService, setReassignmentService] = useState<ServiceForReassignment | null>(null);
  const [reassignmentType, setReassignmentType] = useState<'custodian' | 'armed_guard'>('custodian');
  
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyServiceId, setHistoryServiceId] = useState<string | null>(null);
  const [historyServiceName, setHistoryServiceName] = useState<string>('');
  
  // Estado para modal de asignación de armado/abordo
  const [armedAssignmentModalOpen, setArmedAssignmentModalOpen] = useState(false);
  const [selectedArmadoService, setSelectedArmadoService] = useState<any>(null);

  // Agrupar servicios por cliente para el tooltip
  const servicesByClient = useMemo((): Array<{ name: string; count: number }> => {
    if (!summary?.services_data) return [];
    
    const clientCounts: Record<string, number> = {};
    summary.services_data.forEach((service) => {
      const clientName = service.cliente_nombre || 'Sin cliente';
      clientCounts[clientName] = (clientCounts[clientName] || 0) + 1;
    });
    
    return Object.entries(clientCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [summary?.services_data]);

  // Función para copiar desglose al portapapeles
  const copyClientBreakdown = async () => {
    const dateStr = format(selectedDate, 'dd/MM/yyyy', { locale: es });
    const lines = [
      `Servicios del ${dateStr}`,
      '─'.repeat(35),
      ...servicesByClient.map(({ name, count }) => 
        `${name.padEnd(28)} ${String(count).padStart(3)}`
      ),
      '─'.repeat(35),
      `Total:${' '.repeat(22)}${String(summary?.total_services || 0).padStart(3)}`,
    ];
    
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success('Lista copiada al portapapeles');
    } catch (err) {
      toast.error('Error al copiar');
    }
  };

  // Handler para completar asignación de armado
  const handleArmedAssignmentComplete = async (data: any) => {
    if (!selectedArmadoService) return;
    
    try {
      updateServiceConfiguration({
        id: selectedArmadoService.id,
        data: {
          armado_asignado: data.armado_nombre,
          armado_id: data.armado_id,
          punto_encuentro: data.punto_encuentro,
          hora_encuentro: data.hora_encuentro,
          tipo_asignacion_armado: data.tipo_asignacion,
          proveedor_armado_id: data.proveedor_id || null,
          observaciones: data.observaciones || null
        }
      });
      
      toast.success(`Armado ${data.armado_nombre} asignado correctamente`);
      setArmedAssignmentModalOpen(false);
      setSelectedArmadoService(null);
      
      // Refrescar datos
      refetchPendingArmado();
      refetch();
    } catch (error) {
      console.error('Error assigning armed guard:', error);
      toast.error('Error al asignar armado');
    }
  };

  const getStatusBadge = (service: any) => {
    // Check if service is fully planned and confirmed
    const isFullyPlanned = service.custodio_nombre && (!service.incluye_armado || service.armado_asignado);
    const isConfirmed = service.estado === 'confirmado';
    
    if (isFullyPlanned && isConfirmed) {
      return <Badge className="bg-success/10 text-success border-success/20">✅ Completamente Planeado</Badge>;
    }
    
    if (service.incluye_armado && !service.armado_asignado) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">🛡️ Armado Pendiente</Badge>;
    }
    
    if (!service.custodio_nombre) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">👤 Custodio Pendiente</Badge>;
    }
    
    if (isFullyPlanned && !isConfirmed) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">⏳ Pendiente Confirmación</Badge>;
    }
    
    if (service.estado === 'confirmado') {
      return <Badge className="bg-info/10 text-info border-info/20">✓ Confirmado</Badge>;
    }
    
    return <Badge className="bg-muted text-muted-foreground border-muted">🔄 En Proceso</Badge>;
  };

  const getStatusIcon = (service: any) => {
    // Check if service is fully planned and confirmed
    const isFullyPlanned = service.custodio_nombre && (!service.incluye_armado || service.armado_asignado);
    const isConfirmed = service.estado === 'confirmado';
    
    if (isFullyPlanned && isConfirmed) {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    
    if (service.incluye_armado && !service.armado_asignado) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    
    if (!service.custodio_nombre) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    
    if (service.estado === 'confirmado') {
      return <CheckCircle2 className="h-4 w-4 text-info" />;
    }
    
    return <Timer className="h-4 w-4 text-warning" />;
  };

  const handleEditService = (service: any) => {
    // Check if service needs assignment (custodian or armed guard missing)
    const needsCustodianAssignment = !service.custodio_nombre;
    const needsArmedGuardAssignment = (service.incluye_armado || service.requiere_armado) && !service.armado_asignado;
    const isPendingAssignment = needsCustodianAssignment || needsArmedGuardAssignment;

    if (isPendingAssignment) {
      // ✅ Conversión robusta y tipada usando el hook de transformación
      // ✅ FIX: Usar getCDMXDate/formatCDMXTime en lugar de split('T') para evitar bug UTC off-by-one
      const pendingService = servicioToPending({
        id: service.id,
        folio: service.id_servicio || service.id,
        cliente: service.cliente_nombre || service.nombre_cliente || '',
        origen_texto: service.origen || '',
        destino_texto: service.destino || '',
        fecha_programada: service.fecha_hora_cita ? getCDMXDate(service.fecha_hora_cita) : '',
        hora_ventana_inicio: service.fecha_hora_cita ? formatCDMXTime(service.fecha_hora_cita, 'HH:mm') : '09:00',
        tipo_servicio: service.tipo_servicio || 'custodia',
        requiere_armado: service.incluye_armado || service.requiere_armado || false,
        notas_especiales: service.observaciones,
        created_at: service.created_at || new Date().toISOString(),
        custodio_asignado: service.custodio_nombre || service.custodio_asignado || null,
        estado: service.estado
      } as any);
      
      setSelectedPendingService(pendingService);
      setAssignmentModalOpen(true);
    } else {
      // Use EditServiceModal for fully assigned services
      const editableService: EditableService = {
        id: service.id,
        id_servicio: service.id_servicio || service.id,
        nombre_cliente: service.cliente_nombre || service.nombre_cliente,
        empresa_cliente: service.empresa_cliente,
        email_cliente: service.email_cliente,
        telefono_cliente: service.telefono_cliente,
        origen: service.origen,
        destino: service.destino,
        fecha_hora_cita: service.fecha_hora_cita,
        tipo_servicio: service.tipo_servicio || 'custodia',
        requiere_armado: service.incluye_armado || service.requiere_armado || false,
        custodio_asignado: service.custodio_nombre,
        armado_asignado: service.armado_asignado,
        observaciones: service.observaciones,
        estado_planeacion: service.estado
      };
      setSelectedEditService(editableService);
      setEditModalOpen(true);
    }
  };

  const handleSaveServiceEdit = async (id: string, data: Partial<EditableService>) => {
    await updateServiceConfiguration({ id, data });
    
    // Automatically refresh after successful update
    await Promise.all([
      refetch(),
      refetchPending(),
      refetchPendingArmado()
    ]);
    
    // Set selected date to the service's date to show updated status immediately
    if (data.fecha_hora_cita) {
      setSelectedDate(new Date(data.fecha_hora_cita));
    }
  };

  const handleReassignCustodian = (service: any) => {
    const serviceForReassignment: ServiceForReassignment = {
      id: service.id,
      id_servicio: service.id_servicio || service.id,
      nombre_cliente: service.cliente_nombre || service.nombre_cliente,
      origen: service.origen,
      destino: service.destino,
      fecha_hora_cita: service.fecha_hora_cita,
      custodio_asignado: service.custodio_nombre,
      armado_asignado: service.armado_asignado,
      requiere_armado: service.incluye_armado || service.requiere_armado || false,
      estado_planeacion: service.estado
    };
    setReassignmentService(serviceForReassignment);
    setReassignmentType('custodian');
    setReassignmentModalOpen(true);
  };

  const handleReassignArmedGuard = (service: any) => {
    const serviceForReassignment: ServiceForReassignment = {
      id: service.id,
      id_servicio: service.id_servicio || service.id,
      nombre_cliente: service.cliente_nombre || service.nombre_cliente,
      origen: service.origen,
      destino: service.destino,
      fecha_hora_cita: service.fecha_hora_cita,
      custodio_asignado: service.custodio_nombre,
      armado_asignado: service.armado_asignado,
      requiere_armado: service.incluye_armado || service.requiere_armado || false,
      estado_planeacion: service.estado
    };
    setReassignmentService(serviceForReassignment);
    setReassignmentType('armed_guard');
    setReassignmentModalOpen(true);
  };

  const handleShowHistory = (service: any) => {
    setHistoryServiceId(service.id);
    setHistoryServiceName(`${service.cliente_nombre} - ${service.id_servicio}`);
    setHistoryModalOpen(true);
  };

  const handleReassignmentComplete = async () => {
    // Refresh all data after successful reassignment
    await Promise.all([
      refetch(),
      refetchPending(),
      refetchPendingArmado()
    ]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="apple-header-section">
        <div>
          <h1 className="apple-text-largetitle">Servicios</h1>
          <p className="apple-text-body text-secondary">
            Agenda de servicios programados
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AirlineDateSelector 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="apple-button-ghost">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Header */}
      <div className="apple-date-header">
        <div className="apple-text-title">{format(selectedDate, 'PPP', { locale: es })}</div>
        <div className="apple-summary-compact">
          <Popover>
            <PopoverTrigger asChild>
              <div className="apple-summary-item cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-3 py-2 transition-colors group">
                <div className="flex items-center gap-1">
                  <span className="apple-summary-value">{summary?.total_services || 0}</span>
                  <Info className="h-3.5 w-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="apple-summary-label">total</span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-popover z-[100] border-2 border-slate-200 shadow-lg" align="center" sideOffset={8}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Desglose por Cliente</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyClientBreakdown}
                    className="h-7 px-2"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copiar
                  </Button>
                </div>
                
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {servicesByClient.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin servicios</p>
                  ) : (
                    servicesByClient.map(({ name, count }) => (
                      <div key={name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[200px]">{name}</span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="pt-2 border-t flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span className="tabular-nums">{summary?.total_services || 0}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="apple-summary-item">
            <span className="apple-summary-value apple-text-success">{summary?.assigned_services || 0}</span>
            <span className="apple-summary-label">asignados</span>
          </div>
          <div className="apple-summary-item">
            <span className="apple-summary-value apple-text-warning">{pendingSummary?.total_pending || 0}</span>
            <span className="apple-summary-label">pendientes</span>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="card-refined">
        <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-200/60">
          <h3 className="text-title text-lg">
            Servicios del {format(selectedDate, 'PPP', { locale: es })}
          </h3>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:bg-slate-50">
            Actualizar
          </Button>
        </div>
        <div className="pt-4">
          {error && (
            <div className="text-center py-8 text-red-600">
              {error instanceof Error ? error.message : 'Error al cargar servicios'}
            </div>
          )}

          {!error && summary?.services_data && summary.services_data.length === 0 && (
            <div className="text-center py-8 text-body">
              No hay servicios programados para esta fecha
            </div>
          )}

          {!error && summary?.services_data && summary.services_data.length > 0 && (
            <div className="space-y-4">
              {summary.services_data.map((service, index) => (
                <div
                  key={service.id || index}
                  className="border border-slate-200/60 rounded-lg p-4 hover:bg-slate-50/60 hover:border-slate-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Service Header */}
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service)}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-subtitle">{service.cliente_nombre}</h3>
                            <Badge variant="outline" className="text-xs font-mono bg-muted text-muted-foreground border-muted">
                              ID: {service.id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-caption">
                            <Clock className="h-3 w-3" />
                            {format(new Date(service.fecha_hora_cita), 'HH:mm')}
                          </div>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="text-subtitle">{service.origen}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-subtitle">{service.destino}</span>
                      </div>

                      {/* Custodian and Vehicle Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <span className="text-body"><strong className="text-slate-700">Custodio:</strong> {service.custodio_nombre}</span>
                        </div>
                        
                        {(service.auto || service.placa) && (
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-slate-500" />
                            <span className="text-body">
                              <strong className="text-slate-700">Vehículo:</strong> {service.auto} 
                              {service.placa && ` (${service.placa})`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Armed Guard Info */}
                      {service.incluye_armado && (
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100/60 border border-slate-200/60 rounded-lg p-3 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-4 w-4 text-slate-600" />
                            <span className="text-subtitle text-slate-800">Servicio con Armado</span>
                          </div>
                          <div className="text-body text-slate-700">
                            {service.armado_asignado 
                              ? `✓ Armado asignado - ${service.estado_asignacion || 'Confirmando'}`
                              : '⚠️ Armado pendiente por asignar'
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Badges and Actions */}
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditService(service)}
                          className="h-8 px-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShowHistory(service)}
                          className="h-8 px-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <History className="h-3 w-3" />
                        </Button>
                        
                        <CancelServiceButton
                          serviceId={service.id}
                          serviceName={service.cliente_nombre}
                          serviceStarted={service.estado === 'en_sitio' || service.estado === 'en_curso'}
                          onCancel={async (id, reason) => {
                            await updateServiceConfiguration({
                              id,
                              data: { estado_planeacion: 'cancelado' }
                            });
                            await refetch();
                          }}
                          disabled={service.estado === 'cancelado'}
                        />
                        
                        {service.custodio_nombre && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReassignCustodian(service)}
                            className="h-8 px-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {service.armado_asignado && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReassignArmedGuard(service)}
                            className="h-8 px-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          >
                            <Shield className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      {getStatusBadge(service)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Critical Unassigned Services Section */}
      {pendingSummary?.total_pending && pendingSummary.total_pending > 0 && (
        <div className="card-refined border-orange-200/50 bg-gradient-to-br from-orange-50/40 to-orange-100/20">
          <div className="flex flex-row items-center justify-between pb-4 border-b border-orange-200/40">
            <h3 className="text-title text-lg flex items-center gap-3">
              <div className="status-dot status-dot-warning w-3 h-3"></div>
              <span className="text-slate-800">Servicios sin Custodio</span>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-2 py-1">
                {pendingSummary.total_pending}
              </Badge>
            </h3>
            <Button onClick={refetchPending} variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50">
              Actualizar
            </Button>
          </div>
          <div className="space-y-4 pt-4">
            {pendingSummary.pending_services.map((pendingService) => (
              <div
                key={pendingService.id}
                className="pending-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Service Header */}
                    <div className="flex items-center gap-3">
                      <div className="status-dot status-dot-warning w-3 h-3"></div>
                      <div>
                        <h3 className="text-subtitle text-slate-900">{pendingService.nombre_cliente}</h3>
                        <div className="flex items-center gap-2 text-caption">
                          <span className="font-mono">ID: {pendingService.id_servicio}</span>
                        </div>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm bg-white/60 p-3 rounded-lg border border-slate-200/60">
                      <MapPin className="h-4 w-4 text-slate-600" />
                      <span className="text-subtitle">{pendingService.origen}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-subtitle">{pendingService.destino}</span>
                    </div>

                    {/* Service Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-body"><strong className="text-slate-700">Fecha:</strong> {format(new Date(pendingService.fecha_hora_cita), 'PPP', { locale: es })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-500" />
                        <span className="text-body"><strong className="text-slate-700">Tipo:</strong> {pendingService.tipo_servicio}</span>
                      </div>
                    </div>

                    {pendingService.observaciones && (
                      <div className="bg-white/60 border border-slate-200/60 rounded-lg p-3 text-sm">
                        <strong className="text-slate-800">Observaciones:</strong> 
                        <span className="text-body ml-1">{pendingService.observaciones}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedPendingService(pendingService);
                        setAssignmentModalOpen(true);
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Asignar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditService(pendingService)}
                      className="border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    
                    <Badge className="text-xs justify-center bg-slate-100 text-slate-600 border-slate-200">
                      Sin Custodio
                    </Badge>
                    
                    {pendingService.requiere_armado && (
                      <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                        + Armado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Armed Guard Services Section */}
      {pendingArmadoSummary?.total_pending_armado && pendingArmadoSummary.total_pending_armado > 0 && (
        <div className="card-refined border-blue-200/50 bg-gradient-to-br from-blue-50/40 to-blue-100/20">
          <div className="flex flex-row items-center justify-between pb-4 border-b border-blue-200/40">
            <h3 className="text-title text-lg flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-slate-800">Pendientes de Armado</span>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-sm px-2 py-1">
                {pendingArmadoSummary.total_pending_armado}
              </Badge>
            </h3>
            <Button onClick={refetchPendingArmado} variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              Actualizar
            </Button>
          </div>
          <div className="space-y-4 pt-4">
            {pendingArmadoSummary.pending_armado_services.map((pendingArmadoService) => (
              <div
                key={pendingArmadoService.id}
                className="border border-blue-200/60 rounded-lg p-4 bg-white/80 hover:bg-blue-50/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Service Header */}
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <div>
                        <h3 className="text-subtitle text-slate-900">{pendingArmadoService.nombre_cliente}</h3>
                        <div className="flex items-center gap-2 text-caption">
                          <span className="font-mono">ID: {pendingArmadoService.id_servicio}</span>
                        </div>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm bg-white/60 p-3 rounded-lg border border-blue-200/60">
                      <MapPin className="h-4 w-4 text-slate-600" />
                      <span className="text-subtitle">{pendingArmadoService.origen}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-subtitle">{pendingArmadoService.destino}</span>
                    </div>

                    {/* Service Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-body"><strong className="text-slate-700">Fecha:</strong> {format(new Date(pendingArmadoService.fecha_hora_cita), 'PPP', { locale: es })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="text-body"><strong className="text-slate-700">Custodio:</strong> {pendingArmadoService.custodio_asignado}</span>
                      </div>
                    </div>

                    {pendingArmadoService.observaciones && (
                      <div className="bg-white/60 border border-blue-200/60 rounded-lg p-3 text-sm">
                        <strong className="text-slate-800">Observaciones:</strong> 
                        <span className="text-body ml-1">{pendingArmadoService.observaciones}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedArmadoService(pendingArmadoService);
                        setArmedAssignmentModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Asignar Armado
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditService(pendingArmadoService)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    
                    <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                      Armado: Pendiente
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Asignación */}
      <PendingAssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        service={selectedPendingService}
        onAssignmentComplete={() => {
          refetchPending();
          refetchPendingArmado();
          refetch();
          // Update selected date to show the assigned service
          if (selectedPendingService?.fecha_hora_cita) {
            setSelectedDate(new Date(selectedPendingService.fecha_hora_cita));
          }
        }}
      />

      {/* Modal de Edición */}
      <EditServiceModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        service={selectedEditService}
        onSave={handleSaveServiceEdit}
        isLoading={isUpdatingConfiguration}
      />

      {/* Modal de Reasignación */}
      <ReassignmentModal
        open={reassignmentModalOpen}
        onOpenChange={setReassignmentModalOpen}
        service={reassignmentService}
        assignmentType={reassignmentType}
        onReassign={async (data) => {
          if (reassignmentType === 'custodian') {
            await reassignCustodian({
              serviceId: data.serviceId,
              newCustodioName: data.newName,
              newCustodioId: data.newId,
              reason: data.reason
            });
          } else {
            await reassignArmedGuard({
              serviceId: data.serviceId,
              newArmadoName: data.newName,
              newArmadoId: data.newId,
              reason: data.reason
            });
          }
          await handleReassignmentComplete();
        }}
        onRemove={async (data) => {
          await removeAssignment({
            serviceId: data.serviceId,
            assignmentType: data.assignmentType,
            reason: data.reason
          });
          await handleReassignmentComplete();
        }}
        isLoading={isReassigning}
      />

      {/* Modal de Historial */}
      <ServiceHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        serviceId={historyServiceId}
        serviceName={historyServiceName}
      />

      {/* Modal de Asignación de Armado/Abordo */}
      <Dialog open={armedAssignmentModalOpen} onOpenChange={setArmedAssignmentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asignar Armado / Abordo</DialogTitle>
            <DialogDescription>
              Registra el personal armado que acompañará el servicio. 
              Un "abordo" es un acompañante de seguridad solicitado por el cliente.
            </DialogDescription>
          </DialogHeader>
          {selectedArmadoService && (
            <SimplifiedArmedAssignment
              serviceData={{
                servicio_id: selectedArmadoService.id_servicio,
                origen: selectedArmadoService.origen || selectedArmadoService.origen_texto,
                destino: selectedArmadoService.destino || selectedArmadoService.destino_texto,
                fecha_hora_cita: selectedArmadoService.fecha_hora_cita,
                custodio_asignado: selectedArmadoService.custodio_nombre || selectedArmadoService.custodio_asignado,
                custodio_id: selectedArmadoService.custodio_id
              }}
              onComplete={handleArmedAssignmentComplete}
              onSkip={() => setArmedAssignmentModalOpen(false)}
              onBack={() => setArmedAssignmentModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
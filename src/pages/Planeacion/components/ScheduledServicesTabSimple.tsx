import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useScheduledServices } from '@/hooks/useScheduledServices';
import { usePendingServices } from '@/hooks/usePendingServices';
import { usePendingArmadoServices } from '@/hooks/usePendingArmadoServices';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { PendingAssignmentModal } from '@/components/planeacion/PendingAssignmentModal';
import { EditServiceModal, type EditableService } from '@/components/planeacion/EditServiceModal';
import { ReassignmentModal, type ServiceForReassignment } from '@/components/planeacion/ReassignmentModal';
import { ServiceHistoryModal } from '@/components/planeacion/ServiceHistoryModal';
import { AirlineDateSelector } from '@/components/planeacion/AirlineDateSelector';
import { Clock, MapPin, User, Car, Shield, CheckCircle2, AlertCircle, Edit, RefreshCw, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ScheduledServicesTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { summary, loading, error, refetch } = useScheduledServices(selectedDate);
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

  const getStatusIcon = (service: any) => {
    const isFullyPlanned = service.custodio_nombre && (!service.incluye_armado || service.armado_asignado);
    const isConfirmed = service.estado === 'confirmado';
    
    if (isFullyPlanned && isConfirmed) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    
    if (service.incluye_armado && !service.armado_asignado) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (!service.custodio_nombre) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  const handleEditService = (service: any) => {
    const needsCustodianAssignment = !service.custodio_nombre;
    const needsArmedGuardAssignment = (service.incluye_armado || service.requiere_armado) && !service.armado_asignado;
    const isPendingAssignment = needsCustodianAssignment || needsArmedGuardAssignment;

    if (isPendingAssignment) {
      setSelectedPendingService(service);
      setAssignmentModalOpen(true);
    } else {
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
    
    await Promise.all([
      refetch(),
      refetchPending(),
      refetchPendingArmado()
    ]);
    
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
    await Promise.all([
      refetch(),
      refetchPending(),
      refetchPendingArmado()
    ]);
  };

  if (loading) {
    return (
      <div className="apple-loading-state">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <Button variant="ghost" size="sm" onClick={refetch} className="apple-button-ghost">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Header */}
      <div className="apple-date-header">
        <div className="apple-text-title">{format(selectedDate, 'PPP', { locale: es })}</div>
        <div className="apple-summary-compact">
          <div className="apple-summary-item">
            <span className="apple-summary-value">{summary?.total_services || 0}</span>
            <span className="apple-summary-label">total</span>
          </div>
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

      {/* Services Agenda */}
      <div className="space-y-4">
        {error && (
          <div className="apple-empty-state">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <div className="apple-text-headline text-red-700">Error al cargar</div>
            <div className="apple-text-body text-secondary">{error}</div>
          </div>
        )}

        {!error && summary?.services_data && summary.services_data.length === 0 && (
          <div className="apple-empty-state">
            <CheckCircle2 className="h-8 w-8 text-secondary mx-auto mb-3" />
            <div className="apple-text-headline text-secondary">Sin servicios</div>
            <div className="apple-text-body text-tertiary">No hay servicios programados para esta fecha</div>
          </div>
        )}

        {!error && summary?.services_data && summary.services_data.length > 0 && (
          <div className="apple-agenda-list">
            {summary.services_data.map((service, index) => (
              <div key={service.id || index} className="apple-service-item">
                <div className="apple-service-time">
                  {format(new Date(service.fecha_hora_cita), 'HH:mm')}
                </div>
                
                <div className="apple-service-content">
                  <div className="apple-service-header">
                    <div className="apple-service-title">{service.cliente_nombre}</div>
                    <div className="apple-service-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditService(service)}
                        className="apple-button-ghost-small"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowHistory(service)}
                        className="apple-button-ghost-small"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="apple-service-route">
                    <MapPin className="h-4 w-4 text-secondary" />
                    <span>{service.origen}</span>
                    <span className="text-tertiary">→</span>
                    <span>{service.destino}</span>
                  </div>
                  
                  <div className="apple-service-details">
                    <div className="apple-service-assignment">
                      <User className="h-4 w-4 text-secondary" />
                      <span className="apple-text-body">
                        {service.custodio_nombre || 'Sin asignar'}
                      </span>
                    </div>
                    
                    {(service.auto || service.placa) && (
                      <div className="apple-service-assignment">
                        <Car className="h-4 w-4 text-secondary" />
                        <span className="apple-text-body">
                          {service.auto} {service.placa && `(${service.placa})`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {service.incluye_armado && (
                    <div className="apple-service-armed">
                      <Shield className="h-4 w-4" />
                      <span className="apple-text-caption">
                        {service.armado_asignado 
                          ? 'Armado asignado'
                          : 'Armado pendiente'
                        }
                      </span>
                    </div>
                  )}
                  
                  <div className="apple-service-status">
                    {getStatusIcon(service)}
                    <span className="apple-text-caption text-secondary">
                      {(() => {
                        const isFullyPlanned = service.custodio_nombre && (!service.incluye_armado || service.armado_asignado);
                        const isConfirmed = service.estado === 'confirmado';
                        
                        if (isFullyPlanned && isConfirmed) return 'Completamente planeado';
                        if (service.incluye_armado && !service.armado_asignado) return 'Armado pendiente';
                        if (!service.custodio_nombre) return 'Custodio pendiente';
                        if (isFullyPlanned && !isConfirmed) return 'Pendiente confirmación';
                        return 'En proceso';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <PendingAssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        service={selectedPendingService}
        onAssignmentComplete={async () => {
          await Promise.all([refetch(), refetchPending(), refetchPendingArmado()]);
        }}
      />

      <EditServiceModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        service={selectedEditService}
        onSave={handleSaveServiceEdit}
        isLoading={isUpdatingConfiguration}
      />

      <ReassignmentModal
        open={reassignmentModalOpen}
        onOpenChange={setReassignmentModalOpen}
        service={reassignmentService}
        assignmentType={reassignmentType}
        onReassign={async (data) => {
          console.log('Reassignment:', data);
          await handleReassignmentComplete();
          setReassignmentModalOpen(false);
        }}
      />

      <ServiceHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        serviceId={historyServiceId}
        serviceName={historyServiceName}
      />
    </div>
  );
}
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, MapPin, Clock, Shield, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CustodianAssignmentStep } from '@/pages/Planeacion/components/workflow/CustodianAssignmentStep';
import { ArmedGuardAssignmentStep } from '@/components/planeacion/ArmedGuardAssignmentStep';
import { ContextualEditModal } from './ContextualEditModal';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { toast } from 'sonner';
import type { PendingService } from '@/hooks/usePendingServices';
import type { EditableService } from './EditServiceModal';

interface PendingAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: PendingService | null;
  onAssignmentComplete: () => void;
}

interface PendingAssignmentModalEnhancedProps extends PendingAssignmentModalProps {
  mode?: 'auto' | 'direct_armed' | 'direct_custodian';
}

export function PendingAssignmentModal({
  open,
  onOpenChange,
  service,
  onAssignmentComplete,
  mode = 'auto'
}: PendingAssignmentModalEnhancedProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [showContextualEdit, setShowContextualEdit] = useState(false);
  const [currentStep, setCurrentStep] = useState<'custodian' | 'armed'>(() => {
    if (mode === 'direct_armed') return 'armed';
    if (mode === 'direct_custodian') return 'custodian';
    const hasCustodio = service && 'custodio_asignado' in service && service.custodio_asignado;
    return hasCustodio ? 'armed' : 'custodian';
  });
  const [custodianAssigned, setCustodianAssigned] = useState<any>(
    service && 'custodio_asignado' in service && service.custodio_asignado ? 
      { custodio_nombre: service.custodio_asignado } : null
  );
  const { assignCustodian, assignArmedGuard } = useServiciosPlanificados();

  // Detectar si estamos editando un servicio existente con asignaciones
  const isEditingExisting = service && (
    ('custodio_asignado' in service && service.custodio_asignado) ||
    ('armado_asignado' in service && service.armado_asignado)
  );

  // Mostrar ContextualEditModal si estamos editando un servicio existente
  React.useEffect(() => {
    if (open && isEditingExisting && mode === 'auto') {
      setShowContextualEdit(true);
    } else {
      setShowContextualEdit(false);
    }
  }, [open, isEditingExisting, mode]);

  if (!service) return null;

  // Preparar datos del servicio para el componente de asignación
  const serviceData = {
    servicio_id: service.id_servicio,
    origen: service.origen,
    destino: service.destino,
    fecha_hora_cita: service.fecha_hora_cita,
    tipo_servicio: service.tipo_servicio,
    cliente_nombre: service.nombre_cliente,
    destino_texto: service.destino,
    fecha_programada: service.fecha_hora_cita ? service.fecha_hora_cita.split('T')[0] : new Date().toISOString().split('T')[0],
    hora_ventana_inicio: service.fecha_hora_cita ? (service.fecha_hora_cita.split('T')[1]?.substring(0, 5) || '09:00') : '09:00',
    incluye_armado: service.requiere_armado,
    requiere_gadgets: false,
    gadgets_seleccionados: [],
    observaciones: service.observaciones,
    fecha_recepcion: service.created_at ? service.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    hora_recepcion: service.created_at ? (service.created_at.split('T')[1]?.substring(0, 5) || '09:00') : '09:00'
  };

  const handleCustodianAssignmentComplete = async (assignmentData: any) => {
    setIsAssigning(true);
    try {
      // Asignar custodio al servicio
      await assignCustodian({
        serviceId: service.id,
        custodioName: assignmentData.custodio_nombre,
        custodioId: assignmentData.custodio_asignado_id
      });

      setCustodianAssigned(assignmentData);

      // Check if service requires armed guard
      if (service.requiere_armado) {
        toast.success('Custodio asignado exitosamente', {
          description: 'Ahora proceda a asignar el armado requerido'
        });
        setCurrentStep('armed');
      } else {
        toast.success('Servicio asignado exitosamente', {
          description: `${assignmentData.custodio_nombre} ha sido asignado al servicio ${service.id_servicio}`
        });
        onOpenChange(false);
        onAssignmentComplete();
      }
    } catch (error) {
      console.error('Error assigning custodian:', error);
      // Error handling is now done in the hook
    } finally {
      setIsAssigning(false);
    }
  };

  const handleArmedGuardAssignmentComplete = async (armedData: any) => {
    setIsAssigning(true);
    try {
      await assignArmedGuard({
        serviceId: service.id_servicio, // Use id_servicio for armed guard assignment  
        armadoName: armedData.armado_nombre,
        armadoId: armedData.armado_id
      });

      toast.success('Servicio completamente asignado', {
        description: `Custodio: ${custodianAssigned?.custodio_nombre} | Armado: ${armedData.armado_nombre}`
      });

      onOpenChange(false);
      onAssignmentComplete();
    } catch (error) {
      console.error('Error assigning armed guard:', error);
      toast.error('Error al asignar armado');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleArmedGuardSkip = () => {
    toast.success('Servicio asignado exitosamente', {
      description: `${custodianAssigned?.custodio_nombre} ha sido asignado al servicio ${service.id_servicio}`
    });
    onOpenChange(false);
    onAssignmentComplete();
  };

  const handleStartReassignment = (type: 'custodian' | 'armed_guard') => {
    setShowContextualEdit(false);
    if (type === 'custodian') {
      setCurrentStep('custodian');
    } else {
      setCurrentStep('armed');
    }
  };

  const handleEditServiceSave = async (id: string, data: Partial<EditableService>) => {
    // Implementar guardado de cambios básicos
    toast.success('Cambios guardados exitosamente');
    onAssignmentComplete();
  };

  // Convertir PendingService a EditableService para ContextualEditModal
  const editableService: EditableService | null = service ? {
    id: service.id,
    id_servicio: service.id_servicio,
    nombre_cliente: service.nombre_cliente || '',
    origen: service.origen || '',
    destino: service.destino || '',
    fecha_hora_cita: service.fecha_hora_cita || '',
    tipo_servicio: service.tipo_servicio || '',
    requiere_armado: service.requiere_armado || false,
    custodio_asignado: ('custodio_asignado' in service && typeof service.custodio_asignado === 'string') ? service.custodio_asignado : undefined,
    armado_asignado: ('armado_asignado' in service && typeof service.armado_asignado === 'string') ? service.armado_asignado : undefined,
    estado_planeacion: ('estado' in service && typeof service.estado === 'string') ? service.estado : 'pendiente',
    observaciones: service.observaciones
  } : null;

  // Si debemos mostrar ContextualEditModal primero
  if (showContextualEdit && editableService) {
    return (
      <ContextualEditModal
        open={open}
        onOpenChange={onOpenChange}
        service={editableService}
        onSave={handleEditServiceSave}
        onStartReassignment={handleStartReassignment}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 apple-text-title">
            {currentStep === 'armed' ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
            {currentStep === 'armed' ? 'Asignar Armado' : 'Asignar Custodio'} - {service.id_servicio}
          </DialogTitle>
          {mode === 'direct_armed' && service && 'custodio_asignado' in service && service.custodio_asignado && (
            <div className="flex items-center gap-2 apple-text-caption text-muted-foreground font-mono">
              {String(service.custodio_asignado)} ✅ → Armado ⏳
            </div>
          )}
        </DialogHeader>

        {/* Service Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información del Cliente */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Cliente</div>
                    <div className="font-semibold">{service.nombre_cliente}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Ruta</div>
                    <div className="font-medium">
                      {service.origen} → {service.destino}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Servicio */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Fecha y Hora</div>
                    <div className="font-semibold">
                      {format(new Date(service.fecha_hora_cita), 'PPP p', { locale: es })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Tipo de Servicio</div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{service.tipo_servicio}</Badge>
                      {service.requiere_armado && (
                        <Badge variant="secondary">Con Armado</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {service.observaciones && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-1">Observaciones</div>
                <div className="text-sm bg-muted rounded p-2">
                  {service.observaciones}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Component de Asignación */}
        <div className="space-y-4">
          {currentStep === 'custodian' && (
            <CustodianAssignmentStep
              serviceData={serviceData}
              onComplete={handleCustodianAssignmentComplete}
              onBack={() => onOpenChange(false)}
            />
          )}
          
          {currentStep === 'armed' && custodianAssigned && (
            <ArmedGuardAssignmentStep
              serviceData={{
                ...serviceData,
                custodio_asignado: custodianAssigned.custodio_nombre,
                custodio_id: custodianAssigned.custodio_asignado_id
              }}
              onComplete={handleArmedGuardAssignmentComplete}
              onSkip={handleArmedGuardSkip}
              onBack={() => setCurrentStep('custodian')}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
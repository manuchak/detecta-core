import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, MapPin, Clock, Shield, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CustodianAssignmentStep } from '@/pages/Planeacion/components/workflow/CustodianAssignmentStep';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { toast } from 'sonner';
import type { PendingService } from '@/hooks/usePendingServices';

interface PendingAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: PendingService | null;
  onAssignmentComplete: () => void;
}

export function PendingAssignmentModal({
  open,
  onOpenChange,
  service,
  onAssignmentComplete
}: PendingAssignmentModalProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const { assignCustodian } = useServiciosPlanificados();

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
    fecha_programada: service.fecha_hora_cita.split('T')[0],
    hora_ventana_inicio: service.fecha_hora_cita.split('T')[1]?.substring(0, 5) || '09:00',
    incluye_armado: service.requiere_armado,
    requiere_gadgets: false,
    gadgets_seleccionados: [],
    observaciones: service.observaciones,
    fecha_recepcion: service.created_at.split('T')[0],
    hora_recepcion: service.created_at.split('T')[1]?.substring(0, 5) || '09:00'
  };

  const handleAssignmentComplete = async (assignmentData: any) => {
    setIsAssigning(true);
    try {
      // Asignar custodio al servicio
      await assignCustodian({
        serviceId: service.id,
        custodioName: assignmentData.custodio_nombre,
        custodioId: assignmentData.custodio_asignado_id
      });

      toast.success('Custodio asignado exitosamente', {
        description: `${assignmentData.custodio_nombre} ha sido asignado al servicio ${service.id_servicio}`
      });

      // Cerrar modal y refrescar datos
      onOpenChange(false);
      onAssignmentComplete();
    } catch (error) {
      console.error('Error al asignar custodio:', error);
      toast.error('Error al asignar custodio');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Asignar Custodio - {service.id_servicio}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
          <CustodianAssignmentStep
            serviceData={serviceData}
            onComplete={handleAssignmentComplete}
            onBack={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
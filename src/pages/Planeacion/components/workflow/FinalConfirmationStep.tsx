import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Edit3, AlertTriangle, ArrowLeft, Shield, User, Calendar, MapPin, DollarSign, Settings, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ServiceData {
  servicio_id: string;
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  tipo_servicio: string;
  incluye_armado: boolean;
  precio_sugerido?: number;
  precio_custodio?: number;
  observaciones?: string;
  gadgets_seleccionados: string[];
}

interface AssignmentData extends ServiceData {
  custodio_asignado_id?: string;
  custodio_nombre?: string;
  estado_comunicacion?: 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder';
}

interface ArmedAssignmentData extends AssignmentData {
  armado_asignado_id?: string;
  armado_nombre?: string;
  punto_encuentro?: string;
  hora_encuentro?: string;
}

interface FinalConfirmationStepProps {
  serviceData: ServiceData;
  assignmentData?: AssignmentData;
  armedAssignmentData?: ArmedAssignmentData;
  modifiedSteps: string[];
  onConfirm: () => void;
  onEditStep: (step: string) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function FinalConfirmationStep({ 
  serviceData, 
  assignmentData, 
  armedAssignmentData, 
  modifiedSteps,
  onConfirm, 
  onEditStep, 
  onBack,
  isSubmitting = false 
}: FinalConfirmationStepProps) {
  const [confirmChecked, setConfirmChecked] = useState(false);

  const finalData = armedAssignmentData || assignmentData || serviceData;
  const hasModifications = modifiedSteps.length > 0;
  
  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return `${date} a las ${time}`;
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'service': return Settings;
      case 'assignment': return User;
      case 'armed_assignment': return Shield;
      default: return Edit3;
    }
  };

  const getStepLabel = (step: string) => {
    switch (step) {
      case 'service': return 'Configuración del Servicio';
      case 'assignment': return 'Asignación de Custodio';
      case 'armed_assignment': return 'Asignación de Armado';
      default: return step;
    }
  };

  const handleConfirm = () => {
    if (!confirmChecked) {
      toast.error('Debe confirmar que la información es correcta');
      return;
    }
    
    console.log('✅ Confirmación final completada:', {
      serviceId: finalData.servicio_id,
      hasModifications,
      modifiedSteps,
      timestamp: new Date().toISOString()
    });
    
    onConfirm();
  };

  return (
    <div className="space-y-6">
      {/* Header with Modification Indicator */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Revisión y Confirmación Final
            </div>
            {hasModifications && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {modifiedSteps.length} modificación{modifiedSteps.length > 1 ? 'es' : ''} detectada{modifiedSteps.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Modified Steps Alert */}
      {hasModifications && (
        <Card className="border-yellow-300 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-yellow-800">Cambios detectados</div>
                  <div className="text-sm text-yellow-700">
                    Se han detectado modificaciones en los siguientes pasos. Revise la información antes de confirmar.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {modifiedSteps.map((step) => {
                    const Icon = getStepIcon(step);
                    return (
                      <Button
                        key={step}
                        variant="outline"
                        size="sm"
                        onClick={() => onEditStep(step)}
                        className="border-yellow-300 hover:bg-yellow-100"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        Editar {getStepLabel(step)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Resumen del Servicio
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep('service')}
              className="ml-auto"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">ID del Servicio</div>
              <div className="font-mono font-semibold">{finalData.servicio_id}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Tipo de Servicio</div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{finalData.tipo_servicio.replace(/_/g, ' ')}</span>
                {finalData.incluye_armado && (
                  <Badge variant="destructive">
                    <Shield className="h-3 w-3 mr-1" />
                    Con Armado
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Cliente</div>
              <div className="font-medium">{finalData.cliente_nombre}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Fecha y Hora</div>
              <div className="font-medium">
                {formatDateTime(finalData.fecha_programada, finalData.hora_ventana_inicio)}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Ruta</div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{finalData.origen_texto}</span>
              <span className="text-muted-foreground">→</span>
              <span>{finalData.destino_texto}</span>
            </div>
          </div>
          
          {finalData.precio_sugerido && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Precio</div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">
                  ${finalData.precio_sugerido.toLocaleString()}
                </span>
                {finalData.precio_custodio && finalData.precio_custodio !== finalData.precio_sugerido && (
                  <span className="text-sm text-muted-foreground">
                    (Custodio: ${finalData.precio_custodio.toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          )}
          
          {finalData.gadgets_seleccionados.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Gadgets Incluidos</div>
              <div className="flex flex-wrap gap-1">
                {finalData.gadgets_seleccionados.map((gadget) => (
                  <Badge key={gadget} variant="outline" className="text-xs">
                    {gadget.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {finalData.observaciones && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Observaciones</div>
              <div className="text-sm bg-muted/50 rounded-md p-3">
                {finalData.observaciones}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custodian Assignment Summary */}
      {assignmentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Asignación de Custodio
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep('assignment')}
                className="ml-auto"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{assignmentData.custodio_nombre}</div>
                  <div className="text-sm text-muted-foreground">Custodio asignado</div>
                </div>
                <Badge variant={assignmentData.estado_comunicacion === 'aceptado' ? 'success' : 'secondary'}>
                  {assignmentData.estado_comunicacion === 'aceptado' ? 'Aceptado' : 'Pendiente'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Armed Guard Assignment Summary */}
      {armedAssignmentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Asignación de Armado
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep('armed_assignment')}
                className="ml-auto"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Armado Asignado</div>
                  <div className="font-medium">{armedAssignmentData.armado_nombre}</div>
                </div>
                {armedAssignmentData.punto_encuentro && (
                  <div>
                    <div className="text-sm text-muted-foreground">Punto de Encuentro</div>
                    <div className="font-medium">{armedAssignmentData.punto_encuentro}</div>
                  </div>
                )}
                {armedAssignmentData.hora_encuentro && (
                  <div>
                    <div className="text-sm text-muted-foreground">Hora de Encuentro</div>
                    <div className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {armedAssignmentData.hora_encuentro}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Confirmation Checkbox */}
      <Card className="border-primary">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="space-y-1">
                <div className="font-medium">
                  Confirmo que toda la información es correcta
                </div>
                <div className="text-sm text-muted-foreground">
                  He revisado todos los datos del servicio, las asignaciones y confirmo que la información es exacta.
                  {hasModifications && ' He tomado en cuenta las modificaciones realizadas.'}
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        
        <Button 
          onClick={handleConfirm}
          disabled={!confirmChecked || isSubmitting}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar y Crear Servicio
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
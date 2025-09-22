import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, MapPin, User, UserCheck, Shield } from 'lucide-react';
import { RouteSearchStep } from './workflow/RouteSearchStep';
import { ServiceAutoFillStep } from './workflow/ServiceAutoFillStep';
import { CustodianAssignmentStep } from './workflow/CustodianAssignmentStep';
import { EnhancedArmedGuardAssignmentStep } from './workflow/EnhancedArmedGuardAssignmentStep';
import { useCustodianVehicles } from '@/hooks/useCustodianVehicles';

interface RouteData {
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  precio_sugerido?: number;
  precio_custodio?: number;
  costo_operativo?: number;
  margen_estimado?: number;
  distancia_km?: number;
}

interface ServiceData extends RouteData {
  servicio_id: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  tipo_servicio: string;
  incluye_armado: boolean;
  requiere_gadgets: boolean;
  gadgets_seleccionados: string[];
  observaciones?: string;
  fecha_recepcion: string;
  hora_recepcion: string;
}

interface AssignmentData extends ServiceData {
  custodio_asignado_id?: string;
  custodio_nombre?: string;
  estado_comunicacion?: 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder';
}

interface ArmedAssignmentData extends AssignmentData {
  armado_asignado_id?: string;
  armado_nombre?: string;
  tipo_asignacion?: 'interno' | 'proveedor';
  proveedor_id?: string;
  punto_encuentro?: string;
  hora_encuentro?: string;
  estado_asignacion?: 'pendiente' | 'confirmado' | 'rechazado';
}

export function RequestCreationWorkflow() {
  const [currentStep, setCurrentStep] = useState<'route' | 'service' | 'assignment' | 'armed_assignment'>('route');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [armedAssignmentData, setArmedAssignmentData] = useState<ArmedAssignmentData | null>(null);
  
  // Get vehicle information for assigned custodian (with safety check)
  const { getPrincipalVehicle } = useCustodianVehicles(assignmentData?.custodio_asignado_id);
  const custodianVehicle = assignmentData?.custodio_asignado_id 
    ? getPrincipalVehicle(assignmentData.custodio_asignado_id) 
    : null;

  const steps = [
    { 
      id: 'route', 
      label: 'Búsqueda de Ruta', 
      icon: MapPin,
      description: 'Selecciona cliente y destino'
    },
    { 
      id: 'service', 
      label: 'Configurar Servicio', 
      icon: User,
      description: 'Auto-fill de características'
    },
    { 
      id: 'assignment', 
      label: 'Asignar Custodio', 
      icon: UserCheck,
      description: 'Comunicación y confirmación'
    },
    { 
      id: 'armed_assignment', 
      label: 'Asignar Armado', 
      icon: Shield,
      description: 'Coordinar con armado'
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (stepId === 'route') return routeData ? 'completed' : currentStep === 'route' ? 'current' : 'pending';
    if (stepId === 'service') return serviceData ? 'completed' : currentStep === 'service' ? 'current' : 'pending';
    if (stepId === 'assignment') return assignmentData ? 'completed' : currentStep === 'assignment' ? 'current' : 'pending';
    if (stepId === 'armed_assignment') return armedAssignmentData ? 'completed' : currentStep === 'armed_assignment' ? 'current' : 'pending';
    return 'pending';
  };

  const canProceedToService = routeData !== null;
  const canProceedToAssignment = serviceData !== null;
  const canProceedToArmedAssignment = assignmentData !== null && serviceData?.incluye_armado === true;
  const shouldShowArmedStep = serviceData?.incluye_armado === true;

  // Auto-advance cuando se completen los pasos
  useEffect(() => {
    if (currentStep === 'route' && canProceedToService) {
      setCurrentStep('service');
    }
  }, [canProceedToService, currentStep]);

  const handleRouteComplete = (data: RouteData) => {
    setRouteData(data);
    setCurrentStep('service');
  };

  const handleServiceComplete = (data: ServiceData) => {
    setServiceData(data);
    setCurrentStep('assignment');
  };

  const handleAssignmentComplete = (data: AssignmentData) => {
    setAssignmentData(data);
    // Si el servicio incluye armado, avanzar al siguiente paso
    if (serviceData?.incluye_armado) {
      setCurrentStep('armed_assignment');
    } else {
      // Si no incluye armado, completar el workflow
      console.log('🎉 Solicitud completada:', data);
    }
  };

  const handleArmedAssignmentComplete = (data: ArmedAssignmentData) => {
    setArmedAssignmentData(data);
    console.log('🎉 Solicitud con armado completada:', data);
  };

  const resetWorkflow = () => {
    setCurrentStep('route');
    setRouteData(null);
    setServiceData(null);
    setAssignmentData(null);
    setArmedAssignmentData(null);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso del Flujo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {steps.filter(step => 
              step.id !== 'armed_assignment' || shouldShowArmedStep
            ).map((step, index, filteredSteps) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  {/* Step Circle */}
                  <div className={`step-indicator ${
                    status === 'completed' ? 'step-indicator-completed' :
                    status === 'current' ? 'step-indicator-active' : 
                    'step-indicator-pending'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="ml-4 min-w-0">
                    <div className={`text-sm font-medium ${
                      status === 'current' ? 'text-foreground' : 
                      status === 'completed' ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < filteredSteps.length - 1 && (
                    <div className={`h-px flex-1 mx-4 ${
                      getStepStatus(filteredSteps[index + 1].id) !== 'pending' ? 
                        'bg-success' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="space-y-6">
        {currentStep === 'route' && (
          <RouteSearchStep onComplete={handleRouteComplete} />
        )}
        
        {currentStep === 'service' && routeData && (
          <ServiceAutoFillStep 
            routeData={routeData}
            onComplete={handleServiceComplete}
            onBack={() => setCurrentStep('route')}
          />
        )}
        
        {currentStep === 'assignment' && serviceData && (
          <CustodianAssignmentStep 
            serviceData={serviceData}
            onComplete={handleAssignmentComplete}
            onBack={() => setCurrentStep('service')}
          />
        )}
        
        {currentStep === 'armed_assignment' && serviceData && assignmentData && (
          <EnhancedArmedGuardAssignmentStep 
            serviceData={{...serviceData, ...assignmentData}}
            onComplete={handleArmedAssignmentComplete}
            onBack={() => setCurrentStep('assignment')}
          />
        )}
      </div>

      {/* Summary cuando se complete */}
      {(assignmentData && !serviceData?.incluye_armado) || armedAssignmentData && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Solicitud Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">ID de Servicio</div>
                <div className="font-medium text-primary">
                  {(armedAssignmentData || assignmentData)?.servicio_id || 'No especificado'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cliente - Destino</div>
                <div className="font-medium">
                  {(armedAssignmentData || assignmentData)?.cliente_nombre} → {(armedAssignmentData || assignmentData)?.destino_texto}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Custodio Asignado</div>
                <div className="font-medium">{(armedAssignmentData || assignmentData)?.custodio_nombre || 'Pendiente'}</div>
                {custodianVehicle && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Vehículo: {custodianVehicle.marca} {custodianVehicle.modelo} ({custodianVehicle.placa})
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {serviceData?.incluye_armado ? 'Armado Asignado' : 'Precio'}
                </div>
                <div className="font-medium">
                  {serviceData?.incluye_armado 
                    ? armedAssignmentData?.armado_nombre || 'Pendiente'
                    : `$${assignmentData?.precio_sugerido?.toLocaleString()}`
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fecha Programada</div>
                <div className="font-medium">
                  {(armedAssignmentData || assignmentData)?.fecha_programada || 'Por definir'}
                </div>
              </div>
            </div>
            
            {serviceData?.incluye_armado && armedAssignmentData && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Punto de Encuentro</div>
                    <div className="font-medium">{armedAssignmentData.punto_encuentro}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hora de Encuentro</div>
                    <div className="font-medium">{armedAssignmentData.hora_encuentro}</div>
                  </div>
                </div>
              </>
            )}
            
            <Separator />
            <div className="flex items-center justify-between">
              <Badge variant="success">
                {serviceData?.incluye_armado 
                  ? 'Servicio armado creado exitosamente' 
                  : 'Solicitud creada exitosamente'
                }
              </Badge>
              <button 
                onClick={resetWorkflow}
                className="text-sm text-primary hover:underline"
              >
                Crear nueva solicitud
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
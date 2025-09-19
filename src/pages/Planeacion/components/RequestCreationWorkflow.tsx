import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, MapPin, User, UserCheck } from 'lucide-react';
import { RouteSearchStep } from './workflow/RouteSearchStep';
import { ServiceAutoFillStep } from './workflow/ServiceAutoFillStep';
import { CustodianAssignmentStep } from './workflow/CustodianAssignmentStep';

interface RouteData {
  cliente_nombre: string;
  destino_texto: string;
  precio_sugerido?: number;
  precio_custodio?: number;
  costo_operativo?: number;
  margen_estimado?: number;
  distancia_km?: number;
}

interface ServiceData extends RouteData {
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

export function RequestCreationWorkflow() {
  const [currentStep, setCurrentStep] = useState<'route' | 'service' | 'assignment'>('route');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);

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
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (stepId === 'route') return routeData ? 'completed' : currentStep === 'route' ? 'current' : 'pending';
    if (stepId === 'service') return serviceData ? 'completed' : currentStep === 'service' ? 'current' : 'pending';
    if (stepId === 'assignment') return assignmentData ? 'completed' : currentStep === 'assignment' ? 'current' : 'pending';
    return 'pending';
  };

  const canProceedToService = routeData !== null;
  const canProceedToAssignment = serviceData !== null;

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
    // Aquí se podría crear el servicio en la base de datos
    console.log('🎉 Solicitud completada:', data);
  };

  const resetWorkflow = () => {
    setCurrentStep('route');
    setRouteData(null);
    setServiceData(null);
    setAssignmentData(null);
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
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                      ${status === 'completed' 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : status === 'current'
                        ? 'border-primary text-primary'
                        : 'border-muted-foreground text-muted-foreground'
                      }
                    `}>
                      {status === 'completed' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{step.label}</div>
                      <div className="text-xs text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-4 transition-colors
                      ${getStepStatus(steps[index + 1].id) !== 'pending' ? 'bg-primary' : 'bg-muted-foreground'}
                    `} />
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
      </div>

      {/* Summary cuando se complete */}
      {assignmentData && (
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
                <div className="text-sm text-muted-foreground">Cliente - Destino</div>
                <div className="font-medium">{assignmentData.cliente_nombre} → {assignmentData.destino_texto}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Custodio Asignado</div>
                <div className="font-medium">{assignmentData.custodio_nombre || 'Pendiente'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Precio</div>
                <div className="font-medium">${assignmentData.precio_sugerido?.toLocaleString()}</div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Badge variant="default">Solicitud creada exitosamente</Badge>
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
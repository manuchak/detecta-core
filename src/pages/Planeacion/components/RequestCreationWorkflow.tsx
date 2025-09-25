import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, MapPin, User, UserCheck, Shield } from 'lucide-react';
import { RouteSearchStep } from './workflow/RouteSearchStep';
import { ServiceAutoFillStep } from './workflow/ServiceAutoFillStep';
import { CustodianAssignmentStep } from './workflow/CustodianAssignmentStep';
import { EnhancedArmedGuardAssignmentStep } from './workflow/EnhancedArmedGuardAssignmentStep';
import { FinalConfirmationStep } from './workflow/FinalConfirmationStep';
import { useCustodianVehicles } from '@/hooks/useCustodianVehicles';
import { useServiciosPlanificados, type ServicioPlanificadoData } from '@/hooks/useServiciosPlanificados';
import { toast } from 'sonner';

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
  const [currentStep, setCurrentStep] = useState<'route' | 'service' | 'assignment' | 'armed_assignment' | 'final_confirmation'>('route');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [armedAssignmentData, setArmedAssignmentData] = useState<ArmedAssignmentData | null>(null);
  const [createdServiceDbId, setCreatedServiceDbId] = useState<string | null>(null);
  
  // Estado para rastrear cambios y invalidaciones
  const [modifiedSteps, setModifiedSteps] = useState<string[]>([]);
  const [hasInvalidatedState, setHasInvalidatedState] = useState(false);
  
  // Hook para manejar servicios planificados
  const { createServicioPlanificado, assignArmedGuard, isLoading } = useServiciosPlanificados();
  
  // Get vehicle information for assigned custodian (with safety check)
  const { vehicles, getPrincipalVehicle, loading: vehiclesLoading } = useCustodianVehicles(assignmentData?.custodio_asignado_id);
  const custodianVehicle = assignmentData?.custodio_asignado_id && vehicles.length > 0
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
    },
    { 
      id: 'final_confirmation', 
      label: 'Confirmación Final', 
      icon: CheckCircle,
      description: 'Revisar y confirmar'
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (stepId === 'route') return routeData ? 'completed' : currentStep === 'route' ? 'current' : 'pending';
    if (stepId === 'service') return serviceData ? 'completed' : currentStep === 'service' ? 'current' : 'pending';
    if (stepId === 'assignment') return assignmentData ? 'completed' : currentStep === 'assignment' ? 'current' : 'pending';
    if (stepId === 'armed_assignment') return armedAssignmentData ? 'completed' : currentStep === 'armed_assignment' ? 'current' : 'pending';
    if (stepId === 'final_confirmation') return currentStep === 'final_confirmation' ? 'current' : 'pending';
    return 'pending';
  };

  const canProceedToService = routeData !== null;
  const canProceedToAssignment = serviceData !== null;
  const canProceedToArmedAssignment = assignmentData !== null && serviceData?.incluye_armado === true;
  const shouldShowArmedStep = serviceData?.incluye_armado === true;
  const canProceedToFinalConfirmation = assignmentData !== null;
  
  // Función para determinar si realmente necesita armado
  const currentlyNeedsArmed = serviceData?.incluye_armado === true;
  const hasArmedAssignment = armedAssignmentData !== null;

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
    const previousIncludeArmado = serviceData?.incluye_armado;
    const newIncludeArmado = data.incluye_armado;
    
    // Detectar cambio en el estado de armado - INVALIDACIÓN INTELIGENTE
    if (previousIncludeArmado !== undefined && previousIncludeArmado !== newIncludeArmado) {
      console.log('🔄 Invalidación inteligente: cambio en incluye_armado', {
        anterior: previousIncludeArmado,
        nuevo: newIncludeArmado,
        timestamp: new Date().toISOString()
      });
      
      if (newIncludeArmado === false && armedAssignmentData) {
        // Si se cambió de con armado a sin armado, limpiar datos de armado
        setArmedAssignmentData(null);
        setHasInvalidatedState(true);
        toast.info('Configuración de armado removida - custodia reiniciada', {
          description: 'Los datos de asignación posteriores han sido limpiados'
        });
      }
      
      if (newIncludeArmado === true && !previousIncludeArmado) {
        // Si se agregó armado, invalidar asignaciones existentes para re-evaluar
        if (assignmentData) {
          setHasInvalidatedState(true);
          toast.info('Armado agregado - revise las asignaciones', {
            description: 'Las asignaciones existentes pueden necesitar actualización'
          });
        }
      }
      
      // Marcar el paso como modificado
      if (!modifiedSteps.includes('service')) {
        setModifiedSteps(prev => [...prev, 'service']);
      }
    }
    
    // Detectar otros cambios significativos
    if (serviceData) {
      const significantChanges = [
        serviceData.tipo_servicio !== data.tipo_servicio,
        serviceData.fecha_programada !== data.fecha_programada,
        serviceData.hora_ventana_inicio !== data.hora_ventana_inicio
      ].some(Boolean);
      
      if (significantChanges) {
        console.log('🔄 Cambios significativos detectados en servicio');
        setHasInvalidatedState(true);
        if (!modifiedSteps.includes('service')) {
          setModifiedSteps(prev => [...prev, 'service']);
        }
      }
    }
    
    setServiceData(data);
    setCurrentStep('assignment');
  };

  const handleAssignmentComplete = async (data: AssignmentData) => {
    // Marcar como modificado si hay cambios
    if (assignmentData && assignmentData.custodio_asignado_id !== data.custodio_asignado_id) {
      if (!modifiedSteps.includes('assignment')) {
        setModifiedSteps(prev => [...prev, 'assignment']);
      }
    }
    
    setAssignmentData(data);
    
    // Verificar dinámicamente si necesita armado
    if (currentlyNeedsArmed) {
      setCurrentStep('armed_assignment');
    } else {
      // Si no incluye armado, ir a confirmación final
      setCurrentStep('final_confirmation');
    }
  };

  const handleArmedAssignmentComplete = async (data: ArmedAssignmentData) => {
    // Marcar como modificado si hay cambios
    if (armedAssignmentData && armedAssignmentData.armado_asignado_id !== data.armado_asignado_id) {
      if (!modifiedSteps.includes('armed_assignment')) {
        setModifiedSteps(prev => [...prev, 'armed_assignment']);
      }
    }
    
    setArmedAssignmentData(data);
    
    // Ir a confirmación final en lugar de completar inmediatamente
    setCurrentStep('final_confirmation');
  };

  const handleSaveAsPending = async (data: ServiceData) => {
    try {
      // Crear el servicio planificado con estado pendiente_asignacion
      const servicioData: ServicioPlanificadoData = {
        id_servicio: data.servicio_id,
        nombre_cliente: data.cliente_nombre,
        origen: data.origen_texto,
        destino: data.destino_texto,
        fecha_hora_cita: `${data.fecha_programada}T${data.hora_ventana_inicio}:00.000Z`,
        tipo_servicio: data.tipo_servicio,
        custodio_asignado: null, // Sin asignar
        custodio_id: null, // Sin asignar
        requiere_armado: data.incluye_armado,
        estado_planeacion: 'pendiente_asignacion',
        tarifa_acordada: null, 
        observaciones: data.observaciones,
        auto: null,
        placa: null
      };
      
      // Guardar como pendiente
      createServicioPlanificado(servicioData);
      
      console.log('💾 Solicitud guardada como pendiente:', data);
      toast.success('Solicitud guardada como pendiente por asignar', {
        description: 'Puedes completar la asignación desde el dashboard de servicios programados'
      });
      
      // Resetear el workflow después de guardar
      setTimeout(() => {
        resetWorkflow();
      }, 1500);
    } catch (error) {
      console.error('Error al guardar servicio como pendiente:', error);
      toast.error('Error al guardar la solicitud como pendiente');
    }
  };

  const resetWorkflow = () => {
    setCurrentStep('route');
    setRouteData(null);
    setServiceData(null);
    setAssignmentData(null);
    setArmedAssignmentData(null);
    setCreatedServiceDbId(null);
    setModifiedSteps([]);
    setHasInvalidatedState(false);
  };

  // Función para navegar a un paso específico (para edición)
  const navigateToStep = (step: string) => {
    console.log('🔧 Navegando a paso para edición:', step);
    setCurrentStep(step as any);
  };

  // Función para manejar la confirmación final
  const handleFinalConfirmation = async () => {
    const finalData = armedAssignmentData || assignmentData;
    if (!finalData) return;

    try {
      // Preparar información del vehículo con manejo de casos undefined
      const vehicleInfo = custodianVehicle ? {
        auto: `${custodianVehicle.marca} ${custodianVehicle.modelo}`.trim(),
        placa: custodianVehicle.placa || 'Sin placa'
      } : {
        auto: 'Vehículo no asignado',
        placa: 'Sin placa'
      };

      // Crear el servicio planificado en la base de datos
      const servicioData: ServicioPlanificadoData = {
        id_servicio: finalData.servicio_id,
        nombre_cliente: finalData.cliente_nombre,
        origen: finalData.origen_texto,
        destino: finalData.destino_texto,
        fecha_hora_cita: `${finalData.fecha_programada}T${finalData.hora_ventana_inicio}:00.000Z`,
        tipo_servicio: finalData.tipo_servicio,
        custodio_asignado: finalData.custodio_nombre,
        custodio_id: finalData.custodio_asignado_id,
        requiere_armado: finalData.incluye_armado,
        tarifa_acordada: finalData.precio_custodio,
        observaciones: finalData.observaciones,
        ...vehicleInfo
      };
      
      // Crear el servicio usando la función de mutación
      createServicioPlanificado(servicioData);
      
      // Si tiene armado, asignar el armado también
      if (armedAssignmentData && assignmentData?.servicio_id) {
        assignArmedGuard({
          serviceId: assignmentData.servicio_id,
          armadoName: armedAssignmentData.armado_nombre || '',
          armadoId: armedAssignmentData.armado_asignado_id || ''
        });
        
        console.log('🎉 Servicio con armado completado y guardado:', armedAssignmentData);
        toast.success('Servicio con armado guardado exitosamente');
      } else {
        console.log('🎉 Servicio completado y guardado:', finalData);
        toast.success('Servicio guardado en servicios planificados');
      }
      
      // Resetear después de un delay para mostrar la confirmación
      setTimeout(() => {
        resetWorkflow();
      }, 2000);
      
    } catch (error) {
      console.error('Error al guardar el servicio:', error);
      toast.error('Error al guardar el servicio planificado');
    }
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
            ).filter(step =>
              step.id !== 'final_confirmation' || canProceedToFinalConfirmation
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
                      {modifiedSteps.includes(step.id) && (
                        <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-800">
                          Modificado
                        </Badge>
                      )}
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
            onSaveAsPending={handleSaveAsPending}
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
        
        {currentStep === 'armed_assignment' && serviceData && assignmentData && currentlyNeedsArmed && (
          <EnhancedArmedGuardAssignmentStep 
            serviceData={{...serviceData, ...assignmentData}}
            onComplete={handleArmedAssignmentComplete}
            onBack={() => setCurrentStep('assignment')}
            onSkip={() => {
              // Permitir saltar la asignación de armado si ya no se necesita
              console.log('🚫 Armado ya no requerido, ir a confirmación final');
              toast.info('Continuando sin armado');
              setCurrentStep('final_confirmation');
            }}
          />
        )}
        
        {currentStep === 'final_confirmation' && serviceData && assignmentData && (
          <FinalConfirmationStep
            serviceData={serviceData}
            assignmentData={assignmentData}
            armedAssignmentData={armedAssignmentData || undefined}
            modifiedSteps={modifiedSteps}
            onConfirm={handleFinalConfirmation}
            onEditStep={navigateToStep}
            onBack={() => {
              if (currentlyNeedsArmed && armedAssignmentData) {
                setCurrentStep('armed_assignment');
              } else {
                setCurrentStep('assignment');
              }
            }}
            isSubmitting={isLoading}
          />
        )}
      </div>

      {/* Summary cuando se complete */}
      {((assignmentData && !currentlyNeedsArmed) || (armedAssignmentData && currentlyNeedsArmed)) && (
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
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppleTimePicker } from '@/components/ui/apple-time-picker';
import { SmartLocationDropdown } from '@/components/ui/smart-location-dropdown';
import { useMeetingTimeCalculator } from '@/hooks/useMeetingTimeCalculator';
import { useArmedGuardsWithTracking } from '@/hooks/useArmedGuardsWithTracking';
import { useAssignmentAudit } from '@/hooks/useAssignmentAudit';
import { useCustodianVehicles } from '@/hooks/useCustodianVehicles';
import { AssignmentConfirmationModal } from './AssignmentConfirmationModal';
import { ExternalArmedVerificationModal } from '@/components/planeacion/ExternalArmedVerificationModal';
import { Shield, User, MapPin, Clock, Phone, MessageCircle, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ArmedGuard {
  id: string;
  nombre: string;
  telefono?: string;
  zona_base?: string;
  disponibilidad: string;
  estado: string;
  licencia_portacion?: string;
  fecha_vencimiento_licencia?: string;
  experiencia_anos: number;
  rating_promedio: number;
  numero_servicios: number;
  tasa_respuesta: number;
  tasa_confirmacion: number;
  equipamiento_disponible?: string[];
  observaciones?: string;
}

interface ArmedProvider {
  id: string;
  nombre_empresa: string;
  contacto_principal: string;
  telefono_contacto: string;
  zonas_cobertura: string[];
  tarifa_por_servicio?: number;
  disponibilidad_24h: boolean;
  tiempo_respuesta_promedio?: number;
  rating_proveedor: number;
  servicios_completados: number;
  activo: boolean;
}

interface ServiceDataWithCustodian {
  custodio_asignado_id?: string;
  custodio_nombre?: string;
  incluye_armado?: boolean;
  tipo_servicio?: string;
  fecha_programada?: string;
  hora_ventana_inicio?: string;
  destino_texto?: string;
  cliente_nombre?: string;
}

interface ArmedGuardAssignmentData extends ServiceDataWithCustodian {
  armado_asignado_id?: string;
  armado_nombre?: string;
  tipo_asignacion?: 'interno' | 'proveedor';
  proveedor_id?: string;
  punto_encuentro?: string;
  hora_encuentro?: string;
  estado_asignacion?: 'pendiente' | 'confirmado' | 'rechazado';
  // Datos específicos del personal externo verificado
  personal_externo_id?: string;
  personal_externo_telefono?: string;
  personal_externo_licencia?: string;
}

interface EnhancedArmedGuardAssignmentStepProps {
  serviceData: ServiceDataWithCustodian;
  onComplete: (data: ArmedGuardAssignmentData) => void;
  onBack: () => void;
  onSkip?: () => void; // Opcional para saltar la asignación de armado
}

export function EnhancedArmedGuardAssignmentStep({ serviceData, onComplete, onBack, onSkip }: EnhancedArmedGuardAssignmentStepProps) {
  const [selectedArmed, setSelectedArmed] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'interno' | 'proveedor'>('interno');
  const [puntoEncuentro, setPuntoEncuentro] = useState('');
  const [horaEncuentro, setHoraEncuentro] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showExternalVerificationModal, setShowExternalVerificationModal] = useState(false);
  const [selectedProviderForVerification, setSelectedProviderForVerification] = useState<ArmedProvider | null>(null);
  const [assignmentData, setAssignmentData] = useState<ArmedGuardAssignmentData | null>(null);

  // Use enhanced hooks with fallback mock data
  const { armedGuards: hookArmedGuards, providers: hookProviders, loading, error } = useArmedGuardsWithTracking(serviceData);
  const { logAssignmentAction } = useAssignmentAudit();
  const { getPrincipalVehicle } = useCustodianVehicles(serviceData.custodio_asignado_id);

  // Mock data fallback (same as original component)
  const mockArmedGuards: ArmedGuard[] = [
    {
      id: '1',
      nombre: 'Carlos Mendoza',
      telefono: '+52 55 1234 5678',
      zona_base: 'Ciudad de México',
      disponibilidad: 'disponible',
      estado: 'activo',
      licencia_portacion: 'LIC-001-2024',
      fecha_vencimiento_licencia: '2025-12-31',
      experiencia_anos: 8,
      rating_promedio: 4.8,
      numero_servicios: 145,
      tasa_respuesta: 95,
      tasa_confirmacion: 92,
      equipamiento_disponible: ['Pistola Glock 19', 'Radio comunicación', 'Chaleco antibalas'],
      observaciones: 'Especialista en custodia ejecutiva'
    },
    {
      id: '2',
      nombre: 'Miguel Rodriguez',
      telefono: '+52 55 9876 5432',
      zona_base: 'Ciudad de México',
      disponibilidad: 'ocupado',
      estado: 'activo',
      experiencia_anos: 5,
      rating_promedio: 4.5,
      numero_servicios: 89,
      tasa_respuesta: 88,
      tasa_confirmacion: 85,
      equipamiento_disponible: ['Pistola Beretta', 'Radio comunicación']
    }
  ];

  const mockProviders: ArmedProvider[] = [
    {
      id: 'p1',
      nombre_empresa: 'Seguridad Elite SA',
      contacto_principal: 'Ana García',
      telefono_contacto: '+52 55 4567 8901',
      zonas_cobertura: ['Ciudad de México', 'Estado de México'],
      tarifa_por_servicio: 2500,
      disponibilidad_24h: true,
      tiempo_respuesta_promedio: 25,
      rating_proveedor: 4.7,
      servicios_completados: 234,
      activo: true
    }
  ];

  // Use real data when available, with improved fallback logic
  const armedGuards = (hookArmedGuards && hookArmedGuards.length > 0) ? hookArmedGuards : mockArmedGuards;
  const providers = (hookProviders && hookProviders.length > 0) ? hookProviders : mockProviders;

  console.log('🔧 DEBUG: Final data', {
    hookArmedGuardsLength: hookArmedGuards?.length || 0,
    hookProvidersLength: hookProviders?.length || 0,
    finalArmedGuardsLength: armedGuards?.length || 0,
    finalProvidersLength: providers?.length || 0,
    loading,
    error,
    usingRealData: (hookArmedGuards && hookArmedGuards.length > 0) || (hookProviders && hookProviders.length > 0),
    selectedArmed,
    selectedType,
    serviceData
  });

  // Calculate recommended meeting time
  const { calculatedMeetingTime, formatDisplayTime, getTimeRecommendation } = useMeetingTimeCalculator({
    appointmentTime: serviceData.hora_ventana_inicio,
    appointmentDate: serviceData.fecha_programada,
    preparationMinutes: 90
  });

  // Set default meeting time when calculated
  useEffect(() => {
    if (calculatedMeetingTime && !horaEncuentro) {
      setHoraEncuentro(calculatedMeetingTime);
    }
  }, [calculatedMeetingTime, horaEncuentro]);

  const handleAssignArmed = async () => {
    console.log('🔧 DEBUG: Starting assignment process', {
      selectedArmed,
      selectedType,
      puntoEncuentro,
      horaEncuentro,
      serviceData
    });
    
    if (!selectedArmed || !puntoEncuentro || !horaEncuentro) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    const selectedGuard = selectedType === 'interno' 
      ? armedGuards.find(g => g.id === selectedArmed)
      : providers.find(p => p.id === selectedArmed);

    console.log('🔧 DEBUG: Selected guard', selectedGuard);

    if (!selectedGuard) return;

    // Si es proveedor externo, abrir modal de verificación
    if (selectedType === 'proveedor') {
      setSelectedProviderForVerification(selectedGuard as ArmedProvider);
      setShowExternalVerificationModal(true);
      return;
    }

    // Si es armado interno, proceder directamente
    await proceedWithAssignment(selectedGuard as ArmedGuard, 'interno');
  };

  const proceedWithAssignment = async (
    guard: ArmedGuard, 
    type: 'interno',
    externalPersonalData?: {
      personalId: string;
      nombreCompleto: string;
      telefono?: string;
      licenciaPortacion?: string;
    }
  ) => {
    try {
      // Create assignment data
      const newAssignmentData: ArmedGuardAssignmentData = {
        ...serviceData,
        armado_asignado_id: guard.id,
        armado_nombre: guard.nombre,
        tipo_asignacion: type,
        proveedor_id: undefined,
        punto_encuentro: puntoEncuentro,
        hora_encuentro: horaEncuentro,
        estado_asignacion: 'pendiente',
        personal_externo_id: externalPersonalData?.personalId,
        personal_externo_telefono: externalPersonalData?.telefono,
        personal_externo_licencia: externalPersonalData?.licenciaPortacion,
      };

      console.log('🔧 DEBUG: Assignment data created', newAssignmentData);

      // Log the assignment action
      try {
        await logAssignmentAction({
          service_id: serviceData.cliente_nombre,
          custodio_id: serviceData.custodio_asignado_id,
          armado_id: guard.id,
          proveedor_id: undefined,
          action_type: 'created',
          new_data: newAssignmentData,
          changes_summary: `Asignado armado interno: ${guard.nombre}`
        });
        console.log('🔧 DEBUG: Assignment logged successfully');
      } catch (logError) {
        console.warn('🔧 DEBUG: Failed to log assignment, but continuing:', logError);
      }

      setAssignmentData(newAssignmentData);
      setShowConfirmationModal(true);
      console.log('🔧 DEBUG: Internal assignment modal should be showing now');
      
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Error al crear la asignación');
    }
  };

  const handleExternalPersonalConfirm = async (personalData: {
    personalId: string;
    nombreCompleto: string;
    licenciaPortacion?: string;
    verificacionData: any;
  }) => {
    console.log('🔧 DEBUG: External personal confirmed', personalData);
    
    if (!selectedProviderForVerification) return;

    try {
      // Create assignment data with external personnel info
      const newAssignmentData: ArmedGuardAssignmentData = {
        ...serviceData,
        armado_asignado_id: selectedProviderForVerification.id,
        armado_nombre: personalData.nombreCompleto, // Use personnel name instead of company
        tipo_asignacion: 'proveedor',
        proveedor_id: selectedProviderForVerification.id,
        punto_encuentro: puntoEncuentro,
        hora_encuentro: horaEncuentro,
        estado_asignacion: 'pendiente',
        personal_externo_id: personalData.personalId,
        personal_externo_telefono: personalData.verificacionData?.telefono_personal,
        personal_externo_licencia: personalData.licenciaPortacion,
      };

      console.log('🔧 DEBUG: External assignment data created', newAssignmentData);

      // Log the assignment action
      try {
        await logAssignmentAction({
          service_id: serviceData.cliente_nombre,
          custodio_id: serviceData.custodio_asignado_id,
          armado_id: selectedProviderForVerification.id,
          proveedor_id: selectedProviderForVerification.id,
          action_type: 'created',
          new_data: newAssignmentData,
          changes_summary: `Asignado personal externo: ${personalData.nombreCompleto} (${selectedProviderForVerification.nombre_empresa})`
        });
        console.log('🔧 DEBUG: External assignment logged successfully');
      } catch (logError) {
        console.warn('🔧 DEBUG: Failed to log external assignment, but continuing:', logError);
      }

      setAssignmentData(newAssignmentData);
      setShowExternalVerificationModal(false);
      setShowConfirmationModal(true);
      setSelectedProviderForVerification(null);
      console.log('🔧 DEBUG: External assignment modal should be showing now');
      
    } catch (error) {
      console.error('Error creating external assignment:', error);
      toast.error('Error al crear la asignación externa');
    }
  };

  const handleConfirmAssignment = async () => {
    if (!assignmentData) return;

    try {
      // Simular guardado en base de datos
      console.log('💾 Guardando asignación en base de datos:', assignmentData);
      
      // Aquí se haría la inserción real en las tablas:
      // - servicios_custodia (actualizar estado)
      // - asignacion_armados (crear nueva asignación)
      // - assignment_audit_log (registro de auditoría)
      
      // Log final de auditoría
      await logAssignmentAction({
        service_id: assignmentData.cliente_nombre,
        custodio_id: assignmentData.custodio_asignado_id,
        armado_id: assignmentData.armado_asignado_id,
        proveedor_id: assignmentData.proveedor_id,
        action_type: 'confirmed',
        new_data: assignmentData,
        changes_summary: `Asignación confirmada y completada para servicio ${assignmentData.cliente_nombre}`
      });

      // Completar el workflow
      onComplete(assignmentData);
      
      // Cerrar modal y limpiar formulario
      setShowConfirmationModal(false);
      handleResetForm();
      
      toast.success('Asignación confirmada y registrada exitosamente');
      
    } catch (error) {
      console.error('Error confirming assignment:', error);
      toast.error('Error al confirmar la asignación');
      throw error; // Re-throw para que el modal maneje el error
    }
  };

  const handleResetForm = () => {
    setSelectedArmed(null);
    setSelectedType('interno');
    setPuntoEncuentro('');
    setHoraEncuentro('');
    setAssignmentData(null);
    setShowExternalVerificationModal(false);
    setSelectedProviderForVerification(null);
  };

  const handleCreateNew = () => {
    setShowConfirmationModal(false);
    handleResetForm();
    toast.info('Formulario reiniciado para nueva asignación');
  };

  // Get vehicle information for confirmation modal
  const principalVehicle = getPrincipalVehicle(serviceData.custodio_asignado_id || '');

  const confirmationData = assignmentData ? {
    servicio: {
      cliente_nombre: assignmentData.cliente_nombre || '',
      origen: serviceData.destino_texto?.split(' → ')[0] || '',
      destino: serviceData.destino_texto?.split(' → ')[1] || assignmentData.destino_texto || '',
      fecha_programada: assignmentData.fecha_programada || '',
      hora_ventana_inicio: assignmentData.hora_ventana_inicio || '',
      custodio_nombre: assignmentData.custodio_nombre || '',
      tipo_servicio: assignmentData.tipo_servicio || '',
    },
    armado: {
      nombre: assignmentData.armado_nombre || '',
      telefono: assignmentData.personal_externo_telefono || 
        (selectedType === 'interno' 
          ? armedGuards.find(g => g.id === selectedArmed)?.telefono
          : providers.find(p => p.id === selectedArmed)?.telefono_contacto),
      tipo_asignacion: assignmentData.tipo_asignacion || 'interno',
      licencia_portacion: assignmentData.personal_externo_licencia || 
        (selectedType === 'interno' 
          ? armedGuards.find(g => g.id === selectedArmed)?.licencia_portacion
          : undefined),
    },
    encuentro: {
      punto_encuentro: assignmentData.punto_encuentro || '',
      hora_encuentro: assignmentData.hora_encuentro || '',
    },
    vehiculo: principalVehicle ? {
      auto: `${principalVehicle.marca} ${principalVehicle.modelo}`,
      placa: principalVehicle.placa,
    } : undefined,
  } : null;

  console.log('🔧 DEBUG: Enhanced component rendered', {
    loading,
    error,
    armedGuardsLength: armedGuards.length,
    providersLength: providers.length,
    showConfirmationModal,
    assignmentData,
    selectedArmed,
    selectedType
  });

  if (loading && armedGuards.length === 0 && providers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cargando armados disponibles...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Error al cargar armados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Service Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Asignación de Armado - Versión Mejorada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-sm text-muted-foreground">Servicio</div>
                <div className="font-medium">{serviceData.cliente_nombre} → {serviceData.destino_texto}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Custodio Asignado</div>
                <div className="font-medium">{serviceData.custodio_nombre}</div>
                {principalVehicle && (
                  <div className="text-xs text-muted-foreground">
                    Vehículo: {principalVehicle.marca} {principalVehicle.modelo} ({principalVehicle.placa})
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fecha/Hora</div>
                <div className="font-medium">{serviceData.fecha_programada} {serviceData.hora_ventana_inicio}</div>
              </div>
            </div>

            {/* Type Selection */}
            <div className="mb-6">
              <div className="text-sm font-medium mb-3">Tipo de Asignación</div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoAsignacion"
                    value="interno"
                    checked={selectedType === 'interno'}
                    onChange={(e) => setSelectedType(e.target.value as 'interno' | 'proveedor')}
                    className="text-primary"
                  />
                  <span>Armado Interno</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoAsignacion"
                    value="proveedor"
                    checked={selectedType === 'proveedor'}
                    onChange={(e) => setSelectedType(e.target.value as 'interno' | 'proveedor')}
                    className="text-primary"
                  />
                  <span>Proveedor Externo</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Armed Guards List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedType === 'interno' ? 'Armados Internos Disponibles' : 'Proveedores Externos'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedType === 'interno' ? (
              <div className="space-y-4">
                {armedGuards.filter(guard => guard.disponibilidad === 'disponible').map((guard) => (
                  <div
                    key={guard.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      selectedArmed === guard.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                     onClick={() => {
                       console.log('🔧 DEBUG: Armado seleccionado:', guard.id, guard.nombre);
                       setSelectedArmed(guard.id);
                     }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="h-5 w-5" />
                          <div>
                            <h3 className="font-semibold">{guard.nombre}</h3>
                            <p className="text-sm text-muted-foreground">{guard.telefono}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Experiencia</div>
                            <div className="font-medium">{guard.experiencia_anos} años</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Rating</div>
                            <div className="font-medium">{guard.rating_promedio}/5.0</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Servicios</div>
                            <div className="font-medium">{guard.numero_servicios}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Tasa Confirmación</div>
                            <div className="font-medium">{guard.tasa_confirmacion}%</div>
                          </div>
                        </div>

                        {guard.licencia_portacion && (
                          <div className="mt-2">
                            <Badge variant="success" className="text-xs">
                              Licencia: {guard.licencia_portacion}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Badge variant={guard.disponibilidad === 'disponible' ? 'success' : 'secondary'}>
                          {guard.disponibilidad === 'disponible' ? 'Disponible' : 'Ocupado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {providers.filter(provider => provider.activo).map((provider) => (
                  <div
                    key={provider.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      selectedArmed === provider.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedArmed(provider.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="h-5 w-5" />
                          <div>
                            <h3 className="font-semibold">{provider.nombre_empresa}</h3>
                            <p className="text-sm text-muted-foreground">
                              {provider.contacto_principal} - {provider.telefono_contacto}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Tarifa</div>
                            <div className="font-medium">${provider.tarifa_por_servicio?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Rating</div>
                            <div className="font-medium">{provider.rating_proveedor}/5.0</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Servicios</div>
                            <div className="font-medium">{provider.servicios_completados}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Respuesta</div>
                            <div className="font-medium">{provider.tiempo_respuesta_promedio}min</div>
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground">
                            Cobertura: {provider.zonas_cobertura.join(', ')}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Badge variant={provider.disponibilidad_24h ? 'success' : 'secondary'}>
                          {provider.disponibilidad_24h ? '24/7' : 'Horario Limitado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting Details */}
        {selectedArmed && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Detalles del Encuentro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Time Recommendation */}
                {calculatedMeetingTime && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium text-sm text-primary">
                          Hora recomendada: {formatDisplayTime(calculatedMeetingTime)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {getTimeRecommendation(serviceData.hora_ventana_inicio || '', horaEncuentro)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SmartLocationDropdown
                    value={puntoEncuentro}
                    onChange={setPuntoEncuentro}
                    label="Punto de Encuentro"
                    placeholder="Buscar ubicación favorita o escribir nueva dirección"
                  />
                  
                  <AppleTimePicker
                    value={horaEncuentro}
                    onChange={setHoraEncuentro}
                    defaultTime={calculatedMeetingTime || undefined}
                    label="Hora de Encuentro"
                    maxTime={serviceData.hora_ventana_inicio}
                    appointmentDate={serviceData.fecha_programada}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button onClick={onBack} variant="outline">
            Volver
          </Button>
          
          <Button 
            onClick={handleAssignArmed}
            disabled={!selectedArmed || !puntoEncuentro || !horaEncuentro}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Asignar Armado
          </Button>
        </div>
      </div>

      {/* External Armed Verification Modal */}
      {selectedProviderForVerification && (
        <ExternalArmedVerificationModal
          open={showExternalVerificationModal}
          onOpenChange={setShowExternalVerificationModal}
          proveedorId={selectedProviderForVerification.id}
          proveedorNombre={selectedProviderForVerification.nombre_empresa}
          servicioId={serviceData.cliente_nombre || 'N/A'}
          onConfirm={handleExternalPersonalConfirm}
        />
      )}

      {/* Enhanced Confirmation Modal */}
      {showConfirmationModal && confirmationData && (
        <AssignmentConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={handleConfirmAssignment}
          onCreateNew={handleCreateNew}
          data={confirmationData}
        />
      )}
    </>
  );
}
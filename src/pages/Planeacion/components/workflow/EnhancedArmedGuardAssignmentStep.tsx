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
import { ExpandableArmedCard } from '@/components/planeacion/ExpandableArmedCard';
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
  servicio_id?: string;
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [puntoEncuentro, setPuntoEncuentro] = useState('');
  const [horaEncuentro, setHoraEncuentro] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showExternalVerificationModal, setShowExternalVerificationModal] = useState(false);
  const [selectedProviderForVerification, setSelectedProviderForVerification] = useState<ArmedProvider | null>(null);
  const [assignmentData, setAssignmentData] = useState<ArmedGuardAssignmentData | null>(null);

// Use enhanced hooks with fallback mock data
const { armedGuards: hookArmedGuards, providers: hookProviders, loading, error, assignArmedGuard } = useArmedGuardsWithTracking(serviceData);
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
    overridePuntoEncuentro?: string,
    overrideHoraEncuentro?: string,
    externalPersonalData?: {
      personalId: string;
      nombreCompleto: string;
      telefono?: string;
      licenciaPortacion?: string;
    }
  ) => {
    try {
      const finalPuntoEncuentro = overridePuntoEncuentro || puntoEncuentro;
      const finalHoraEncuentro = overrideHoraEncuentro || horaEncuentro;

      // Create assignment data
      const newAssignmentData: ArmedGuardAssignmentData = {
        ...serviceData,
        armado_asignado_id: guard.id,
        armado_nombre: guard.nombre,
        tipo_asignacion: type,
        proveedor_id: undefined,
        punto_encuentro: finalPuntoEncuentro,
        hora_encuentro: finalHoraEncuentro,
        estado_asignacion: 'pendiente',
        personal_externo_id: externalPersonalData?.personalId,
        personal_externo_telefono: externalPersonalData?.telefono,
        personal_externo_licencia: externalPersonalData?.licenciaPortacion,
      };

      console.log('🔧 DEBUG: Assignment data created', newAssignmentData);

      // Log the assignment action
      try {
        await logAssignmentAction({
          service_id: (serviceData as any).servicio_id || serviceData.cliente_nombre,
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
          service_id: (serviceData as any).servicio_id || serviceData.cliente_nombre,
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
      console.log('💾 Guardando asignación en base de datos:', assignmentData);

      // Persist assignment using already-initialized hook function
      const serviceId = assignmentData.servicio_id || serviceData.servicio_id || assignmentData.cliente_nombre || '';
      await assignArmedGuard(
        serviceId,
        assignmentData.custodio_asignado_id || '',
        assignmentData.armado_asignado_id || '',
        assignmentData.tipo_asignacion || 'interno',
        assignmentData.punto_encuentro || '',
        assignmentData.hora_encuentro || '',
        assignmentData.proveedor_id
      );
      console.log('✅ Armed guard assignment persisted to database');
      
      // Log final de auditoría
      await logAssignmentAction({
        service_id: serviceId,
        custodio_id: assignmentData.custodio_asignado_id,
        armado_id: assignmentData.armado_asignado_id,
        proveedor_id: assignmentData.proveedor_id,
        action_type: 'confirmed',
        new_data: assignmentData,
        changes_summary: `Asignación confirmada y completada para servicio ${serviceId}`
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
    setExpandedCard(null);
    setPuntoEncuentro('');
    setHoraEncuentro('');
    setAssignmentData(null);
    setShowExternalVerificationModal(false);
    setSelectedProviderForVerification(null);
  };

  // New handlers for expandable cards
  const handleCardSelect = (id: string, type: 'interno' | 'proveedor') => {
    setSelectedArmed(id);
    setSelectedType(type);
    // Auto-expand when selected
    setExpandedCard(id);
  };

  const handleCardExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const handleDirectAssignment = async (data: {
    id: string;
    type: 'interno' | 'proveedor';
    puntoEncuentro: string;
    horaEncuentro: string;
  }) => {
    console.log('🔧 DEBUG: Starting direct assignment process', data);
    
    // Update the state with the data from the card
    setPuntoEncuentro(data.puntoEncuentro);
    setHoraEncuentro(data.horaEncuentro);
    setSelectedArmed(data.id);
    setSelectedType(data.type);
    
    const selectedGuard = data.type === 'interno' 
      ? armedGuards.find(g => g.id === data.id)
      : providers.find(p => p.id === data.id);

    console.log('🔧 DEBUG: Selected guard for direct assignment', selectedGuard);

    if (!selectedGuard) return;

    // Si es proveedor externo, abrir modal de verificación
    if (data.type === 'proveedor') {
      setSelectedProviderForVerification(selectedGuard as ArmedProvider);
      setShowExternalVerificationModal(true);
      return;
    }

    // Si es armado interno, proceder directamente
    await proceedWithAssignment(selectedGuard as ArmedGuard, 'interno', data.puntoEncuentro, data.horaEncuentro);
  };

  const createTimeRecommendationWrapper = (selectedTime: string) => {
    return getTimeRecommendation(serviceData.hora_ventana_inicio || '', selectedTime);
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
      id_servicio: assignmentData.cliente_nombre || 'N/A', // Use client name as fallback for service ID
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
      tipo_asignacion: assignmentData.tipo_asignacion || 'interno',
    },
    encuentro: {
      punto_encuentro: assignmentData.punto_encuentro || '',
      hora_encuentro: assignmentData.hora_encuentro || '',
    },
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
              Asignación de Armado
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

            {/* Armed Guards List with Expandable Cards */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Armados Internos</div>
                <Badge variant="secondary" className="text-xs">
                  {armedGuards.filter(guard => guard.disponibilidad === 'disponible').length} disponibles
                </Badge>
              </div>
              <div className="space-y-4">
                {armedGuards.filter(guard => guard.disponibilidad === 'disponible').length > 0 ? (
                  armedGuards.filter(guard => guard.disponibilidad === 'disponible').map((guard) => (
                    <ExpandableArmedCard
                      key={guard.id}
                      guard={guard}
                      type="interno"
                      isSelected={selectedArmed === guard.id}
                      isExpanded={expandedCard === guard.id}
                      onSelect={() => handleCardSelect(guard.id, 'interno')}
                      onExpand={() => handleCardExpand(guard.id)}
                      onConfirmAssignment={handleDirectAssignment}
                      calculatedMeetingTime={calculatedMeetingTime}
                      formatDisplayTime={formatDisplayTime}
                      getTimeRecommendation={createTimeRecommendationWrapper}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div>No hay armados internos disponibles</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-4 mt-8">
                <div className="text-lg font-semibold">Proveedores Externos</div>
                <Badge variant="secondary" className="text-xs">
                  {providers.length} disponibles
                </Badge>
              </div>
              <div className="space-y-4">
                {providers.length > 0 ? (
                  providers.map((provider) => (
                    <ExpandableArmedCard
                      key={provider.id}
                      provider={provider}
                      type="proveedor"
                      isSelected={selectedArmed === provider.id}
                      isExpanded={expandedCard === provider.id}
                      onSelect={() => handleCardSelect(provider.id, 'proveedor')}
                      onExpand={() => handleCardExpand(provider.id)}
                      onConfirmAssignment={handleDirectAssignment}
                      calculatedMeetingTime={calculatedMeetingTime}
                      formatDisplayTime={formatDisplayTime}
                      getTimeRecommendation={createTimeRecommendationWrapper}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div>No hay proveedores externos disponibles</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
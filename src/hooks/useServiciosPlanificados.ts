import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isValidUuid, safeUuidForDatabase } from '@/utils/uuidHelpers';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useServiciosPlanificados');

export interface ServicioPlanificadoData {
  id_servicio: string;
  id_interno_cliente?: string;
  nombre_cliente: string;
  empresa_cliente?: string;
  email_cliente?: string;
  telefono_cliente?: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tipo_servicio?: string;
  prioridad?: number;
  custodio_asignado?: string;
  custodio_id?: string;
  requiere_armado?: boolean;
  armado_asignado?: string;
  armado_id?: string;
  fecha_asignacion_armado?: string;
  punto_encuentro?: string;
  hora_encuentro?: string;
  tipo_asignacion_armado?: 'interno' | 'proveedor';
  proveedor_armado_id?: string;
  auto?: string;
  placa?: string;
  num_vehiculos?: number;
  tarifa_acordada?: number;
  moneda?: string;
  observaciones?: string;
  comentarios_adicionales?: string;
  condiciones_especiales?: string[];
  estado_planeacion?: string;
  gadgets_cantidades?: Array<{ tipo: string; cantidad: number }>;
  // Override de conflictos (para servicios de retorno, secuenciales, etc.)
  override_conflicto_motivo?: string;
  override_conflicto_autorizado_por?: string;
  override_conflicto_timestamp?: string;
}

export interface ConflictInfo {
  id_servicio: string;
  fecha_hora_cita: string;
  cliente: string;
  origen: string;
  destino: string;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: ConflictInfo[];
}

// Helper function to check custodian conflicts
export const checkCustodianConflicts = async (
  custodioId: string,
  fechaHoraCita: string,
  currentServiceUuid?: string
): Promise<ConflictCheckResult> => {
  console.debug('Checking conflicts for custodian:', custodioId, 'at:', fechaHoraCita);
  
  const conflicts: ConflictInfo[] = [];
  
  try {
    const excludeServiceId = safeUuidForDatabase(currentServiceUuid);
    
    // 1. Check via RPC for existing conflicts
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('check_custodian_availability', {
        p_custodio_id: custodioId,
        p_fecha_hora_cita: fechaHoraCita,
        p_exclude_service_id: excludeServiceId
      });

    if (!rpcError && rpcResult?.has_conflicts) {
      const rpcConflicts = rpcResult.conflicting_services || [];
      conflicts.push(...rpcConflicts.map((service: any) => ({
        id_servicio: service.id_servicio || service.service_id || 'N/A',
        fecha_hora_cita: service.fecha_hora_cita || service.scheduled_time || '',
        cliente: service.nombre_cliente || service.client_name || 'Cliente no especificado',
        origen: service.origen || 'Origen no especificado',
        destino: service.destino || 'Destino no especificado'
      })));
    }

    // 2. Additional check in servicios_planificados (±8h window)
    const targetTime = new Date(fechaHoraCita);
    const startTime = new Date(targetTime.getTime() - 8 * 60 * 60 * 1000); // -8h
    const endTime = new Date(targetTime.getTime() + 8 * 60 * 60 * 1000); // +8h

    const { data: plannedConflicts, error: plannedError } = await supabase
      .from('servicios_planificados')
      .select('id, id_servicio, fecha_hora_cita, nombre_cliente, origen, destino')
      .eq('custodio_id', custodioId)
      .in('estado_planeacion', ['confirmado', 'asignado'])
      .gte('fecha_hora_cita', startTime.toISOString())
      .lte('fecha_hora_cita', endTime.toISOString())
      .neq('id', excludeServiceId || '');

    if (!plannedError && plannedConflicts?.length > 0) {
      // Add planned conflicts that weren't already found by RPC
      const existingIds = new Set(conflicts.map(c => c.id_servicio));
      
      plannedConflicts.forEach(service => {
        if (!existingIds.has(service.id_servicio)) {
          conflicts.push({
            id_servicio: service.id_servicio,
            fecha_hora_cita: service.fecha_hora_cita,
            cliente: service.nombre_cliente || 'Cliente no especificado',
            origen: service.origen || 'Origen no especificado',
            destino: service.destino || 'Destino no especificado'
          });
        }
      });
    }

    console.debug(`Found ${conflicts.length} conflicts for custodian ${custodioId}:`, conflicts);

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };

  } catch (error) {
    console.error('Error checking custodian conflicts:', error);
    // Return no conflicts on error to avoid blocking UI
    return {
      hasConflicts: false,
      conflicts: []
    };
  }
};

export function useServiciosPlanificados() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const createServicioPlanificado = useMutation({
    mutationFn: async (data: ServicioPlanificadoData) => {
      console.log('Creating planned service:', data);
      
      // Validate required fields
      if (!data.id_servicio || !data.nombre_cliente || !data.origen || !data.destino || !data.fecha_hora_cita) {
        throw new Error('Campos requeridos faltantes: ID servicio, cliente, origen, destino y fecha/hora');
      }

      // Check if service ID already exists
      const { data: existingService, error: checkError } = await supabase
        .from('servicios_planificados')
        .select('id_servicio')
        .eq('id_servicio', data.id_servicio)
        .maybeSingle();

      if (checkError) {
        throw new Error('Error verificando ID del servicio');
      }

      if (existingService) {
        throw new Error(`El ID de servicio "${data.id_servicio}" ya existe. Por favor, usa un ID diferente.`);
      }

      const { data: result, error } = await supabase
        .from('servicios_planificados')
        .insert([{
          id_servicio: data.id_servicio,
          id_interno_cliente: data.id_interno_cliente,
          nombre_cliente: data.nombre_cliente,
          empresa_cliente: data.empresa_cliente,
          email_cliente: data.email_cliente,
          telefono_cliente: data.telefono_cliente,
          origen: data.origen,
          destino: data.destino,
          fecha_hora_cita: data.fecha_hora_cita,
          tipo_servicio: data.tipo_servicio || 'custodia',
          prioridad: data.prioridad || 5,
          custodio_asignado: data.custodio_asignado,
          custodio_id: data.custodio_id,
          requiere_armado: data.requiere_armado || false,
          armado_asignado: data.armado_asignado,
          armado_id: data.armado_id,
          punto_encuentro: data.punto_encuentro,
          hora_encuentro: data.hora_encuentro,
          tipo_asignacion_armado: data.tipo_asignacion_armado,
          proveedor_armado_id: data.proveedor_armado_id,
          auto: data.auto,
          placa: data.placa,
          num_vehiculos: data.num_vehiculos || 1,
          tarifa_acordada: data.tarifa_acordada,
          moneda: data.moneda || 'MXN',
          observaciones: data.observaciones,
          comentarios_adicionales: data.comentarios_adicionales,
          condiciones_especiales: data.condiciones_especiales,
          estado_planeacion: data.estado_planeacion || 'planificado',
          gadgets_cantidades: data.gadgets_cantidades || [],
          // Override de conflictos
          override_conflicto_motivo: data.override_conflicto_motivo,
          override_conflicto_autorizado_por: data.override_conflicto_autorizado_por,
          override_conflicto_timestamp: data.override_conflicto_timestamp
        }])
        .select()
        .single();

      if (error) {
        console.error('Error inserting planned service:', error);
        throw new Error(`Error al crear servicio planificado: ${error.message}`);
      }

      console.log('Planned service created successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      toast.success('Servicio planificado creado exitosamente');
      console.log('Service created with ID:', data.id);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['planned-services'] });
    },
    onError: (error) => {
      console.error('Error creating planned service:', error);
      
      // Handle duplicate key error with suggestion
      if (error.message && error.message.includes('ya existe')) {
        toast.error(error.message, {
          description: 'Intenta con un ID diferente o usa el botón de generar ID automático'
        });
      } else {
        toast.error('Error al crear servicio planificado', {
          description: error.message || 'Error desconocido'
        });
      }
    }
  });

  const updateServicioPlanificado = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ServicioPlanificadoData> }) => {
      console.log('Updating planned service:', id, data);

      const { data: result, error } = await supabase
        .from('servicios_planificados')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating planned service:', error);
        throw new Error(`Error al actualizar servicio: ${error.message}`);
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Servicio planificado actualizado');
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['planned-services'] });
    },
    onError: (error) => {
      console.error('Error updating planned service:', error);
      toast.error(error.message || 'Error al actualizar el servicio');
    }
  });

  const assignCustodian = useMutation({
    mutationFn: async ({ serviceId, custodioName, custodioId }: { 
      serviceId: string; 
      custodioName: string; 
      custodioId?: string;
    }) => {
      // Validate inputs
      if (!serviceId || !custodioName) {
        throw new Error('ID de servicio y nombre de custodio son requeridos');
      }
      
      // Validate serviceId is a proper UUID
      if (!isValidUuid(serviceId)) {
        throw new Error('ID de servicio inválido - debe ser un UUID válido');
      }
      
      // First check for conflicts if custodioId is provided
      if (custodioId && isValidUuid(custodioId)) {
        // Get service details first to check conflicts
        const { data: service, error: serviceError } = await supabase
          .from('servicios_planificados')
          .select('fecha_hora_cita, id_servicio, origen, destino')
          .eq('id', serviceId) // Use UUID id, not id_servicio
          .maybeSingle();

        if (serviceError) throw new Error('Error al obtener datos del servicio');
        if (!service) throw new Error('Servicio no encontrado');

        // Check for conflicts        
        const excludeServiceId = safeUuidForDatabase(serviceId);
        
        const { data: conflictCheck, error: conflictError } = await supabase
          .rpc('check_custodian_availability', {
            p_custodio_id: custodioId,
            p_fecha_hora_cita: service.fecha_hora_cita,
            p_exclude_service_id: excludeServiceId
          });

        if (conflictError) {
          console.warn('Error checking conflicts:', conflictError);
        } else if (conflictCheck?.has_conflicts) {
          const conflicts = conflictCheck.conflicting_services || [];
          console.log('🚫 Conflicto detectado para custodio:', custodioName, 'Conflictos:', conflicts);
          throw new Error(`El custodio ${custodioName} ya tiene ${conflicts.length} servicio(s) asignado(s) en horarios conflictivos. Revise los servicios existentes antes de continuar.`);
        }
        
        console.log('✅ Custodio disponible, procediendo con asignación:', custodioName);
      }

      // Get current service state to determine final status
      const { data: currentService, error: fetchError } = await supabase
        .from('servicios_planificados')
        .select('requiere_armado, armado_asignado, cantidad_armados_requeridos, id_servicio')
        .eq('id', serviceId)
        .maybeSingle();

      if (fetchError) throw new Error('Error al obtener datos del servicio');
      if (!currentService) throw new Error('Servicio no encontrado');

      // Determine final state: check armados asignados vs requeridos
      let shouldBeConfirmed: boolean;
      if (!currentService.requiere_armado) {
        shouldBeConfirmed = true;
      } else {
        // Count from asignacion_armados table (source of truth)
        const { countArmadosAsignados } = await import('@/hooks/useArmadosDelServicio');
        const armadosAsignados = await countArmadosAsignados(currentService.id_servicio);
        const armadosRequeridos = currentService.cantidad_armados_requeridos || 1;
        shouldBeConfirmed = armadosAsignados >= armadosRequeridos;
      }
      const newState = shouldBeConfirmed ? 'confirmado' : 'pendiente_asignacion';
      
      console.log('📊 Estado del servicio antes de asignar custodio:', {
        requiere_armado: currentService.requiere_armado,
        armado_asignado: currentService.armado_asignado,
        estado_calculado: newState
      });

      // Update the service with custodian assignment
      const { error } = await supabase
        .from('servicios_planificados')
        .update({
          custodio_asignado: custodioName,
          custodio_id: custodioId,
          fecha_asignacion: new Date().toISOString(),
          estado_planeacion: newState,
          asignado_por: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', serviceId); // Use UUID id, not id_servicio

      if (error) throw error;
      
      console.log('🎉 Custodio asignado exitosamente. Nuevo estado:', newState);
    },
    onSuccess: () => {
      toast.success('Custodio asignado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['planned-services'] });
    },
    onError: (error) => {
      console.error('Error assigning custodian:', error);
      if (error.message && error.message.includes('conflictivos')) {
        toast.error('Conflicto de horario detectado', {
          description: error.message
        });
      } else {
        toast.error('Error al asignar custodio', {
          description: error.message || 'Error desconocido'
        });
      }
    }
  });

  const assignArmedGuard = useMutation({
    mutationFn: async ({ serviceId, armadoName, armadoId, assignmentType, providerId, puntoEncuentro, horaEncuentro, tarifaAcordada }: { 
      serviceId: string; 
      armadoName: string; 
      armadoId?: string;
      assignmentType?: 'interno' | 'proveedor';
      providerId?: string;
      puntoEncuentro?: string;
      horaEncuentro?: string;
      tarifaAcordada?: number;
    }) => {
      // Get current service state to determine final status
      // Detect if serviceId is UUID or human-readable id_servicio
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(serviceId);
      const filterColumn = isUuid ? 'id' : 'id_servicio';

      const { data: currentService, error: fetchError } = await supabase
        .from('servicios_planificados')
        .select('id, custodio_asignado, custodio_id, estado_planeacion, fecha_hora_cita, id_servicio, cantidad_armados_requeridos')
        .eq(filterColumn, serviceId)
        .maybeSingle();

      if (fetchError) throw new Error('Error al obtener datos del servicio');
      if (!currentService) throw new Error('Servicio no encontrado');

      // Insert into asignacion_armados (source of truth)
      const serviceDate = new Date(currentService.fecha_hora_cita).toISOString().split('T')[0];
      const userId = (await supabase.auth.getUser()).data.user?.id;

      await supabase.from('asignacion_armados').insert({
        servicio_custodia_id: currentService.id_servicio,
        custodio_id: currentService.custodio_id,
        armado_id: armadoId || null,
        proveedor_armado_id: assignmentType === 'proveedor' ? providerId : null,
        tipo_asignacion: assignmentType || 'interno',
        punto_encuentro: puntoEncuentro || null,
        hora_encuentro: horaEncuentro ? `${serviceDate}T${horaEncuentro}:00` : null,
        estado_asignacion: 'pendiente',
        armado_nombre_verificado: armadoName,
        tarifa_acordada: tarifaAcordada || null,
        asignado_por: userId,
      });

      // Determine final state using count from asignacion_armados
      const { countArmadosAsignados } = await import('@/hooks/useArmadosDelServicio');
      const armadosAsignados = await countArmadosAsignados(currentService.id_servicio);
      const armadosRequeridos = currentService.cantidad_armados_requeridos || 1;
      const shouldBeConfirmed = currentService.custodio_asignado && armadosAsignados >= armadosRequeridos;
      const newState = shouldBeConfirmed ? 'confirmado' : 'pendiente_asignacion';

      console.log('🛡️ Asignando armado. Estado del servicio:', {
        custodio_asignado: currentService.custodio_asignado,
        armadosAsignados,
        armadosRequeridos,
        estado_calculado: newState
      });

      // Update scalar fields (legacy compat) + state
      const { error } = await supabase
        .from('servicios_planificados')
        .update({
          armado_asignado: armadoName,
          armado_id: armadoId,
          fecha_asignacion_armado: new Date().toISOString(),
          estado_planeacion: newState
        })
        .eq('id', currentService.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Armado asignado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['pending-armado-services'] });
      queryClient.invalidateQueries({ queryKey: ['armados-del-servicio'] });
    },
    onError: (error) => {
      toast.error('Error al asignar armado');
      console.error(error);
    }
  });

  // Hook to check custodian conflicts reactively
  const useCheckCustodianConflicts = (
    custodioId?: string,
    fechaHoraCita?: string,
    currentServiceUuid?: string,
    enabled: boolean = true
  ) => {
    return useQuery({
      queryKey: ['custodian-conflicts', custodioId, fechaHoraCita, currentServiceUuid],
      queryFn: () => checkCustodianConflicts(custodioId!, fechaHoraCita!, currentServiceUuid),
      enabled: enabled && !!custodioId && !!fechaHoraCita,
      staleTime: 30000, // 30 seconds
      refetchInterval: 60000, // Refetch every minute
    });
  };

  // New function for updating service configuration with smart state management
  const updateServiceConfiguration = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ServicioPlanificadoData> }) => {
      console.log('Updating service configuration:', id, data);

      // Get current service state to handle armado logic
      const { data: currentService, error: fetchError } = await supabase
        .from('servicios_planificados')
        .select('requiere_armado, armado_asignado, armado_id, custodio_asignado, estado_planeacion')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Error al obtener datos del servicio: ${fetchError.message}`);
      }
      
      if (!currentService) {
        throw new Error('Servicio no encontrado');
      }

      let updateData = { ...data };
      let newState = currentService.estado_planeacion;

      // Handle requiere_armado logic changes
      if ('requiere_armado' in data && data.requiere_armado !== currentService.requiere_armado) {
        console.log('🔄 requiere_armado changed from', currentService.requiere_armado, 'to', data.requiere_armado);
        
        if (data.requiere_armado === false && currentService.requiere_armado === true) {
          // Changed from requiring armado to not requiring it
          console.log('🚮 Removing armado assignment since service no longer requires it');
          updateData.armado_asignado = null;
          updateData.armado_id = null;
          updateData.fecha_asignacion_armado = null;
          
          // If custodian is assigned, mark as confirmed
          if (currentService.custodio_asignado) {
            newState = 'confirmado';
            console.log('✅ Service confirmed with custodian only');
          }
        } 
        else if (data.requiere_armado === true && currentService.requiere_armado === false) {
          // Changed from not requiring armado to requiring it
          console.log('🛡️ Service now requires armado assignment');
          
          // If custodian is assigned but no armado, set to pending assignment
          if (currentService.custodio_asignado && !currentService.armado_asignado) {
            newState = 'pendiente_asignacion';
            console.log('⏳ Service pending armado assignment');
          }
        }
      }

      // Update estado_planeacion if it changed
      if (newState !== currentService.estado_planeacion) {
        updateData.estado_planeacion = newState;
      }

      const { data: result, error } = await supabase
        .from('servicios_planificados')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating service configuration:', error);
        throw new Error(`Error al actualizar configuración: ${error.message}`);
      }

      console.log('🎉 Service configuration updated successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      toast.success('Configuración del servicio actualizada', {
        description: 'Los cambios se han guardado exitosamente'
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['planned-services'] });
      queryClient.invalidateQueries({ queryKey: ['pending-services'] });
      queryClient.invalidateQueries({ queryKey: ['pending-armado-services'] });
    },
    onError: (error) => {
      console.error('Error updating service configuration:', error);
      toast.error('Error al actualizar configuración', {
        description: error.message || 'Error desconocido'
      });
    }
  });

  // SPRINT 2: Reassignment functions
  const reassignCustodian = useMutation({
    mutationFn: async ({ serviceId, newCustodioName, newCustodioId, reason }: {
      serviceId: string;
      newCustodioName: string;
      newCustodioId?: string;
      reason: string;
    }) => {
      console.log('🔄 Reassigning custodian for service:', serviceId);
      
      // Get current service data
      const { data: currentService, error: fetchError } = await supabase
        .from('servicios_planificados')
        .select('custodio_asignado, custodio_id, fecha_hora_cita, requiere_armado, armado_asignado, id_servicio, cantidad_armados_requeridos')
        .eq('id', serviceId)
        .maybeSingle();

      if (fetchError) throw new Error('Error al obtener datos del servicio');
      if (!currentService) throw new Error('Servicio no encontrado');

      // Check conflicts if custodioId is provided
      if (newCustodioId) {
        const conflictResult = await checkCustodianConflicts(newCustodioId, currentService.fecha_hora_cita, serviceId);
        if (conflictResult.hasConflicts) {
          throw new Error(`El custodio ${newCustodioName} ya tiene ${conflictResult.conflicts.length} servicio(s) asignado(s) en horarios conflictivos.`);
        }
      }

      // Determine final state using relational count (multi-armado support)
      let shouldBeConfirmed: boolean;
      if (!currentService.requiere_armado) {
        shouldBeConfirmed = true;
      } else {
        const { countArmadosAsignados } = await import('@/hooks/useArmadosDelServicio');
        const armadosAsignados = await countArmadosAsignados(currentService.id_servicio);
        const armadosRequeridos = currentService.cantidad_armados_requeridos || 1;
        shouldBeConfirmed = armadosAsignados >= armadosRequeridos;
      }
      const finalState = shouldBeConfirmed ? 'confirmado' : 'pendiente_asignacion';

      // Update assignment
      const { error: updateError } = await supabase
        .from('servicios_planificados')
        .update({
          custodio_asignado: newCustodioName,
          custodio_id: newCustodioId,
          fecha_asignacion: new Date().toISOString(),
          asignado_por: (await supabase.auth.getUser()).data.user?.id,
          estado_planeacion: finalState
        })
        .eq('id', serviceId);

      if (updateError) throw updateError;

      // Log the change
      await logServiceChange({
        serviceId,
        actionType: 'reassign_custodian',
        previousValue: currentService.custodio_asignado,
        newValue: newCustodioName,
        reason
      });

      return { 
        previousCustodian: currentService.custodio_asignado,
        newCustodian: newCustodioName 
      };
    },
    onSuccess: (data) => {
      toast.success('Custodio reasignado exitosamente', {
        description: `Cambiado de "${data.previousCustodian}" a "${data.newCustodian}"`
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['planned-services'] });
    },
    onError: (error) => {
      console.error('Error reassigning custodian:', error);
      toast.error('Error al reasignar custodio', {
        description: error.message || 'Error desconocido'
      });
    }
  });

  const reassignArmedGuard = useMutation({
    mutationFn: async ({ 
      serviceId, 
      newArmadoName, 
      newArmadoId, 
      reason,
      assignmentType,
      providerId,
      puntoEncuentro,
      horaEncuentro,
      tarifaAcordada,
      nombrePersonal
    }: {
      serviceId: string;
      newArmadoName: string;
      newArmadoId?: string;
      reason: string;
      assignmentType?: 'interno' | 'proveedor';
      providerId?: string;
      puntoEncuentro?: string;
      horaEncuentro?: string;
      tarifaAcordada?: number;
      nombrePersonal?: string;
    }) => {
      console.log('🛡️ Reassigning armed guard for service:', serviceId, 'type:', assignmentType);
      
      // Validación de UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(serviceId)) {
        throw new Error(`ID de servicio inválido: "${serviceId}". Se esperaba un UUID.`);
      }
      
      // Get current service data
      const { data: currentService, error: fetchError } = await supabase
        .from('servicios_planificados')
        .select('armado_asignado, armado_id, custodio_asignado, custodio_id, estado_planeacion, fecha_hora_cita, id_servicio, cantidad_armados_requeridos')
        .eq('id', serviceId)
        .single();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw new Error(`Error al obtener datos del servicio: ${fetchError.message}`);
      }
      if (!currentService) {
        throw new Error('Servicio no encontrado en la base de datos');
      }
      
      console.log('✅ Service found:', currentService.id_servicio);

      // Always insert into asignacion_armados (source of truth for multi-armado)
      const serviceDate = new Date(currentService.fecha_hora_cita).toISOString().split('T')[0];
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Cancel previous active assignments for this service (reassignment = replace, not add)
      const { error: cancelError } = await supabase
        .from('asignacion_armados')
        .update({ 
          estado_asignacion: 'cancelado',
          observaciones: `Reemplazado por: ${newArmadoName}. Motivo: ${reason}`
        })
        .eq('servicio_custodia_id', currentService.id_servicio)
        .not('estado_asignacion', 'eq', 'cancelado');

      if (cancelError) {
        console.error('Error cancelling previous assignments:', cancelError);
      }

      await supabase.from('asignacion_armados').insert({
        servicio_custodia_id: currentService.id_servicio,
        custodio_id: currentService.custodio_id,
        armado_id: newArmadoId || null,
        proveedor_armado_id: assignmentType === 'proveedor' ? providerId : null,
        tipo_asignacion: assignmentType || 'interno',
        punto_encuentro: puntoEncuentro || null,
        hora_encuentro: horaEncuentro ? `${serviceDate}T${horaEncuentro}:00` : null,
        estado_asignacion: 'pendiente',
        armado_nombre_verificado: newArmadoName,
        tarifa_acordada: tarifaAcordada || null,
        asignado_por: userId,
        observaciones: nombrePersonal ? `Personal: ${nombrePersonal}` : null
      });

      // Determine final state using count from asignacion_armados
      const { countArmadosAsignados } = await import('@/hooks/useArmadosDelServicio');
      const armadosAsignados = await countArmadosAsignados(currentService.id_servicio);
      const armadosRequeridos = (currentService as any).cantidad_armados_requeridos || 1;
      const shouldBeConfirmed = currentService.custodio_asignado && armadosAsignados >= armadosRequeridos;
      const finalState = shouldBeConfirmed ? 'confirmado' : currentService.estado_planeacion;

      // Update scalar fields (legacy compat) + state
      const { error: updateError } = await supabase
        .from('servicios_planificados')
        .update({
          armado_asignado: newArmadoName,
          armado_id: newArmadoId,
          fecha_asignacion_armado: new Date().toISOString(),
          estado_planeacion: finalState
        })
        .eq('id', serviceId);

      if (updateError) throw updateError;

      await logServiceChange({
        serviceId,
        actionType: assignmentType === 'proveedor' ? 'assign_provider' : 'reassign_armed_guard',
        previousValue: currentService.armado_asignado,
        newValue: newArmadoName,
        reason
      });

      return { 
        previousArmado: currentService.armado_asignado,
        newArmado: newArmadoName 
      };
    },
    onSuccess: (data) => {
      toast.success('Armado reasignado exitosamente', {
        description: `Cambiado de "${data.previousArmado}" a "${data.newArmado}"`
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['pending-armado-services'] });
    },
    onError: (error) => {
      console.error('Error reassigning armed guard:', error);
      toast.error('Error al reasignar armado', {
        description: error.message || 'Error desconocido'
      });
    }
  });

  const removeAssignment = useMutation({
    mutationFn: async ({ serviceId, assignmentType, reason }: {
      serviceId: string;
      assignmentType: 'custodian' | 'armed_guard';
      reason: string;
    }) => {
      console.log('🗑️ Removing assignment for service:', serviceId, 'type:', assignmentType);
      
      // Get current service data
      const { data: currentService, error: fetchError } = await supabase
        .from('servicios_planificados')
        .select('custodio_asignado, armado_asignado, requiere_armado, estado_planeacion, id_servicio')
        .eq('id', serviceId)
        .maybeSingle();

      if (fetchError) throw new Error('Error al obtener datos del servicio');
      if (!currentService) throw new Error('Servicio no encontrado');

      let updateData: any = {};
      let previousValue = '';
      let newState = currentService.estado_planeacion;

      if (assignmentType === 'custodian') {
        updateData = {
          custodio_asignado: null,
          custodio_id: null,
          fecha_asignacion: null,
          asignado_por: null,
          estado_planeacion: 'planificado' // Reset to initial state
        };
        previousValue = currentService.custodio_asignado;
      } else if (assignmentType === 'armed_guard') {
        updateData = {
          armado_asignado: null,
          armado_id: null,
          fecha_asignacion_armado: null
        };
        previousValue = currentService.armado_asignado;

        // Cancel all active records in asignacion_armados for this service
        if (currentService.id_servicio) {
          const { error: cancelError } = await supabase
            .from('asignacion_armados')
            .update({ estado_asignacion: 'cancelado' })
            .eq('servicio_custodia_id', currentService.id_servicio)
            .not('estado_asignacion', 'eq', 'cancelado');

          if (cancelError) {
            console.error('Error cancelling asignacion_armados records:', cancelError);
          }
        }
        
        // If custodian is assigned but armado is removed, mark as confirmed
        if (currentService.custodio_asignado) {
          updateData.estado_planeacion = 'confirmado';
        }
      }

      // Update assignment
      const { error: updateError } = await supabase
        .from('servicios_planificados')
        .update(updateData)
        .eq('id', serviceId);

      if (updateError) throw updateError;

      // Log the change
      await logServiceChange({
        serviceId,
        actionType: `remove_${assignmentType}`,
        previousValue,
        newValue: null,
        reason
      });

      return { assignmentType, previousValue };
    },
    onSuccess: (data) => {
      const typeText = data.assignmentType === 'custodian' ? 'Custodio' : 'Armado';
      toast.success(`${typeText} removido exitosamente`, {
        description: `Se removió "${data.previousValue}" del servicio`
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['planned-services'] });
      queryClient.invalidateQueries({ queryKey: ['pending-services'] });
      queryClient.invalidateQueries({ queryKey: ['pending-armado-services'] });
    },
    onError: (error) => {
      console.error('Error removing assignment:', error);
      toast.error('Error al remover asignación', {
        description: error.message || 'Error desconocido'
      });
    }
  });

  // Cancel service mutation
  const cancelService = useMutation({
    mutationFn: async ({ serviceId, reason }: { serviceId: string; reason?: string }) => {
      logger.operation('cancelService', 'start', { serviceId, reason });
      
      // Validate service exists and can be cancelled
      const { data: service, error: fetchError } = await supabase
        .from('servicios_planificados')
        .select('estado_planeacion, custodio_asignado, armado_asignado, fecha_hora_cita')
        .eq('id', serviceId)
        .maybeSingle();

      if (fetchError) {
        logger.error('cancelService', 'Error fetching service', fetchError);
        throw new Error('Error al verificar el servicio');
      }

      if (!service) {
        logger.warn('cancelService', 'Service not found', { serviceId });
        throw new Error('Servicio no encontrado');
      }

      // Check if service has already started (allow cancellation if reason is client-initiated)
      const serviceTime = new Date(service.fecha_hora_cita);
      const currentTime = new Date();
      const timeDiff = serviceTime.getTime() - currentTime.getTime();
      const hoursUntilService = timeDiff / (1000 * 60 * 60);

      // Allow cancellation of started services if the reason indicates client cancellation
      const isClientCancellation = reason && (
        reason.toLowerCase().includes('cliente cancel') ||
        reason.toLowerCase().includes('cancelado por cliente') ||
        reason.toLowerCase().includes('cliente no') ||
        reason === 'cliente_cancelo'
      );

      if (hoursUntilService < -1 && !isClientCancellation) {
        logger.warn('cancelService', 'Cannot cancel started service without client reason', { hoursUntilService });
        throw new Error('Para cancelar un servicio ya iniciado, indica "Cancelado por cliente" como motivo');
      }

      // Cancel the service
      const { error } = await supabase
        .from('servicios_planificados')
        .update({
          estado_planeacion: 'cancelado',
          observaciones: reason ? `Cancelado: ${reason}` : 'Servicio cancelado',
          cancelado_por: (await supabase.auth.getUser()).data.user?.id,
          fecha_cancelacion: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (error) {
        logger.error('cancelService', 'Error updating service', error);
        throw new Error(`Error al cancelar servicio: ${error.message}`);
      }

      logger.operation('cancelService', 'success', { serviceId });
      return { serviceId };
    },
    onSuccess: () => {
      toast.success('Servicio cancelado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['planned-services'] });
    },
    onError: (error) => {
      logger.error('cancelService', 'Mutation failed', error);
      toast.error('Error al cancelar servicio', {
        description: error.message || 'Error desconocido'
      });
    }
  });

  // SPRINT 3: Service change logging helper function
  const logServiceChange = async ({
    serviceId,
    actionType,
    previousValue,
    newValue,
    reason
  }: {
    serviceId: string;
    actionType: string;
    previousValue: any;
    newValue: any;
    reason?: string;
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      await supabase
        .from('service_modification_log')
        .insert({
          service_id: serviceId,
          action_type: actionType,
          previous_value: previousValue ? JSON.stringify(previousValue) : null,
          new_value: newValue ? JSON.stringify(newValue) : null,
          modified_by: user.user?.id,
          reason: reason,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Error logging service change:', error);
      // Don't throw error to avoid breaking the main operation
    }
  };

  // SPRINT 2: Update operational status (mark as "En sitio" or revert to "Programado")
  const updateOperationalStatus = useMutation({
    mutationFn: async ({ 
      serviceId, 
      action 
    }: { 
      serviceId: string; 
      action: 'mark_on_site' | 'revert_to_scheduled';
    }) => {
      logger.operation('updateOperationalStatus', 'start', { serviceId, action });
      
      const updateData = action === 'mark_on_site' 
        ? { hora_inicio_real: new Date().toISOString() }
        : { hora_inicio_real: null };
      
      const { error } = await supabase
        .from('servicios_planificados')
        .update(updateData)
        .eq('id', serviceId);
      
      if (error) {
        logger.error('updateOperationalStatus', 'Failed to update', error);
        throw error;
      }
      
      logger.operation('updateOperationalStatus', 'success', { serviceId, action });
    },
    onSuccess: (_, variables) => {
      const message = variables.action === 'mark_on_site' 
        ? 'Servicio marcado como "En sitio"' 
        : 'Servicio revertido a "Programado"';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
    },
    onError: (error) => {
      logger.error('updateOperationalStatus', 'Mutation failed', error);
      toast.error('Error al actualizar estado operativo');
    }
  });

  // False positioning mutation - when custodian arrives but client cancels
  const markFalsePositioning = useMutation({
    mutationFn: async ({ 
      serviceId, 
      horaLlegada,
      motivo,
      cobroPosicionamiento
    }: { 
      serviceId: string;
      horaLlegada: string;
      motivo: string;
      cobroPosicionamiento: boolean;
    }) => {
      logger.operation('markFalsePositioning', 'start', { serviceId, motivo, cobroPosicionamiento });
      
      const { error } = await supabase
        .from('servicios_planificados')
        .update({
          estado_planeacion: 'cancelado',
          posicionamiento_falso: true,
          motivo_posicionamiento_falso: motivo,
          cobro_posicionamiento: cobroPosicionamiento,
          hora_llegada_custodio: horaLlegada,
          hora_inicio_real: new Date().toISOString(), // Mark that custodian arrived
          observaciones: `Posicionamiento en falso: ${motivo}. ${cobroPosicionamiento ? 'Se cobrará posicionamiento.' : 'Sin cargo de posicionamiento.'}`,
          cancelado_por: (await supabase.auth.getUser()).data.user?.id,
          fecha_cancelacion: new Date().toISOString()
        })
        .eq('id', serviceId);
      
      if (error) {
        logger.error('markFalsePositioning', 'Failed to update', error);
        throw error;
      }
      
      logger.operation('markFalsePositioning', 'success', { serviceId });
      return { serviceId };
    },
    onSuccess: (_, variables) => {
      toast.success('Posicionamiento en falso registrado', {
        description: variables.cobroPosicionamiento 
          ? 'Se marcó para cobro de posicionamiento' 
          : 'Sin cargo de posicionamiento'
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['planned-services'] });
    },
    onError: (error) => {
      logger.error('markFalsePositioning', 'Mutation failed', error);
      toast.error('Error al registrar posicionamiento en falso');
    }
  });

  return {
    createServicioPlanificado: createServicioPlanificado.mutate,
    updateServicioPlanificado: updateServicioPlanificado.mutate,
    updateServiceConfiguration: updateServiceConfiguration.mutate,
    assignCustodian: assignCustodian.mutate,
    assignArmedGuard: assignArmedGuard.mutate,
    reassignCustodian: reassignCustodian.mutate,
    reassignArmedGuard: reassignArmedGuard.mutate,
    removeAssignment: removeAssignment.mutate,
    cancelService,
    updateOperationalStatus,
    markFalsePositioning,
    isCreating: createServicioPlanificado.isPending,
    isUpdating: updateServicioPlanificado.isPending,
    isUpdatingConfiguration: updateServiceConfiguration.isPending,
    isUpdatingOperationalStatus: updateOperationalStatus.isPending,
    isMarkingFalsePositioning: markFalsePositioning.isPending,
    isReassigning: reassignCustodian.isPending || reassignArmedGuard.isPending || removeAssignment.isPending,
    isCancelling: cancelService.isPending,
    isLoading: isLoading || createServicioPlanificado.isPending || updateServicioPlanificado.isPending || updateServiceConfiguration.isPending || reassignCustodian.isPending || reassignArmedGuard.isPending || removeAssignment.isPending,
    checkCustodianConflicts,
    useCheckCustodianConflicts,
    logServiceChange
  };
}
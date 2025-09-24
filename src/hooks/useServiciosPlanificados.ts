import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServicioPlanificadoData {
  id_servicio: string;
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
  auto?: string;
  placa?: string;
  num_vehiculos?: number;
  tarifa_acordada?: number;
  moneda?: string;
  observaciones?: string;
  comentarios_adicionales?: string;
  condiciones_especiales?: string[];
  punto_encuentro?: string;
  hora_encuentro?: string;
  estado_planeacion?: string;
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
    // 1. Check via RPC for existing conflicts
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('check_custodian_availability', {
        p_custodio_id: custodioId,
        p_fecha_hora_cita: fechaHoraCita,
        p_exclude_service_id: currentServiceUuid
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
      .neq('id', currentServiceUuid || '');

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
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is what we want
        throw new Error('Error verificando ID del servicio');
      }

      if (existingService) {
        throw new Error(`El ID de servicio "${data.id_servicio}" ya existe. Por favor, usa un ID diferente.`);
      }

      const { data: result, error } = await supabase
        .from('servicios_planificados')
        .insert([{
          id_servicio: data.id_servicio,
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
          auto: data.auto,
          placa: data.placa,
          num_vehiculos: data.num_vehiculos || 1,
          tarifa_acordada: data.tarifa_acordada,
          moneda: data.moneda || 'MXN',
          observaciones: data.observaciones,
          comentarios_adicionales: data.comentarios_adicionales,
          condiciones_especiales: data.condiciones_especiales,
          estado_planeacion: data.estado_planeacion || 'planificado'
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
      // First check for conflicts if custodioId is provided
      if (custodioId) {
        // Get service details first to check conflicts
        const { data: service, error: serviceError } = await supabase
          .from('servicios_planificados')
          .select('fecha_hora_cita, id_servicio, origen, destino')
          .eq('id', serviceId) // Use UUID id, not id_servicio
          .single();

        if (serviceError) throw new Error('Error al obtener datos del servicio');

        // Check for conflicts
        const { data: conflictCheck, error: conflictError } = await supabase
          .rpc('check_custodian_availability', {
            p_custodio_id: custodioId,
            p_fecha_hora_cita: service.fecha_hora_cita,
            p_exclude_service_id: serviceId
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
        .select('requiere_armado, armado_asignado')
        .eq('id', serviceId)
        .single();

      if (fetchError) throw new Error('Error al obtener datos del servicio');

      // Determine final state based on armed guard requirement
      const shouldBeConfirmed = !currentService.requiere_armado || currentService.armado_asignado;
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
    mutationFn: async ({ serviceId, armadoName, armadoId }: { 
      serviceId: string; 
      armadoName: string; 
      armadoId?: string;
    }) => {
      // Get current service state to determine final status
      const { data: currentService, error: fetchError } = await supabase
        .from('servicios_planificados')
        .select('custodio_asignado, estado_planeacion')
        .eq('id_servicio', serviceId)
        .single();

      if (fetchError) throw new Error('Error al obtener datos del servicio');

      // Determine new state based on custodian assignment
      const newState = currentService.custodio_asignado 
        ? 'confirmado'  // If custodian is assigned, mark as confirmed
        : 'pendiente_asignacion'; // If no custodian, keep pending
        
      console.log('🛡️ Asignando armado. Estado del servicio:', {
        custodio_asignado: currentService.custodio_asignado,
        estado_calculado: newState
      });

      const { error } = await supabase
        .from('servicios_planificados')
        .update({
          armado_asignado: armadoName,
          armado_id: armadoId,
          fecha_asignacion_armado: new Date().toISOString(),
          estado_planeacion: newState
        })
        .eq('id_servicio', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Armado asignado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
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

  return {
    createServicioPlanificado: createServicioPlanificado.mutate,
    updateServicioPlanificado: updateServicioPlanificado.mutate,
    assignCustodian: assignCustodian.mutate,
    assignArmedGuard: assignArmedGuard.mutate,
    isCreating: createServicioPlanificado.isPending,
    isUpdating: updateServicioPlanificado.isPending,
    isLoading: isLoading || createServicioPlanificado.isPending || updateServicioPlanificado.isPending,
    checkCustodianConflicts,
    useCheckCustodianConflicts
  };
}
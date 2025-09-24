import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      const { error } = await supabase
        .from('servicios_planificados')
        .update({
          custodio_asignado: custodioName,
          custodio_id: custodioId,
          fecha_asignacion: new Date().toISOString(),
          estado_planeacion: 'asignado'
        })
        .eq('id_servicio', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Custodio asignado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
    },
    onError: (error) => {
      toast.error('Error al asignar custodio');
      console.error(error);
    }
  });

  const assignArmedGuard = useMutation({
    mutationFn: async ({ serviceId, armadoName, armadoId }: { 
      serviceId: string; 
      armadoName: string; 
      armadoId?: string;
    }) => {
      const { error } = await supabase
        .from('servicios_planificados')
        .update({
          armado_asignado: armadoName,
          armado_id: armadoId,
          fecha_asignacion_armado: new Date().toISOString()
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

  return {
    createServicioPlanificado: createServicioPlanificado.mutate,
    updateServicioPlanificado: updateServicioPlanificado.mutate,
    assignCustodian: assignCustodian.mutate,
    assignArmedGuard: assignArmedGuard.mutate,
    isCreating: createServicioPlanificado.isPending,
    isUpdating: updateServicioPlanificado.isPending,
    isLoading: isLoading || createServicioPlanificado.isPending || updateServicioPlanificado.isPending
  };
}
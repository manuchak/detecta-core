import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlanningOperationalConfig {
  id: string;
  velocidad_promedio_kmh: number;
  tiempo_descanso_minutos: number;
  bloqueo_automatico_habilitado: boolean;
  zona_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanningOperationalConfigInput {
  velocidad_promedio_kmh: number;
  tiempo_descanso_minutos: number;
  bloqueo_automatico_habilitado: boolean;
  zona_id?: string;
}

/**
 * Hook para obtener la configuración operacional de planeación
 */
export function usePlanningOperationalConfig(zona_id?: string) {
  return useQuery({
    queryKey: ['planning-operational-config', zona_id],
    queryFn: async () => {
      console.log('🔍 Obteniendo configuración operacional...');
      
      let query = supabase
        .from('planning_operational_config')
        .select('*')
        .order('zona_id', { nullsFirst: false }); // Global config first
      
      if (zona_id) {
        query = query.or(`zona_id.eq.${zona_id},zona_id.is.null`);
      } else {
        query = query.is('zona_id', null);
      }
      
      const { data, error } = await query.limit(1);
      
      if (error) {
        console.error('❌ Error al obtener configuración operacional:', error);
        throw error;
      }

      console.log(`✅ Configuración operacional obtenida:`, data?.[0]);
      return data?.[0] as PlanningOperationalConfig || null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para actualizar la configuración operacional
 */
export function useUpdatePlanningOperationalConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      config 
    }: { 
      id: string; 
      config: Partial<PlanningOperationalConfigInput> 
    }) => {
      console.log('⚙️ Actualizando configuración operacional:', config);

      const { data, error } = await supabase
        .from('planning_operational_config')
        .update(config)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error al actualizar configuración:', error);
        throw error;
      }

      console.log('✅ Configuración actualizada:', data);
      return data as PlanningOperationalConfig;
    },
    onSuccess: (data) => {
      // Invalidar todas las consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['planning-operational-config'] });
      
      toast.success('Configuración operacional actualizada exitosamente');
    },
    onError: (error) => {
      console.error('❌ Error en actualización de configuración:', error);
      toast.error('Error al actualizar la configuración operacional');
    }
  });
}

/**
 * Hook para crear nueva configuración operacional (por zona específica)
 */
export function useCreatePlanningOperationalConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: PlanningOperationalConfigInput) => {
      console.log('➕ Creando configuración operacional:', config);

      const { data, error } = await supabase
        .from('planning_operational_config')
        .insert(config)
        .select()
        .single();

      if (error) {
        console.error('❌ Error al crear configuración:', error);
        throw error;
      }

      console.log('✅ Configuración creada:', data);
      return data as PlanningOperationalConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-operational-config'] });
      toast.success('Configuración operacional creada exitosamente');
    },
    onError: (error) => {
      console.error('❌ Error en creación de configuración:', error);
      toast.error('Error al crear la configuración operacional');
    }
  });
}

/**
 * Hook para verificar disponibilidad de custodio
 */
export function useVerificarDisponibilidadCustodio() {
  return useMutation({
    mutationFn: async ({
      custodio_id,
      fecha_hora_inicio,
      km_teoricos = 0,
      zona_id
    }: {
      custodio_id: string;
      fecha_hora_inicio: string;
      km_teoricos?: number;
      zona_id?: string;
    }) => {
      console.log('🔍 Verificando disponibilidad del custodio:', custodio_id);

      const { data, error } = await supabase.rpc('verificar_disponibilidad_custodio', {
        p_custodio_id: custodio_id,
        p_fecha_hora_inicio: fecha_hora_inicio,
        p_km_teoricos: km_teoricos,
        p_zona_id: zona_id || null
      });

      if (error) {
        console.error('❌ Error al verificar disponibilidad:', error);
        throw error;
      }

      console.log('✅ Verificación de disponibilidad:', data);
      return data;
    }
  });
}

/**
 * Hook para calcular hora de fin estimada de servicio
 */
export function useCalcularHoraFinEstimada() {
  return useMutation({
    mutationFn: async ({
      km_teoricos,
      fecha_hora_inicio,
      zona_id
    }: {
      km_teoricos: number;
      fecha_hora_inicio: string;
      zona_id?: string;
    }) => {
      console.log('⏰ Calculando hora de fin estimada...');

      const { data, error } = await supabase.rpc('calcular_hora_fin_estimada_servicio', {
        p_km_teoricos: km_teoricos,
        p_fecha_hora_inicio: fecha_hora_inicio,
        p_zona_id: zona_id || null
      });

      if (error) {
        console.error('❌ Error al calcular hora de fin:', error);
        throw error;
      }

      console.log('✅ Hora de fin calculada:', data);
      return data;
    }
  });
}
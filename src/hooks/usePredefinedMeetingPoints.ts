import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface MeetingPoint {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion_completa: string;
  categoria: string;
  zona: string;
  activo: boolean;
  coordenadas?: any;
  created_at: string;
  updated_at: string;
  tipo_operacion: 'base_empresa' | 'direccion_personal' | 'base_proveedor' | 'general';
  armado_interno_id?: string;
  proveedor_id?: string;
  base_empresa?: string;
  auto_agregado: boolean;
  frecuencia_uso: number;
}

export interface CreateMeetingPointData {
  nombre: string;
  descripcion?: string;
  direccion_completa: string;
  categoria: string;
  zona: string;
  coordenadas?: any;
  tipo_operacion?: 'base_empresa' | 'direccion_personal' | 'base_proveedor' | 'general';
  armado_interno_id?: string;
  proveedor_id?: string;
  base_empresa?: string;
}

export interface UpdateMeetingPointData extends CreateMeetingPointData {
  activo?: boolean;
}

// Hook para obtener puntos de encuentro con filtros contextuales
export function usePredefinedMeetingPoints(filters?: {
  tipo_operacion?: string;
  armado_interno_id?: string;
  proveedor_id?: string;
  include_general?: boolean;
}) {
  return useQuery({
    queryKey: ['predefined-meeting-points', filters],
    queryFn: async () => {
      let query = supabase
        .from('puntos_encuentro_predefinidos')
        .select('*')
        .eq('activo', true);

      // Apply contextual filters
      if (filters?.tipo_operacion) {
        query = query.eq('tipo_operacion', filters.tipo_operacion);
      }
      
      if (filters?.armado_interno_id) {
        query = query.or(`armado_interno_id.eq.${filters.armado_interno_id},tipo_operacion.eq.general${filters.include_general !== false ? ',tipo_operacion.eq.base_empresa' : ''}`);
      }
      
      if (filters?.proveedor_id) {
        query = query.or(`proveedor_id.eq.${filters.proveedor_id},tipo_operacion.eq.general`);
      }

      // Order by frequency and then by name
      query = query.order('frecuencia_uso', { ascending: false })
                  .order('nombre', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data as MeetingPoint[];
    }
  });
}

// Hook para crear punto de encuentro
export function useCreateMeetingPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMeetingPointData) => {
      const { data: result, error } = await supabase
        .from('puntos_encuentro_predefinidos')
        .insert([{
          ...data,
          tipo_operacion: data.tipo_operacion || 'general'
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-meeting-points'] });
      toast({
        title: 'Punto creado',
        description: 'El punto de encuentro se creó exitosamente.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el punto de encuentro.',
        variant: 'destructive'
      });
    }
  });
}

// Hook para actualizar punto de encuentro
export function useUpdateMeetingPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMeetingPointData }) => {
      const { data: result, error } = await supabase
        .from('puntos_encuentro_predefinidos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-meeting-points'] });
      toast({
        title: 'Punto actualizado',
        description: 'El punto de encuentro se actualizó exitosamente.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el punto de encuentro.',
        variant: 'destructive'
      });
    }
  });
}

// Hook para eliminar punto de encuentro (soft delete)
export function useDeleteMeetingPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('puntos_encuentro_predefinidos')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-meeting-points'] });
      toast({
        title: 'Punto eliminado',
        description: 'El punto de encuentro se desactivó exitosamente.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el punto de encuentro.',
        variant: 'destructive'
      });
    }
  });
}

// Hook para incrementar uso de punto de encuentro
export function useIncrementMeetingPointUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pointId: string) => {
      const { error } = await supabase.rpc('increment_meeting_point_usage', {
        point_id: pointId
      });

      if (error) throw error;
      return pointId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-meeting-points'] });
    }
  });
}

// Hook para auto-agregar dirección personal
export function useAutoAddPersonalAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      armadoId,
      direccion,
      coordenadas
    }: {
      armadoId: string;
      direccion: string;
      coordenadas?: any;
    }) => {
      const { data, error } = await supabase.rpc('auto_add_personal_address', {
        p_armado_id: armadoId,
        p_direccion: direccion,
        p_coordenadas: coordenadas
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-meeting-points'] });
      toast({
        title: '📍 Dirección guardada',
        description: 'La dirección se agregó como favorita para este armado.'
      });
    },
    onError: (error: any) => {
      console.error('Error auto-adding personal address:', error);
    }
  });
}
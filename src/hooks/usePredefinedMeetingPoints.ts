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
}

export interface CreateMeetingPointData {
  nombre: string;
  descripcion?: string;
  direccion_completa: string;
  categoria: string;
  zona: string;
  coordenadas?: any;
}

export interface UpdateMeetingPointData extends CreateMeetingPointData {
  activo?: boolean;
}

// Hook para obtener puntos de encuentro
export function usePredefinedMeetingPoints() {
  return useQuery({
    queryKey: ['predefined-meeting-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('puntos_encuentro_predefinidos')
        .select('*')
        .order('zona', { ascending: true })
        .order('nombre', { ascending: true });

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
        .insert([data])
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
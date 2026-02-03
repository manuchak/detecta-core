import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustodioUpdateData {
  nombre: string;
  telefono: string | null;
  email: string | null;
  zona_base: string | null;
  experiencia_seguridad: boolean | null;
  vehiculo_propio: boolean | null;
}

export interface ArmadoUpdateData {
  nombre: string;
  telefono: string | null;
  email: string | null;
  zona_base: string | null;
  tipo_armado: string;
  licencia_portacion: string | null;
  fecha_vencimiento_licencia: string | null;
  experiencia_anos: number | null;
}

interface UpdateOperativeParams {
  id: string;
  tipo: 'custodio' | 'armado';
  data: Partial<CustodioUpdateData> | Partial<ArmadoUpdateData>;
}

export function useUpdateOperativeProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tipo, data }: UpdateOperativeParams) => {
      const table = tipo === 'custodio' ? 'custodios_operativos' : 'armados_operativos';
      
      const { error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      return { id, tipo };
    },
    onSuccess: ({ id, tipo }) => {
      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['operative-profile', tipo, id] });
      toast.success('Perfil actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    }
  });
}

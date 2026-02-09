import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Detencion {
  id: string;
  servicio_id: number;
  tipo_detencion: string;
  hora_inicio: string;
  hora_fin: string | null;
  duracion_minutos: number | null;
  motivo: string | null;
  ubicacion: string | null;
  cobrable_cliente: boolean;
  pagable_custodio: boolean;
  monto_cobro_cliente: number;
  monto_pago_custodio: number;
  registrado_por: string | null;
  created_at: string;
  updated_at: string;
}

export type TipoDetencion = 'carga' | 'descarga' | 'revision' | 'pernocta' | 'espera_cliente' | 'mecanica' | 'accidente' | 'otro';

export const TIPOS_DETENCION: Record<TipoDetencion, string> = {
  carga: 'Carga',
  descarga: 'Descarga',
  revision: 'Revisión',
  pernocta: 'Pernocta',
  espera_cliente: 'Espera Cliente',
  mecanica: 'Mecánica',
  accidente: 'Accidente',
  otro: 'Otro',
};

export interface CrearDetencionInput {
  servicio_id: number;
  tipo_detencion: TipoDetencion;
  hora_inicio: string;
  hora_fin?: string | null;
  motivo?: string;
  ubicacion?: string;
  cobrable_cliente?: boolean;
  pagable_custodio?: boolean;
  monto_cobro_cliente?: number;
  monto_pago_custodio?: number;
}

export function useDetenciones(servicioId: number | null) {
  return useQuery({
    queryKey: ['detenciones-servicio', servicioId],
    queryFn: async () => {
      if (!servicioId) return [];
      const { data, error } = await supabase
        .from('detenciones_servicio')
        .select('*')
        .eq('servicio_id', servicioId)
        .order('hora_inicio', { ascending: true });

      if (error) throw error;
      return (data || []) as Detencion[];
    },
    enabled: !!servicioId,
  });
}

export function useCrearDetencion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CrearDetencionInput) => {
      const { data, error } = await supabase
        .from('detenciones_servicio')
        .insert({
          servicio_id: input.servicio_id,
          tipo_detencion: input.tipo_detencion,
          hora_inicio: input.hora_inicio,
          hora_fin: input.hora_fin || null,
          motivo: input.motivo || null,
          ubicacion: input.ubicacion || null,
          cobrable_cliente: input.cobrable_cliente ?? false,
          pagable_custodio: input.pagable_custodio ?? false,
          monto_cobro_cliente: input.monto_cobro_cliente ?? 0,
          monto_pago_custodio: input.monto_pago_custodio ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['detenciones-servicio', variables.servicio_id] });
      toast.success('Detención registrada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar detención: ${error.message}`);
    },
  });
}

export function useEliminarDetencion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, servicioId }: { id: string; servicioId: number }) => {
      const { error } = await supabase
        .from('detenciones_servicio')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return servicioId;
    },
    onSuccess: (servicioId) => {
      queryClient.invalidateQueries({ queryKey: ['detenciones-servicio', servicioId] });
      toast.success('Detención eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

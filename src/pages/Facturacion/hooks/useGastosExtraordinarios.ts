import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GastoExtraordinario {
  id: string;
  servicio_custodia_id: number | null;
  cliente: string | null;
  tipo_gasto: string;
  descripcion: string;
  monto: number;
  moneda: string;
  cobrable_cliente: boolean;
  pagable_custodio: boolean;
  estado_reembolso: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  evidencia_url: string | null;
  notas: string | null;
  registrado_por: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateGastoData = Pick<
  GastoExtraordinario,
  'tipo_gasto' | 'descripcion' | 'monto' | 'cobrable_cliente' | 'pagable_custodio'
> & {
  servicio_custodia_id?: number;
  cliente?: string;
  moneda?: string;
  evidencia_url?: string;
  notas?: string;
};

const QUERY_KEY = 'gastos-extraordinarios';

export function useGastosExtraordinarios(filters?: { estado?: string; cliente?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('gastos_extraordinarios_servicio')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters?.estado && filters.estado !== 'todos') {
        query = query.eq('estado_reembolso', filters.estado);
      }
      if (filters?.cliente) {
        query = query.ilike('cliente', `%${filters.cliente}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as GastoExtraordinario[];
    },
    staleTime: 60_000,
  });
}

export function useCreateGastoExtraordinario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGastoData) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('gastos_extraordinarios_servicio')
        .insert({ ...data, registrado_por: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Gasto extraordinario registrado');
    },
    onError: () => toast.error('Error al registrar gasto'),
  });
}

export function useUpdateGastoExtraordinario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<GastoExtraordinario> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('gastos_extraordinarios_servicio')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Gasto actualizado');
    },
    onError: () => toast.error('Error al actualizar gasto'),
  });
}

export const TIPOS_GASTO = [
  { value: 'caseta_extra', label: 'Caseta Extra' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'combustible', label: 'Combustible' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'reparacion_vehicular', label: 'Reparación Vehicular' },
  { value: 'multa', label: 'Multa' },
  { value: 'peaje_adicional', label: 'Peaje Adicional' },
  { value: 'estacionamiento', label: 'Estacionamiento' },
  { value: 'propina_autorizada', label: 'Propina Autorizada' },
  { value: 'otro', label: 'Otro' },
];

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IncidenciaFacturacion {
  id: string;
  factura_id: string | null;
  servicio_custodia_id: number | null;
  cliente: string;
  tipo_incidencia: string;
  descripcion: string;
  monto_original: number | null;
  monto_ajustado: number | null;
  estado: 'abierta' | 'en_revision' | 'resuelta' | 'cerrada';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  reportado_por: string | null;
  asignado_a: string | null;
  resolucion: string | null;
  fecha_resolucion: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateIncidenciaData = Pick<
  IncidenciaFacturacion,
  'cliente' | 'tipo_incidencia' | 'descripcion' | 'prioridad'
> & {
  factura_id?: string;
  servicio_custodia_id?: number;
  monto_original?: number;
  monto_ajustado?: number;
};

const QUERY_KEY = 'incidencias-facturacion';

export function useIncidenciasFacturacion(estado?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, estado],
    queryFn: async () => {
      let query = supabase
        .from('incidencias_facturacion')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (estado && estado !== 'todas') {
        query = query.eq('estado', estado);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as IncidenciaFacturacion[];
    },
    staleTime: 60_000,
  });
}

export function useCreateIncidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIncidenciaData) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('incidencias_facturacion')
        .insert({ ...data, reportado_por: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Incidencia registrada');
    },
    onError: () => toast.error('Error al registrar incidencia'),
  });
}

export function useUpdateIncidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<IncidenciaFacturacion> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('incidencias_facturacion')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Incidencia actualizada');
    },
    onError: () => toast.error('Error al actualizar incidencia'),
  });
}

export const TIPOS_INCIDENCIA = [
  { value: 'discrepancia_monto', label: 'Discrepancia de Monto' },
  { value: 'servicio_no_reconocido', label: 'Servicio No Reconocido' },
  { value: 'factura_duplicada', label: 'Factura Duplicada' },
  { value: 'datos_fiscales_incorrectos', label: 'Datos Fiscales Incorrectos' },
  { value: 'nota_credito', label: 'Nota de Crédito' },
  { value: 'ajuste_precio', label: 'Ajuste de Precio' },
  { value: 'cancelacion', label: 'Cancelación' },
  { value: 'rechazo_cliente', label: 'Rechazo de Cliente' },
  { value: 'error_ruta', label: 'Error de Ruta' },
  { value: 'otro', label: 'Otro' },
];

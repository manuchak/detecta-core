import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SolicitudApoyo {
  id: string;
  servicio_custodia_id: number | null;
  id_servicio: string | null;
  custodio_id: string | null;
  custodio_nombre: string | null;
  cliente_nombre: string | null;
  tipo_apoyo: string;
  motivo: string;
  monto_solicitado: number;
  monto_aprobado: number | null;
  moneda: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'pagado' | 'cancelado';
  urgencia: 'baja' | 'normal' | 'alta' | 'critica';
  solicitado_por: string | null;
  fecha_solicitud: string;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  motivo_rechazo: string | null;
  metodo_pago: string | null;
  referencia_pago: string | null;
  fecha_pago: string | null;
  pagado_por: string | null;
  comprobante_url: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = 'apoyos-extraordinarios';

export const TIPOS_APOYO = [
  { value: 'regreso_base', label: 'Regreso a Base' },
  { value: 'traslado_destino', label: 'Traslado a Destino' },
  { value: 'alimentacion', label: 'Alimentación' },
  { value: 'hospedaje', label: 'Hospedaje' },
  { value: 'transporte_alterno', label: 'Transporte Alterno' },
  { value: 'otro', label: 'Otro' },
];

export function useApoyosExtraordinarios(filters?: { estado?: string; urgencia?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('solicitudes_apoyo_extraordinario')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters?.estado && filters.estado !== 'todos') {
        query = query.eq('estado', filters.estado);
      }
      if (filters?.urgencia && filters.urgencia !== 'todos') {
        query = query.eq('urgencia', filters.urgencia);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SolicitudApoyo[];
    },
    staleTime: 30_000,
  });
}

export function useCreateApoyo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Pick<SolicitudApoyo, 'tipo_apoyo' | 'motivo' | 'monto_solicitado' | 'urgencia'> & {
      servicio_custodia_id?: number;
      id_servicio?: string;
      custodio_id?: string;
      custodio_nombre?: string;
      cliente_nombre?: string;
      notas?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .insert({ ...data, solicitado_por: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Solicitud de apoyo creada');
    },
    onError: () => toast.error('Error al crear solicitud'),
  });
}

export function useAprobarApoyo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, monto_aprobado }: { id: string; monto_aprobado: number }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .update({
          estado: 'aprobado',
          monto_aprobado,
          aprobado_por: user.user?.id,
          fecha_aprobacion: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Apoyo aprobado');
    },
    onError: () => toast.error('Error al aprobar'),
  });
}

export function useRechazarApoyo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo_rechazo }: { id: string; motivo_rechazo: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .update({
          estado: 'rechazado',
          motivo_rechazo,
          aprobado_por: user.user?.id,
          fecha_aprobacion: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Apoyo rechazado');
    },
    onError: () => toast.error('Error al rechazar'),
  });
}

export function useRegistrarPagoApoyo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, metodo_pago, referencia_pago }: { id: string; metodo_pago: string; referencia_pago: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .update({
          estado: 'pagado',
          metodo_pago,
          referencia_pago,
          fecha_pago: new Date().toISOString(),
          pagado_por: user.user?.id,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Pago registrado');
    },
    onError: () => toast.error('Error al registrar pago'),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CSQueja {
  id: string;
  numero_queja: string;
  cliente_id: string;
  servicio_id: string | null;
  tipo: string;
  severidad: string;
  canal_entrada: string;
  descripcion: string;
  evidencia_urls: string[] | null;
  estado: string;
  asignado_a: string | null;
  ejecutivo_cuenta: string | null;
  causa_raiz: string | null;
  accion_correctiva: string | null;
  accion_preventiva: string | null;
  fecha_compromiso: string | null;
  fecha_resolucion: string | null;
  calificacion_cierre: number | null;
  requiere_capa: boolean;
  capa_id: string | null;
  sla_respuesta_horas: number;
  sla_resolucion_horas: number;
  primera_respuesta_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  cliente?: { nombre_comercial: string; razon_social: string } | null;
}

export type CSQuejaInsert = {
  cliente_id: string;
  servicio_id?: string;
  tipo: string;
  severidad: string;
  canal_entrada: string;
  descripcion: string;
  evidencia_urls?: string[];
  asignado_a?: string;
  ejecutivo_cuenta?: string;
  fecha_compromiso?: string;
  sla_respuesta_horas?: number;
  sla_resolucion_horas?: number;
};

export type CSQuejaUpdate = Partial<CSQuejaInsert> & {
  estado?: string;
  causa_raiz?: string;
  accion_correctiva?: string;
  accion_preventiva?: string;
  fecha_resolucion?: string;
  calificacion_cierre?: number;
  requiere_capa?: boolean;
  capa_id?: string;
  primera_respuesta_at?: string;
};

export function useCSQuejas(filters?: { estado?: string; tipo?: string; severidad?: string; cliente_id?: string }) {
  return useQuery({
    queryKey: ['cs-quejas', filters],
    queryFn: async () => {
      let query = supabase
        .from('cs_quejas')
        .select('*, cliente:pc_clientes(nombre_comercial, razon_social)')
        .order('created_at', { ascending: false });

      if (filters?.estado) query = query.eq('estado', filters.estado);
      if (filters?.tipo) query = query.eq('tipo', filters.tipo);
      if (filters?.severidad) query = query.eq('severidad', filters.severidad);
      if (filters?.cliente_id) query = query.eq('cliente_id', filters.cliente_id);

      const { data, error } = await query;
      if (error) throw error;
      return data as CSQueja[];
    },
  });
}

export function useCSQueja(id: string | undefined) {
  return useQuery({
    queryKey: ['cs-queja', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cs_quejas')
        .select('*, cliente:pc_clientes(nombre_comercial, razon_social)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as CSQueja;
    },
  });
}

export function useCreateCSQueja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CSQuejaInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('cs_quejas')
        .insert({ ...input, numero_queja: '', created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-quejas'] });
      toast.success('Queja registrada exitosamente');
    },
    onError: (e: any) => toast.error('Error al registrar queja: ' + e.message),
  });
}

export function useUpdateCSQueja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: CSQuejaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('cs_quejas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-quejas'] });
      qc.invalidateQueries({ queryKey: ['cs-queja'] });
      toast.success('Queja actualizada');
    },
    onError: (e: any) => toast.error('Error al actualizar: ' + e.message),
  });
}

export function useCSQuejaStats() {
  return useQuery({
    queryKey: ['cs-quejas-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cs_quejas')
        .select('estado, tipo, severidad, created_at, fecha_resolucion, calificacion_cierre, sla_resolucion_horas');
      if (error) throw error;

      const abiertas = data.filter(q => q.estado !== 'cerrada').length;
      const cerradasMes = data.filter(q => {
        if (q.estado !== 'cerrada' || !q.fecha_resolucion) return false;
        const d = new Date(q.fecha_resolucion);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      const conCalificacion = data.filter(q => q.calificacion_cierre);
      const csatPromedio = conCalificacion.length
        ? conCalificacion.reduce((s, q) => s + (q.calificacion_cierre || 0), 0) / conCalificacion.length
        : 0;

      // SLA compliance
      const cerradas = data.filter(q => q.fecha_resolucion && q.created_at);
      const enSLA = cerradas.filter(q => {
        const created = new Date(q.created_at).getTime();
        const resolved = new Date(q.fecha_resolucion!).getTime();
        const hoursToResolve = (resolved - created) / (1000 * 60 * 60);
        return hoursToResolve <= (q.sla_resolucion_horas || 72);
      });
      const slaCompliance = cerradas.length ? (enSLA.length / cerradas.length) * 100 : 100;

      // By type
      const porTipo: Record<string, number> = {};
      data.forEach(q => { porTipo[q.tipo] = (porTipo[q.tipo] || 0) + 1; });

      return { abiertas, cerradasMes, csatPromedio, slaCompliance, porTipo, total: data.length };
    },
  });
}

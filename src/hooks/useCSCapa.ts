import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CSCAPA {
  id: string;
  numero_capa: string;
  queja_id: string | null;
  cliente_id: string;
  tipo: string;
  descripcion_no_conformidad: string;
  analisis_causa_raiz: string | null;
  accion_inmediata: string | null;
  accion_correctiva: string | null;
  accion_preventiva: string | null;
  responsable_id: string | null;
  fecha_implementacion: string | null;
  fecha_verificacion: string | null;
  eficacia_verificada: boolean;
  estado: string;
  created_at: string;
  updated_at: string;
  cliente?: { nombre_comercial: string } | null;
}

export type CSCAPAInsert = {
  queja_id?: string;
  cliente_id: string;
  tipo: string;
  descripcion_no_conformidad: string;
  analisis_causa_raiz?: string;
  accion_inmediata?: string;
  accion_correctiva?: string;
  accion_preventiva?: string;
  responsable_id?: string;
  fecha_implementacion?: string;
  fecha_verificacion?: string;
};

export type CSCAPAUpdate = Partial<CSCAPAInsert> & {
  estado?: string;
  eficacia_verificada?: boolean;
};

export function useCSCapas(filters?: { estado?: string }) {
  return useQuery({
    queryKey: ['cs-capas', filters],
    queryFn: async () => {
      let query = supabase
        .from('cs_capa')
        .select('*, cliente:pc_clientes(nombre_comercial)')
        .order('created_at', { ascending: false });

      if (filters?.estado) query = query.eq('estado', filters.estado);

      const { data, error } = await query;
      if (error) throw error;
      return data as CSCAPA[];
    },
  });
}

export function useCreateCSCapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CSCAPAInsert) => {
      const { data, error } = await supabase
        .from('cs_capa')
        .insert({ ...input, numero_capa: '' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-capas'] });
      toast.success('CAPA creado exitosamente');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useUpdateCSCapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: CSCAPAUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('cs_capa')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-capas'] });
      toast.success('CAPA actualizado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

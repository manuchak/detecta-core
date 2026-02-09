import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EvidenciaGasto {
  id: string;
  servicio_id: number;
  tipo_gasto: string;
  descripcion: string | null;
  monto: number;
  moneda: string;
  archivo_url: string | null;
  archivo_nombre: string | null;
  verificado: boolean;
  verificado_por: string | null;
  fecha_verificacion: string | null;
  cobrable_cliente: boolean;
  pagable_custodio: boolean;
  notas: string | null;
  registrado_por: string | null;
  created_at: string;
  updated_at: string;
}

export type TipoGasto = 'caseta' | 'hotel' | 'estadia' | 'combustible' | 'alimentos' | 'otro';

export const TIPOS_GASTO: Record<TipoGasto, string> = {
  caseta: 'Caseta',
  hotel: 'Hotel',
  estadia: 'Estadía',
  combustible: 'Combustible',
  alimentos: 'Alimentos',
  otro: 'Otro',
};

export interface CrearEvidenciaInput {
  servicio_id: number;
  tipo_gasto: TipoGasto;
  descripcion?: string;
  monto: number;
  archivo?: File;
  cobrable_cliente?: boolean;
  pagable_custodio?: boolean;
  notas?: string;
}

export function useEvidenciasGastos(servicioId: number | null) {
  return useQuery({
    queryKey: ['evidencias-gastos', servicioId],
    queryFn: async () => {
      if (!servicioId) return [];
      const { data, error } = await supabase
        .from('evidencias_gastos_servicio')
        .select('*')
        .eq('servicio_id', servicioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EvidenciaGasto[];
    },
    enabled: !!servicioId,
  });
}

export function useCrearEvidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CrearEvidenciaInput) => {
      let archivoUrl: string | null = null;
      let archivoNombre: string | null = null;

      // Subir archivo si existe
      if (input.archivo) {
        const fileExt = input.archivo.name.split('.').pop();
        const fileName = `${input.servicio_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('evidencias-gastos')
          .upload(fileName, input.archivo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('evidencias-gastos')
          .getPublicUrl(fileName);

        archivoUrl = urlData.publicUrl;
        archivoNombre = input.archivo.name;
      }

      const { data, error } = await supabase
        .from('evidencias_gastos_servicio')
        .insert({
          servicio_id: input.servicio_id,
          tipo_gasto: input.tipo_gasto,
          descripcion: input.descripcion || null,
          monto: input.monto,
          archivo_url: archivoUrl,
          archivo_nombre: archivoNombre,
          cobrable_cliente: input.cobrable_cliente ?? false,
          pagable_custodio: input.pagable_custodio ?? false,
          notas: input.notas || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evidencias-gastos', variables.servicio_id] });
      toast.success('Evidencia registrada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar evidencia: ${error.message}`);
    },
  });
}

export function useVerificarEvidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, servicioId, verificadoPor }: { id: string; servicioId: number; verificadoPor: string }) => {
      const { error } = await supabase
        .from('evidencias_gastos_servicio')
        .update({
          verificado: true,
          verificado_por: verificadoPor,
          fecha_verificacion: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return servicioId;
    },
    onSuccess: (servicioId) => {
      queryClient.invalidateQueries({ queryKey: ['evidencias-gastos', servicioId] });
      toast.success('Evidencia verificada');
    },
    onError: (error: Error) => {
      toast.error(`Error al verificar: ${error.message}`);
    },
  });
}

export function useEliminarEvidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, servicioId }: { id: string; servicioId: number }) => {
      const { error } = await supabase
        .from('evidencias_gastos_servicio')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return servicioId;
    },
    onSuccess: (servicioId) => {
      queryClient.invalidateQueries({ queryKey: ['evidencias-gastos', servicioId] });
      toast.success('Evidencia eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

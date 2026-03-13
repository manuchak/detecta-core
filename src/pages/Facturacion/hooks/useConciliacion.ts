import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ConciliacionLine } from '../services/conciliacionParserService';

export interface Conciliacion {
  id: string;
  cxp_id: string;
  archivo_nombre: string | null;
  archivo_url: string | null;
  columnas_mapeo: Record<string, string> | null;
  total_filas_proveedor: number;
  total_filas_detecta: number;
  coincidencias: number;
  discrepancias_monto: number;
  solo_proveedor: number;
  solo_detecta: number;
  estado: string;
  created_at: string;
  created_by: string | null;
}

export interface ConciliacionDetalle {
  id: string;
  conciliacion_id: string;
  asignacion_id: string | null;
  fila_proveedor: Record<string, any> | null;
  resultado: string;
  monto_detecta: number | null;
  monto_proveedor: number | null;
  diferencia: number | null;
  monto_final: number | null;
  resolucion: string;
  notas_finanzas: string | null;
  created_at: string;
}

const QK = 'conciliacion';

export function useConciliacion(cxpId?: string) {
  return useQuery({
    queryKey: [QK, cxpId],
    queryFn: async () => {
      if (!cxpId) return null;
      const { data, error } = await supabase
        .from('conciliacion_proveedor_armados')
        .select('*')
        .eq('cxp_id', cxpId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Conciliacion | null;
    },
    enabled: !!cxpId,
  });
}

export function useConciliacionDetalle(conciliacionId?: string) {
  return useQuery({
    queryKey: [QK, 'detalle', conciliacionId],
    queryFn: async () => {
      if (!conciliacionId) return [];
      const { data, error } = await supabase
        .from('conciliacion_detalle')
        .select('*')
        .eq('conciliacion_id', conciliacionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ConciliacionDetalle[];
    },
    enabled: !!conciliacionId,
  });
}

export function useCreateConciliacion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      cxpId: string;
      filename: string;
      mapping: Record<string, string>;
      lines: ConciliacionLine[];
      totalFilasDetecta: number;
      totalFilasProveedor: number;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const coincidencias = params.lines.filter(l => l.resultado === 'coincide').length;
      const discrepancias = params.lines.filter(l => l.resultado === 'discrepancia_monto').length;
      const soloProveedor = params.lines.filter(l => l.resultado === 'solo_proveedor').length;
      const soloDetecta = params.lines.filter(l => l.resultado === 'solo_detecta').length;

      // Create header
      const { data: conc, error } = await supabase
        .from('conciliacion_proveedor_armados')
        .insert({
          cxp_id: params.cxpId,
          archivo_nombre: params.filename,
          columnas_mapeo: params.mapping,
          total_filas_proveedor: params.totalFilasProveedor,
          total_filas_detecta: params.totalFilasDetecta,
          coincidencias,
          discrepancias_monto: discrepancias,
          solo_proveedor: soloProveedor,
          solo_detecta: soloDetecta,
          estado: 'pendiente',
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert detail lines
      if (params.lines.length > 0) {
        const detalles = params.lines.map(l => ({
          conciliacion_id: conc.id,
          asignacion_id: l.asignacion_id,
          fila_proveedor: l.fila_proveedor,
          resultado: l.resultado,
          monto_detecta: l.monto_detecta,
          monto_proveedor: l.monto_proveedor,
          diferencia: l.diferencia,
          monto_final: l.resultado === 'coincide' ? l.monto_detecta : null,
          resolucion: l.resultado === 'coincide' ? 'aceptado' : 'pendiente',
        }));

        const { error: detErr } = await supabase
          .from('conciliacion_detalle')
          .insert(detalles);
        if (detErr) throw detErr;
      }

      return conc;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success('Conciliación ejecutada exitosamente');
    },
    onError: (e: any) => toast.error(`Error en conciliación: ${e.message}`),
  });
}

export function useUpdateDetalleResolucion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      resolucion: string;
      monto_final?: number | null;
      notas_finanzas?: string | null;
    }) => {
      const { error } = await supabase
        .from('conciliacion_detalle')
        .update({
          resolucion: params.resolucion,
          monto_final: params.monto_final ?? null,
          notas_finanzas: params.notas_finanzas ?? null,
        })
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success('Resolución actualizada');
    },
    onError: () => toast.error('Error al actualizar resolución'),
  });
}

export function useFinalizeConciliacion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (conciliacionId: string) => {
      const { error } = await supabase
        .from('conciliacion_proveedor_armados')
        .update({ estado: 'conciliado' })
        .eq('id', conciliacionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      qc.invalidateQueries({ queryKey: ['cxp-proveedores'] });
      toast.success('Conciliación finalizada');
    },
    onError: () => toast.error('Error al finalizar'),
  });
}

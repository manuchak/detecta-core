import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CxPProveedor {
  id: string;
  proveedor_id: string;
  periodo_inicio: string;
  periodo_fin: string;
  total_servicios: number;
  monto_servicios: number;
  monto_gastos_extra: number;
  monto_deducciones: number;
  monto_total: number;
  estado: 'borrador' | 'revision' | 'aprobado' | 'pagado' | 'cancelado';
  factura_proveedor: string | null;
  fecha_factura_proveedor: string | null;
  fecha_vencimiento: string | null;
  metodo_pago: string | null;
  referencia_pago: string | null;
  fecha_pago: string | null;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  proveedor_nombre?: string;
}

export interface CxPDetalle {
  id: string;
  cxp_id: string;
  asignacion_id: string;
  monto_servicio: number;
  monto_gasto_extra: number;
  monto_deduccion: number;
  notas: string | null;
  created_at: string;
}

const QUERY_KEY = 'cxp-proveedores';

export function useCxPProveedores(estado?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, estado],
    queryFn: async () => {
      let query = supabase
        .from('cxp_proveedores_armados')
        .select(`
          *,
          proveedores_armados(nombre_empresa)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (estado && estado !== 'todos') {
        query = query.eq('estado', estado);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        proveedor_nombre: d.proveedores_armados?.nombre_empresa || 'N/A',
      })) as CxPProveedor[];
    },
    staleTime: 60_000,
  });
}

export function useCxPDetalle(cxpId?: string) {
  return useQuery({
    queryKey: ['cxp-detalle', cxpId],
    queryFn: async () => {
      if (!cxpId) return [];
      const { data, error } = await supabase
        .from('cxp_detalle_servicios')
        .select('*')
        .eq('cxp_id', cxpId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CxPDetalle[];
    },
    enabled: !!cxpId,
  });
}

export function useCreateCxP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      proveedor_id: string;
      periodo_inicio: string;
      periodo_fin: string;
      notas?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      // Fetch completed assignments for this provider in the period
      const { data: asignaciones, error: fetchErr } = await supabase
        .from('asignacion_armados')
        .select('id, tarifa_acordada')
        .eq('proveedor_armado_id', data.proveedor_id)
        .eq('tipo_asignacion', 'proveedor')
        .eq('estado_asignacion', 'completado')
        .gte('hora_encuentro', `${data.periodo_inicio}T00:00:00`)
        .lte('hora_encuentro', `${data.periodo_fin}T23:59:59`);

      if (fetchErr) throw fetchErr;

      const totalServicios = asignaciones?.length || 0;
      const montoServicios = asignaciones?.reduce((s, a) => s + (Number(a.tarifa_acordada) || 0), 0) || 0;

      // Create CxP header
      const { data: cxp, error } = await supabase
        .from('cxp_proveedores_armados')
        .insert({
          proveedor_id: data.proveedor_id,
          periodo_inicio: data.periodo_inicio,
          periodo_fin: data.periodo_fin,
          total_servicios: totalServicios,
          monto_servicios: montoServicios,
          monto_total: montoServicios,
          notas: data.notas,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert detail lines
      if (asignaciones && asignaciones.length > 0) {
        const detalles = asignaciones.map(a => ({
          cxp_id: cxp.id,
          asignacion_id: a.id,
          monto_servicio: Number(a.tarifa_acordada) || 0,
        }));

        await supabase.from('cxp_detalle_servicios').insert(detalles);
      }

      return cxp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Estado de cuenta creado');
    },
    onError: () => toast.error('Error al crear estado de cuenta'),
  });
}

export function useUpdateCxP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CxPProveedor> & { id: string }) => {
      const updateData: any = { ...data };
      delete updateData.proveedor_nombre;
      delete updateData.proveedores_armados;

      const { data: result, error } = await supabase
        .from('cxp_proveedores_armados')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Estado de cuenta actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });
}

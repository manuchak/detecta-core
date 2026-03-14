import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InventarioGadget {
  id: string;
  serial: string;
  tipo: string;
  proveedor_nombre: string | null;
  es_propio: boolean;
  renta_mensual: number;
  estado: string;
  fecha_alta: string;
  fecha_baja: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentaGadgetMensual {
  id: string;
  mes: string;
  total_unidades: number;
  renta_por_unidad: number;
  monto_total: number;
  proveedor: string | null;
  factura_proveedor: string | null;
  estado: string;
  fecha_pago: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
}

const INVENTARIO_KEY = 'inventario-gadgets';
const RENTAS_KEY = 'rentas-gadgets-mensuales';

export function useInventarioGadgets(filters?: { tipo?: string; estado?: string }) {
  return useQuery({
    queryKey: [INVENTARIO_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('inventario_gadgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.tipo && filters.tipo !== 'todos') {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.estado && filters.estado !== 'todos') {
        query = query.eq('estado', filters.estado);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as InventarioGadget[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertInventarioGadget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<InventarioGadget> & { serial: string; tipo: string }) => {
      if (data.id) {
        const { id, created_at, updated_at, ...rest } = data;
        const { data: updated, error } = await supabase.from('inventario_gadgets').update(rest).eq('id', id).select('id');
        if (error) throw error;
        if (!updated || updated.length === 0) throw new Error('No se pudo actualizar el gadget — posible bloqueo de permisos');
      } else {
        const { id, created_at, updated_at, ...rest } = data;
        const { data: inserted, error } = await supabase.from('inventario_gadgets').insert(rest).select('id');
        if (error) throw error;
        if (!inserted || inserted.length === 0) throw new Error('No se pudo crear el gadget — posible bloqueo de permisos');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVENTARIO_KEY] });
      toast.success('Gadget guardado');
    },
    onError: (e: any) => toast.error(e.message || 'Error al guardar gadget'),
  });
}

export function useDeleteInventarioGadget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventario_gadgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVENTARIO_KEY] });
      toast.success('Gadget eliminado');
    },
    onError: () => toast.error('Error al eliminar'),
  });
}

export function useRentasGadgets(filtroEstado?: string) {
  return useQuery({
    queryKey: [RENTAS_KEY, filtroEstado],
    queryFn: async () => {
      let query = supabase
        .from('rentas_gadgets_mensuales')
        .select('*')
        .order('mes', { ascending: false })
        .limit(50);

      if (filtroEstado && filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RentaGadgetMensual[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertRentaGadget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RentaGadgetMensual> & { mes: string }) => {
      if (data.id) {
        const { id, created_at, created_by, ...rest } = data;
        const { error } = await supabase.from('rentas_gadgets_mensuales').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { id, created_at, created_by, ...rest } = data;
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase.from('rentas_gadgets_mensuales').insert({
          ...rest,
          created_by: user.user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RENTAS_KEY] });
      toast.success('Renta guardada');
    },
    onError: () => toast.error('Error al guardar renta'),
  });
}

// P&L calculation hook
export function useGadgetsPnL(mes?: string) {
  return useQuery({
    queryKey: ['gadgets-pnl', mes],
    queryFn: async () => {
      // Egresos: rentas del mes
      const targetMes = mes || new Date().toISOString().slice(0, 7);

      const { data: rentas } = await supabase
        .from('rentas_gadgets_mensuales')
        .select('monto_total, total_unidades, renta_por_unidad, proveedor')
        .eq('mes', targetMes);

      const totalEgresos = (rentas || []).reduce((s, r) => s + (Number(r.monto_total) || 0), 0);
      const totalUnidadesRentadas = (rentas || []).reduce((s, r) => s + (r.total_unidades || 0), 0);

      // Inventario counts
      const { data: inventario } = await supabase
        .from('inventario_gadgets')
        .select('tipo, es_propio, estado')
        .eq('estado', 'activo');

      const totalActivos = inventario?.length || 0;
      const totalPropios = inventario?.filter(g => g.es_propio).length || 0;
      const totalRentados = inventario?.filter(g => !g.es_propio).length || 0;

      // Ingresos: servicios con gadget en el mes, cruzado con precio del cliente
      const mesStart = `${targetMes}-01`;
      const mesEnd = `${targetMes}-31`;

      const { data: serviciosConGadget } = await supabase
        .from('servicios_custodia')
        .select('id, gadget, tipo_gadget, nombre_cliente, cliente_id')
        .not('gadget', 'is', null)
        .gte('fecha_servicio', mesStart)
        .lte('fecha_servicio', mesEnd);

      // Get client gadget prices
      const clienteIds = [...new Set((serviciosConGadget || []).map(s => s.cliente_id).filter(Boolean))];
      let preciosMap: Record<string, number> = {};

      if (clienteIds.length > 0) {
        const { data: precios } = await supabase
          .from('pc_clientes_gadgets')
          .select('cliente_id, tipo, precio')
          .in('cliente_id', clienteIds)
          .eq('activo', true);

        (precios || []).forEach(p => {
          preciosMap[`${p.cliente_id}_${p.tipo}`] = Number(p.precio) || 0;
        });
      }

      let totalIngresos = 0;
      let serviciosFacturados = 0;

      (serviciosConGadget || []).forEach(s => {
        const key = `${s.cliente_id}_${s.tipo_gadget}`;
        const precio = preciosMap[key] || 0;
        if (precio > 0) {
          totalIngresos += precio;
          serviciosFacturados++;
        }
      });

      return {
        mes: targetMes,
        ingresos: totalIngresos,
        egresos: totalEgresos,
        margen: totalIngresos - totalEgresos,
        margenPct: totalIngresos > 0 ? ((totalIngresos - totalEgresos) / totalIngresos) * 100 : 0,
        serviciosConGadget: serviciosConGadget?.length || 0,
        serviciosFacturados,
        totalActivos,
        totalPropios,
        totalRentados,
        totalUnidadesRentadas,
        detalleRentas: rentas || [],
      };
    },
    staleTime: 120_000,
  });
}

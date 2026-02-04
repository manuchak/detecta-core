import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

export interface AccionPendiente {
  id: string;
  tipo: 'vencimiento' | 'promesa' | 'seguimiento' | 'llamada';
  prioridad: 'alta' | 'media' | 'baja';
  cliente_id: string;
  cliente_nombre: string;
  descripcion: string;
  monto?: number;
  fecha_accion: string;
  factura_id?: string;
  numero_factura?: string;
  promesa_cumplida?: boolean;
}

export interface AgendaMetrics {
  llamadasPendientes: number;
  vencenHoy: number;
  vencenSemana: number;
  montoVenceSemana: number;
  promesasPago: number;
}

export function useAgendaCobranza() {
  return useQuery({
    queryKey: ['agenda-cobranza'],
    queryFn: async () => {
      console.log('[useAgendaCobranza] Fetching agenda data');

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const weekEndStr = format(addDays(today, 7), 'yyyy-MM-dd');

      const acciones: AccionPendiente[] = [];

      // 1. Get facturas that expire today
      const { data: facturasHoy, error: facturasHoyError } = await supabase
        .from('facturas')
        .select('id, numero_factura, cliente_id, cliente_nombre, total, fecha_vencimiento')
        .eq('fecha_vencimiento', todayStr)
        .in('estado', ['pendiente', 'parcial']);

      if (facturasHoyError) {
        console.error('[useAgendaCobranza] Error facturas hoy:', facturasHoyError);
      } else {
        (facturasHoy || []).forEach(f => {
          acciones.push({
            id: `venc-${f.id}`,
            tipo: 'vencimiento',
            prioridad: 'alta',
            cliente_id: f.cliente_id || '',
            cliente_nombre: f.cliente_nombre || 'Sin nombre',
            descripcion: `Factura ${f.numero_factura} vence hoy`,
            monto: Number(f.total),
            fecha_accion: f.fecha_vencimiento,
            factura_id: f.id,
            numero_factura: f.numero_factura,
          });
        });
      }

      // 2. Get facturas that expire this week
      const { data: facturasSemana, error: facturasSemanaError } = await supabase
        .from('facturas')
        .select('id, numero_factura, cliente_id, cliente_nombre, total, fecha_vencimiento')
        .gt('fecha_vencimiento', todayStr)
        .lte('fecha_vencimiento', weekEndStr)
        .in('estado', ['pendiente', 'parcial']);

      if (facturasSemanaError) {
        console.error('[useAgendaCobranza] Error facturas semana:', facturasSemanaError);
      } else {
        (facturasSemana || []).forEach(f => {
          acciones.push({
            id: `venc-sem-${f.id}`,
            tipo: 'vencimiento',
            prioridad: 'media',
            cliente_id: f.cliente_id || '',
            cliente_nombre: f.cliente_nombre || 'Sin nombre',
            descripcion: `Factura ${f.numero_factura} vence el ${format(new Date(f.fecha_vencimiento), 'dd/MM')}`,
            monto: Number(f.total),
            fecha_accion: f.fecha_vencimiento,
            factura_id: f.id,
            numero_factura: f.numero_factura,
          });
        });
      }

      // 3. Get pending payment promises (promesas_pago with fecha_promesa_pago <= today and promesa_cumplida = false or null)
      const { data: promesas, error: promesasError } = await supabase
        .from('cobranza_seguimiento')
        .select('id, cliente_id, tipo_accion, descripcion, fecha_promesa_pago, monto_prometido, promesa_cumplida')
        .eq('tipo_accion', 'promesa_pago')
        .lte('fecha_promesa_pago', todayStr)
        .or('promesa_cumplida.is.null,promesa_cumplida.eq.false');

      if (promesasError) {
        console.error('[useAgendaCobranza] Error promesas:', promesasError);
      } else {
        // Get client names for promesas
        const clienteIds = [...new Set((promesas || []).filter(p => p.cliente_id).map(p => p.cliente_id))];
        
        let clientesMap: Record<string, string> = {};
        if (clienteIds.length > 0) {
          const { data: clientes } = await supabase
            .from('pc_clientes')
            .select('id, nombre')
            .in('id', clienteIds as string[]);

          (clientes || []).forEach(c => {
            clientesMap[c.id] = c.nombre;
          });
        }

        (promesas || []).forEach(p => {
          const isOverdue = p.fecha_promesa_pago && new Date(p.fecha_promesa_pago) < today;
          acciones.push({
            id: `prom-${p.id}`,
            tipo: 'promesa',
            prioridad: isOverdue ? 'alta' : 'media',
            cliente_id: p.cliente_id || '',
            cliente_nombre: p.cliente_id ? (clientesMap[p.cliente_id] || 'Sin nombre') : 'Sin nombre',
            descripcion: isOverdue 
              ? `Promesa de pago vencida - ${p.descripcion?.substring(0, 50) || 'Sin descripción'}`
              : `Promesa de pago para hoy - ${p.descripcion?.substring(0, 50) || 'Sin descripción'}`,
            monto: p.monto_prometido ? Number(p.monto_prometido) : undefined,
            fecha_accion: p.fecha_promesa_pago || todayStr,
            promesa_cumplida: p.promesa_cumplida || false,
          });
        });
      }

      // 4. Get scheduled follow-ups for today
      const { data: seguimientos, error: seguimientosError } = await supabase
        .from('cobranza_seguimiento')
        .select('id, cliente_id, tipo_accion, descripcion, proxima_accion')
        .eq('proxima_accion', todayStr);

      if (seguimientosError) {
        console.error('[useAgendaCobranza] Error seguimientos:', seguimientosError);
      } else {
        // Get client names
        const clienteIds = [...new Set((seguimientos || []).filter(s => s.cliente_id).map(s => s.cliente_id))];
        
        let clientesMap: Record<string, string> = {};
        if (clienteIds.length > 0) {
          const { data: clientes } = await supabase
            .from('pc_clientes')
            .select('id, nombre')
            .in('id', clienteIds as string[]);

          (clientes || []).forEach(c => {
            clientesMap[c.id] = c.nombre;
          });
        }

        (seguimientos || []).forEach(s => {
          acciones.push({
            id: `seg-${s.id}`,
            tipo: s.tipo_accion === 'llamada' ? 'llamada' : 'seguimiento',
            prioridad: 'media',
            cliente_id: s.cliente_id || '',
            cliente_nombre: s.cliente_id ? (clientesMap[s.cliente_id] || 'Sin nombre') : 'Sin nombre',
            descripcion: `Seguimiento programado: ${s.descripcion?.substring(0, 50) || s.tipo_accion}`,
            fecha_accion: s.proxima_accion || todayStr,
          });
        });
      }

      // Calculate metrics
      const metrics: AgendaMetrics = {
        llamadasPendientes: acciones.filter(a => a.tipo === 'llamada' || a.tipo === 'seguimiento').length,
        vencenHoy: acciones.filter(a => a.tipo === 'vencimiento' && a.fecha_accion === todayStr).length,
        vencenSemana: acciones.filter(a => a.tipo === 'vencimiento').length,
        montoVenceSemana: acciones
          .filter(a => a.tipo === 'vencimiento')
          .reduce((sum, a) => sum + (a.monto || 0), 0),
        promesasPago: acciones.filter(a => a.tipo === 'promesa').length,
      };

      // Sort by priority and date
      const sortedAcciones = acciones.sort((a, b) => {
        const prioridadOrder = { alta: 0, media: 1, baja: 2 };
        const prioDiff = prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
        if (prioDiff !== 0) return prioDiff;
        return new Date(a.fecha_accion).getTime() - new Date(b.fecha_accion).getTime();
      });

      console.log('[useAgendaCobranza] Loaded', sortedAcciones.length, 'acciones');

      return {
        acciones: sortedAcciones,
        metrics,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

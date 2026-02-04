import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FacturaCliente {
  id: string;
  numero_factura: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_rfc: string;
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  estado: string;
  notas: string | null;
  created_at: string;
  // Calculated fields
  total_pagado?: number;
  saldo_pendiente?: number;
  dias_vencido?: number;
}

export interface PagoFactura {
  id: string;
  factura_id: string;
  cliente_id: string;
  monto: number;
  moneda: string;
  forma_pago: string;
  referencia_bancaria: string | null;
  banco: string | null;
  fecha_pago: string;
  fecha_deposito: string | null;
  estado: string;
  notas: string | null;
  created_at: string;
}

export interface Movimiento {
  fecha: string;
  tipo: 'cargo' | 'abono';
  concepto: string;
  referencia: string;
  cargo: number;
  abono: number;
  saldo: number;
}

export interface EstadoCuentaData {
  facturas: any[];
  pagos: any[];
  movimientos: Movimiento[];
  saldoFinal: number;
}

export function useFacturasCliente(clienteId?: string) {
  return useQuery({
    queryKey: ['facturas-cliente', clienteId],
    queryFn: async () => {
      if (!clienteId) {
        console.log('[useFacturasCliente] No clienteId provided');
        return [];
      }

      console.log('[useFacturasCliente] Fetching facturas for cliente:', clienteId);

      // Get facturas with their payments
      const { data: facturas, error } = await supabase
        .from('facturas')
        .select('*')
        .eq('cliente_id', clienteId)
        .neq('estado', 'cancelada')
        .order('fecha_emision', { ascending: false });

      if (error) {
        console.error('[useFacturasCliente] Error fetching facturas:', error);
        throw error;
      }

      // Get payments for these facturas
      const facturaIds = (facturas || []).map(f => f.id);
      
      let pagosMap: Record<string, number> = {};
      
      if (facturaIds.length > 0) {
        const { data: pagos, error: pagosError } = await supabase
          .from('pagos')
          .select('factura_id, monto')
          .in('factura_id', facturaIds)
          .eq('estado', 'aplicado');

        if (pagosError) {
          console.error('[useFacturasCliente] Error fetching pagos:', pagosError);
        } else {
          // Sum pagos by factura
          (pagos || []).forEach(p => {
            if (p.factura_id) {
              pagosMap[p.factura_id] = (pagosMap[p.factura_id] || 0) + Number(p.monto);
            }
          });
        }
      }

      // Calculate derived fields
      const today = new Date();
      const facturasWithPagos: FacturaCliente[] = (facturas || []).map(f => {
        const totalPagado = pagosMap[f.id] || 0;
        const saldoPendiente = Number(f.total) - totalPagado;
        const fechaVencimiento = new Date(f.fecha_vencimiento);
        const diasVencido = saldoPendiente > 0 ? Math.max(0, Math.floor((today.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))) : 0;

        return {
          ...f,
          total_pagado: totalPagado,
          saldo_pendiente: saldoPendiente,
          dias_vencido: diasVencido,
        } as FacturaCliente;
      });

      console.log('[useFacturasCliente] Loaded', facturasWithPagos.length, 'facturas');
      return facturasWithPagos;
    },
    enabled: !!clienteId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function usePagosFactura(facturaId?: string) {
  return useQuery({
    queryKey: ['pagos-factura', facturaId],
    queryFn: async () => {
      if (!facturaId) return [];

      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('factura_id', facturaId)
        .order('fecha_pago', { ascending: false });

      if (error) {
        console.error('[usePagosFactura] Error:', error);
        throw error;
      }

      return (data || []) as PagoFactura[];
    },
    enabled: !!facturaId,
    staleTime: 1 * 60 * 1000,
  });
}

// Get all pending facturas for a client (for payment application)
export function useFacturasPendientes(clienteId?: string) {
  return useQuery({
    queryKey: ['facturas-pendientes', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];

      console.log('[useFacturasPendientes] Fetching for cliente:', clienteId);

      const { data: facturas, error } = await supabase
        .from('facturas')
        .select('*')
        .eq('cliente_id', clienteId)
        .in('estado', ['pendiente', 'parcial', 'vencida'])
        .order('fecha_vencimiento', { ascending: true });

      if (error) {
        console.error('[useFacturasPendientes] Error:', error);
        throw error;
      }

      // Get payments
      const facturaIds = (facturas || []).map(f => f.id);
      let pagosMap: Record<string, number> = {};

      if (facturaIds.length > 0) {
        const { data: pagos } = await supabase
          .from('pagos')
          .select('factura_id, monto')
          .in('factura_id', facturaIds)
          .eq('estado', 'aplicado');

        (pagos || []).forEach(p => {
          if (p.factura_id) {
            pagosMap[p.factura_id] = (pagosMap[p.factura_id] || 0) + Number(p.monto);
          }
        });
      }

      // Only return facturas with pending balance
      return (facturas || [])
        .map(f => ({
          ...f,
          total_pagado: pagosMap[f.id] || 0,
          saldo_pendiente: Number(f.total) - (pagosMap[f.id] || 0),
        }))
        .filter(f => f.saldo_pendiente > 0) as FacturaCliente[];
    },
    enabled: !!clienteId,
    staleTime: 30 * 1000,
  });
}

// Get estado de cuenta (all movements)
export function useEstadoCuenta(clienteId?: string, fechaInicio?: string, fechaFin?: string) {
  return useQuery({
    queryKey: ['estado-cuenta', clienteId, fechaInicio, fechaFin],
    queryFn: async () => {
      if (!clienteId) return { facturas: [], pagos: [], movimientos: [] };

      console.log('[useEstadoCuenta] Fetching for cliente:', clienteId);

      // Get facturas
      let facturasQuery = supabase
        .from('facturas')
        .select('*')
        .eq('cliente_id', clienteId)
        .neq('estado', 'cancelada');

      if (fechaInicio) {
        facturasQuery = facturasQuery.gte('fecha_emision', fechaInicio);
      }
      if (fechaFin) {
        facturasQuery = facturasQuery.lte('fecha_emision', fechaFin);
      }

      const { data: facturas, error: facturasError } = await facturasQuery.order('fecha_emision', { ascending: true });

      if (facturasError) {
        console.error('[useEstadoCuenta] Error facturas:', facturasError);
        throw facturasError;
      }

      // Get pagos
      let pagosQuery = supabase
        .from('pagos')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('estado', 'aplicado');

      if (fechaInicio) {
        pagosQuery = pagosQuery.gte('fecha_pago', fechaInicio);
      }
      if (fechaFin) {
        pagosQuery = pagosQuery.lte('fecha_pago', fechaFin);
      }

      const { data: pagos, error: pagosError } = await pagosQuery.order('fecha_pago', { ascending: true });

      if (pagosError) {
        console.error('[useEstadoCuenta] Error pagos:', pagosError);
        throw pagosError;
      }

      // Combine into movements - using the exported Movimiento interface
      const movimientos: Movimiento[] = [];
      let saldoAcumulado = 0;

      // Combine and sort by date
      const allMovements = [
        ...(facturas || []).map(f => ({
          fecha: f.fecha_emision,
          tipo: 'cargo' as const,
          concepto: 'Factura',
          referencia: f.numero_factura,
          monto: Number(f.total),
        })),
        ...(pagos || []).map(p => ({
          fecha: p.fecha_pago,
          tipo: 'abono' as const,
          concepto: `Pago ${p.forma_pago}`,
          referencia: p.referencia_bancaria || '-',
          monto: Number(p.monto),
        })),
      ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      allMovements.forEach(m => {
        if (m.tipo === 'cargo') {
          saldoAcumulado += m.monto;
          movimientos.push({
            fecha: m.fecha,
            tipo: 'cargo',
            concepto: m.concepto,
            referencia: m.referencia,
            cargo: m.monto,
            abono: 0,
            saldo: saldoAcumulado,
          });
        } else {
          saldoAcumulado -= m.monto;
          movimientos.push({
            fecha: m.fecha,
            tipo: 'abono',
            concepto: m.concepto,
            referencia: m.referencia,
            cargo: 0,
            abono: m.monto,
            saldo: saldoAcumulado,
          });
        }
      });

      return {
        facturas: facturas || [],
        pagos: pagos || [],
        movimientos,
        saldoFinal: saldoAcumulado,
      };
    },
    enabled: !!clienteId,
    staleTime: 1 * 60 * 1000,
  });
}

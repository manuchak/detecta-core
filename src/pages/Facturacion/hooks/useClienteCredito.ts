import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClienteCreditoAnalisis {
  cliente_id: string;
  cliente_nombre: string;
  limite_credito: number | null;
  saldo_actual: number;
  credito_utilizado_pct: number;
  credito_disponible: number;
  facturas_pendientes: number;
  facturas_vencidas: number;
  dias_promedio_pago: number;
  ultimo_pago_fecha: string | null;
  ultimo_pago_monto: number | null;
  historial_pagos_30d: number;
  historial_pagos_60d: number;
  historial_pagos_90d: number;
  comportamiento: 'excelente' | 'bueno' | 'regular' | 'riesgoso';
  score_crediticio: number; // 0-100
}

export function useClienteCreditoAnalisis(clienteId?: string) {
  return useQuery({
    queryKey: ['cliente-credito-analisis', clienteId],
    queryFn: async (): Promise<ClienteCreditoAnalisis | null> => {
      if (!clienteId) return null;

      // Get client data
      const { data: cliente, error: clienteError } = await supabase
        .from('pc_clientes')
        .select('id, nombre, limite_credito, dias_credito')
        .eq('id', clienteId)
        .single();

      if (clienteError || !cliente) return null;

      // Get aging data for this client
      const { data: agingData } = await supabase
        .from('vw_aging_cuentas_cobrar')
        .select('*')
        .eq('cliente_id', clienteId)
        .single();

      // Get facturas data
      const { data: facturas } = await supabase
        .from('facturas')
        .select('id, total, fecha_emision, fecha_vencimiento, estado, fecha_pago')
        .eq('cliente_id', clienteId)
        .not('estado', 'eq', 'cancelada');

      // Get pagos history
      const { data: pagos } = await supabase
        .from('pagos')
        .select('id, monto, fecha_pago')
        .eq('cliente_id', clienteId)
        .eq('estado', 'aplicado')
        .order('fecha_pago', { ascending: false })
        .limit(50);

      const facturasArr = facturas || [];
      const pagosArr = pagos || [];

      // Calculate metrics
      const saldoActual = agingData?.saldo_pendiente || 0;
      const limiteCredito = cliente.limite_credito;
      const creditoUtilizadoPct = limiteCredito ? Math.round((saldoActual / limiteCredito) * 100) : 0;
      const creditoDisponible = limiteCredito ? Math.max(0, limiteCredito - saldoActual) : Infinity;

      // Count facturas by status
      const facturasPendientes = facturasArr.filter(f => 
        f.estado === 'pendiente' || f.estado === 'parcial'
      ).length;
      const facturasVencidas = facturasArr.filter(f => f.estado === 'vencida').length;

      // Calculate average payment days
      const pagadasConFecha = facturasArr.filter(f => f.fecha_pago && f.estado === 'pagada');
      let diasPromedioPago = 0;
      if (pagadasConFecha.length > 0) {
        const totalDias = pagadasConFecha.reduce((sum, f) => {
          const emision = new Date(f.fecha_emision);
          const pago = new Date(f.fecha_pago!);
          return sum + Math.ceil((pago.getTime() - emision.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        diasPromedioPago = Math.round(totalDias / pagadasConFecha.length);
      }

      // Recent payments
      const now = new Date();
      const historialPagos30d = pagosArr.filter(p => {
        const fecha = new Date(p.fecha_pago);
        return (now.getTime() - fecha.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      }).reduce((sum, p) => sum + Number(p.monto), 0);

      const historialPagos60d = pagosArr.filter(p => {
        const fecha = new Date(p.fecha_pago);
        return (now.getTime() - fecha.getTime()) <= 60 * 24 * 60 * 60 * 1000;
      }).reduce((sum, p) => sum + Number(p.monto), 0);

      const historialPagos90d = pagosArr.filter(p => {
        const fecha = new Date(p.fecha_pago);
        return (now.getTime() - fecha.getTime()) <= 90 * 24 * 60 * 60 * 1000;
      }).reduce((sum, p) => sum + Number(p.monto), 0);

      const ultimoPago = pagosArr[0];

      // Calculate credit score (0-100)
      let score = 100;
      
      // Penalize for overdue invoices
      score -= facturasVencidas * 15;
      
      // Penalize for high credit utilization
      if (creditoUtilizadoPct > 90) score -= 20;
      else if (creditoUtilizadoPct > 70) score -= 10;
      
      // Penalize for slow payment
      if (diasPromedioPago > 60) score -= 20;
      else if (diasPromedioPago > 45) score -= 10;
      else if (diasPromedioPago > 30) score -= 5;
      
      // Bonus for recent payments
      if (historialPagos30d > 0) score += 5;
      
      score = Math.max(0, Math.min(100, score));

      // Determine behavior
      let comportamiento: ClienteCreditoAnalisis['comportamiento'] = 'bueno';
      if (score >= 85) comportamiento = 'excelente';
      else if (score >= 70) comportamiento = 'bueno';
      else if (score >= 50) comportamiento = 'regular';
      else comportamiento = 'riesgoso';

      return {
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre,
        limite_credito: limiteCredito,
        saldo_actual: saldoActual,
        credito_utilizado_pct: creditoUtilizadoPct,
        credito_disponible: creditoDisponible === Infinity ? -1 : creditoDisponible, // -1 = sin límite
        facturas_pendientes: facturasPendientes,
        facturas_vencidas: facturasVencidas,
        dias_promedio_pago: diasPromedioPago,
        ultimo_pago_fecha: ultimoPago?.fecha_pago || null,
        ultimo_pago_monto: ultimoPago?.monto || null,
        historial_pagos_30d: historialPagos30d,
        historial_pagos_60d: historialPagos60d,
        historial_pagos_90d: historialPagos90d,
        comportamiento,
        score_crediticio: score,
      };
    },
    enabled: !!clienteId,
    staleTime: 2 * 60 * 1000,
  });
}

// Hook to get all clients with credit summary
export function useClientesCreditoResumen() {
  return useQuery({
    queryKey: ['clientes-credito-resumen'],
    queryFn: async () => {
      const { data: agingData, error } = await supabase
        .from('vw_aging_cuentas_cobrar')
        .select('*');

      if (error) throw error;

      const { data: clientes } = await supabase
        .from('pc_clientes')
        .select('id, nombre, limite_credito, dias_credito');

      if (!clientes) return [];

      // Map aging data by client
      const agingMap = new Map(agingData?.map(a => [a.cliente_id, a]) || []);

      return clientes.map(c => {
        const aging = agingMap.get(c.id);
        const saldo = aging?.saldo_pendiente || 0;
        const limite = c.limite_credito;
        const utilizacion = limite ? Math.round((saldo / limite) * 100) : 0;

        return {
          id: c.id,
          nombre: c.nombre,
          limite_credito: limite,
          saldo_actual: saldo,
          utilizacion_pct: utilizacion,
          sobre_limite: limite ? saldo > limite : false,
          vencido: (aging?.total_vencido || 0) > 0,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

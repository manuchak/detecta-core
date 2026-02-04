import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface AgingData {
  cliente_id: string;
  cliente_nombre: string;
  cliente_rfc: string;
  dias_credito: number | null;
  limite_credito: number | null;
  prioridad_cobranza: string | null;
  total_facturado: number;
  total_pagado: number;
  saldo_pendiente: number;
  vigente: number;
  vencido_1_30: number;
  vencido_31_60: number;
  vencido_61_90: number;
  vencido_90_mas: number;
  num_facturas: number;
  ultima_factura: string | null;
  ultimo_pago: string | null;
}

export interface CxCMetrics {
  totalCxC: number;
  totalVigente: number;
  totalVencido: number;
  totalVencidoMas60: number;
  dsoPromedio: number;
  eficienciaCobranza: number;
  numClientes: number;
  numFacturas: number;
}

export interface SeguimientoCobranza {
  id: string;
  factura_id: string | null;
  cliente_id: string | null;
  tipo_accion: string;
  descripcion: string;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  fecha_promesa_pago: string | null;
  monto_prometido: number | null;
  promesa_cumplida: boolean | null;
  resultado: string | null;
  proxima_accion: string | null;
  created_at: string;
  created_by: string | null;
}

export function useAgingCuentasPorCobrar() {
  return useQuery({
    queryKey: ['aging-cuentas-cobrar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_aging_cuentas_cobrar')
        .select('*')
        .order('saldo_pendiente', { ascending: false });

      if (error) throw error;
      return (data || []) as AgingData[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCxCMetrics(agingData: AgingData[]) {
  return useMemo(() => {
    if (!agingData || agingData.length === 0) {
      return {
        totalCxC: 0,
        totalVigente: 0,
        totalVencido: 0,
        totalVencidoMas60: 0,
        dsoPromedio: 0,
        eficienciaCobranza: 100,
        numClientes: 0,
        numFacturas: 0,
      } as CxCMetrics;
    }

    const totalCxC = agingData.reduce((sum, d) => sum + (d.saldo_pendiente || 0), 0);
    const totalVigente = agingData.reduce((sum, d) => sum + (d.vigente || 0), 0);
    const totalVencido = agingData.reduce((sum, d) => 
      sum + (d.vencido_1_30 || 0) + (d.vencido_31_60 || 0) + (d.vencido_61_90 || 0) + (d.vencido_90_mas || 0), 0
    );
    const totalVencidoMas60 = agingData.reduce((sum, d) => 
      sum + (d.vencido_61_90 || 0) + (d.vencido_90_mas || 0), 0
    );
    const totalFacturado = agingData.reduce((sum, d) => sum + (d.total_facturado || 0), 0);
    const totalPagado = agingData.reduce((sum, d) => sum + (d.total_pagado || 0), 0);
    const numFacturas = agingData.reduce((sum, d) => sum + (d.num_facturas || 0), 0);

    // DSO = (CxC / Facturado) * 30 días
    const dsoPromedio = totalFacturado > 0 
      ? Math.round((totalCxC / totalFacturado) * 30) 
      : 0;

    // Eficiencia = (Pagado / Facturado) * 100
    const eficienciaCobranza = totalFacturado > 0 
      ? Math.min(100, Math.round((totalPagado / totalFacturado) * 100))
      : 100;

    return {
      totalCxC,
      totalVigente,
      totalVencido,
      totalVencidoMas60,
      dsoPromedio,
      eficienciaCobranza,
      numClientes: agingData.length,
      numFacturas,
    } as CxCMetrics;
  }, [agingData]);
}

export function useCobranzaSeguimiento(clienteId?: string) {
  return useQuery({
    queryKey: ['cobranza-seguimiento', clienteId],
    queryFn: async () => {
      let query = supabase
        .from('cobranza_seguimiento')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SeguimientoCobranza[];
    },
    staleTime: 1 * 60 * 1000,
  });
}

export function useCreateSeguimiento() {
  const createSeguimiento = async (data: Omit<SeguimientoCobranza, 'id' | 'created_at' | 'created_by'>) => {
    const { data: result, error } = await supabase
      .from('cobranza_seguimiento')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  };

  return { createSeguimiento };
}

// Utility function for aging colors
export const getAgingColor = (dias: number) => {
  if (dias <= 0) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  if (dias <= 30) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
  if (dias <= 60) return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
  if (dias <= 90) return 'bg-red-500/10 text-red-700 dark:text-red-400';
  return 'bg-red-700/20 text-red-800 dark:text-red-300 font-bold';
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DynamicDeficitData {
  zona_operacion: string;
  deficit_inicial: number;
  nuevos_custodios_incorporados: number;
  deficit_ajustado: number;
  porcentaje_progreso: number;
  estado_progreso: string;
  fecha_calculo: string;
}

export interface DeficitProgressAlert {
  id: string;
  zona: string;
  tipo: 'objetivo_cumplido' | 'progreso_excelente' | 'progreso_bueno' | 'necesita_atencion';
  mensaje: string;
  porcentaje: number;
}

export function useDynamicDeficitTracking() {
  const [loading, setLoading] = useState(true);
  const [deficitData, setDeficitData] = useState<DynamicDeficitData[]>([]);
  const [alerts, setAlerts] = useState<DeficitProgressAlert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Función para obtener el déficit dinámico nacional
  const fetchDynamicDeficit = useCallback(async () => {
    try {
      setLoading(true);
      
      // Llamar a la función de Supabase para obtener déficit dinámico
      const { data, error } = await supabase.rpc('obtener_deficit_dinamico_nacional', {
        p_fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_fecha_hasta: new Date().toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error fetching dynamic deficit:', error);
        throw error;
      }

      setDeficitData(data || []);
      setLastUpdate(new Date());

      // Generar alertas basadas en el progreso
      const newAlerts: DeficitProgressAlert[] = data?.map((zona: DynamicDeficitData) => {
        let tipo: DeficitProgressAlert['tipo'] = 'necesita_atencion';
        let mensaje = '';

        if (zona.porcentaje_progreso >= 90) {
          tipo = 'objetivo_cumplido';
          mensaje = `¡Excelente! ${zona.zona_operacion} ha cumplido el objetivo de reclutamiento`;
        } else if (zona.porcentaje_progreso >= 70) {
          tipo = 'progreso_excelente';
          mensaje = `${zona.zona_operacion} muestra progreso excelente en reclutamiento`;
        } else if (zona.porcentaje_progreso >= 50) {
          tipo = 'progreso_bueno';
          mensaje = `${zona.zona_operacion} está progresando bien hacia el objetivo`;
        } else {
          tipo = 'necesita_atencion';
          mensaje = `${zona.zona_operacion} necesita acelerar el reclutamiento`;
        }

        return {
          id: `alert-${zona.zona_operacion}`,
          zona: zona.zona_operacion,
          tipo,
          mensaje,
          porcentaje: zona.porcentaje_progreso
        };
      }) || [];

      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error in fetchDynamicDeficit:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener incorporaciones recientes
  const getRecentIncorporations = useCallback(async (dias: number = 7) => {
    try {
      const fechaDesde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('custodios_primer_servicio_zona')
        .select('*')
        .gte('fecha_primer_servicio', fechaDesde)
        .order('fecha_primer_servicio', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching recent incorporations:', error);
      return [];
    }
  }, []);

  // Función para obtener histórico de incorporaciones por zona
  const getZoneIncorporationHistory = useCallback(async (zona: string) => {
    try {
      const { data, error } = await supabase
        .from('custodios_primer_servicio_zona')
        .select('*')
        .eq('zona_operacion', zona)
        .order('fecha_primer_servicio', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching zone incorporation history:', error);
      return [];
    }
  }, []);

  // Métricas calculadas
  const metrics = {
    totalIncorporaciones: deficitData.reduce((sum, zona) => sum + zona.nuevos_custodios_incorporados, 0),
    progresoPromedio: deficitData.length > 0 
      ? deficitData.reduce((sum, zona) => sum + zona.porcentaje_progreso, 0) / deficitData.length 
      : 0,
    zonasConObjetivoCumplido: deficitData.filter(zona => zona.porcentaje_progreso >= 90).length,
    zonasEnRiesgo: deficitData.filter(zona => zona.porcentaje_progreso < 25).length,
    deficitTotalRestante: deficitData.reduce((sum, zona) => sum + zona.deficit_ajustado, 0)
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchDynamicDeficit();
  }, [fetchDynamicDeficit]);

  // Función para refrescar datos
  const refreshData = useCallback(() => {
    fetchDynamicDeficit();
  }, [fetchDynamicDeficit]);

  return {
    loading,
    deficitData,
    alerts,
    metrics,
    lastUpdate,
    refreshData,
    getRecentIncorporations,
    getZoneIncorporationHistory
  };
}
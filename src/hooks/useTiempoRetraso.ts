// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parsePostgresInterval, formatTiempoRetrasoDisplay } from '@/utils/timeUtils';

interface ServicioConRetraso {
  id_servicio: string;
  nombre_custodio: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tiempo_retraso: string | null;
  estado: string;
  nombre_cliente: string;
}

export const useTiempoRetraso = (fechaInicio?: Date, fechaFin?: Date) => {
  return useQuery({
    queryKey: ['tiempo-retraso', fechaInicio, fechaFin],
    queryFn: async (): Promise<ServicioConRetraso[]> => {
      console.log('🕐 === CONSULTANDO DATOS DE TIEMPO RETRASO ===');
      
      let query = supabase
        .from('servicios_custodia')
        .select(`
          id_servicio,
          nombre_custodio,
          origen,
          destino,
          fecha_hora_cita,
          tiempo_retraso,
          estado,
          nombre_cliente
        `)
        .not('tiempo_retraso', 'is', null)
        .order('fecha_hora_cita', { ascending: false });

      // Aplicar filtros de fecha si se proporcionan
      if (fechaInicio) {
        query = query.gte('fecha_hora_cita', fechaInicio.toISOString());
      }
      
      if (fechaFin) {
        query = query.lte('fecha_hora_cita', fechaFin.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error consultando tiempo retraso:', error);
        throw error;
      }

      if (!data) {
        console.log('No se encontraron datos de tiempo retraso');
        return [];
      }

      console.log(`📊 Datos de tiempo retraso encontrados: ${data.length} registros`);
      
      // Procesar y validar los datos
      const serviciosConRetraso = data.map((servicio) => {
        const tiempoRetrasoStr = servicio.tiempo_retraso as string | null;
        const tiempoRetraso = parsePostgresInterval(tiempoRetrasoStr);
        
        if (tiempoRetraso) {
          console.log(`⏱️ Servicio ${servicio.id_servicio}: ${formatTiempoRetrasoDisplay(tiempoRetrasoStr)}`);
        }
        
        return servicio as ServicioConRetraso;
      });

      return serviciosConRetraso;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
};

// Hook para estadísticas de tiempo de retraso
export const useEstadisticasTiempoRetraso = (fechaInicio?: Date, fechaFin?: Date) => {
  const { data: serviciosData } = useTiempoRetraso(fechaInicio, fechaFin);
  
  return useQuery({
    queryKey: ['estadisticas-tiempo-retraso', fechaInicio, fechaFin],
    queryFn: async () => {
      const data = serviciosData;
      
      if (!data || data.length === 0) {
        return {
          totalServicios: 0,
          serviciosATiempo: 0,
          serviciosConRetraso: 0,
          serviciosAntes: 0,
          promedioRetraso: 0,
          mayorRetraso: null,
          menorRetraso: null
        };
      }

      let serviciosATiempo = 0;
      let serviciosConRetraso = 0;
      let serviciosAntes = 0;
      let totalMinutosRetraso = 0;
      let maxRetraso: string | null = null;
      let minRetraso: string | null = null;

      data.forEach((servicio) => {
        const tiempo = parsePostgresInterval(servicio.tiempo_retraso);
        
        if (!tiempo) return;

        const { horas, minutos, segundos, esNegativo } = tiempo;
        const totalMinutos = (horas * 60) + minutos + (segundos / 60);

        if (totalMinutos === 0) {
          serviciosATiempo++;
        } else if (esNegativo) {
          serviciosAntes++;
          totalMinutosRetraso -= totalMinutos;
        } else {
          serviciosConRetraso++;
          totalMinutosRetraso += totalMinutos;
        }

        // Actualizar máximos y mínimos
        if (!maxRetraso || totalMinutos > (parsePostgresInterval(maxRetraso)?.horas || 0) * 60 + (parsePostgresInterval(maxRetraso)?.minutos || 0)) {
          maxRetraso = servicio.tiempo_retraso;
        }
        
        if (!minRetraso || totalMinutos < (parsePostgresInterval(minRetraso)?.horas || 0) * 60 + (parsePostgresInterval(minRetraso)?.minutos || 0)) {
          minRetraso = servicio.tiempo_retraso;
        }
      });

      return {
        totalServicios: data.length,
        serviciosATiempo,
        serviciosConRetraso,
        serviciosAntes,
        promedioRetraso: data.length > 0 ? totalMinutosRetraso / data.length : 0,
        mayorRetraso: maxRetraso,
        menorRetraso: minRetraso
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!serviciosData // Solo ejecutar cuando tengamos datos de servicios
  });
};

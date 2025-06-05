
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyDiagnostic {
  month: number;
  month_name: string;
  total_registros: number;
  servicios_finalizados: number;
  servicios_con_cobro: number;
  total_gmv_raw: number;
  servicios_unicos: number;
  gmv_servicios_unicos: number;
  sample_services: string[];
}

export const useGmvDiagnostic = () => {
  const { data: diagnosticData, isLoading, error } = useQuery({
    queryKey: ['gmv-diagnostic-2025-full'],
    queryFn: async () => {
      try {
        console.log("🔍 INICIANDO DIAGNÓSTICO GMV 2025 COMPLETO...");
        
        // Obtener datos RAW sin filtros RLS
        const { data: rawData, error: rawError } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 500000
        });

        if (rawError) {
          console.error('❌ Error obteniendo datos RAW:', rawError);
          throw rawError;
        }

        console.log(`📋 Total registros RAW obtenidos: ${rawData?.length || 0}`);

        if (!rawData || rawData.length === 0) {
          console.warn('⚠️ No hay datos disponibles');
          return [];
        }

        // Filtrar datos de 2025 con validación más robusta
        const data2025 = rawData.filter(item => {
          if (!item.fecha_hora_cita) return false;
          try {
            const fecha = new Date(item.fecha_hora_cita);
            const year = fecha.getFullYear();
            console.log(`📅 Procesando fecha: ${item.fecha_hora_cita}, año: ${year}`);
            return year === 2025;
          } catch (error) {
            console.warn(`⚠️ Fecha inválida: ${item.fecha_hora_cita}`);
            return false;
          }
        });

        console.log(`📅 Registros de 2025 encontrados: ${data2025.length}`);

        // Log de muestra de fechas para verificar
        const sampleDates = data2025.slice(0, 10).map(item => ({
          fecha: item.fecha_hora_cita,
          estado: item.estado,
          cobro: item.cobro_cliente,
          id: item.id_servicio
        }));
        console.log('📊 Muestra de fechas 2025:', sampleDates);

        // Analizar por mes (enero = 0, febrero = 1, etc.)
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const diagnosticResults: MonthlyDiagnostic[] = [];

        // Procesar TODOS los meses del año
        for (let month = 0; month < 12; month++) {
          const monthData = data2025.filter(item => {
            try {
              const fecha = new Date(item.fecha_hora_cita);
              const itemMonth = fecha.getMonth();
              return itemMonth === month;
            } catch (error) {
              return false;
            }
          });

          console.log(`📊 ${monthNames[month]} 2025: ${monthData.length} registros totales`);

          // Analizar servicios finalizados (con variaciones de estado)
          const serviciosFinalizados = monthData.filter(item => {
            const estado = (item.estado || '').trim().toLowerCase();
            return estado === 'finalizado' || estado === 'completado' || estado === 'finished';
          });

          // Servicios con cobro válido
          const serviciosConCobro = serviciosFinalizados.filter(item => {
            const cobro = parseFloat(String(item.cobro_cliente)) || 0;
            return cobro > 0;
          });

          // GMV total sin deduplicar
          const totalGmvRaw = serviciosConCobro.reduce((sum, item) => {
            const cobro = parseFloat(String(item.cobro_cliente)) || 0;
            return sum + cobro;
          }, 0);

          // Deduplicar por ID de servicio
          const serviciosUnicos = new Map();
          serviciosConCobro.forEach(item => {
            if (!item.id_servicio || item.id_servicio.trim() === '') return;
            
            const id = item.id_servicio.trim();
            if (!serviciosUnicos.has(id)) {
              serviciosUnicos.set(id, item);
            } else {
              // Si hay duplicado, tomar el que tenga mayor cobro
              const existing = serviciosUnicos.get(id);
              const existingCobro = parseFloat(String(existing.cobro_cliente)) || 0;
              const currentCobro = parseFloat(String(item.cobro_cliente)) || 0;
              if (currentCobro > existingCobro) {
                serviciosUnicos.set(id, item);
              }
            }
          });

          // GMV de servicios únicos
          const gmvServiciosUnicos = Array.from(serviciosUnicos.values()).reduce((sum, item) => {
            const cobro = parseFloat(String(item.cobro_cliente)) || 0;
            return sum + cobro;
          }, 0);

          // Obtener muestra de IDs de servicios
          const sampleServices = Array.from(serviciosUnicos.keys()).slice(0, 5);

          // Incluir TODOS los meses en el resultado, incluso si no tienen datos
          diagnosticResults.push({
            month: month + 1,
            month_name: monthNames[month],
            total_registros: monthData.length,
            servicios_finalizados: serviciosFinalizados.length,
            servicios_con_cobro: serviciosConCobro.length,
            total_gmv_raw: totalGmvRaw,
            servicios_unicos: serviciosUnicos.size,
            gmv_servicios_unicos: gmvServiciosUnicos,
            sample_services: sampleServices
          });

          if (monthData.length > 0) {
            console.log(`📊 ${monthNames[month]} 2025 DETALLE:`);
            console.log(`  - Total registros: ${monthData.length}`);
            console.log(`  - Finalizados: ${serviciosFinalizados.length}`);
            console.log(`  - Con cobro: ${serviciosConCobro.length}`);
            console.log(`  - GMV raw: $${totalGmvRaw.toLocaleString()}`);
            console.log(`  - Servicios únicos: ${serviciosUnicos.size}`);
            console.log(`  - GMV únicos: $${gmvServiciosUnicos.toLocaleString()}`);
            console.log(`  - Muestra IDs: ${sampleServices.join(', ')}`);
          }
        }

        // Log de resumen
        const mesesConDatos = diagnosticResults.filter(month => month.total_registros > 0);
        console.log(`🎯 RESUMEN DIAGNÓSTICO COMPLETO:`);
        console.log(`  - Total meses con registros: ${mesesConDatos.length}`);
        console.log(`  - Meses con datos: ${mesesConDatos.map(m => m.month_name).join(', ')}`);

        console.log('🎯 DIAGNÓSTICO COMPLETADO');
        return diagnosticResults;

      } catch (err) {
        console.error('❌ Error en diagnóstico GMV:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2
  });

  return {
    diagnosticData: diagnosticData || [],
    isLoading,
    error
  };
};

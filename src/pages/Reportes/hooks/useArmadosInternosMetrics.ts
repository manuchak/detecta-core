import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArmadosInternosMetrics } from '../types';
import { fetchTarifasKm, calcularCostoPlano, type TarifaKmRango } from '@/utils/tarifasKmUtils';

export function useArmadosInternosMetrics() {
  return useQuery({
    queryKey: ['armados-internos-metrics'],
    queryFn: async (): Promise<ArmadosInternosMetrics> => {
      const tarifas = await fetchTarifasKm();
      const { data: servicios, error } = await supabase
        .from('servicios_custodia')
        .select('id, km_recorridos, nombre_custodio, created_at, estado')
        .not('proveedor', 'ilike', '%cusaem%')
        .not('proveedor', 'ilike', '%seicsa%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allServices = servicios || [];
      
      // Data quality analysis
      const totalRegistros = allServices.length;
      const registrosValidos = allServices.filter(
        s => s.km_recorridos !== null && 
             !isNaN(s.km_recorridos) && 
             s.km_recorridos > 0 &&
             s.km_recorridos < 10000 // Filter anomalies
      );
      const registrosSinKm = allServices.filter(
        s => s.km_recorridos === null || isNaN(s.km_recorridos) || s.km_recorridos === 0
      ).length;
      const registrosAnomalos = allServices.filter(
        s => s.km_recorridos !== null && s.km_recorridos >= 10000
      ).length;
      
      // Calculate metrics with valid data
      const kmTotales = registrosValidos.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      const kmPromedio = registrosValidos.length > 0 ? kmTotales / registrosValidos.length : 0;
      
      // Calculate costs using tiered rates
      let costoTotal = 0;
      registrosValidos.forEach(s => {
        const { costo } = calcularCostoPlano(s.km_recorridos || 0, tarifas);
        costoTotal += costo;
      });
      
      const costoPromedioServicio = registrosValidos.length > 0 
        ? costoTotal / registrosValidos.length 
        : 0;

      // Distribution by km range
      const distribucionKm = tarifas.map(tarifa => {
        const serviciosEnRango = registrosValidos.filter(s => {
          const km = s.km_recorridos || 0;
          const max = tarifa.km_max ?? Infinity;
          return km > tarifa.km_min && km <= max;
        });
        const kmEnRango = serviciosEnRango.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
        const costoEnRango = kmEnRango * tarifa.tarifa_por_km;
        
        return {
          rango: tarifa.descripcion,
          kmMin: tarifa.km_min,
          kmMax: tarifa.km_max ?? 999999,
          tarifaPorKm: tarifa.tarifa_por_km,
          servicios: serviciosEnRango.length,
          porcentaje: registrosValidos.length > 0 
            ? (serviciosEnRango.length / registrosValidos.length) * 100 
            : 0,
          kmTotales: kmEnRango,
          costoTotal: costoEnRango,
          costoPromedio: serviciosEnRango.length > 0 ? costoEnRango / serviciosEnRango.length : 0,
        };
      });

      // Group by armado (custodio)
      const armadoMap = new Map<string, typeof registrosValidos>();
      registrosValidos.forEach(s => {
        const nombre = s.nombre_custodio || 'Sin asignar';
        if (!armadoMap.has(nombre)) armadoMap.set(nombre, []);
        armadoMap.get(nombre)!.push(s);
      });

      const porArmado = Array.from(armadoMap.entries())
        .map(([nombre, servs]) => {
          const kmTotal = servs.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
          let costo = 0;
          servs.forEach(s => {
            costo += calcularCostoPlano(s.km_recorridos || 0, tarifas).costo;
          });
          
          // Calculate unique days
          const diasUnicos = new Set(servs.map(s => 
            new Date(s.created_at).toISOString().split('T')[0]
          )).size;
          
          return {
            id: nombre.toLowerCase().replace(/\s+/g, '-'),
            nombre,
            servicios: servs.length,
            kmTotales: kmTotal,
            kmPromedio: servs.length > 0 ? kmTotal / servs.length : 0,
            costoTotal: costo,
            diasActivos: diasUnicos,
            capacidadDisponible: Math.max(0, 22 - diasUnicos), // 22 working days
            rating: 4.5,
          };
        })
        .sort((a, b) => b.servicios - a.servicios)
        .slice(0, 15); // Top 15

      // Efficiency metrics
      const armadosConCapacidad = porArmado.filter(a => a.capacidadDisponible > 5).length;
      const capacidadTotalDisponible = porArmado.reduce((sum, a) => sum + a.capacidadDisponible, 0);
      const serviciosRutasLargas = registrosValidos.filter(s => (s.km_recorridos || 0) > 400).length;
      const pctRutasLargas = registrosValidos.length > 0 
        ? (serviciosRutasLargas / registrosValidos.length) * 100 
        : 0;

      // Generate alerts
      const alertas: ArmadosInternosMetrics['alertas'] = [];
      
      const pctDatosConfiables = totalRegistros > 0 
        ? (registrosValidos.length / totalRegistros) * 100 
        : 0;
      
      if (registrosSinKm > 50 || pctDatosConfiables < 90) {
        alertas.push({
          tipo: 'DATOS_INVALIDOS',
          severidad: 'alta',
          descripcion: `${registrosSinKm} registros sin km_recorridos (${(100 - pctDatosConfiables).toFixed(1)}% del total)`,
          accionSugerida: 'Corregir captura de datos de kilometraje en servicios',
        });
      }

      if (armadosConCapacidad > 5) {
        alertas.push({
          tipo: 'CAPACIDAD_OCIOSA',
          severidad: 'media',
          descripcion: `${armadosConCapacidad} armados internos tienen capacidad disponible significativa`,
          accionSugerida: 'Priorizar asignación a armados internos antes de contratar externos',
        });
      }

      const serviciosCortos = registrosValidos.filter(s => (s.km_recorridos || 0) <= 100).length;
      const pctCortos = registrosValidos.length > 0 ? (serviciosCortos / registrosValidos.length) * 100 : 0;
      if (pctCortos > 40) {
        alertas.push({
          tipo: 'CONCENTRACION_RUTAS_CORTAS',
          severidad: 'baja',
          descripcion: `${pctCortos.toFixed(1)}% de servicios son rutas cortas (<100km) con tarifa más alta ($6/km)`,
          accionSugerida: 'Analizar si es posible combinar rutas cortas para optimizar costos',
        });
      }

      return {
        resumen: {
          serviciosTotales: registrosValidos.length,
          kmTotales,
          kmPromedio,
          costoTotal,
          costoPromedioServicio,
        },
        distribucionKm,
        porArmado,
        eficiencia: {
          armadosConCapacidad,
          capacidadTotalDisponible,
          serviciosRutasLargas,
          pctRutasLargas,
        },
        calidadDatos: {
          totalRegistros,
          registrosValidos: registrosValidos.length,
          registrosSinKm,
          registrosAnomalos,
          pctDatosConfiables,
        },
        alertas,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

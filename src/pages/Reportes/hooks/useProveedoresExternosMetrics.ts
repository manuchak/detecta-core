import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProveedoresExternosMetrics, CompletitudDatos } from '../types';

const TARIFA_BASE_12H = 1300;
const HORAS_CONTRATADAS = 12;

function parseIntervalToHours(interval: string | null | undefined): number {
  if (!interval) return 0;
  const timeMatch = interval.match(/(\d+):(\d+):(\d+)/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);
    return hours + (minutes / 60) + (seconds / 3600);
  }
  return 0;
}

interface ServicioExterno {
  id: string;
  id_servicio: string;
  proveedor: string | null;
  duracion_servicio: string | null;
  duracion_estimada: string | null;
  metodo_estimacion: string | null;
  confianza_estimacion: number | null;
  estado: string | null;
  created_at: string;
}

function getDuracionServicio(s: ServicioExterno): { horas: number; esEstimada: boolean; metodo: string | null } {
  const duracionReal = parseIntervalToHours(s.duracion_servicio);
  if (duracionReal > 0) {
    return { horas: duracionReal, esEstimada: false, metodo: 'real' };
  }
  const duracionEstimada = parseIntervalToHours(s.duracion_estimada);
  if (duracionEstimada > 0) {
    return { horas: duracionEstimada, esEstimada: true, metodo: s.metodo_estimacion };
  }
  return { horas: 0, esEstimada: false, metodo: null };
}

export function useProveedoresExternosMetrics() {
  return useQuery({
    queryKey: ['proveedores-externos-metrics'],
    queryFn: async (): Promise<ProveedoresExternosMetrics> => {
      // Fetch services from external providers (Cusaem and SEICSA patterns)
      const { data: serviciosExternos, error } = await supabase
        .from('servicios_custodia')
        .select('id, id_servicio, proveedor, duracion_servicio, duracion_estimada, metodo_estimacion, confianza_estimacion, estado, created_at')
        .or('proveedor.ilike.%cusaem%,proveedor.ilike.%seicsa%,id_servicio.like.SIINSRH-%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const servicios = (serviciosExternos || []) as ServicioExterno[];
      
      // Calculate completitud de datos
      const conDuracionReal = servicios.filter(s => parseIntervalToHours(s.duracion_servicio) > 0).length;
      const conDuracionEstimada = servicios.filter(s => 
        parseIntervalToHours(s.duracion_servicio) === 0 && 
        parseIntervalToHours(s.duracion_estimada) > 0
      ).length;
      const sinDuracion = servicios.filter(s => 
        parseIntervalToHours(s.duracion_servicio) === 0 && 
        parseIntervalToHours(s.duracion_estimada) === 0
      ).length;

      const completitudDatos: CompletitudDatos = {
        totalServicios: servicios.length,
        conDuracionReal,
        conDuracionEstimada,
        sinDuracion,
        porcentajeCompletitud: servicios.length > 0 
          ? ((conDuracionReal + conDuracionEstimada) / servicios.length) * 100 
          : 0
      };
      
      // Parse durations (use real or estimated) and calculate metrics
      const serviciosConDuracion = servicios
        .map(s => {
          const duracion = getDuracionServicio(s);
          return {
            ...s,
            horas: duracion.horas,
            esEstimada: duracion.esEstimada,
            metodoCalculo: duracion.metodo
          };
        })
        .filter(s => s.horas > 0);

      const totalServicios = serviciosConDuracion.length;
      const duracionPromedio = totalServicios > 0
        ? serviciosConDuracion.reduce((sum, s) => sum + s.horas, 0) / totalServicios
        : 0;
      
      const indiceAprovechamiento = (duracionPromedio / HORAS_CONTRATADAS) * 100;
      const horasDesperdiciadas = serviciosConDuracion.reduce(
        (sum, s) => sum + Math.max(0, HORAS_CONTRATADAS - s.horas), 0
      );
      const tarifaPorHora = TARIFA_BASE_12H / HORAS_CONTRATADAS;
      const revenueLeakage = horasDesperdiciadas * tarifaPorHora;
      const costoEfectivoPorHora = duracionPromedio > 0 
        ? TARIFA_BASE_12H / duracionPromedio 
        : TARIFA_BASE_12H;

      // Distribution by duration ranges
      const rangos = [
        { rango: '0-2h', min: 0, max: 2, color: 'rojo' as const },
        { rango: '2-4h', min: 2, max: 4, color: 'rojo' as const },
        { rango: '4-6h', min: 4, max: 6, color: 'amarillo' as const },
        { rango: '6-8h', min: 6, max: 8, color: 'amarillo' as const },
        { rango: '8-12h', min: 8, max: 12, color: 'verde' as const },
        { rango: '12h+', min: 12, max: Infinity, color: 'verde' as const },
      ];

      const distribucionDuracion = rangos.map(r => {
        const count = serviciosConDuracion.filter(
          s => s.horas >= r.min && s.horas < r.max
        ).length;
        return {
          rango: r.rango,
          servicios: count,
          porcentaje: totalServicios > 0 ? (count / totalServicios) * 100 : 0,
          colorSemaforo: r.color,
        };
      });

      // Group by provider - include all services for counting
      const proveedorMapAll = new Map<string, ServicioExterno[]>();
      servicios.forEach(s => {
        const prov = s.proveedor?.toLowerCase().includes('cusaem') ? 'Cusaem' 
          : (s.proveedor?.toLowerCase().includes('seicsa') || s.id_servicio?.startsWith('SIINSRH-')) ? 'SEICSA' 
          : 'Otro';
        if (!proveedorMapAll.has(prov)) proveedorMapAll.set(prov, []);
        proveedorMapAll.get(prov)!.push(s);
      });

      const porProveedor = Array.from(proveedorMapAll.entries()).map(([nombre, servs]) => {
        const servsConDuracion = servs
          .map(s => ({ ...s, ...getDuracionServicio(s) }))
          .filter(s => s.horas > 0);
        
        const avgDur = servsConDuracion.length > 0 
          ? servsConDuracion.reduce((sum, s) => sum + s.horas, 0) / servsConDuracion.length
          : 0;
        const aprovProv = avgDur > 0 ? (avgDur / HORAS_CONTRATADAS) * 100 : 0;
        const wastedHours = servsConDuracion.reduce((sum, s) => sum + Math.max(0, HORAS_CONTRATADAS - s.horas), 0);
        
        return {
          id: nombre.toLowerCase(),
          nombre,
          esquemaPago: 'Tiempo Fijo 12h',
          tarifaBase: TARIFA_BASE_12H,
          servicios: servs.length,
          serviciosConDuracion: servsConDuracion.length,
          duracionPromedio: avgDur,
          aprovechamiento: aprovProv,
          revenueLeakage: wastedHours * tarifaPorHora,
          rating: 4.0,
        };
      });

      // Generate alerts
      const alertas: ProveedoresExternosMetrics['alertas'] = [];
      
      // Alert for incomplete data
      if (completitudDatos.porcentajeCompletitud < 80) {
        alertas.push({
          tipo: 'DATOS_INCOMPLETOS',
          severidad: completitudDatos.porcentajeCompletitud < 50 ? 'alta' : 'media',
          descripcion: `Solo ${completitudDatos.porcentajeCompletitud.toFixed(1)}% de servicios tienen duración registrada (${completitudDatos.sinDuracion} pendientes)`,
          impactoFinanciero: 0,
          accionSugerida: 'Ejecutar estimación automática de duración para servicios pendientes',
        });
      }
      
      if (indiceAprovechamiento < 30 && totalServicios > 0) {
        alertas.push({
          tipo: 'SUBUTILIZACION_CRITICA',
          severidad: 'alta',
          descripcion: `Solo se aprovecha el ${indiceAprovechamiento.toFixed(1)}% de las 12h contratadas`,
          impactoFinanciero: revenueLeakage,
          accionSugerida: 'Considerar cambio a modelo de pago por hora para servicios cortos',
        });
      }

      const serviciosCortos = serviciosConDuracion.filter(s => s.horas < 4).length;
      const pctCortos = totalServicios > 0 ? (serviciosCortos / totalServicios) * 100 : 0;
      if (pctCortos > 50) {
        alertas.push({
          tipo: 'OPORTUNIDAD_CONSOLIDACION',
          severidad: 'media',
          descripcion: `${pctCortos.toFixed(1)}% de servicios duran menos de 4h`,
          impactoFinanciero: (serviciosCortos / 2) * TARIFA_BASE_12H,
          accionSugerida: 'Consolidar servicios en misma zona para maximizar las 12h',
        });
      }

      // Monthly evolution (based on created_at)
      const evolucionMensual: ProveedoresExternosMetrics['evolucionMensual'] = [];
      const now = new Date();
      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = monthDate.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
        const monthServices = serviciosConDuracion.filter(s => {
          const d = new Date(s.created_at);
          return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
        });
        const avgAprov = monthServices.length > 0
          ? (monthServices.reduce((sum, s) => sum + s.horas, 0) / monthServices.length / HORAS_CONTRATADAS) * 100
          : 0;
        const wastedH = monthServices.reduce((sum, s) => sum + Math.max(0, HORAS_CONTRATADAS - s.horas), 0);
        evolucionMensual.push({
          mes: monthStr,
          servicios: monthServices.length,
          aprovechamiento: avgAprov,
          revenueLeakage: wastedH * tarifaPorHora,
        });
      }

      return {
        utilizacion: {
          serviciosTotales: totalServicios,
          duracionPromedio,
          indiceAprovechamiento,
          horasDesperdiciadas,
          revenueLeakage,
          costoEfectivoPorHora,
          tarifaBase: TARIFA_BASE_12H,
        },
        completitudDatos,
        distribucionDuracion,
        porProveedor,
        alertas,
        evolucionMensual,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

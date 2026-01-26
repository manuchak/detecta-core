import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Tiered km rates for internal armed guards
const TARIFAS_KM = [
  { kmMin: 0, kmMax: 100, tarifaPorKm: 6.0, rango: '0-100 km' },
  { kmMin: 100, kmMax: 250, tarifaPorKm: 5.5, rango: '101-250 km' },
  { kmMin: 250, kmMax: 400, tarifaPorKm: 5.0, rango: '251-400 km' },
  { kmMin: 400, kmMax: Infinity, tarifaPorKm: 4.6, rango: '400+ km' },
];

function calcularCostoPorKm(km: number): { tarifa: number; costo: number; rango: string } {
  const tarifaEncontrada = TARIFAS_KM.find(t => km > t.kmMin && km <= t.kmMax) 
    || TARIFAS_KM[TARIFAS_KM.length - 1];
  return { 
    tarifa: tarifaEncontrada.tarifaPorKm, 
    costo: km * tarifaEncontrada.tarifaPorKm,
    rango: tarifaEncontrada.rango 
  };
}

function normalizarNombre(nombre: string): string {
  return nombre
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ArmadoEconomics {
  serviciosTotales: number;
  kmTotales: number;
  costoTotalEstimado: number;
  tarifaPromedioKm: number;
  costoPromedioServicio: number;
  distribucionPorRango: {
    rango: string;
    servicios: number;
    kmTotales: number;
    costoTotal: number;
    tarifaAplicada: number;
    porcentaje: number;
  }[];
  tendenciaMensual: {
    mes: string;
    mesLabel: string;
    servicios: number;
    kmTotales: number;
    costoEstimado: number;
  }[];
  primerServicio: string | null;
  ultimoServicio: string | null;
  diasActivo: number;
}

export function useArmadoEconomics(nombre: string | undefined) {
  return useQuery({
    queryKey: ['armado-economics', nombre],
    queryFn: async (): Promise<ArmadoEconomics> => {
      if (!nombre) throw new Error('Nombre requerido');
      
      const nombreNormalizado = normalizarNombre(nombre);
      
      // Fetch services where this armado was assigned
      // We look in asignacion_armados for armado_nombre_verificado and join with servicios_custodia
      const { data: asignaciones, error: errorAsignaciones } = await supabase
        .from('asignacion_armados')
        .select(`
          id,
          servicio_custodia_id,
          armado_nombre_verificado,
          estado_asignacion,
          created_at
        `)
        .or(`armado_nombre_verificado.ilike.%${nombre}%`)
        .in('estado_asignacion', ['confirmado', 'en_servicio', 'completado']);
      
      if (errorAsignaciones) {
        console.error('Error fetching asignaciones:', errorAsignaciones);
        throw errorAsignaciones;
      }
      
      // Get service IDs from assignments
      const servicioIds = (asignaciones || [])
        .map(a => a.servicio_custodia_id)
        .filter(Boolean);
      
      // Fetch km data from servicios_custodia
      let serviciosData: { id: number; km_recorridos: number | null; created_at: string }[] = [];
      
      if (servicioIds.length > 0) {
        const { data: servicios, error: errorServicios } = await supabase
          .from('servicios_custodia')
          .select('id, km_recorridos, created_at')
          .in('id', servicioIds);
        
        if (errorServicios) {
          console.error('Error fetching servicios:', errorServicios);
        } else {
          serviciosData = servicios || [];
        }
      }
      
      // Also check for services where this person is directly named in nombre_custodio (legacy data)
      const { data: serviciosDirectos, error: errorDirectos } = await supabase
        .from('servicios_custodia')
        .select('id, km_recorridos, created_at')
        .ilike('nombre_custodio', `%${nombre}%`);
      
      if (!errorDirectos && serviciosDirectos) {
        // Merge and dedupe
        const existingIds = new Set(serviciosData.map(s => s.id));
        serviciosDirectos.forEach(s => {
          if (!existingIds.has(s.id)) {
            serviciosData.push(s);
          }
        });
      }
      
      // Filter valid km records
      const serviciosValidos = serviciosData.filter(
        s => s.km_recorridos !== null && 
             !isNaN(s.km_recorridos) && 
             s.km_recorridos > 0 &&
             s.km_recorridos < 10000
      );
      
      // Calculate totals
      const kmTotales = serviciosValidos.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      
      let costoTotalEstimado = 0;
      const rangoCount: Record<string, { servicios: number; km: number; costo: number; tarifa: number }> = {};
      
      TARIFAS_KM.forEach(t => {
        rangoCount[t.rango] = { servicios: 0, km: 0, costo: 0, tarifa: t.tarifaPorKm };
      });
      
      serviciosValidos.forEach(s => {
        const km = s.km_recorridos || 0;
        const { tarifa, costo, rango } = calcularCostoPorKm(km);
        costoTotalEstimado += costo;
        
        if (rangoCount[rango]) {
          rangoCount[rango].servicios++;
          rangoCount[rango].km += km;
          rangoCount[rango].costo += costo;
        }
      });
      
      const distribucionPorRango = Object.entries(rangoCount).map(([rango, data]) => ({
        rango,
        servicios: data.servicios,
        kmTotales: data.km,
        costoTotal: data.costo,
        tarifaAplicada: data.tarifa,
        porcentaje: serviciosValidos.length > 0 
          ? (data.servicios / serviciosValidos.length) * 100 
          : 0
      }));
      
      // Calculate monthly trends (last 6 months)
      const tendenciaMensual: ArmadoEconomics['tendenciaMensual'] = [];
      
      for (let i = 5; i >= 0; i--) {
        const mesDate = subMonths(new Date(), i);
        const mesStart = startOfMonth(mesDate);
        const mesKey = format(mesStart, 'yyyy-MM');
        const mesLabel = format(mesStart, 'MMM yyyy', { locale: es });
        
        const serviciosMes = serviciosValidos.filter(s => {
          const fechaServicio = format(new Date(s.created_at), 'yyyy-MM');
          return fechaServicio === mesKey;
        });
        
        const kmMes = serviciosMes.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
        let costoMes = 0;
        serviciosMes.forEach(s => {
          const { costo } = calcularCostoPorKm(s.km_recorridos || 0);
          costoMes += costo;
        });
        
        tendenciaMensual.push({
          mes: mesKey,
          mesLabel,
          servicios: serviciosMes.length,
          kmTotales: kmMes,
          costoEstimado: costoMes
        });
      }
      
      // Calculate dates and tenure
      const fechas = serviciosValidos
        .map(s => new Date(s.created_at).getTime())
        .sort((a, b) => a - b);
      
      const primerServicio = fechas.length > 0 
        ? new Date(fechas[0]).toISOString() 
        : null;
      const ultimoServicio = fechas.length > 0 
        ? new Date(fechas[fechas.length - 1]).toISOString() 
        : null;
      
      const diasActivo = primerServicio 
        ? Math.floor((Date.now() - new Date(primerServicio).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      return {
        serviciosTotales: serviciosValidos.length,
        kmTotales,
        costoTotalEstimado,
        tarifaPromedioKm: kmTotales > 0 ? costoTotalEstimado / kmTotales : 0,
        costoPromedioServicio: serviciosValidos.length > 0 
          ? costoTotalEstimado / serviciosValidos.length 
          : 0,
        distribucionPorRango,
        tendenciaMensual,
        primerServicio,
        ultimoServicio,
        diasActivo
      };
    },
    enabled: !!nombre
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyEconomics {
  mes: string;
  mesLabel: string;
  servicios: number;
  ingresos: number;
  km: number;
  ingresoPorKm: number;
  ingresoPorServicio: number;
}

export interface CustodioEconomics {
  ingresosTotales: number;
  kmTotales: number;
  serviciosTotales: number;
  horasTotales: number;
  ingresoPorKm: number;
  ingresoPorHora: number;
  ingresoPorServicio: number;
  tendenciaMensual: MonthlyEconomics[];
  ingresosMTD: number;
  serviciosMTD: number;
  kmMTD: number;
  ingresosMesAnterior: number;
  serviciosMesAnterior: number;
  variacionIngresosMTD: number;
  serviciosLocales: number;
  serviciosForaneos: number;
  ingresoLocales: number;
  ingresoForaneos: number;
  primerServicio: string | null;
  ultimoServicio: string | null;
  diasActivo: number;
}

interface ServiceRow {
  costo_custodio: number | null;
  km_recorridos: number | null;
  duracion_servicio: string | null;
  fecha_hora_cita: string;
}

function normalizarNombre(nombre: string): string {
  return nombre.trim().toUpperCase();
}

export function useProfileEconomics(nombre: string | undefined, custodioId?: string) {
  return useQuery({
    queryKey: ['profile-economics', nombre, custodioId],
    queryFn: async (): Promise<CustodioEconomics> => {
      if (!nombre) throw new Error('Nombre requerido');
      
      const nombreNormalizado = normalizarNombre(nombre);
      
      // === Dual-source pattern ===
      // Source 1: servicios_custodia (legacy)
      const { data: serviciosCustodia } = await supabase
        .from('servicios_custodia')
        .select('costo_custodio, km_recorridos, duracion_servicio, fecha_hora_cita, estado, nombre_custodio, id_custodio')
        .or(
          custodioId 
            ? `id_custodio.eq.${custodioId},nombre_custodio.ilike.${nombreNormalizado}`
            : `nombre_custodio.ilike.${nombreNormalizado}`
        )
        .eq('estado', 'Finalizado')
        .gt('costo_custodio', 0)
        .limit(400);
      
      // Source 2: servicios_planificados (new)
      const { data: serviciosPlanificados } = await supabase
        .from('servicios_planificados')
        .select('cobro_posicionamiento, km_estimados, fecha_servicio, estado, custodio_asignado, custodio_id')
        .or(
          custodioId
            ? `custodio_id.eq.${custodioId},custodio_asignado.ilike.${nombreNormalizado}`
            : `custodio_asignado.ilike.${nombreNormalizado}`
        )
        .eq('estado', 'completado')
        .limit(400);

      // Normalize and deduplicate
      const seenKeys = new Set<string>();
      const allRows: ServiceRow[] = [];

      // Add servicios_custodia rows
      (serviciosCustodia || []).forEach(s => {
        const key = `${normalizarNombre(s.nombre_custodio || '')}_${s.fecha_hora_cita}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allRows.push({
            costo_custodio: s.costo_custodio,
            km_recorridos: s.km_recorridos,
            duracion_servicio: s.duracion_servicio as string | null,
            fecha_hora_cita: s.fecha_hora_cita,
          });
        }
      });

      // Add servicios_planificados rows (mapped fields)
      (serviciosPlanificados || []).forEach(s => {
        const key = `${normalizarNombre(s.custodio_asignado || '')}_${s.fecha_servicio}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allRows.push({
            costo_custodio: s.cobro_posicionamiento,
            km_recorridos: s.km_estimados,
            duracion_servicio: null,
            fecha_hora_cita: s.fecha_servicio,
          });
        }
      });

      const data = allRows;
      
      // Calcular totales
      const ingresosTotales = data.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
      const kmTotales = data.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      const serviciosTotales = data.length;
      
      let horasTotales = 0;
      data.forEach(s => {
        if (s.duracion_servicio) {
          const duracion = String(s.duracion_servicio);
          const match = duracion.match(/(\d+):(\d+):(\d+)/);
          if (match) {
            horasTotales += parseInt(match[1]) + parseInt(match[2]) / 60 + parseInt(match[3]) / 3600;
          }
        }
      });
      
      const ingresoPorKm = kmTotales > 0 ? ingresosTotales / kmTotales : 0;
      const ingresoPorHora = horasTotales > 0 ? ingresosTotales / horasTotales : 0;
      const ingresoPorServicio = serviciosTotales > 0 ? ingresosTotales / serviciosTotales : 0;
      
      const ahora = new Date();
      const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
      
      const serviciosMTD = data.filter(s => new Date(s.fecha_hora_cita) >= inicioMesActual);
      const ingresosMTD = serviciosMTD.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
      const kmMTD = serviciosMTD.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      
      const serviciosMesAnt = data.filter(s => {
        const fecha = new Date(s.fecha_hora_cita);
        return fecha >= inicioMesAnterior && fecha <= finMesAnterior;
      });
      const ingresosMesAnterior = serviciosMesAnt.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
      
      const diaActual = ahora.getDate();
      const serviciosMTDAnterior = data.filter(s => {
        const fecha = new Date(s.fecha_hora_cita);
        return fecha >= inicioMesAnterior && fecha.getDate() <= diaActual && fecha < inicioMesActual;
      });
      const ingresosMTDAnterior = serviciosMTDAnterior.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
      const variacionIngresosMTD = ingresosMTDAnterior > 0 
        ? ((ingresosMTD - ingresosMTDAnterior) / ingresosMTDAnterior) * 100 
        : 0;
      
      const locales = data.filter(s => (s.km_recorridos || 0) < 100);
      const foraneos = data.filter(s => (s.km_recorridos || 0) >= 100);
      
      const meses: { [key: string]: MonthlyEconomics } = {};
      const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        meses[key] = {
          mes: key,
          mesLabel: `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear().toString().slice(-2)}`,
          servicios: 0, ingresos: 0, km: 0, ingresoPorKm: 0, ingresoPorServicio: 0
        };
      }
      
      data.forEach(s => {
        const fecha = new Date(s.fecha_hora_cita);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        if (meses[key]) {
          meses[key].servicios++;
          meses[key].ingresos += s.costo_custodio || 0;
          meses[key].km += s.km_recorridos || 0;
        }
      });
      
      Object.values(meses).forEach(m => {
        m.ingresoPorKm = m.km > 0 ? m.ingresos / m.km : 0;
        m.ingresoPorServicio = m.servicios > 0 ? m.ingresos / m.servicios : 0;
      });
      
      const tendenciaMensual = Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes));
      
      const fechasOrdenadas = data
        .map(s => new Date(s.fecha_hora_cita))
        .sort((a, b) => a.getTime() - b.getTime());
      
      const primerServicio = fechasOrdenadas.length > 0 ? fechasOrdenadas[0].toISOString() : null;
      const ultimoServicio = fechasOrdenadas.length > 0 ? fechasOrdenadas[fechasOrdenadas.length - 1].toISOString() : null;
      
      const diasActivo = primerServicio && ultimoServicio
        ? Math.ceil((new Date(ultimoServicio).getTime() - new Date(primerServicio).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      return {
        ingresosTotales, kmTotales, serviciosTotales, horasTotales,
        ingresoPorKm, ingresoPorHora, ingresoPorServicio, tendenciaMensual,
        ingresosMTD, serviciosMTD: serviciosMTD.length, kmMTD,
        ingresosMesAnterior, serviciosMesAnterior: serviciosMesAnt.length,
        variacionIngresosMTD,
        serviciosLocales: locales.length, serviciosForaneos: foraneos.length,
        ingresoLocales: locales.reduce((sum, s) => sum + (s.costo_custodio || 0), 0),
        ingresoForaneos: foraneos.reduce((sum, s) => sum + (s.costo_custodio || 0), 0),
        primerServicio, ultimoServicio, diasActivo
      };
    },
    enabled: !!nombre
  });
}

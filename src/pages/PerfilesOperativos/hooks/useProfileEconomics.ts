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
  // Totales históricos
  ingresosTotales: number;
  kmTotales: number;
  serviciosTotales: number;
  horasTotales: number;
  
  // Unit Economics
  ingresoPorKm: number;
  ingresoPorHora: number;
  ingresoPorServicio: number;
  
  // Tendencias mensuales (últimos 6 meses)
  tendenciaMensual: MonthlyEconomics[];
  
  // Comparación MTD (Month to Date)
  ingresosMTD: number;
  serviciosMTD: number;
  kmMTD: number;
  
  // Mes anterior completo
  ingresosMesAnterior: number;
  serviciosMesAnterior: number;
  
  // Variaciones
  variacionIngresosMTD: number;
  
  // Por tipo de servicio (basado en distancia)
  serviciosLocales: number; // < 100km
  serviciosForaneos: number; // >= 100km
  ingresoLocales: number;
  ingresoForaneos: number;
  
  // Primer y último servicio
  primerServicio: string | null;
  ultimoServicio: string | null;
  diasActivo: number;
}

function normalizarNombre(nombre: string): string {
  return nombre.trim().toUpperCase();
}

export function useProfileEconomics(nombre: string | undefined) {
  return useQuery({
    queryKey: ['profile-economics', nombre],
    queryFn: async (): Promise<CustodioEconomics> => {
      if (!nombre) throw new Error('Nombre requerido');
      
      const nombreNormalizado = normalizarNombre(nombre);
      
      // Query principal: todos los servicios finalizados del custodio
      const { data: servicios, error } = await supabase
        .from('servicios_custodia')
        .select('costo_custodio, km_recorridos, duracion_servicio, fecha_hora_cita, estado')
        .ilike('nombre_custodio', nombreNormalizado)
        .eq('estado', 'Finalizado')
        .gt('costo_custodio', 0);
      
      if (error) throw error;
      
      const data = servicios || [];
      
      // Calcular totales
      const ingresosTotales = data.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
      const kmTotales = data.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      const serviciosTotales = data.length;
      
      // Calcular horas totales (duracion_servicio es interval, lo parseamos)
      let horasTotales = 0;
      data.forEach(s => {
        if (s.duracion_servicio) {
          // Parsear interval formato "HH:MM:SS" o similar
          const duracion = String(s.duracion_servicio);
          const match = duracion.match(/(\d+):(\d+):(\d+)/);
          if (match) {
            horasTotales += parseInt(match[1]) + parseInt(match[2]) / 60 + parseInt(match[3]) / 3600;
          }
        }
      });
      
      // Unit Economics
      const ingresoPorKm = kmTotales > 0 ? ingresosTotales / kmTotales : 0;
      const ingresoPorHora = horasTotales > 0 ? ingresosTotales / horasTotales : 0;
      const ingresoPorServicio = serviciosTotales > 0 ? ingresosTotales / serviciosTotales : 0;
      
      // Fechas para cálculos temporales
      const ahora = new Date();
      const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
      
      // MTD (Month to Date)
      const serviciosMTD = data.filter(s => {
        const fecha = new Date(s.fecha_hora_cita);
        return fecha >= inicioMesActual;
      });
      const ingresosMTD = serviciosMTD.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
      const kmMTD = serviciosMTD.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      
      // Mes anterior completo
      const serviciosMesAnt = data.filter(s => {
        const fecha = new Date(s.fecha_hora_cita);
        return fecha >= inicioMesAnterior && fecha <= finMesAnterior;
      });
      const ingresosMesAnterior = serviciosMesAnt.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
      
      // Variación MTD vs mismo período mes anterior
      const diaActual = ahora.getDate();
      const serviciosMTDAnterior = data.filter(s => {
        const fecha = new Date(s.fecha_hora_cita);
        return fecha >= inicioMesAnterior && fecha.getDate() <= diaActual && fecha < inicioMesActual;
      });
      const ingresosMTDAnterior = serviciosMTDAnterior.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
      const variacionIngresosMTD = ingresosMTDAnterior > 0 
        ? ((ingresosMTD - ingresosMTDAnterior) / ingresosMTDAnterior) * 100 
        : 0;
      
      // Por tipo de servicio (local < 100km, foráneo >= 100km)
      const locales = data.filter(s => (s.km_recorridos || 0) < 100);
      const foraneos = data.filter(s => (s.km_recorridos || 0) >= 100);
      
      // Tendencia mensual (últimos 6 meses)
      const meses: { [key: string]: MonthlyEconomics } = {};
      const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      // Inicializar últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        meses[key] = {
          mes: key,
          mesLabel: `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear().toString().slice(-2)}`,
          servicios: 0,
          ingresos: 0,
          km: 0,
          ingresoPorKm: 0,
          ingresoPorServicio: 0
        };
      }
      
      // Agregar datos
      data.forEach(s => {
        const fecha = new Date(s.fecha_hora_cita);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        if (meses[key]) {
          meses[key].servicios++;
          meses[key].ingresos += s.costo_custodio || 0;
          meses[key].km += s.km_recorridos || 0;
        }
      });
      
      // Calcular unit economics por mes
      Object.values(meses).forEach(m => {
        m.ingresoPorKm = m.km > 0 ? m.ingresos / m.km : 0;
        m.ingresoPorServicio = m.servicios > 0 ? m.ingresos / m.servicios : 0;
      });
      
      const tendenciaMensual = Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes));
      
      // Primer y último servicio
      const fechasOrdenadas = data
        .map(s => new Date(s.fecha_hora_cita))
        .sort((a, b) => a.getTime() - b.getTime());
      
      const primerServicio = fechasOrdenadas.length > 0 ? fechasOrdenadas[0].toISOString() : null;
      const ultimoServicio = fechasOrdenadas.length > 0 ? fechasOrdenadas[fechasOrdenadas.length - 1].toISOString() : null;
      
      // Días activo
      const diasActivo = primerServicio && ultimoServicio
        ? Math.ceil((new Date(ultimoServicio).getTime() - new Date(primerServicio).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      return {
        ingresosTotales,
        kmTotales,
        serviciosTotales,
        horasTotales,
        ingresoPorKm,
        ingresoPorHora,
        ingresoPorServicio,
        tendenciaMensual,
        ingresosMTD,
        serviciosMTD: serviciosMTD.length,
        kmMTD,
        ingresosMesAnterior,
        serviciosMesAnterior: serviciosMesAnt.length,
        variacionIngresosMTD,
        serviciosLocales: locales.length,
        serviciosForaneos: foraneos.length,
        ingresoLocales: locales.reduce((sum, s) => sum + (s.costo_custodio || 0), 0),
        ingresoForaneos: foraneos.reduce((sum, s) => sum + (s.costo_custodio || 0), 0),
        primerServicio,
        ultimoServicio,
        diasActivo
      };
    },
    enabled: !!nombre
  });
}

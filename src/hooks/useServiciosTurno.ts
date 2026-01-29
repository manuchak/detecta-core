import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CIUDADES_PRINCIPALES, extraerCiudad } from '@/utils/geografico';

export type EstadoVisual = 'en_sitio' | 'proximo' | 'asignado' | 'sin_asignar';

export interface ServicioTurno {
  id: string;
  nombre_cliente: string | null;
  origen: string | null;
  destino: string | null;
  custodio_asignado: string | null;
  fecha_hora_cita: string | null;
  estado_planeacion: string | null;
  hora_inicio_real: string | null;
  // Campos calculados
  lat: number | null;
  lng: number | null;
  estadoVisual: EstadoVisual;
  minutosParaCita: number;
}

export interface ResumenTurno {
  enSitio: number;
  proximos: number;
  asignados: number;
  sinAsignar: number;
  total: number;
}

// Paleta de colores por estado
export const COLORES_ESTADO: Record<EstadoVisual, {
  primary: string;
  bg: string;
  border: string;
  icon: string;
  label: string;
}> = {
  en_sitio: {
    primary: 'hsl(142, 76%, 36%)',    // green-600
    bg: 'hsl(142, 76%, 94%)',         // green-100
    border: 'hsl(142, 71%, 45%)',     // green-500
    icon: 'CheckCircle',
    label: 'Posicionado'
  },
  proximo: {
    primary: 'hsl(38, 92%, 50%)',     // amber-500
    bg: 'hsl(48, 96%, 89%)',          // amber-100
    border: 'hsl(32, 95%, 44%)',      // amber-600
    icon: 'Clock',
    label: 'En Camino'
  },
  asignado: {
    primary: 'hsl(217, 91%, 60%)',    // blue-500
    bg: 'hsl(214, 95%, 93%)',         // blue-100
    border: 'hsl(221, 83%, 53%)',     // blue-600
    icon: 'User',
    label: 'Por Salir'
  },
  sin_asignar: {
    primary: 'hsl(220, 9%, 46%)',     // gray-500
    bg: 'hsl(220, 14%, 96%)',         // gray-100
    border: 'hsl(215, 14%, 34%)',     // gray-600
    icon: 'AlertCircle',
    label: 'Pendiente Custodio'
  }
};

/**
 * Calcula el estado visual basado en las condiciones del servicio
 */
function calcularEstadoVisual(
  horaInicioReal: string | null,
  custodioAsignado: string | null,
  fechaHoraCita: string | null
): { estado: EstadoVisual; minutosParaCita: number } {
  // Si ya inició el servicio → En Sitio
  if (horaInicioReal) {
    return { estado: 'en_sitio', minutosParaCita: 0 };
  }
  
  // Sin custodio → Sin Asignar
  if (!custodioAsignado) {
    const minutos = fechaHoraCita 
      ? (new Date(fechaHoraCita).getTime() - Date.now()) / 60000 
      : 0;
    return { estado: 'sin_asignar', minutosParaCita: Math.round(minutos) };
  }
  
  // Calcular minutos hasta la cita
  if (!fechaHoraCita) {
    return { estado: 'asignado', minutosParaCita: 0 };
  }
  
  const ahora = Date.now();
  const cita = new Date(fechaHoraCita).getTime();
  const minutos = (cita - ahora) / 60000;
  
  // Menos de 60 minutos y no más de 30 minutos pasados → Próximo
  if (minutos <= 60 && minutos >= -30) {
    return { estado: 'proximo', minutosParaCita: Math.round(minutos) };
  }
  
  // Con custodio y tiempo → Asignado
  return { estado: 'asignado', minutosParaCita: Math.round(minutos) };
}

/**
 * Geocodifica un origen usando el diccionario de ciudades
 */
function geocodificarOrigen(origen: string | null): { lat: number | null; lng: number | null } {
  if (!origen) return { lat: null, lng: null };
  
  const ciudadKey = extraerCiudad(origen);
  if (!ciudadKey) return { lat: null, lng: null };
  
  const ciudadInfo = CIUDADES_PRINCIPALES[ciudadKey as keyof typeof CIUDADES_PRINCIPALES];
  if (!ciudadInfo) return { lat: null, lng: null };
  
  // Añadir pequeño offset aleatorio para evitar superposición exacta
  const offset = () => (Math.random() - 0.5) * 0.02;
  
  return {
    lat: ciudadInfo.lat + offset(),
    lng: ciudadInfo.lng + offset()
  };
}

export const useServiciosTurno = () => {
  return useQuery({
    queryKey: ['servicios-turno'],
    queryFn: async (): Promise<{ servicios: ServicioTurno[]; resumen: ResumenTurno }> => {
      // Calcular ventana de ±8 horas
      const ahora = new Date();
      const hace8Horas = new Date(ahora.getTime() - 8 * 60 * 60 * 1000);
      const en8Horas = new Date(ahora.getTime() + 8 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, nombre_cliente, origen, destino, custodio_asignado, fecha_hora_cita, estado_planeacion, hora_inicio_real')
        .gte('fecha_hora_cita', hace8Horas.toISOString())
        .lte('fecha_hora_cita', en8Horas.toISOString())
        .not('estado_planeacion', 'in', '(cancelado,completado)')
        .order('fecha_hora_cita', { ascending: true });
      
      if (error) throw error;
      
      // Transformar datos con geocodificación y estado visual
      const servicios: ServicioTurno[] = (data || []).map(s => {
        const coords = geocodificarOrigen(s.origen);
        const { estado, minutosParaCita } = calcularEstadoVisual(
          s.hora_inicio_real,
          s.custodio_asignado,
          s.fecha_hora_cita
        );
        
        return {
          ...s,
          lat: coords.lat,
          lng: coords.lng,
          estadoVisual: estado,
          minutosParaCita
        };
      });
      
      // Calcular resumen
      const resumen: ResumenTurno = {
        enSitio: servicios.filter(s => s.estadoVisual === 'en_sitio').length,
        proximos: servicios.filter(s => s.estadoVisual === 'proximo').length,
        asignados: servicios.filter(s => s.estadoVisual === 'asignado').length,
        sinAsignar: servicios.filter(s => s.estadoVisual === 'sin_asignar').length,
        total: servicios.length
      };
      
      return { servicios, resumen };
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
    staleTime: 15000,
  });
};

/**
 * Funciones de detección de conflictos para custodios
 * Usado como backup cuando la función RPC falla
 */

import { supabase } from '@/integrations/supabase/client';

export interface ConflictDetails {
  id_servicio: string;
  fecha_hora: string;
  origen: 'servicios_custodia' | 'servicios_planificados';
}

export interface ConflictValidation {
  disponible: boolean;
  servicios_en_conflicto: number;
  conflictos_detalle: ConflictDetails[];
  servicios_hoy: number;
  razon_no_disponible?: string;
  categoria_disponibilidad: 'disponible' | 'parcialmente_ocupado' | 'ocupado' | 'no_disponible';
}

/**
 * Verifica si un custodio tiene conflictos de horario para una fecha y hora específicas
 * Consulta ambas tablas: servicios_custodia y servicios_planificados
 */
export async function verificarConflictosCustodio(
  custodioId: string,
  custodioNombre: string,
  fechaServicio: string, // YYYY-MM-DD
  horaInicio: string, // HH:MM
  duracionHoras: number = 4
): Promise<ConflictValidation> {
  console.log('🔍 Verificando conflictos para:', { custodioNombre, fechaServicio, horaInicio });

  const horaFin = calcularHoraFin(horaInicio, duracionHoras);
  const conflictosDetalle: ConflictDetails[] = [];
  let serviciosHoy = 0;

  try {
    // 1. Verificar servicios en servicios_custodia
    const { data: serviciosCustodia, error: errorCustodia } = await supabase
      .from('servicios_custodia')
      .select('id_servicio, fecha_hora_cita, estado')
      .or(`id_custodio.eq.${custodioId},nombre_custodio.eq.${custodioNombre}`)
      .gte('fecha_hora_cita', `${fechaServicio}T00:00:00`)
      .lt('fecha_hora_cita', `${fechaServicio}T23:59:59`);

    if (errorCustodia) {
      console.warn('Error consultando servicios_custodia:', errorCustodia);
    } else if (serviciosCustodia) {
      for (const servicio of serviciosCustodia) {
        const estadoLimpio = (servicio.estado || '').toLowerCase().trim();
        
        // Excluir servicios cancelados o finalizados
        if (['cancelado', 'cancelled', 'canceled', 'finalizado', 'completado'].includes(estadoLimpio)) {
          continue;
        }

        serviciosHoy++;
        
        // Verificar solapamiento de horarios
        const horaServicio = new Date(servicio.fecha_hora_cita).toTimeString().substring(0, 5);
        const horaFinServicio = calcularHoraFin(horaServicio, 4);
        
        if (hayConflictoHorario(horaInicio, horaFin, horaServicio, horaFinServicio)) {
          conflictosDetalle.push({
            id_servicio: servicio.id_servicio,
            fecha_hora: servicio.fecha_hora_cita,
            origen: 'servicios_custodia'
          });
        }
      }
    }

    // 2. Verificar servicios en servicios_planificados
    const { data: serviciosPlanificados, error: errorPlanificados } = await supabase
      .from('servicios_planificados')
      .select('id_servicio, fecha_hora_cita, estado_planeacion')
      .or(`custodio_id.eq.${custodioId},custodio_asignado.eq.${custodioNombre}`)
      .gte('fecha_hora_cita', `${fechaServicio}T00:00:00`)
      .lt('fecha_hora_cita', `${fechaServicio}T23:59:59`);

    if (errorPlanificados) {
      console.warn('Error consultando servicios_planificados:', errorPlanificados);
    } else if (serviciosPlanificados) {
      for (const servicio of serviciosPlanificados) {
        // Solo considerar servicios activos (incluir 'planificado')
        if (!['planificado', 'asignado', 'confirmado', 'en_progreso'].includes(servicio.estado_planeacion)) {
          continue;
        }

        serviciosHoy++;
        
        // Verificar solapamiento de horarios
        const horaServicio = new Date(servicio.fecha_hora_cita).toTimeString().substring(0, 5);
        const horaFinServicio = calcularHoraFin(horaServicio, 4);
        
        if (hayConflictoHorario(horaInicio, horaFin, horaServicio, horaFinServicio)) {
          conflictosDetalle.push({
            id_servicio: servicio.id_servicio || 'unknown',
            fecha_hora: servicio.fecha_hora_cita,
            origen: 'servicios_planificados'
          });
        }
      }
    }

    // 3. Determinar disponibilidad
    const serviciosEnConflicto = conflictosDetalle.length;
    let disponible = true;
    let razonNoDisponible: string | undefined;
    let categoria: 'disponible' | 'parcialmente_ocupado' | 'ocupado' | 'no_disponible' = 'disponible';

    if (serviciosEnConflicto > 0) {
      disponible = false;
      categoria = 'no_disponible';
      razonNoDisponible = `Conflicto horario detectado con ${serviciosEnConflicto} servicio(s) existente(s)`;
    } else if (serviciosHoy >= 3) {
      disponible = false;
      categoria = 'no_disponible';
      razonNoDisponible = `Límite máximo de servicios diarios alcanzado (${serviciosHoy}/3)`;
    } else if (serviciosHoy === 2) {
      categoria = 'ocupado';
    } else if (serviciosHoy === 1) {
      categoria = 'parcialmente_ocupado';
    }

    console.log(`✅ Verificación completa para ${custodioNombre}:`, {
      disponible,
      serviciosHoy,
      serviciosEnConflicto,
      categoria
    });

    return {
      disponible,
      servicios_en_conflicto: serviciosEnConflicto,
      conflictos_detalle: conflictosDetalle,
      servicios_hoy: serviciosHoy,
      razon_no_disponible: razonNoDisponible,
      categoria_disponibilidad: categoria
    };

  } catch (error) {
    console.error('❌ Error verificando conflictos:', error);
    
    // En caso de error, asumir que no está disponible por seguridad
    return {
      disponible: false,
      servicios_en_conflicto: 0,
      conflictos_detalle: [],
      servicios_hoy: 0,
      razon_no_disponible: 'Error al verificar disponibilidad - contactar soporte',
      categoria_disponibilidad: 'no_disponible'
    };
  }
}

/**
 * Calcula la hora de fin basada en la hora de inicio y duración
 */
function calcularHoraFin(horaInicio: string, duracionHoras: number): string {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(horas, minutos, 0, 0);
  fecha.setHours(fecha.getHours() + duracionHoras);
  
  return fecha.toTimeString().substring(0, 5);
}

/**
 * Verifica si hay conflicto entre dos rangos horarios
 */
function hayConflictoHorario(
  inicio1: string,
  fin1: string,
  inicio2: string,
  fin2: string
): boolean {
  const convertirAMinutos = (hora: string): number => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const i1 = convertirAMinutos(inicio1);
  const f1 = convertirAMinutos(fin1);
  const i2 = convertirAMinutos(inicio2);
  const f2 = convertirAMinutos(fin2);

  // Hay conflicto si los rangos se solapan
  return i1 < f2 && i2 < f1;
}
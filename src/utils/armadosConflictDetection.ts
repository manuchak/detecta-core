import { supabase } from '@/integrations/supabase/client';

export interface ArmadosConflictDetails {
  assignment_id: string;
  servicio_id: string;
  fecha_hora: string;
  origen: string;
}

export interface ArmadosConflictValidation {
  disponible: boolean;
  categoria_disponibilidad: string;
  razon_no_disponible?: string;
  servicios_hoy: number;
  servicios_en_conflicto: number;
  conflictos_detalle: ArmadosConflictDetails[];
  horas_trabajadas_hoy: number;
  dias_sin_asignar: number;
  nivel_fatiga: string;
  factor_equidad: number;
  factor_oportunidad: number;
  scoring_equitativo: {
    workload_score: number;
    opportunity_score: number;
    fatiga_penalty: number;
    balance_recommendation: string;
  };
}

/**
 * Fallback function to verify armed guard conflicts when RPC fails
 * Follows the same pattern as custodios conflict detection
 */
export async function verificarConflictosArmado(
  armadoId: string,
  armadoNombre: string,
  fechaServicio: string,
  horaInicio: string,
  duracionHoras: number = 4
): Promise<ArmadosConflictValidation> {
  
  try {
    const fechaServicioDate = new Date(fechaServicio);
    const horaFin = calcularHoraFin(horaInicio, duracionHoras);
    
    // Query existing assignments for conflicts - Simplified approach
    const { data: asignaciones, error } = await supabase
      .from('asignacion_armados')
      .select('id, servicio_custodia_id, estado_asignacion, armado_id, armado_nombre_verificado')
      .or(`armado_id.eq.${armadoId},armado_nombre_verificado.eq.${armadoNombre}`)
      .in('estado_asignacion', ['confirmado', 'asignado', 'en_progreso']);

    if (error) {
      console.error('Error querying armados assignments:', error);
      return getDefaultUnavailableResponse();
    }

    // Get service details separately to avoid typing issues
    const serviceIds = asignaciones?.map(a => a.servicio_custodia_id).filter(Boolean) || [];
    
    let serviciosData: any[] = [];
    if (serviceIds.length > 0) {
      const { data: services } = await supabase
        .from('servicios_custodia')
        .select('id_servicio, fecha_hora_cita, estado')
        .in('id_servicio', serviceIds);
      
      serviciosData = services || [];
    }

    const assignmentsToday = asignaciones?.filter(a => {
      const serviceData = serviciosData.find(s => s.id_servicio === a.servicio_custodia_id);
      if (!serviceData?.fecha_hora_cita) return false;
      
      const assignmentDate = new Date(serviceData.fecha_hora_cita);
      return assignmentDate.toDateString() === fechaServicioDate.toDateString() &&
             !['cancelado', 'cancelled', 'canceled', 'finalizado', 'completado'].includes(
               serviceData.estado?.toLowerCase()?.trim() || ''
             );
    }) || [];

    const serviciosHoy = assignmentsToday.length;

    // Check for time conflicts
    const conflictos: ArmadosConflictDetails[] = [];
    
    assignmentsToday.forEach(assignment => {
      const serviceData = serviciosData.find(s => s.id_servicio === assignment.servicio_custodia_id);
      if (!serviceData?.fecha_hora_cita) return;
      
      const assignmentTime = new Date(serviceData.fecha_hora_cita);
      const assignmentHoraInicio = assignmentTime.toTimeString().slice(0, 5);
      const assignmentHoraFin = calcularHoraFin(assignmentHoraInicio, 4);

      if (hayConflictoHorario(horaInicio, horaFin, assignmentHoraInicio, assignmentHoraFin)) {
        conflictos.push({
          assignment_id: assignment.id,
          servicio_id: assignment.servicio_custodia_id,
          fecha_hora: serviceData.fecha_hora_cita,
          origen: 'asignacion_armados'
        });
      }
    });

    const serviciosEnConflicto = conflictos.length;
    const horasTrabajadasHoy = serviciosHoy * 4; // 4 hours per assignment

    // Calculate days without assignment
    const diasSinAsignar = await calcularDiasSinAsignarArmado(armadoId, armadoNombre, fechaServicioDate);

    // Determine fatigue level
    let nivelFatiga = 'bajo';
    if (horasTrabajadasHoy >= 12) nivelFatiga = 'alto';
    else if (horasTrabajadasHoy >= 8) nivelFatiga = 'medio';

    // Determine availability
    let disponible = true;
    let categoriaDisponibilidad = 'libre';
    let razonNoDisponible = '';

    if (serviciosEnConflicto > 0) {
      disponible = false;
      categoriaDisponibilidad = 'no_disponible';
      razonNoDisponible = `Conflicto horario detectado con ${serviciosEnConflicto} servicio(s) existente(s)`;
    } else if (serviciosHoy >= 2) {
      disponible = false;
      categoriaDisponibilidad = 'no_disponible';
      razonNoDisponible = `Límite máximo de servicios diarios alcanzado (${serviciosHoy}/2)`;
    } else if (horasTrabajadasHoy >= 10) {
      disponible = false;
      categoriaDisponibilidad = 'no_disponible';
      razonNoDisponible = `Límite de horas trabajadas excedido (${horasTrabajadasHoy}/10h)`;
    } else if (serviciosHoy === 1) {
      categoriaDisponibilidad = 'ocupado_disponible';
    }

    // Calculate equity and opportunity factors
    let factorEquidad = serviciosHoy === 0 ? 100.0 : serviciosHoy === 1 ? 60.0 : 20.0;
    
    // Apply fatigue penalty
    if (nivelFatiga === 'alto') factorEquidad *= 0.6;
    else if (nivelFatiga === 'medio') factorEquidad *= 0.8;

    let factorOportunidad = 40.0;
    if (diasSinAsignar >= 7) factorOportunidad = 100.0;
    else if (diasSinAsignar >= 3) factorOportunidad = 80.0;
    else if (diasSinAsignar >= 1) factorOportunidad = 60.0;

    if (diasSinAsignar >= 14) factorOportunidad += 20.0;

    // Ensure values are within bounds
    factorEquidad = Math.max(0, Math.min(100, factorEquidad));
    factorOportunidad = Math.max(0, Math.min(100, factorOportunidad));

    const fatigaPenalty = nivelFatiga === 'alto' ? 40 : nivelFatiga === 'medio' ? 20 : 0;
    const balanceRecommendation = categoriaDisponibilidad === 'libre' ? 'ideal' : 
                                  categoriaDisponibilidad === 'ocupado_disponible' ? 'aceptable' : 'evitar';

    return {
      disponible,
      categoria_disponibilidad: categoriaDisponibilidad,
      razon_no_disponible: razonNoDisponible,
      servicios_hoy: serviciosHoy,
      servicios_en_conflicto: serviciosEnConflicto,
      conflictos_detalle: conflictos,
      horas_trabajadas_hoy: horasTrabajadasHoy,
      dias_sin_asignar: diasSinAsignar,
      nivel_fatiga: nivelFatiga,
      factor_equidad: factorEquidad,
      factor_oportunidad: factorOportunidad,
      scoring_equitativo: {
        workload_score: factorEquidad,
        opportunity_score: factorOportunidad,
        fatiga_penalty: fatigaPenalty,
        balance_recommendation: balanceRecommendation
      }
    };

  } catch (error) {
    console.error('Error in armados conflict detection fallback:', error);
    return getDefaultUnavailableResponse();
  }
}

/**
 * Calculate days without assignment for armed guard
 */
async function calcularDiasSinAsignarArmado(
  armadoId: string, 
  armadoNombre: string, 
  fechaServicio: Date
): Promise<number> {
  try {
    // Simplified query for last assignment
    const { data: assignments } = await supabase
      .from('asignacion_armados')
      .select('servicio_custodia_id')
      .or(`armado_id.eq.${armadoId},armado_nombre_verificado.eq.${armadoNombre}`)
      .in('estado_asignacion', ['confirmado', 'completado'])
      .order('created_at', { ascending: false })
      .limit(10); // Get last 10 to find most recent with service data

    if (!assignments?.length) {
      return 30; // Default to 30 days if no previous assignments
    }

    // Get service dates
    const serviceIds = assignments.map(a => a.servicio_custodia_id);
    const { data: services } = await supabase
      .from('servicios_custodia')
      .select('id_servicio, fecha_hora_cita')
      .in('id_servicio', serviceIds)
      .order('fecha_hora_cita', { ascending: false })
      .limit(1);

    if (!services?.length) {
      return 30;
    }

    const lastDate = new Date(services[0].fecha_hora_cita);
    const diffTime = fechaServicio.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  } catch (error) {
    console.error('Error calculating days without assignment:', error);
    return 0;
  }
}

/**
 * Calculate end time given start time and duration
 */
function calcularHoraFin(horaInicio: string, duracionHoras: number): string {
  const [hours, minutes] = horaInicio.split(':').map(Number);
  const startTime = new Date();
  startTime.setHours(hours, minutes, 0, 0);
  
  const endTime = new Date(startTime.getTime() + duracionHoras * 60 * 60 * 1000);
  
  return endTime.toTimeString().slice(0, 5);
}

/**
 * Check if two time ranges overlap
 */
function hayConflictoHorario(
  inicio1: string, 
  fin1: string, 
  inicio2: string, 
  fin2: string
): boolean {
  const start1 = timeToMinutes(inicio1);
  const end1 = timeToMinutes(fin1);
  const start2 = timeToMinutes(inicio2);
  const end2 = timeToMinutes(fin2);
  
  return start1 < end2 && end1 > start2;
}

/**
 * Convert time string to minutes for comparison
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Default response when conflict detection fails
 */
function getDefaultUnavailableResponse(): ArmadosConflictValidation {
  return {
    disponible: false,
    categoria_disponibilidad: 'no_disponible',
    razon_no_disponible: 'Error al verificar disponibilidad - por seguridad se marca como no disponible',
    servicios_hoy: 0,
    servicios_en_conflicto: 0,
    conflictos_detalle: [],
    horas_trabajadas_hoy: 0,
    dias_sin_asignar: 0,
    nivel_fatiga: 'bajo',
    factor_equidad: 0,
    factor_oportunidad: 0,
    scoring_equitativo: {
      workload_score: 0,
      opportunity_score: 0,
      fatiga_penalty: 0,
      balance_recommendation: 'evitar'
    }
  };
}
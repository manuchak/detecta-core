-- Create RPC function to verify armed guard availability and conflicts
CREATE OR REPLACE FUNCTION public.verificar_disponibilidad_equitativa_armado(
  p_armado_id uuid, 
  p_armado_nombre text, 
  p_fecha_servicio date, 
  p_hora_inicio time without time zone, 
  p_duracion_estimada_horas integer DEFAULT 4
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  servicios_hoy integer := 0;
  servicios_en_conflicto integer := 0;
  horas_trabajadas_hoy numeric := 0;
  ultimo_servicio_fecha date;
  dias_sin_asignar integer := 0;
  nivel_fatiga text := 'bajo';
  categoria_disponibilidad text;
  factor_equidad numeric := 50.0;
  factor_oportunidad numeric := 50.0;
  disponible boolean := true;
  razon_no_disponible text;
  resultado jsonb;
  conflictos_detalle jsonb := '[]'::jsonb;
  hora_fin time without time zone;
BEGIN
  -- Calcular hora de fin del servicio propuesto
  hora_fin := (p_hora_inicio::time + (p_duracion_estimada_horas || ' hours')::interval)::time;

  -- Contar servicios asignados hoy en asignacion_armados
  SELECT COUNT(*) INTO servicios_hoy
  FROM asignacion_armados aa
  JOIN servicios_custodia sc ON aa.servicio_custodia_id = sc.id_servicio
  WHERE (aa.armado_id = p_armado_id OR aa.armado_nombre_verificado = p_armado_nombre)
    AND DATE(sc.fecha_hora_cita) = p_fecha_servicio
    AND aa.estado_asignacion IN ('confirmado', 'asignado', 'en_progreso')
    AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled', 'finalizado', 'completado');

  -- Verificar conflictos horarios en asignaciones existentes
  WITH conflictos_armados AS (
    SELECT 
      aa.id as assignment_id,
      sc.fecha_hora_cita,
      'asignacion_armados' as origen,
      aa.servicio_custodia_id
    FROM asignacion_armados aa
    JOIN servicios_custodia sc ON aa.servicio_custodia_id = sc.id_servicio
    WHERE (aa.armado_id = p_armado_id OR aa.armado_nombre_verificado = p_armado_nombre)
      AND DATE(sc.fecha_hora_cita) = p_fecha_servicio
      AND aa.estado_asignacion IN ('confirmado', 'asignado', 'en_progreso')
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled', 'finalizado', 'completado')
      AND (
        (p_hora_inicio::time, hora_fin) 
        OVERLAPS 
        (sc.fecha_hora_cita::time, (sc.fecha_hora_cita::time + '4 hours'::interval)::time)
      )
  )
  SELECT 
    COUNT(*)::integer,
    jsonb_agg(jsonb_build_object(
      'assignment_id', assignment_id,
      'servicio_id', servicio_custodia_id,
      'fecha_hora', fecha_hora_cita,
      'origen', origen
    ))
  INTO servicios_en_conflicto, conflictos_detalle
  FROM conflictos_armados;

  -- Calcular horas trabajadas aproximadas hoy
  WITH horas_armados AS (
    SELECT COALESCE(SUM(4), 0) as horas -- Asumimos 4 horas por servicio de armado
    FROM asignacion_armados aa
    JOIN servicios_custodia sc ON aa.servicio_custodia_id = sc.id_servicio
    WHERE (aa.armado_id = p_armado_id OR aa.armado_nombre_verificado = p_armado_nombre)
      AND DATE(sc.fecha_hora_cita) = p_fecha_servicio
      AND aa.estado_asignacion IN ('confirmado', 'asignado', 'en_progreso')
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
  )
  SELECT horas INTO horas_trabajadas_hoy FROM horas_armados;

  -- Calcular días sin asignar servicio
  WITH ultimo_servicio AS (
    SELECT MAX(DATE(sc.fecha_hora_cita)) as ultima_fecha
    FROM asignacion_armados aa
    JOIN servicios_custodia sc ON aa.servicio_custodia_id = sc.id_servicio
    WHERE (aa.armado_id = p_armado_id OR aa.armado_nombre_verificado = p_armado_nombre)
      AND aa.estado_asignacion IN ('confirmado', 'completado')
  )
  SELECT GREATEST(0, p_fecha_servicio - COALESCE(us.ultima_fecha, p_fecha_servicio - 30))
  INTO dias_sin_asignar
  FROM ultimo_servicio us;

  -- Determinar nivel de fatiga
  IF horas_trabajadas_hoy >= 12 THEN
    nivel_fatiga := 'alto';
  ELSIF horas_trabajadas_hoy >= 8 THEN
    nivel_fatiga := 'medio';
  ELSE
    nivel_fatiga := 'bajo';
  END IF;

  -- Determinar disponibilidad y categoría
  IF servicios_en_conflicto > 0 THEN
    disponible := false;
    categoria_disponibilidad := 'no_disponible';
    razon_no_disponible := 'Conflicto horario detectado con ' || servicios_en_conflicto || ' servicio(s) existente(s)';
  ELSIF servicios_hoy >= 2 THEN -- Límite más bajo para armados
    disponible := false;
    categoria_disponibilidad := 'no_disponible'; 
    razon_no_disponible := 'Límite máximo de servicios diarios alcanzado (' || servicios_hoy || '/2)';
  ELSIF horas_trabajadas_hoy >= 10 THEN -- Límite más bajo para armados
    disponible := false;
    categoria_disponibilidad := 'no_disponible';
    razon_no_disponible := 'Límite de horas trabajadas excedido (' || horas_trabajadas_hoy || '/10h)';
  ELSIF servicios_hoy = 1 THEN
    categoria_disponibilidad := 'ocupado_disponible';
  ELSE
    categoria_disponibilidad := 'libre';
  END IF;

  -- Calcular factores de equidad y oportunidad
  CASE servicios_hoy
    WHEN 0 THEN factor_equidad := 100.0;
    WHEN 1 THEN factor_equidad := 60.0;
    ELSE factor_equidad := 20.0;
  END CASE;

  CASE nivel_fatiga
    WHEN 'alto' THEN factor_equidad := factor_equidad * 0.6;
    WHEN 'medio' THEN factor_equidad := factor_equidad * 0.8;
    ELSE factor_equidad := factor_equidad;
  END CASE;

  CASE 
    WHEN dias_sin_asignar >= 7 THEN factor_oportunidad := 100.0;
    WHEN dias_sin_asignar >= 3 THEN factor_oportunidad := 80.0;
    WHEN dias_sin_asignar >= 1 THEN factor_oportunidad := 60.0;
    ELSE factor_oportunidad := 40.0;
  END CASE;

  IF dias_sin_asignar >= 14 THEN
    factor_oportunidad := factor_oportunidad + 20.0;
  END IF;

  -- Construir resultado
  resultado := jsonb_build_object(
    'disponible', disponible,
    'categoria_disponibilidad', categoria_disponibilidad,
    'razon_no_disponible', razon_no_disponible,
    'servicios_hoy', servicios_hoy,
    'servicios_en_conflicto', servicios_en_conflicto,
    'conflictos_detalle', conflictos_detalle,
    'horas_trabajadas_hoy', horas_trabajadas_hoy,
    'dias_sin_asignar', dias_sin_asignar,
    'nivel_fatiga', nivel_fatiga,
    'factor_equidad', GREATEST(0, LEAST(100, factor_equidad)),
    'factor_oportunidad', GREATEST(0, LEAST(100, factor_oportunidad)),
    'validacion_mejorada', true,
    'scoring_equitativo', jsonb_build_object(
      'workload_score', GREATEST(0, LEAST(100, factor_equidad)),
      'opportunity_score', GREATEST(0, LEAST(100, factor_oportunidad)),
      'fatiga_penalty', CASE nivel_fatiga 
        WHEN 'alto' THEN 40 
        WHEN 'medio' THEN 20 
        ELSE 0 
      END,
      'balance_recommendation', CASE categoria_disponibilidad
        WHEN 'libre' THEN 'ideal'
        WHEN 'ocupado_disponible' THEN 'aceptable'
        ELSE 'evitar'
      END
    )
  );

  RETURN resultado;
END;
$function$;
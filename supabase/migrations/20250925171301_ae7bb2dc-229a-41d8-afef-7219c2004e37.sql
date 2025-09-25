-- Función para verificar disponibilidad real y calcular factor de equidad
CREATE OR REPLACE FUNCTION public.verificar_disponibilidad_equitativa_custodio(
  p_custodio_id uuid,
  p_custodio_nombre text,
  p_fecha_servicio date,
  p_hora_inicio time,
  p_duracion_estimada_horas integer DEFAULT 4
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
BEGIN
  -- Contar servicios asignados hoy
  SELECT COUNT(*) INTO servicios_hoy
  FROM servicios_custodia sc
  WHERE (sc.custodio_id = p_custodio_id OR sc.nombre_custodio = p_custodio_nombre)
    AND DATE(sc.fecha_hora_cita) = p_fecha_servicio
    AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled', 'finalizado', 'completado');

  -- Calcular horas trabajadas aproximadas hoy
  SELECT COALESCE(SUM(CASE 
    WHEN sc.km_recorridos IS NOT NULL AND sc.km_recorridos > 0 
    THEN GREATEST(2, LEAST(8, sc.km_recorridos / 50.0)) -- Estimar duración por km
    ELSE 3 -- Duración promedio por servicio
  END), 0) INTO horas_trabajadas_hoy
  FROM servicios_custodia sc
  WHERE (sc.custodio_id = p_custodio_id OR sc.nombre_custodio = p_custodio_nombre)
    AND DATE(sc.fecha_hora_cita) = p_fecha_servicio
    AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled');

  -- Verificar conflictos horarios específicos
  SELECT COUNT(*) INTO servicios_en_conflicto
  FROM servicios_custodia sc
  WHERE (sc.custodio_id = p_custodio_id OR sc.nombre_custodio = p_custodio_nombre)
    AND DATE(sc.fecha_hora_cita) = p_fecha_servicio
    AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled', 'finalizado', 'completado')
    AND (
      -- Conflicto si el nuevo servicio se superpone con existente
      (p_hora_inicio::time, (p_hora_inicio::time + (p_duracion_estimada_horas || ' hours')::interval)::time) 
      OVERLAPS 
      (sc.fecha_hora_cita::time, (sc.fecha_hora_cita::time + '4 hours'::interval)::time)
    );

  -- Calcular días sin asignar servicio
  SELECT GREATEST(0, p_fecha_servicio - COALESCE(MAX(DATE(sc.fecha_hora_cita)), p_fecha_servicio - 30))
  INTO dias_sin_asignar
  FROM servicios_custodia sc
  WHERE (sc.custodio_id = p_custodio_id OR sc.nombre_custodio = p_custodio_nombre)
    AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled');

  -- Determinar nivel de fatiga
  IF horas_trabajadas_hoy >= 10 THEN
    nivel_fatiga := 'alto';
  ELSIF horas_trabajadas_hoy >= 6 THEN
    nivel_fatiga := 'medio';
  ELSE
    nivel_fatiga := 'bajo';
  END IF;

  -- Determinar disponibilidad y categoría
  IF servicios_en_conflicto > 0 THEN
    disponible := false;
    categoria_disponibilidad := 'no_disponible';
    razon_no_disponible := 'Conflicto horario con servicio existente';
  ELSIF servicios_hoy >= 3 THEN
    disponible := false;
    categoria_disponibilidad := 'no_disponible'; 
    razon_no_disponible := 'Límite máximo de servicios diarios alcanzado (3)';
  ELSIF horas_trabajadas_hoy >= 12 THEN
    disponible := false;
    categoria_disponibilidad := 'no_disponible';
    razon_no_disponible := 'Límite de horas trabajadas excedido (12h)';
  ELSIF servicios_hoy = 2 THEN
    categoria_disponibilidad := 'ocupado_disponible';
  ELSIF servicios_hoy = 1 THEN
    categoria_disponibilidad := 'parcialmente_ocupado';
  ELSE
    categoria_disponibilidad := 'libre';
  END IF;

  -- Calcular Factor de Equidad (workload balance)
  CASE servicios_hoy
    WHEN 0 THEN factor_equidad := 100.0;
    WHEN 1 THEN factor_equidad := 75.0;
    WHEN 2 THEN factor_equidad := 50.0;
    ELSE factor_equidad := 20.0 - (servicios_hoy - 3) * 5.0; -- Penalización progresiva
  END CASE;

  -- Penalización por fatiga
  CASE nivel_fatiga
    WHEN 'alto' THEN factor_equidad := factor_equidad * 0.7;
    WHEN 'medio' THEN factor_equidad := factor_equidad * 0.85;
    ELSE factor_equidad := factor_equidad; -- Sin penalización
  END CASE;

  -- Calcular Factor de Oportunidad (rotación inteligente)
  CASE 
    WHEN dias_sin_asignar >= 7 THEN factor_oportunidad := 100.0; -- Una semana sin servicio
    WHEN dias_sin_asignar >= 3 THEN factor_oportunidad := 80.0;  -- 3+ días sin servicio
    WHEN dias_sin_asignar >= 1 THEN factor_oportunidad := 60.0;  -- 1+ días sin servicio
    ELSE factor_oportunidad := 40.0; -- Trabajó recientemente
  END CASE;

  -- Bonificación adicional por tiempo prolongado sin trabajo
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
    'horas_trabajadas_hoy', horas_trabajadas_hoy,
    'dias_sin_asignar', dias_sin_asignar,
    'nivel_fatiga', nivel_fatiga,
    'factor_equidad', GREATEST(0, LEAST(100, factor_equidad)),
    'factor_oportunidad', GREATEST(0, LEAST(100, factor_oportunidad)),
    'scoring_equitativo', jsonb_build_object(
      'workload_score', GREATEST(0, LEAST(100, factor_equidad)),
      'opportunity_score', GREATEST(0, LEAST(100, factor_oportunidad)),
      'fatiga_penalty', CASE nivel_fatiga 
        WHEN 'alto' THEN 30 
        WHEN 'medio' THEN 15 
        ELSE 0 
      END,
      'balance_recommendation', CASE categoria_disponibilidad
        WHEN 'libre' THEN 'ideal'
        WHEN 'parcialmente_ocupado' THEN 'bueno'
        WHEN 'ocupado_disponible' THEN 'aceptable'
        ELSE 'evitar'
      END
    )
  );

  RETURN resultado;
END;
$$;
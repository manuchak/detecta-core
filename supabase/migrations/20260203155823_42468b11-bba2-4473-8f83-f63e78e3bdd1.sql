-- Fase 4: Sistema de Métricas 15 Días para Operativos
-- Incluye: RPC de cálculo, función batch, y actualización de RPC equitativo

-- 1. RPC para calcular métricas de 15 días de un operativo
CREATE OR REPLACE FUNCTION public.calcular_metricas_15d_operativo(
  p_operativo_id UUID,
  p_operativo_tipo TEXT DEFAULT 'custodio'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  nombre_operativo TEXT;
  servicios_locales INTEGER := 0;
  servicios_foraneos INTEGER := 0;
  servicios_sin_clasificar INTEGER := 0;
  fecha_limite TIMESTAMPTZ;
BEGIN
  -- Calcular fecha límite (15 días atrás)
  fecha_limite := NOW() - INTERVAL '15 days';

  -- Obtener nombre del operativo para búsqueda por nombre
  IF p_operativo_tipo = 'custodio' THEN
    SELECT nombre INTO nombre_operativo
    FROM custodios_operativos
    WHERE id = p_operativo_id;
  ELSE
    SELECT nombre INTO nombre_operativo
    FROM armados_operativos
    WHERE id = p_operativo_id;
  END IF;

  -- Si no se encuentra el operativo, retornar valores por defecto
  IF nombre_operativo IS NULL THEN
    RETURN jsonb_build_object(
      'servicios_locales_15d', 0,
      'servicios_foraneos_15d', 0,
      'total_servicios_15d', 0,
      'sin_clasificar_15d', 0,
      'fecha_calculo', NOW(),
      'operativo_encontrado', false
    );
  END IF;

  -- Contar servicios en servicios_custodia
  IF p_operativo_tipo = 'custodio' THEN
    SELECT 
      COALESCE(SUM(CASE WHEN km_recorridos IS NOT NULL AND km_recorridos < 100 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN km_recorridos IS NOT NULL AND km_recorridos >= 100 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN km_recorridos IS NULL THEN 1 ELSE 0 END), 0)
    INTO servicios_locales, servicios_foraneos, servicios_sin_clasificar
    FROM servicios_custodia
    WHERE (id_custodio = p_operativo_id::text OR nombre_custodio = nombre_operativo)
      AND fecha_hora_cita >= fecha_limite
      AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled');
  ELSE
    -- Para armados, buscar por nombre en nombre_armado (columna correcta)
    SELECT 
      COALESCE(SUM(CASE WHEN km_recorridos IS NOT NULL AND km_recorridos < 100 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN km_recorridos IS NOT NULL AND km_recorridos >= 100 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN km_recorridos IS NULL THEN 1 ELSE 0 END), 0)
    INTO servicios_locales, servicios_foraneos, servicios_sin_clasificar
    FROM servicios_custodia
    WHERE nombre_armado = nombre_operativo
      AND fecha_hora_cita >= fecha_limite
      AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled');
  END IF;

  RETURN jsonb_build_object(
    'servicios_locales_15d', servicios_locales,
    'servicios_foraneos_15d', servicios_foraneos,
    'total_servicios_15d', servicios_locales + servicios_foraneos + servicios_sin_clasificar,
    'sin_clasificar_15d', servicios_sin_clasificar,
    'fecha_calculo', NOW(),
    'operativo_encontrado', true
  );
END;
$function$;

-- 2. Función batch para actualizar métricas de todos los operativos
CREATE OR REPLACE FUNCTION public.actualizar_todas_metricas_15d()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contador INTEGER := 0;
  rec RECORD;
  metricas JSONB;
BEGIN
  -- Actualizar custodios activos
  FOR rec IN SELECT id FROM custodios_operativos WHERE estado = 'activo' LOOP
    metricas := calcular_metricas_15d_operativo(rec.id, 'custodio');
    
    UPDATE custodios_operativos
    SET 
      servicios_locales_15d = (metricas->>'servicios_locales_15d')::INT,
      servicios_foraneos_15d = (metricas->>'servicios_foraneos_15d')::INT,
      fecha_calculo_15d = NOW()
    WHERE id = rec.id;
    
    contador := contador + 1;
  END LOOP;

  -- Actualizar armados activos
  FOR rec IN SELECT id FROM armados_operativos WHERE estado = 'activo' LOOP
    metricas := calcular_metricas_15d_operativo(rec.id, 'armado');
    
    UPDATE armados_operativos
    SET 
      servicios_locales_15d = (metricas->>'servicios_locales_15d')::INT,
      servicios_foraneos_15d = (metricas->>'servicios_foraneos_15d')::INT,
      fecha_calculo_15d = NOW()
    WHERE id = rec.id;
    
    contador := contador + 1;
  END LOOP;

  RETURN contador;
END;
$function$;

-- 3. Actualizar RPC verificar_disponibilidad_equitativa_custodio para incluir métricas 15d
CREATE OR REPLACE FUNCTION public.verificar_disponibilidad_equitativa_custodio(
  p_custodio_id uuid, 
  p_custodio_nombre text, 
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
  metricas_15d jsonb;
BEGIN
  -- Calcular hora de fin del servicio propuesto
  hora_fin := (p_hora_inicio::time + (p_duracion_estimada_horas || ' hours')::interval)::time;

  -- Contar servicios asignados hoy en servicios_custodia
  SELECT COUNT(*) INTO servicios_hoy
  FROM servicios_custodia sc
  WHERE (sc.id_custodio = p_custodio_id::text OR sc.nombre_custodio = p_custodio_nombre)
    AND DATE(sc.fecha_hora_cita AT TIME ZONE 'America/Mexico_City') = p_fecha_servicio
    AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled', 'finalizado', 'completado');

  -- Sumar servicios planificados
  SELECT servicios_hoy + COUNT(*) INTO servicios_hoy
  FROM servicios_planificados sp
  WHERE (sp.custodio_id = p_custodio_id OR sp.custodio_asignado = p_custodio_nombre)
    AND DATE(sp.fecha_hora_cita AT TIME ZONE 'America/Mexico_City') = p_fecha_servicio
    AND sp.estado_planeacion IN ('planificado', 'asignado', 'confirmado', 'en_progreso');

  -- Verificar conflictos horarios
  WITH conflictos_custodia AS (
    SELECT 
      sc.id_servicio,
      sc.fecha_hora_cita,
      'servicios_custodia' as origen
    FROM servicios_custodia sc
    WHERE (sc.id_custodio = p_custodio_id::text OR sc.nombre_custodio = p_custodio_nombre)
      AND DATE(sc.fecha_hora_cita AT TIME ZONE 'America/Mexico_City') = p_fecha_servicio
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled', 'finalizado', 'completado')
      AND (
        (p_hora_inicio::time, hora_fin) 
        OVERLAPS 
        ((sc.fecha_hora_cita AT TIME ZONE 'America/Mexico_City')::time, 
         ((sc.fecha_hora_cita AT TIME ZONE 'America/Mexico_City')::time + '4 hours'::interval)::time)
      )
  ),
  conflictos_planificados AS (
    SELECT 
      sp.id_servicio,
      sp.fecha_hora_cita,
      'servicios_planificados' as origen
    FROM servicios_planificados sp
    WHERE (sp.custodio_id = p_custodio_id OR sp.custodio_asignado = p_custodio_nombre)
      AND DATE(sp.fecha_hora_cita AT TIME ZONE 'America/Mexico_City') = p_fecha_servicio
      AND sp.estado_planeacion IN ('planificado', 'asignado', 'confirmado', 'en_progreso')
      AND (
        (p_hora_inicio::time, hora_fin) 
        OVERLAPS 
        ((sp.fecha_hora_cita AT TIME ZONE 'America/Mexico_City')::time, 
         ((sp.fecha_hora_cita AT TIME ZONE 'America/Mexico_City')::time + COALESCE(4, 4) * interval '1 hour')::time)
      )
  ),
  todos_conflictos AS (
    SELECT * FROM conflictos_custodia
    UNION ALL
    SELECT * FROM conflictos_planificados
  )
  SELECT 
    COUNT(*)::integer,
    COALESCE(jsonb_agg(jsonb_build_object(
      'id_servicio', id_servicio,
      'fecha_hora', fecha_hora_cita,
      'origen', origen
    )), '[]'::jsonb)
  INTO servicios_en_conflicto, conflictos_detalle
  FROM todos_conflictos;

  -- Calcular horas trabajadas
  WITH horas_custodia AS (
    SELECT COALESCE(SUM(CASE 
      WHEN sc.km_recorridos IS NOT NULL AND sc.km_recorridos > 0 
      THEN GREATEST(2, LEAST(8, sc.km_recorridos / 50.0))
      ELSE 3
    END), 0) as horas
    FROM servicios_custodia sc
    WHERE (sc.id_custodio = p_custodio_id::text OR sc.nombre_custodio = p_custodio_nombre)
      AND DATE(sc.fecha_hora_cita AT TIME ZONE 'America/Mexico_City') = p_fecha_servicio
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
  ),
  horas_planificadas AS (
    SELECT COALESCE(SUM(COALESCE(4, 4)), 0) as horas
    FROM servicios_planificados sp
    WHERE (sp.custodio_id = p_custodio_id OR sp.custodio_asignado = p_custodio_nombre)
      AND DATE(sp.fecha_hora_cita AT TIME ZONE 'America/Mexico_City') = p_fecha_servicio
      AND sp.estado_planeacion IN ('planificado', 'asignado', 'confirmado', 'en_progreso')
  )
  SELECT hc.horas + hp.horas INTO horas_trabajadas_hoy
  FROM horas_custodia hc, horas_planificadas hp;

  -- Calcular días sin asignar
  WITH ultimo_servicio AS (
    SELECT MAX(fecha) as ultima_fecha
    FROM (
      SELECT MAX(DATE(sc.fecha_hora_cita AT TIME ZONE 'America/Mexico_City')) as fecha
      FROM servicios_custodia sc
      WHERE (sc.id_custodio = p_custodio_id::text OR sc.nombre_custodio = p_custodio_nombre)
        AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
      UNION ALL
      SELECT MAX(DATE(sp.fecha_hora_cita AT TIME ZONE 'America/Mexico_City')) as fecha
      FROM servicios_planificados sp
      WHERE (sp.custodio_id = p_custodio_id OR sp.custodio_asignado = p_custodio_nombre)
        AND sp.estado_planeacion IN ('planificado', 'asignado', 'confirmado', 'en_progreso')
    ) combined
  )
  SELECT GREATEST(0, p_fecha_servicio - COALESCE(us.ultima_fecha, p_fecha_servicio - 30))
  INTO dias_sin_asignar
  FROM ultimo_servicio us;

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
    razon_no_disponible := 'Conflicto horario detectado con ' || servicios_en_conflicto || ' servicio(s) existente(s)';
  ELSIF servicios_hoy >= 3 THEN
    disponible := false;
    categoria_disponibilidad := 'no_disponible'; 
    razon_no_disponible := 'Límite máximo de servicios diarios alcanzado (' || servicios_hoy || '/3)';
  ELSIF horas_trabajadas_hoy >= 12 THEN
    disponible := false;
    categoria_disponibilidad := 'no_disponible';
    razon_no_disponible := 'Límite de horas trabajadas excedido (' || horas_trabajadas_hoy || '/12h)';
  ELSIF servicios_hoy = 2 THEN
    categoria_disponibilidad := 'ocupado_disponible';
  ELSIF servicios_hoy = 1 THEN
    categoria_disponibilidad := 'parcialmente_ocupado';
  ELSE
    categoria_disponibilidad := 'libre';
  END IF;

  -- Calcular factores de equidad y oportunidad
  CASE servicios_hoy
    WHEN 0 THEN factor_equidad := 100.0;
    WHEN 1 THEN factor_equidad := 75.0;
    WHEN 2 THEN factor_equidad := 50.0;
    ELSE factor_equidad := 20.0 - (servicios_hoy - 3) * 5.0;
  END CASE;

  CASE nivel_fatiga
    WHEN 'alto' THEN factor_equidad := factor_equidad * 0.7;
    WHEN 'medio' THEN factor_equidad := factor_equidad * 0.85;
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

  -- NUEVO: Calcular métricas de 15 días
  metricas_15d := calcular_metricas_15d_operativo(p_custodio_id, 'custodio');

  -- Construir resultado con métricas 15d incluidas
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
    ),
    'servicios_locales_15d', (metricas_15d->>'servicios_locales_15d')::int,
    'servicios_foraneos_15d', (metricas_15d->>'servicios_foraneos_15d')::int,
    'total_servicios_15d', (metricas_15d->>'total_servicios_15d')::int,
    'sin_clasificar_15d', (metricas_15d->>'sin_clasificar_15d')::int,
    'metricas_15d', metricas_15d
  );

  RETURN resultado;
END;
$function$;

-- 4. Ejecutar actualización inicial de todos los operativos activos
SELECT actualizar_todas_metricas_15d();
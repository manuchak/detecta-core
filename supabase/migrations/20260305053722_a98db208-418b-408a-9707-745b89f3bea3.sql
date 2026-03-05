
CREATE OR REPLACE FUNCTION public.cerrar_servicios_estancados(p_limit int DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
  v_service record;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  FOR v_service IN
    SELECT sp.id, sp.id_servicio
    FROM servicios_planificados sp
    WHERE sp.hora_inicio_real IS NOT NULL
      AND sp.hora_fin_real IS NULL
      AND sp.estado_planeacion NOT IN ('cancelado', 'completado')
      AND sp.hora_inicio_real < now() - interval '18 hours'
      AND NOT EXISTS (
        SELECT 1 FROM servicio_eventos_ruta e
        WHERE e.servicio_id = sp.id_servicio
          AND e.hora_inicio > now() - interval '18 hours'
      )
    LIMIT p_limit
  LOOP
    UPDATE servicios_planificados
    SET hora_fin_real = now(),
        estado_planeacion = 'completado'
    WHERE id = v_service.id;

    INSERT INTO servicio_eventos_ruta (servicio_id, tipo_evento, descripcion, registrado_por, hora_inicio, hora_fin)
    VALUES (
      v_service.id_servicio,
      'fin_servicio',
      'Cerrado automáticamente por inactividad (>18h sin eventos)',
      v_user_id,
      now(),
      now()
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('cerrados', v_count, 'ejecutado_por', v_user_id, 'timestamp', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.detectar_servicios_estancados()
RETURNS TABLE(
  id uuid,
  id_servicio text,
  nombre_cliente text,
  custodio_asignado text,
  hora_inicio_real timestamptz,
  ultima_actividad timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sp.id,
    sp.id_servicio,
    sp.nombre_cliente,
    sp.custodio_asignado,
    sp.hora_inicio_real,
    COALESCE(
      (SELECT MAX(e.hora_inicio) FROM servicio_eventos_ruta e WHERE e.servicio_id = sp.id_servicio),
      sp.hora_inicio_real
    ) AS ultima_actividad
  FROM servicios_planificados sp
  WHERE sp.hora_inicio_real IS NOT NULL
    AND sp.hora_fin_real IS NULL
    AND sp.estado_planeacion NOT IN ('cancelado', 'completado')
    AND sp.hora_inicio_real < now() - interval '18 hours'
    AND NOT EXISTS (
      SELECT 1 FROM servicio_eventos_ruta e
      WHERE e.servicio_id = sp.id_servicio
        AND e.hora_inicio > now() - interval '18 hours'
    )
  ORDER BY sp.hora_inicio_real ASC;
$$;

-- ========================================
-- HACER PSICOMÉTRICOS NO BLOQUEANTE
-- Fecha: 2025-11-24
-- Objetivo: Permitir liberación sin psicométricos completados
-- ========================================

-- Modificar función RPC para quitar validación de psicométricos
CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion(
  p_liberacion_id UUID,
  p_liberado_por UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_candidato candidatos_custodios%ROWTYPE;
  v_liberacion custodio_liberacion%ROWTYPE;
  v_nuevo_custodio_id UUID;
  v_zona_nombre TEXT;
BEGIN
  -- 1. Obtener datos de liberación
  SELECT * INTO v_liberacion
  FROM custodio_liberacion
  WHERE id = p_liberacion_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de liberación no encontrado';
  END IF;
  
  -- 2. VALIDAR CHECKLIST MÍNIMO (SIN psicométricos - ahora opcional)
  IF NOT (
    v_liberacion.documentacion_completa AND
    v_liberacion.toxicologicos_completado AND
    v_liberacion.instalacion_gps_completado
  ) THEN
    RAISE EXCEPTION 'El checklist de liberación no está completo (Documentación, Toxicológicos y GPS requeridos)';
  END IF;
  
  -- 3. Obtener candidato
  SELECT * INTO v_candidato
  FROM candidatos_custodios
  WHERE id = v_liberacion.candidato_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidato no encontrado';
  END IF;
  
  -- 4. Obtener nombre de zona
  SELECT nombre INTO v_zona_nombre
  FROM zonas_operacion_nacional
  WHERE id = v_candidato.zona_preferida_id;
  
  -- 5. CREAR REGISTRO EN PC_CUSTODIOS (Planificación)
  INSERT INTO pc_custodios (
    nombre,
    tel,
    email,
    zona_base,
    lat,
    lng,
    tipo_custodia,
    estado,
    disponibilidad,
    documentos,
    comentarios
  ) VALUES (
    v_candidato.nombre,
    v_candidato.telefono,
    v_candidato.email,
    COALESCE(v_zona_nombre, 'Sin zona'),
    ST_X(v_candidato.ubicacion_residencia::geometry),
    ST_Y(v_candidato.ubicacion_residencia::geometry),
    CASE 
      WHEN v_candidato.vehiculo_propio THEN 'armado'::tipo_custodia
      ELSE 'no_armado'::tipo_custodia
    END,
    'activo'::estado_custodio,
    'disponible'::disponibilidad_custodio,
    ARRAY['INE', 'Licencia', 'Antecedentes', 'CURP', 'RFC'],
    CONCAT(
      'Liberado desde Supply. ',
      'Psicométrico: ', COALESCE(v_liberacion.psicometricos_puntaje::text, 'N/A'), ' pts. ',
      'GPS: ', COALESCE(v_liberacion.gps_imei, 'N/A')
    )
  )
  RETURNING id INTO v_nuevo_custodio_id;
  
  -- 6. Actualizar estado de liberación
  UPDATE custodio_liberacion
  SET 
    estado_liberacion = 'liberado',
    liberado_por = p_liberado_por,
    fecha_liberacion = NOW(),
    updated_at = NOW()
  WHERE id = p_liberacion_id;
  
  -- 7. Actualizar candidato a 'custodio_activo'
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'custodio_activo',
    updated_at = NOW()
  WHERE id = v_liberacion.candidato_id;
  
  -- 8. AUDITORÍA
  INSERT INTO lead_audit_log (
    lead_id,
    action_type,
    actor_id,
    changes,
    metadata
  ) VALUES (
    v_liberacion.candidato_id::text,
    'liberacion_custodio',
    p_liberado_por,
    jsonb_build_object(
      'estado_anterior', 'aprobado',
      'estado_nuevo', 'custodio_activo',
      'pc_custodio_id', v_nuevo_custodio_id
    ),
    jsonb_build_object(
      'liberacion_id', p_liberacion_id,
      'gps_imei', v_liberacion.gps_imei,
      'psico_puntaje', v_liberacion.psicometricos_puntaje,
      'psico_opcional', true
    )
  );
  
  -- 9. Retornar resultado
  RETURN json_build_object(
    'success', true,
    'pc_custodio_id', v_nuevo_custodio_id,
    'candidato_id', v_liberacion.candidato_id,
    'mensaje', '✅ Custodio liberado a Planificación'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al liberar custodio: %', SQLERRM;
END;
$$;
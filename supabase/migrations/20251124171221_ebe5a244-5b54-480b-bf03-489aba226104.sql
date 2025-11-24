-- ===================================================================
-- SPRINT 0: SISTEMA DE FEATURE FLAGS PARA LIBERACIÓN FLEXIBLE
-- ===================================================================
-- Objetivo: Permitir liberación sin validaciones bloqueantes
-- Fecha: 2025-11-24

-- ===================================================================
-- TABLA: workflow_validation_config
-- ===================================================================
-- Configuración de validaciones por fase (activar/desactivar)

CREATE TABLE IF NOT EXISTS public.workflow_validation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_nombre VARCHAR NOT NULL UNIQUE,
  validacion_activa BOOLEAN DEFAULT false,
  es_bloqueante BOOLEAN DEFAULT false, -- true = error / false = warning
  orden_fase INTEGER,
  descripcion TEXT,
  fecha_activacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_validation_config_fase ON public.workflow_validation_config(fase_nombre);
CREATE INDEX idx_validation_config_activa ON public.workflow_validation_config(validacion_activa);

-- ===================================================================
-- POBLAR FASES (TODAS DESACTIVADAS INICIALMENTE)
-- ===================================================================

INSERT INTO public.workflow_validation_config (fase_nombre, validacion_activa, es_bloqueante, orden_fase, descripcion) VALUES
  ('entrevista_estructurada', false, false, 3, 'Fase 3: Entrevista con ratings 1-5 y checklist de riesgos'),
  ('psicometria', false, false, 4, 'Fase 4: MIDOT + Psicotest con semáforo Verde/Ámbar/Rojo'),
  ('toxicologia', false, false, 5, 'Fase 5: Examen toxicológico con resultado negativo'),
  ('referencias', false, false, 6, 'Fase 6: 2 referencias laborales + 2 personales positivas'),
  ('documentacion', false, false, 7, 'Fase 7: Documentación completa con validación OCR'),
  ('contrato', false, false, 8, 'Fase 8: Contrato electrónico firmado'),
  ('capacitacion', false, false, 9, 'Fase 9: Capacitación administrativa con quiz 80%'),
  ('instalacion_tecnica', false, false, 10, 'Fase 10: Instalación de GPS y equipo técnico');

-- ===================================================================
-- FUNCIÓN: debe_validar_fase
-- ===================================================================
-- Verifica si una fase debe ser validada (está activa)

CREATE OR REPLACE FUNCTION public.debe_validar_fase(p_fase VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT validacion_activa, es_bloqueante INTO v_config
  FROM workflow_validation_config
  WHERE fase_nombre = p_fase;
  
  RETURN COALESCE(v_config.validacion_activa, false);
END;
$$;

-- ===================================================================
-- FUNCIÓN MEJORADA: liberar_custodio_a_planeacion
-- ===================================================================
-- Ahora acepta p_forzar_liberacion para modo flexible

CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion(
  p_liberacion_id UUID,
  p_liberado_por UUID,
  p_forzar_liberacion BOOLEAN DEFAULT true -- TRUE por defecto durante desarrollo
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidato candidatos_custodios%ROWTYPE;
  v_liberacion custodio_liberacion%ROWTYPE;
  v_nuevo_custodio_id UUID;
  v_zona_nombre TEXT;
  v_warnings TEXT[] := '{}';
  v_fases_incompletas TEXT[] := '{}';
BEGIN
  -- 1. Obtener datos de liberación
  SELECT * INTO v_liberacion
  FROM custodio_liberacion
  WHERE id = p_liberacion_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de liberación no encontrado';
  END IF;
  
  -- 2. VALIDACIONES SOFT (recolectar warnings, NO bloquear si p_forzar_liberacion = true)
  
  -- 2.1 Documentación
  IF NOT v_liberacion.documentacion_completa THEN
    v_warnings := array_append(v_warnings, '⚠️ Documentación incompleta');
    v_fases_incompletas := array_append(v_fases_incompletas, 'documentacion');
  END IF;
  
  -- 2.2 Toxicológicos
  IF NOT v_liberacion.toxicologicos_completado THEN
    v_warnings := array_append(v_warnings, '⚠️ Toxicológicos pendientes');
    v_fases_incompletas := array_append(v_fases_incompletas, 'toxicologia');
  END IF;
  
  -- 2.3 GPS
  IF NOT v_liberacion.instalacion_gps_completado THEN
    v_warnings := array_append(v_warnings, '⚠️ GPS no instalado/verificado');
    v_fases_incompletas := array_append(v_fases_incompletas, 'instalacion_gps');
  END IF;
  
  -- 2.4 Psicométricos (opcional pero registrado)
  IF NOT v_liberacion.psicometricos_completado THEN
    v_warnings := array_append(v_warnings, 'ℹ️ Psicométricos pendientes (opcional)');
  END IF;
  
  -- 2.5 Entrevista estructurada (si tabla existe y validación activa)
  IF debe_validar_fase('entrevista_estructurada') THEN
    IF NOT EXISTS (
      SELECT 1 FROM entrevistas_estructuradas 
      WHERE candidato_id = v_liberacion.candidato_id 
        AND resultado = 'aprobado'
    ) THEN
      v_warnings := array_append(v_warnings, '⚠️ Entrevista estructurada no completada');
      v_fases_incompletas := array_append(v_fases_incompletas, 'entrevista_estructurada');
    END IF;
  END IF;
  
  -- 2.6 Psicometría formal (si tabla existe y validación activa)
  IF debe_validar_fase('psicometria') THEN
    IF NOT EXISTS (
      SELECT 1 FROM psicometria_evaluaciones 
      WHERE candidato_id = v_liberacion.candidato_id 
        AND semaforo IN ('verde', 'ambar')
    ) THEN
      v_warnings := array_append(v_warnings, '⚠️ Psicometría formal no completada');
      v_fases_incompletas := array_append(v_fases_incompletas, 'psicometria');
    END IF;
  END IF;
  
  -- 3. DECISIÓN: ¿Bloquear o continuar?
  -- Si p_forzar_liberacion = true → SIEMPRE continuar (modo desarrollo)
  -- Si p_forzar_liberacion = false → validar fases críticas
  
  IF NOT p_forzar_liberacion AND array_length(v_fases_incompletas, 1) > 0 THEN
    RAISE EXCEPTION 'No se puede liberar. Fases incompletas: %', array_to_string(v_fases_incompletas, ', ');
  END IF;
  
  -- 4. Obtener candidato
  SELECT * INTO v_candidato
  FROM candidatos_custodios
  WHERE id = v_liberacion.candidato_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidato no encontrado';
  END IF;
  
  -- 5. Obtener nombre de zona
  SELECT nombre INTO v_zona_nombre
  FROM zonas_operacion_nacional
  WHERE id = v_candidato.zona_preferida_id;
  
  -- 6. CREAR REGISTRO EN PC_CUSTODIOS (Planificación)
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
      CASE 
        WHEN array_length(v_warnings, 1) > 0 THEN 
          'Liberación con advertencias: ' || array_to_string(v_warnings, ', ')
        ELSE 
          'Checklist completo.'
      END
    )
  )
  RETURNING id INTO v_nuevo_custodio_id;
  
  -- 7. Actualizar estado de liberación
  UPDATE custodio_liberacion
  SET 
    estado_liberacion = 'liberado',
    liberado_por = p_liberado_por,
    fecha_liberacion = NOW(),
    notas_liberacion = CASE
      WHEN array_length(v_warnings, 1) > 0 THEN
        'Liberado con advertencias: ' || array_to_string(v_warnings, ', ')
      ELSE
        'Liberación completa'
    END,
    updated_at = NOW()
  WHERE id = p_liberacion_id;
  
  -- 8. Actualizar candidato a 'custodio_activo'
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'custodio_activo',
    updated_at = NOW()
  WHERE id = v_liberacion.candidato_id;
  
  -- 9. AUDITORÍA (incluir warnings y modo de liberación)
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
      'pc_custodio_id', v_nuevo_custodio_id,
      'forzado', p_forzar_liberacion,
      'warnings', v_warnings,
      'fases_incompletas', v_fases_incompletas
    ),
    jsonb_build_object(
      'liberacion_id', p_liberacion_id,
      'modo_flexible', p_forzar_liberacion,
      'gps_imei', v_liberacion.gps_imei,
      'psico_puntaje', v_liberacion.psicometricos_puntaje
    )
  );
  
  -- 10. Retornar resultado con warnings
  RETURN json_build_object(
    'success', true,
    'pc_custodio_id', v_nuevo_custodio_id,
    'candidato_id', v_liberacion.candidato_id,
    'warnings', v_warnings,
    'fases_incompletas', v_fases_incompletas,
    'tiene_warnings', array_length(v_warnings, 1) > 0,
    'mensaje', CASE
      WHEN array_length(v_warnings, 1) > 0 THEN
        '⚠️ Custodio liberado con advertencias'
      ELSE
        '✅ Custodio liberado correctamente'
    END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al liberar custodio: %', SQLERRM;
END;
$$;

-- ===================================================================
-- POLÍTICAS RLS
-- ===================================================================

ALTER TABLE public.workflow_validation_config ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden leer la configuración
CREATE POLICY "workflow_validation_config_select" ON public.workflow_validation_config
  FOR SELECT USING (true);

-- Policy: Solo admins pueden modificar
CREATE POLICY "workflow_validation_config_update" ON public.workflow_validation_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'supply_admin')
    )
  );

-- ===================================================================
-- COMENTARIOS
-- ===================================================================

COMMENT ON TABLE public.workflow_validation_config IS 
'Configuración de validaciones por fase del workflow de reclutamiento. Permite activar/desactivar validaciones gradualmente durante el desarrollo.';

COMMENT ON FUNCTION public.debe_validar_fase(VARCHAR) IS 
'Verifica si una fase específica debe ser validada según la configuración activa.';

COMMENT ON FUNCTION public.liberar_custodio_a_planeacion(UUID, UUID, BOOLEAN) IS 
'Libera un custodio a Planificación con modo flexible. p_forzar_liberacion=true permite liberar con warnings sin bloqueos (modo desarrollo). p_forzar_liberacion=false activa validaciones bloqueantes (modo producción).';
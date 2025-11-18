-- ========================================
-- FASE 1: MÓDULO DE LIBERACIÓN
-- Tabla para gestionar el proceso de liberación de custodios
-- ========================================

-- Crear tabla principal: custodio_liberacion
CREATE TABLE public.custodio_liberacion (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  
  -- Estado del proceso de liberación
  estado_liberacion VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  
  -- ✅ CHECKLIST: DOCUMENTACIÓN (6 items)
  documentacion_ine BOOLEAN DEFAULT false,
  documentacion_licencia BOOLEAN DEFAULT false,
  documentacion_antecedentes BOOLEAN DEFAULT false,
  documentacion_domicilio BOOLEAN DEFAULT false,
  documentacion_curp BOOLEAN DEFAULT false,
  documentacion_rfc BOOLEAN DEFAULT false,
  documentacion_completa BOOLEAN DEFAULT false,
  fecha_documentacion_completa TIMESTAMPTZ,
  notas_documentacion TEXT,
  
  -- ✅ CHECKLIST: PSICOMÉTRICOS
  psicometricos_completado BOOLEAN DEFAULT false,
  psicometricos_resultado VARCHAR(50),
  psicometricos_puntaje NUMERIC(5,2),
  fecha_psicometricos TIMESTAMPTZ,
  psicometricos_archivo_url TEXT,
  notas_psicometricos TEXT,
  
  -- ✅ CHECKLIST: TOXICOLÓGICOS
  toxicologicos_completado BOOLEAN DEFAULT false,
  toxicologicos_resultado VARCHAR(50),
  fecha_toxicologicos TIMESTAMPTZ,
  toxicologicos_archivo_url TEXT,
  notas_toxicologicos TEXT,
  
  -- ✅ CHECKLIST: VEHÍCULO (condicional)
  vehiculo_capturado BOOLEAN DEFAULT false,
  vehiculo_marca VARCHAR(100),
  vehiculo_modelo VARCHAR(100),
  vehiculo_año INTEGER,
  vehiculo_placa VARCHAR(20),
  vehiculo_color VARCHAR(50),
  vehiculo_tarjeta_circulacion BOOLEAN DEFAULT false,
  vehiculo_poliza_seguro BOOLEAN DEFAULT false,
  fecha_vehiculo_completo TIMESTAMPTZ,
  notas_vehiculo TEXT,
  
  -- ✅ CHECKLIST: GPS
  instalacion_gps_completado BOOLEAN DEFAULT false,
  gps_imei VARCHAR(50),
  gps_numero_linea VARCHAR(20),
  fecha_instalacion_gps TIMESTAMPTZ,
  instalador_id UUID,
  notas_gps TEXT,
  
  -- APROBACIÓN Y LIBERACIÓN
  aprobado_por_supply UUID REFERENCES auth.users(id),
  fecha_aprobacion_supply TIMESTAMPTZ,
  liberado_por UUID REFERENCES auth.users(id),
  fecha_liberacion TIMESTAMPTZ,
  notas_liberacion TEXT,
  
  -- METADATOS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- CONSTRAINTS
  CONSTRAINT unique_candidato_liberacion UNIQUE(candidato_id),
  CONSTRAINT valid_estado CHECK (estado_liberacion IN (
    'pendiente', 'documentacion', 'psicometricos', 'toxicologicos',
    'vehiculo', 'gps', 'aprobado_final', 'liberado', 'rechazado'
  ))
);

-- Índices de performance
CREATE INDEX idx_liberacion_estado ON custodio_liberacion(estado_liberacion);
CREATE INDEX idx_liberacion_candidato ON custodio_liberacion(candidato_id);
CREATE INDEX idx_liberacion_fecha_creacion ON custodio_liberacion(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_custodio_liberacion_updated_at
  BEFORE UPDATE ON custodio_liberacion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE custodio_liberacion ENABLE ROW LEVEL SECURITY;

-- Supply puede ver y modificar
CREATE POLICY "Supply puede gestionar liberaciones"
  ON custodio_liberacion FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
    )
  );

-- ========================================
-- FUNCIÓN RPC: liberar_custodio_a_planeacion
-- ========================================

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
  
  -- 2. VALIDAR CHECKLIST COMPLETO (100%)
  IF NOT (
    v_liberacion.documentacion_completa AND
    v_liberacion.psicometricos_completado AND
    v_liberacion.toxicologicos_completado AND
    v_liberacion.instalacion_gps_completado
  ) THEN
    RAISE EXCEPTION 'El checklist de liberación no está completo al 100%%';
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
  
  -- 5. 🎯 CREAR REGISTRO EN PC_CUSTODIOS (Planificación)
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
  
  -- 8. 📝 AUDITORÍA
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
      'psico_puntaje', v_liberacion.psicometricos_puntaje
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

-- ========================================
-- VISTA DE MÉTRICAS
-- ========================================

CREATE OR REPLACE VIEW v_liberacion_metrics AS
SELECT 
  estado_liberacion,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE documentacion_completa) as con_docs,
  COUNT(*) FILTER (WHERE psicometricos_completado) as con_psico,
  COUNT(*) FILTER (WHERE instalacion_gps_completado) as con_gps,
  AVG(EXTRACT(EPOCH FROM (COALESCE(fecha_liberacion, NOW()) - created_at))/86400) as dias_promedio,
  COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - 7) as ultimos_7_dias
FROM custodio_liberacion
WHERE estado_liberacion != 'rechazado'
GROUP BY estado_liberacion;
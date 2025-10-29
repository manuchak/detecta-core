-- ============================================
-- FASE 4B: Función RPC Segura para Conversión de Leads
-- ============================================
-- Función SECURITY DEFINER para convertir leads de Supply en armados operativos
-- con validaciones de permisos y duplicados

CREATE OR REPLACE FUNCTION convertir_lead_a_armado_operativo(
  p_lead_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nuevo_armado_id uuid;
  v_lead_data record;
BEGIN
  -- Verificar permisos del usuario
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role_name IN ('planificador', 'admin', 'operations')
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para convertir leads a armados operativos';
  END IF;

  -- Obtener datos del lead
  SELECT * INTO v_lead_data
  FROM leads
  WHERE id = p_lead_id
    AND estado IN ('contactado', 'aprobado');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead no encontrado o no elegible para conversión (debe estar en estado contactado/aprobado)';
  END IF;

  -- Verificar que no exista ya un armado con ese teléfono/email
  IF EXISTS (
    SELECT 1 FROM armados_operativos
    WHERE telefono = v_lead_data.telefono
       OR email = v_lead_data.email
  ) THEN
    RAISE EXCEPTION 'Ya existe un armado operativo con ese teléfono/email';
  END IF;

  -- Crear armado operativo
  INSERT INTO armados_operativos (
    nombre, telefono, email, zona_base,
    estado, disponibilidad, tipo_armado,
    numero_servicios, rating_promedio,
    tasa_confirmacion, tasa_respuesta, tasa_confiabilidad,
    score_comunicacion, score_disponibilidad, score_confiabilidad, score_total,
    experiencia_anos, licencia_portacion,
    zonas_permitidas, servicios_permitidos,
    fuente
  )
  VALUES (
    v_lead_data.nombre,
    v_lead_data.telefono,
    v_lead_data.email,
    'Por confirmar',
    'activo',
    'ocupado', -- Se marca como ocupado al asignar
    'interno',
    0,
    5.0,
    0, 0, 0,
    5.0, 5.0, 5.0, 5.0,
    0,
    'PENDIENTE VERIFICACIÓN',
    ARRAY['Nacional']::text[],
    ARRAY['local', 'foraneo']::text[],
    'candidato'
  )
  RETURNING id INTO v_nuevo_armado_id;

  -- Actualizar lead
  UPDATE leads
  SET 
    estado = 'aprobado',
    fecha_aprobacion = NOW(),
    updated_at = NOW(),
    notas = COALESCE(notas, '') || E'\n[' || NOW()::date || '] Convertido a armado operativo. ID: ' || v_nuevo_armado_id::text || ' (vía Planeación)'
  WHERE id = p_lead_id;

  RETURN v_nuevo_armado_id;
END;
$$;

COMMENT ON FUNCTION convertir_lead_a_armado_operativo IS
'Convierte un lead de Supply en armado operativo de manera segura.
SECURITY: Solo accesible por planificadores/admin con validación de permisos.
VALIDATIONS: 
  - Verifica permisos del usuario
  - Valida estado del lead (contactado/aprobado)
  - Previene duplicados por teléfono/email
  - Actualiza lead con nota de conversión
RETURNS: UUID del nuevo armado operativo creado.';
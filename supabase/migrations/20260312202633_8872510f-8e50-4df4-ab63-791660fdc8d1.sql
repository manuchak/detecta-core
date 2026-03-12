-- Crear RPC sync_lead_to_candidato_armado (mirror de sync_lead_to_candidato pero para candidatos_armados)
CREATE OR REPLACE FUNCTION public.sync_lead_to_candidato_armado(
  p_lead_id TEXT,
  p_nombre TEXT,
  p_email TEXT DEFAULT NULL,
  p_telefono TEXT DEFAULT NULL,
  p_fuente TEXT DEFAULT 'Plataforma Detecta',
  p_estado_proceso TEXT DEFAULT 'aprobado',
  p_tipo_armado TEXT DEFAULT 'interno',
  p_licencia_portacion TEXT DEFAULT NULL,
  p_experiencia_seguridad BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_candidato_id UUID;
BEGIN
  -- Buscar candidato armado existente por lead_id, email o teléfono
  SELECT id INTO v_candidato_id
  FROM candidatos_armados
  WHERE lead_id = p_lead_id
     OR (p_email IS NOT NULL AND email = p_email)
     OR (p_telefono IS NOT NULL AND telefono = p_telefono)
  LIMIT 1;

  IF v_candidato_id IS NULL THEN
    -- Crear nuevo candidato armado
    INSERT INTO candidatos_armados (
      lead_id,
      nombre,
      email,
      telefono,
      tipo_armado,
      licencia_portacion,
      experiencia_seguridad,
      estado_proceso,
      fuente_reclutamiento,
      created_at,
      updated_at
    ) VALUES (
      p_lead_id,
      p_nombre,
      p_email,
      p_telefono,
      p_tipo_armado,
      p_licencia_portacion,
      p_experiencia_seguridad,
      p_estado_proceso,
      p_fuente,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_candidato_id;
  ELSE
    -- Actualizar candidato existente
    UPDATE candidatos_armados
    SET 
      estado_proceso = p_estado_proceso,
      tipo_armado = COALESCE(p_tipo_armado, tipo_armado),
      licencia_portacion = COALESCE(p_licencia_portacion, licencia_portacion),
      experiencia_seguridad = COALESCE(p_experiencia_seguridad, experiencia_seguridad),
      updated_at = NOW()
    WHERE id = v_candidato_id;
  END IF;

  RETURN v_candidato_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_lead_to_candidato_armado TO authenticated;

COMMENT ON FUNCTION public.sync_lead_to_candidato_armado IS 
'Sincroniza un lead aprobado con la tabla de candidatos armados. Crea nuevo candidato si no existe.';
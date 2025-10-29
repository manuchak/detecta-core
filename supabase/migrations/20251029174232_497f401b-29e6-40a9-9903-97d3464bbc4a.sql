-- Corrección 1: Función convertir_lead_a_armado_operativo con validación correcta de roles

DROP FUNCTION IF EXISTS public.convertir_lead_a_armado_operativo(text);

CREATE OR REPLACE FUNCTION public.convertir_lead_a_armado_operativo(
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
  v_user_role text;
BEGIN
  -- Obtener el rol del usuario actual usando la función segura
  SELECT public.get_current_user_role_secure() INTO v_user_role;
  
  -- Verificar permisos usando roles válidos (corregido de 'operations' a roles reales)
  IF v_user_role NOT IN ('planificador', 'admin', 'owner', 'coordinador_operaciones') THEN
    RAISE EXCEPTION 'No tienes permisos para convertir leads. Rol actual: %. Se requiere: planificador, admin, owner o coordinador_operaciones', v_user_role;
  END IF;

  -- Validar que el lead_id sea un UUID válido
  IF p_lead_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'ID de lead inválido. Debe ser un UUID válido.';
  END IF;

  -- Obtener datos del lead
  SELECT * INTO v_lead_data
  FROM leads
  WHERE id = p_lead_id::uuid
    AND estado IN ('contactado', 'aprobado');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead no encontrado o no elegible para conversión. Estado requerido: contactado o aprobado';
  END IF;

  -- Validar datos mínimos del lead
  IF v_lead_data.telefono IS NULL OR v_lead_data.email IS NULL THEN
    RAISE EXCEPTION 'El lead no tiene teléfono o email registrado. Datos requeridos para crear armado operativo.';
  END IF;

  -- Verificar duplicados por teléfono/email
  IF EXISTS (
    SELECT 1 FROM armados_operativos
    WHERE telefono = v_lead_data.telefono
       OR email = v_lead_data.email
  ) THEN
    RAISE EXCEPTION 'Ya existe un armado operativo con teléfono % o email %', v_lead_data.telefono, v_lead_data.email;
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
    COALESCE(v_lead_data.zona_preferida, 'Por confirmar'),
    'activo',
    'ocupado',
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

  -- Actualizar lead con auditoría
  UPDATE leads
  SET 
    estado = 'aprobado',
    fecha_aprobacion = NOW(),
    updated_at = NOW(),
    notas = COALESCE(notas, '') || 
            E'\n[' || NOW()::timestamp || '] Convertido a armado operativo automáticamente.' ||
            E'\n- ID Armado: ' || v_nuevo_armado_id::text ||
            E'\n- Convertido por: ' || (SELECT email FROM auth.users WHERE id = auth.uid()) ||
            E'\n- Rol: ' || v_user_role
  WHERE id = p_lead_id::uuid;

  -- Log de auditoría
  INSERT INTO assignment_audit_log (
    action_type,
    armado_id,
    performed_by,
    changes_summary,
    new_data
  ) VALUES (
    'lead_conversion',
    v_nuevo_armado_id,
    auth.uid(),
    'Lead convertido automáticamente a armado operativo',
    jsonb_build_object(
      'lead_id', p_lead_id,
      'lead_nombre', v_lead_data.nombre,
      'armado_id', v_nuevo_armado_id,
      'converted_by_role', v_user_role
    )
  );

  RETURN v_nuevo_armado_id;
END;
$$;

COMMENT ON FUNCTION convertir_lead_a_armado_operativo IS
'Convierte un lead de Supply en armado operativo de manera segura.
Solo accesible por: planificador, admin, owner, coordinador_operaciones.
Validaciones: UUID válido, teléfono/email presentes, sin duplicados.
Registra auditoría completa en assignment_audit_log.';

GRANT EXECUTE ON FUNCTION public.convertir_lead_a_armado_operativo(text) TO authenticated;
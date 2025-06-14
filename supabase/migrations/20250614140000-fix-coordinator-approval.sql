
-- Función segura para crear aprobaciones de coordinador que evite problemas de RLS
CREATE OR REPLACE FUNCTION public.crear_aprobacion_coordinador_segura(
  p_servicio_id text,
  p_estado_aprobacion text,
  p_modelo_vehiculo_compatible boolean DEFAULT false,
  p_cobertura_celular_verificada boolean DEFAULT false,
  p_requiere_instalacion_fisica boolean DEFAULT false,
  p_acceso_instalacion_disponible boolean DEFAULT false,
  p_restricciones_tecnicas_sla boolean DEFAULT false,
  p_contactos_emergencia_validados boolean DEFAULT false,
  p_elementos_aclarar_cliente text DEFAULT NULL,
  p_observaciones text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  servicio_existe boolean;
  aprobacion_id uuid;
  nuevo_estado text;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar autenticación
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Verificar permisos usando la función existente
  IF NOT public.is_coordinator_or_admin() THEN
    RAISE EXCEPTION 'Usuario no tiene permisos de coordinador u administrador';
  END IF;
  
  -- Verificar que el servicio existe
  SELECT EXISTS(
    SELECT 1 FROM public.servicios_monitoreo 
    WHERE id = p_servicio_id::uuid
  ) INTO servicio_existe;
  
  IF NOT servicio_existe THEN
    RAISE EXCEPTION 'El servicio especificado no existe';
  END IF;
  
  -- Insertar la aprobación directamente
  INSERT INTO public.aprobacion_coordinador (
    servicio_id,
    coordinador_id,
    estado_aprobacion,
    fecha_respuesta,
    modelo_vehiculo_compatible,
    cobertura_celular_verificada,
    requiere_instalacion_fisica,
    acceso_instalacion_disponible,
    restricciones_tecnicas_sla,
    contactos_emergencia_validados,
    elementos_aclarar_cliente,
    observaciones
  ) VALUES (
    p_servicio_id::uuid,
    current_user_id,
    p_estado_aprobacion,
    now(),
    p_modelo_vehiculo_compatible,
    p_cobertura_celular_verificada,
    p_requiere_instalacion_fisica,
    p_acceso_instalacion_disponible,
    p_restricciones_tecnicas_sla,
    p_contactos_emergencia_validados,
    p_elementos_aclarar_cliente,
    p_observaciones
  ) RETURNING id INTO aprobacion_id;
  
  -- Determinar el nuevo estado del servicio
  CASE p_estado_aprobacion
    WHEN 'aprobado' THEN nuevo_estado := 'pendiente_analisis_riesgo';
    WHEN 'rechazado' THEN nuevo_estado := 'rechazado';
    WHEN 'requiere_aclaracion' THEN nuevo_estado := 'requiere_aclaracion';
    ELSE nuevo_estado := 'pendiente_evaluacion';
  END CASE;
  
  -- Actualizar el estado del servicio
  UPDATE public.servicios_monitoreo
  SET estado_general = nuevo_estado
  WHERE id = p_servicio_id::uuid;
  
  RETURN aprobacion_id;
END;
$$;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.crear_aprobacion_coordinador_segura TO authenticated;

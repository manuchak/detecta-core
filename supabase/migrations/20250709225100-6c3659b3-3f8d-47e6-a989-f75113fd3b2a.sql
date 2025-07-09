-- Eliminar funciones existentes que causan conflictos
DROP FUNCTION IF EXISTS public.update_user_role_secure(uuid, text);
DROP FUNCTION IF EXISTS public.verify_user_email_secure(uuid);

-- Crear función para actualizar roles de usuario de manera segura
CREATE OR REPLACE FUNCTION public.update_user_role_secure(
  target_user_id uuid,
  new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Verificar que el usuario actual es administrador
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Sin permisos para actualizar roles de usuario';
  END IF;

  -- Verificar que el usuario objetivo existe
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Verificar que el nuevo rol es válido
  IF new_role NOT IN (
    'admin', 'owner', 'supply_admin', 'coordinador_operaciones', 
    'jefe_seguridad', 'analista_seguridad', 'supply_lead', 
    'ejecutivo_ventas', 'bi', 'monitoring_supervisor', 'monitoring', 
    'supply', 'instalador', 'soporte', 'custodio', 'pending'
  ) THEN
    RAISE EXCEPTION 'Rol no válido: %', new_role;
  END IF;

  -- Eliminar todos los roles existentes del usuario (bypass RLS)
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insertar el nuevo rol (bypass RLS)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role);

  RETURN true;
END;
$$;

-- Función para verificar email de usuario de manera segura
CREATE OR REPLACE FUNCTION public.verify_user_email_secure(
  target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Verificar que el usuario actual es administrador
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Sin permisos para verificar emails de usuario';
  END IF;

  -- Actualizar el perfil del usuario
  UPDATE public.profiles
  SET 
    is_verified = true,
    updated_at = now()
  WHERE id = target_user_id;

  -- Verificar que se actualizó
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado para verificación';
  END IF;

  RETURN true;
END;
$$;

-- Conceder permisos a las funciones
GRANT EXECUTE ON FUNCTION public.update_user_role_secure(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_email_secure(uuid) TO authenticated;
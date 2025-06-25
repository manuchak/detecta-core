-- Migración para crear el sistema granular de skills (Corregida - Final)
-- Este sistema permite control de acceso más específico que los roles tradicionales

-- 1. Crear enum para skills
CREATE TYPE public.user_skill_type AS ENUM (
  'dashboard_view',
  'leads_management',
  'leads_approval',
  'user_management',
  'role_management',
  'monitoring_view',
  'monitoring_manage',
  'services_view',
  'services_manage',
  'installer_portal_only',
  'custodio_tracking_only',
  'supply_chain_view',
  'supply_chain_manage',
  'reports_view',
  'reports_export',
  'settings_view',
  'settings_manage',
  'wms_view',
  'wms_manage',
  'tickets_view',
  'tickets_manage',
  'admin_full_access'
);

-- 2. Crear tabla de skills de usuarios
CREATE TABLE public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill user_skill_type NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Crear índice único parcial para evitar duplicados de skill activo por usuario
CREATE UNIQUE INDEX user_skills_active_unique 
ON public.user_skills (user_id, skill) 
WHERE is_active = true;

-- 4. Crear índices adicionales para optimizar consultas
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON public.user_skills(skill);
CREATE INDEX idx_user_skills_active ON public.user_skills(is_active);
CREATE INDEX idx_user_skills_expires ON public.user_skills(expires_at) WHERE expires_at IS NOT NULL;

-- 5. Crear trigger para updated_at
CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Habilitar RLS
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- 7. Función auxiliar para verificar admin sin RLS (necesaria para políticas)
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Obtener email del usuario
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Verificar admin@admin.com directamente
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar rol en user_roles
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- 8. Políticas RLS para user_skills
-- Los usuarios pueden ver sus propios skills
CREATE POLICY "Users can view own skills"
ON public.user_skills FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Los administradores pueden ver todos los skills
CREATE POLICY "Admins can view all skills"
ON public.user_skills FOR SELECT
TO authenticated
USING (public.is_admin_user_secure());

-- Solo los administradores pueden gestionar skills
CREATE POLICY "Admins can manage skills"
ON public.user_skills FOR ALL
TO authenticated
USING (public.is_admin_user_secure());

-- 9. Función para verificar si un usuario tiene un skill específico
CREATE OR REPLACE FUNCTION public.user_has_skill(check_user_id uuid, required_skill user_skill_type)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar si el usuario tiene admin_full_access (acceso total)
  IF EXISTS (
    SELECT 1 FROM public.user_skills
    WHERE user_id = check_user_id 
    AND skill = 'admin_full_access'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RETURN true;
  END IF;
  
  -- Verificar si tiene el skill específico
  RETURN EXISTS (
    SELECT 1 FROM public.user_skills
    WHERE user_id = check_user_id 
    AND skill = required_skill
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;

-- 10. Función para obtener todos los skills activos de un usuario
CREATE OR REPLACE FUNCTION public.get_user_skills(check_user_id uuid)
RETURNS TABLE(skill user_skill_type, granted_at timestamp with time zone, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT us.skill, us.granted_at, us.expires_at
  FROM public.user_skills us
  WHERE us.user_id = check_user_id 
  AND us.is_active = true
  AND (us.expires_at IS NULL OR us.expires_at > now())
  ORDER BY us.granted_at DESC;
END;
$$;

-- 11. Función para migrar roles existentes a skills
CREATE OR REPLACE FUNCTION public.migrate_roles_to_skills()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  migrated_count integer := 0;
BEGIN
  -- Iterar sobre todos los usuarios con roles
  FOR user_record IN
    SELECT DISTINCT ur.user_id, ur.role
    FROM public.user_roles ur
    JOIN auth.users au ON ur.user_id = au.id
  LOOP
    -- Asignar skills basados en el rol
    CASE user_record.role
      WHEN 'owner', 'admin' THEN
        INSERT INTO public.user_skills (user_id, skill, granted_by)
        VALUES (user_record.user_id, 'admin_full_access', user_record.user_id)
        ON CONFLICT DO NOTHING;
      
      WHEN 'supply_admin' THEN
        INSERT INTO public.user_skills (user_id, skill, granted_by)
        SELECT user_record.user_id, unnest(ARRAY['dashboard_view', 'leads_management', 'services_manage', 'supply_chain_manage', 'reports_view']::user_skill_type[]), user_record.user_id
        ON CONFLICT DO NOTHING;
      
      WHEN 'coordinador_operaciones' THEN
        INSERT INTO public.user_skills (user_id, skill, granted_by)
        SELECT user_record.user_id, unnest(ARRAY['dashboard_view', 'services_manage', 'monitoring_view', 'reports_view']::user_skill_type[]), user_record.user_id
        ON CONFLICT DO NOTHING;
      
      WHEN 'custodio' THEN
        INSERT INTO public.user_skills (user_id, skill, granted_by)
        VALUES (user_record.user_id, 'custodio_tracking_only', user_record.user_id)
        ON CONFLICT DO NOTHING;
      
      WHEN 'instalador' THEN
        INSERT INTO public.user_skills (user_id, skill, granted_by)
        VALUES (user_record.user_id, 'installer_portal_only', user_record.user_id)
        ON CONFLICT DO NOTHING;
      
      WHEN 'bi' THEN
        INSERT INTO public.user_skills (user_id, skill, granted_by)
        SELECT user_record.user_id, unnest(ARRAY['dashboard_view', 'reports_view', 'reports_export']::user_skill_type[]), user_record.user_id
        ON CONFLICT DO NOTHING;
      
      WHEN 'monitoring_supervisor' THEN
        INSERT INTO public.user_skills (user_id, skill, granted_by)
        SELECT user_record.user_id, unnest(ARRAY['monitoring_manage', 'dashboard_view']::user_skill_type[]), user_record.user_id
        ON CONFLICT DO NOTHING;
      
      WHEN 'monitoring' THEN
        INSERT INTO public.user_skills (user_id, skill, granted_by)
        VALUES (user_record.user_id, 'monitoring_view', user_record.user_id)
        ON CONFLICT DO NOTHING;
      
      ELSE
        -- Para otros roles, no asignar skills automáticamente
        NULL;
    END CASE;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$;

-- 12. Función para limpiar skills expirados (para ejecutar periódicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_skills()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE public.user_skills
  SET is_active = false,
      updated_at = now()
  WHERE is_active = true 
  AND expires_at IS NOT NULL 
  AND expires_at <= now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- 13. Conceder permisos a las funciones
GRANT EXECUTE ON FUNCTION public.user_has_skill(uuid, user_skill_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_skills(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_roles_to_skills() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_skills() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user_secure() TO authenticated;

-- 14. Ejecutar migración inicial de roles a skills
SELECT public.migrate_roles_to_skills();

-- 15. Crear vista para facilitar consultas de skills por usuario
CREATE VIEW public.user_skills_view AS
SELECT 
  us.user_id,
  p.email,
  p.display_name,
  us.skill,
  us.granted_at,
  us.expires_at,
  us.is_active,
  CASE 
    WHEN us.expires_at IS NULL THEN 'Permanente'
    WHEN us.expires_at > now() THEN 'Activo'
    ELSE 'Expirado'
  END as status
FROM public.user_skills us
JOIN public.profiles p ON us.user_id = p.id
WHERE us.is_active = true;

-- 16. Establecer permisos básicos para la vista
GRANT SELECT ON public.user_skills_view TO authenticated;

-- 17. Comentarios
COMMENT ON TABLE public.user_skills IS 'Sistema granular de permisos basado en skills para usuarios';
COMMENT ON FUNCTION public.user_has_skill(uuid, user_skill_type) IS 'Verifica si un usuario tiene un skill específico';
COMMENT ON FUNCTION public.migrate_roles_to_skills() IS 'Migra roles tradicionales al sistema de skills';

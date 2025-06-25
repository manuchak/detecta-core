
-- Migración final para eliminar definitivamente SECURITY DEFINER de user_skills_view
-- Forzar recreación completa sin dependencias problemáticas

-- 1. Eliminar la vista completamente
DROP VIEW IF EXISTS public.user_skills_view CASCADE;

-- 2. Esperar un momento para limpiar cache
SELECT pg_sleep(0.1);

-- 3. Recrear la vista con una consulta completamente nueva y simple
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

-- 4. Asegurar que NO tiene SECURITY DEFINER explícitamente
ALTER VIEW public.user_skills_view SET (security_invoker = true);

-- 5. Conceder permisos básicos
GRANT SELECT ON public.user_skills_view TO authenticated;

-- 6. Comentario de documentación
COMMENT ON VIEW public.user_skills_view IS 'Vista de skills de usuarios - recreada sin SECURITY DEFINER para cumplir con políticas de seguridad de Supabase';

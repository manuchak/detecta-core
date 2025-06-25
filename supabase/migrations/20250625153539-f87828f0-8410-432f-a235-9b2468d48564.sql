
-- Migración para corregir definitivamente el error de SECURITY DEFINER en user_skills_view
-- Forzar la recreación completa de la vista sin la propiedad SECURITY DEFINER

-- 1. Eliminar completamente la vista existente
DROP VIEW IF EXISTS public.user_skills_view CASCADE;

-- 2. Recrear la vista sin SECURITY DEFINER
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

-- 3. Establecer permisos apropiados para la vista
GRANT SELECT ON public.user_skills_view TO authenticated;

-- 4. Comentario para documentar el cambio
COMMENT ON VIEW public.user_skills_view IS 'Vista de skills de usuarios - recreada sin SECURITY DEFINER para cumplir con políticas de seguridad de Supabase';


-- Migración para corregir errores de seguridad de Supabase
-- 1. Corregir vista user_skills_view removiendo SECURITY DEFINER
-- 2. Habilitar RLS en tabla maintenance_log

-- 1. Recrear la vista user_skills_view sin SECURITY DEFINER
DROP VIEW IF EXISTS public.user_skills_view;

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

-- 2. Habilitar RLS en la tabla maintenance_log si existe
DO $$
BEGIN
  -- Verificar si la tabla maintenance_log existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'maintenance_log'
  ) THEN
    -- Habilitar RLS
    ALTER TABLE public.maintenance_log ENABLE ROW LEVEL SECURITY;
    
    -- Crear política básica - solo administradores pueden ver/modificar logs
    DROP POLICY IF EXISTS "Admin can manage maintenance logs" ON public.maintenance_log;
    CREATE POLICY "Admin can manage maintenance logs"
    ON public.maintenance_log FOR ALL
    TO authenticated
    USING (public.is_admin_user_secure());
    
    -- Política para que los usuarios puedan crear logs (para debugging)
    DROP POLICY IF EXISTS "Users can create maintenance logs" ON public.maintenance_log;
    CREATE POLICY "Users can create maintenance logs"
    ON public.maintenance_log FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Comentarios
COMMENT ON VIEW public.user_skills_view IS 'Vista de skills de usuarios sin SECURITY DEFINER para cumplir con políticas de seguridad';

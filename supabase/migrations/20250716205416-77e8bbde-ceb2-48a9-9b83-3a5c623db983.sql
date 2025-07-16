-- Eliminar todas las políticas de programacion_instalaciones
DROP POLICY IF EXISTS "simple_insert_programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "simple_select_programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "simple_update_programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "simple_delete_programaciones" ON public.programacion_instalaciones;

-- Temporalmente deshabilitar RLS para debugging
ALTER TABLE public.programacion_instalaciones DISABLE ROW LEVEL SECURITY;

-- Verificar que admin@admin.com tenga el rol admin en user_roles
DO $$
DECLARE 
    admin_user_id uuid;
BEGIN
    -- Buscar admin@admin.com usando la función auth.uid() cuando esté autenticado
    -- En su lugar, buscar directamente en profiles si existe
    SELECT id INTO admin_user_id 
    FROM public.profiles 
    WHERE email = 'admin@admin.com'
    LIMIT 1;
    
    -- Si no existe en profiles, intentar obtener desde el contexto de autenticación
    IF admin_user_id IS NULL THEN
        -- Solo podemos hacer esto si tenemos una sesión activa
        RAISE NOTICE 'Admin user not found in profiles table';
    ELSE
        -- Asegurar que tiene rol admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin user role ensured for: %', admin_user_id;
    END IF;
END $$;
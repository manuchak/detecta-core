-- Corregir los errores de seguridad detectados por el linter de Supabase

-- 1. Habilitar RLS en programacion_instalaciones (errores 2 y 6)
ALTER TABLE public.programacion_instalaciones ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar vistas con SECURITY DEFINER que causan problemas de seguridad
DROP VIEW IF EXISTS public.vista_kits_instalacion;
DROP VIEW IF EXISTS public.vista_analisis_inventario;  
DROP VIEW IF EXISTS public.scheduled_calls_view;

-- Las vistas se pueden recrear más tarde si son necesarias, 
-- pero sin SECURITY DEFINER y sin exponer datos sensibles de auth.users
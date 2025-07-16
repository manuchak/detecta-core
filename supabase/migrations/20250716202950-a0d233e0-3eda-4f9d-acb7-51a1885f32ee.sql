-- Verificar el estado de RLS en programacion_instalaciones
SELECT schemaname, tablename, rowsecurity, hasrls
FROM pg_tables 
WHERE tablename = 'programacion_instalaciones';

-- Temporalmente deshabilitar RLS para probar
ALTER TABLE public.programacion_instalaciones DISABLE ROW LEVEL SECURITY;
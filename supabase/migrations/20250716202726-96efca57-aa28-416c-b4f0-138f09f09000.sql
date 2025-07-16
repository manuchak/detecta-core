-- Verificar las políticas RLS actuales en programacion_instalaciones
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'programacion_instalaciones';
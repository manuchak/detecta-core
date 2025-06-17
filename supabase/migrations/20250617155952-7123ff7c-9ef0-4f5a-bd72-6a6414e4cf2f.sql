
-- Verificar el constraint actual de estado_general
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE contype = 'c' 
AND conrelid = 'public.servicios_monitoreo'::regclass
AND conname LIKE '%estado%';

-- Ver los valores únicos actuales en estado_general
SELECT DISTINCT estado_general, COUNT(*) as cantidad
FROM servicios_monitoreo 
GROUP BY estado_general
ORDER BY cantidad DESC;

-- Verificar la estructura de la tabla para entender mejor
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'servicios_monitoreo' 
AND column_name = 'estado_general';

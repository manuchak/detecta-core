
-- Consulta diagnóstica corregida para verificar el estado de los servicios después de evaluación

-- 1. Verificar servicios con aprobación de coordinador y su estado actual
SELECT 
    sm.id,
    sm.numero_servicio,
    sm.nombre_cliente,
    sm.estado_general,
    sm.created_at,
    ac.estado_aprobacion,
    ac.fecha_respuesta,
    ac.coordinador_id,
    CASE 
        WHEN ac.estado_aprobacion = 'aprobado' AND sm.estado_general != 'pendiente_analisis_riesgo' THEN 'PROBLEMA: Estado debería ser pendiente_analisis_riesgo'
        WHEN ac.estado_aprobacion = 'rechazado' AND sm.estado_general != 'rechazado_coordinador' THEN 'PROBLEMA: Estado debería ser rechazado_coordinador'
        WHEN ac.estado_aprobacion = 'requiere_aclaracion' AND sm.estado_general != 'requiere_aclaracion_cliente' THEN 'PROBLEMA: Estado debería ser requiere_aclaracion_cliente'
        ELSE 'OK: Estado correcto'
    END as diagnostico
FROM servicios_monitoreo sm
LEFT JOIN aprobacion_coordinador ac ON sm.id = ac.servicio_id
WHERE ac.id IS NOT NULL
ORDER BY ac.fecha_respuesta DESC
LIMIT 20;

-- 2. Verificar servicios que deberían estar en análisis de riesgo
SELECT 
    sm.id,
    sm.numero_servicio,
    sm.nombre_cliente,
    sm.estado_general,
    sm.created_at,
    ac.estado_aprobacion,
    ac.fecha_respuesta,
    ars.id as tiene_analisis_riesgo
FROM servicios_monitoreo sm
INNER JOIN aprobacion_coordinador ac ON sm.id = ac.servicio_id
LEFT JOIN analisis_riesgo_seguridad ars ON sm.id = ars.servicio_id
WHERE ac.estado_aprobacion = 'aprobado'
ORDER BY ac.fecha_respuesta DESC;

-- 3. Verificar constraint de estado_general en servicios_monitoreo (corregido)
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as check_clause
FROM pg_constraint 
WHERE contype = 'c' 
AND conrelid = 'public.servicios_monitoreo'::regclass
AND conname LIKE '%estado%';

-- 4. Verificar todos los estados únicos en la tabla
SELECT 
    estado_general,
    COUNT(*) as cantidad
FROM servicios_monitoreo 
GROUP BY estado_general
ORDER BY cantidad DESC;

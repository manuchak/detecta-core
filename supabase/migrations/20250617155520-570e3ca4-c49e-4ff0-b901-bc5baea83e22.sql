
-- Consulta específica para diagnosticar los 3 servicios que no avanzan
-- Verificar los servicios SRV-2025-000003, SRV-2025-000004, SRV-2025-000005

SELECT 
    sm.numero_servicio,
    sm.estado_general as estado_actual,
    sm.nombre_cliente,
    ac.estado_aprobacion,
    ac.fecha_respuesta,
    ac.coordinador_id,
    -- Verificar si existe registro en análisis de riesgo
    CASE 
        WHEN ars.id IS NOT NULL THEN 'SÍ - Ya existe en análisis'
        ELSE 'NO - Falta crear análisis'
    END as tiene_analisis_riesgo,
    -- Diagnóstico del problema
    CASE 
        WHEN ac.estado_aprobacion = 'aprobado' AND sm.estado_general = 'pendiente_analisis_riesgo' THEN 'CORRECTO: Listo para análisis'
        WHEN ac.estado_aprobacion = 'aprobado' AND sm.estado_general != 'pendiente_analisis_riesgo' THEN 
            'PROBLEMA: Aprobado pero estado es ' || sm.estado_general || ' (debería ser pendiente_analisis_riesgo)'
        WHEN ac.estado_aprobacion != 'aprobado' THEN 
            'INFO: No aprobado (' || ac.estado_aprobacion || ')'
        ELSE 'OTRO PROBLEMA'
    END as diagnostico,
    -- Mostrar timestamps para debugging
    sm.created_at as servicio_creado,
    ac.created_at as aprobacion_creada,
    ac.updated_at as aprobacion_actualizada
FROM servicios_monitoreo sm
LEFT JOIN aprobacion_coordinador ac ON sm.id = ac.servicio_id
LEFT JOIN analisis_riesgo_seguridad ars ON sm.id = ars.servicio_id
WHERE sm.numero_servicio IN ('SRV-2025-000003', 'SRV-2025-000004', 'SRV-2025-000005')
ORDER BY sm.numero_servicio;

-- También verificar si hay algún error en los constraints (corregido)
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE contype = 'c' 
AND conrelid = 'public.servicios_monitoreo'::regclass
AND conname LIKE '%estado%';

-- Verificar los valores exactos en aprobacion_coordinador para estos servicios
SELECT 
    ac.*,
    sm.numero_servicio,
    sm.estado_general
FROM aprobacion_coordinador ac
JOIN servicios_monitoreo sm ON ac.servicio_id = sm.id
WHERE sm.numero_servicio IN ('SRV-2025-000003', 'SRV-2025-000004', 'SRV-2025-000005')
ORDER BY sm.numero_servicio;

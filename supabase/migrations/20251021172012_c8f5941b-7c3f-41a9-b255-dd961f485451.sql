-- ============================================================================
-- CORRECCIÓN CRÍTICA: Análisis de Retención por Cohorte
-- ============================================================================
-- Problemas corregidos:
-- 1. Definición de cohorte basada en fecha_contratacion (no primer servicio)
-- 2. Filtro de estado menos restrictivo (incluye servicios activos)
-- 3. Cálculo preciso de meses usando aritmética de año-mes
-- 4. Validación de tamaño mínimo de cohorte (>=3 custodios)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_cohort_retention_matrix();

CREATE OR REPLACE FUNCTION public.get_cohort_retention_matrix()
RETURNS TABLE(
    cohort_month text,
    initial_size bigint,
    month_0 numeric,
    month_1 numeric,
    month_2 numeric,
    month_3 numeric,
    month_4 numeric,
    month_5 numeric,
    month_6 numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fecha_limite DATE;
BEGIN
    -- Analizar últimos 8 meses (para tener 6 meses completos de datos de retención)
    fecha_limite := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '8 months')::date;
    
    RETURN QUERY
    WITH 
    -- 1. COHORTES: Definir basado en fecha de contratación (NO primer servicio)
    custodian_cohort_month AS (
        SELECT 
            sc.nombre_custodio,
            DATE_TRUNC('month', MIN(sc.fecha_contratacion))::date as cohort_month
        FROM servicios_custodia sc
        WHERE sc.nombre_custodio IS NOT NULL 
            AND TRIM(sc.nombre_custodio) != ''
            AND sc.nombre_custodio != '#N/A'
            AND sc.fecha_contratacion IS NOT NULL
            AND sc.fecha_contratacion >= fecha_limite
        GROUP BY sc.nombre_custodio
    ),
    
    -- 2. ACTIVIDAD MENSUAL: Incluir todos los estados excepto cancelados/rechazados
    custodian_monthly_activity AS (
        SELECT 
            sc.nombre_custodio,
            DATE_TRUNC('month', sc.fecha_hora_cita)::date as activity_month
        FROM servicios_custodia sc
        WHERE sc.nombre_custodio IS NOT NULL 
            AND TRIM(sc.nombre_custodio) != ''
            AND sc.nombre_custodio != '#N/A'
            AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
            -- ✅ CAMBIO CRÍTICO: Incluir servicios activos, no solo finalizados
            AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'rechazado', 'no_realizado', '')
        GROUP BY sc.nombre_custodio, DATE_TRUNC('month', sc.fecha_hora_cita)::date
    ),
    
    -- 3. TAMAÑOS DE COHORTE: Validar mínimo 3 custodios para significancia estadística
    cohort_sizes AS (
        SELECT 
            ccm.cohort_month,
            COUNT(DISTINCT ccm.nombre_custodio)::bigint as initial_size
        FROM custodian_cohort_month ccm
        GROUP BY ccm.cohort_month
        HAVING COUNT(DISTINCT ccm.nombre_custodio) >= 3
    ),
    
    -- 4. DATOS DE RETENCIÓN: Cálculo preciso de meses transcurridos
    retention_data AS (
        SELECT 
            ccm.cohort_month,
            cs.initial_size,
            -- ✅ CAMBIO CRÍTICO: Cálculo preciso usando año-mes
            (EXTRACT(YEAR FROM cma.activity_month) * 12 + EXTRACT(MONTH FROM cma.activity_month)) - 
            (EXTRACT(YEAR FROM ccm.cohort_month) * 12 + EXTRACT(MONTH FROM ccm.cohort_month)) as months_after_cohort,
            COUNT(DISTINCT cma.nombre_custodio)::bigint as active_custodians
        FROM custodian_cohort_month ccm
        JOIN cohort_sizes cs ON ccm.cohort_month = cs.cohort_month
        LEFT JOIN custodian_monthly_activity cma ON ccm.nombre_custodio = cma.nombre_custodio
        WHERE cma.activity_month >= ccm.cohort_month
        GROUP BY ccm.cohort_month, cs.initial_size, months_after_cohort
    )
    
    -- 5. AGREGACIÓN FINAL: Calcular porcentajes de retención
    SELECT 
        TO_CHAR(rd.cohort_month, 'Mon YYYY') as cohort_month,
        MAX(rd.initial_size) as initial_size,
        -- Mes 0 (mes de contratación) - siempre 100%
        ROUND(100.0, 1) as month_0,
        -- Meses 1-6: Porcentaje de custodios activos vs inicial
        ROUND(MAX(CASE WHEN rd.months_after_cohort = 1 THEN (rd.active_custodians * 100.0 / NULLIF(rd.initial_size, 0)) END), 1) as month_1,
        ROUND(MAX(CASE WHEN rd.months_after_cohort = 2 THEN (rd.active_custodians * 100.0 / NULLIF(rd.initial_size, 0)) END), 1) as month_2,
        ROUND(MAX(CASE WHEN rd.months_after_cohort = 3 THEN (rd.active_custodians * 100.0 / NULLIF(rd.initial_size, 0)) END), 1) as month_3,
        ROUND(MAX(CASE WHEN rd.months_after_cohort = 4 THEN (rd.active_custodians * 100.0 / NULLIF(rd.initial_size, 0)) END), 1) as month_4,
        ROUND(MAX(CASE WHEN rd.months_after_cohort = 5 THEN (rd.active_custodians * 100.0 / NULLIF(rd.initial_size, 0)) END), 1) as month_5,
        ROUND(MAX(CASE WHEN rd.months_after_cohort = 6 THEN (rd.active_custodians * 100.0 / NULLIF(rd.initial_size, 0)) END), 1) as month_6
    FROM retention_data rd
    WHERE rd.months_after_cohort <= 6
    GROUP BY rd.cohort_month
    HAVING MAX(rd.initial_size) >= 3
    ORDER BY rd.cohort_month DESC;
END;
$$;

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_servicios_fecha_contratacion 
ON servicios_custodia(fecha_contratacion) 
WHERE fecha_contratacion IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_servicios_estado_lower 
ON servicios_custodia(LOWER(TRIM(estado)));

-- Comentarios para documentación
COMMENT ON FUNCTION public.get_cohort_retention_matrix() IS 
'Calcula matriz de retención por cohorte basado en fecha de contratación real. 
Incluye servicios activos (no solo finalizados). 
Requiere mínimo 3 custodios por cohorte para validez estadística.
Actualizado: 2025-10-21';
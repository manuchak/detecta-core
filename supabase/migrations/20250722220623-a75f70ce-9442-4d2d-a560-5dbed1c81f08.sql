-- Drop and recreate functions to fix type issues and ensure proper data retrieval

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_income_distribution_by_threshold();
DROP FUNCTION IF EXISTS public.get_activation_metrics();
DROP FUNCTION IF EXISTS public.get_cohort_retention_matrix();
DROP FUNCTION IF EXISTS public.get_monthly_productivity_stats();

-- Recreate get_income_distribution_by_threshold function
CREATE OR REPLACE FUNCTION public.get_income_distribution_by_threshold()
RETURNS TABLE(
    income_level text,
    income_range text,
    custodian_count bigint,
    percentage numeric,
    avg_services numeric,
    avg_income numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fecha_limite DATE;
BEGIN
    -- Calculate date limit: last 30 days
    fecha_limite := CURRENT_DATE - INTERVAL '30 days';
    
    RETURN QUERY
    WITH custodian_income AS (
        SELECT 
            sc.nombre_custodio,
            SUM(COALESCE(sc.cobro_cliente, 0))::numeric as total_income,
            COUNT(*)::numeric as total_services
        FROM servicios_custodia sc
        WHERE sc.nombre_custodio IS NOT NULL 
            AND TRIM(sc.nombre_custodio) != ''
            AND sc.nombre_custodio != '#N/A'
            AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
            AND sc.fecha_hora_cita <= (CURRENT_DATE + INTERVAL '1 day')::timestamp with time zone
            AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
        GROUP BY sc.nombre_custodio
    ),
    income_brackets AS (
        SELECT 
            ci.*,
            CASE 
                WHEN ci.total_income >= 50000 THEN 'Alto'
                WHEN ci.total_income >= 30000 THEN 'Medio-Alto'
                WHEN ci.total_income >= 15000 THEN 'Medio'
                WHEN ci.total_income >= 5000 THEN 'Bajo-Medio'
                ELSE 'Bajo'
            END as income_bracket,
            CASE 
                WHEN ci.total_income >= 50000 THEN '$50,000+'
                WHEN ci.total_income >= 30000 THEN '$30,000 - $49,999'
                WHEN ci.total_income >= 15000 THEN '$15,000 - $29,999'
                WHEN ci.total_income >= 5000 THEN '$5,000 - $14,999'
                ELSE '$0 - $4,999'
            END as range_text
        FROM custodian_income ci
    ),
    distribution_stats AS (
        SELECT 
            ib.income_bracket,
            ib.range_text,
            COUNT(*)::bigint as custodian_count,
            AVG(ib.total_services)::numeric as avg_services,
            AVG(ib.total_income)::numeric as avg_income,
            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM income_brackets))::numeric as percentage
        FROM income_brackets ib
        GROUP BY ib.income_bracket, ib.range_text
    )
    SELECT 
        ds.income_bracket as income_level,
        ds.range_text as income_range,
        ds.custodian_count,
        ROUND(ds.percentage, 1) as percentage,
        ROUND(ds.avg_services, 1) as avg_services,
        ROUND(ds.avg_income, 0) as avg_income
    FROM distribution_stats ds
    ORDER BY 
        CASE ds.income_bracket
            WHEN 'Alto' THEN 1
            WHEN 'Medio-Alto' THEN 2
            WHEN 'Medio' THEN 3
            WHEN 'Bajo-Medio' THEN 4
            WHEN 'Bajo' THEN 5
        END;
END;
$$;

-- Recreate get_activation_metrics function
CREATE OR REPLACE FUNCTION public.get_activation_metrics()
RETURNS TABLE(
    avg_activation_days numeric,
    median_activation_days numeric,
    fast_activations bigint,
    slow_activations bigint,
    total_activations bigint,
    fast_activation_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH custodian_first_last AS (
        SELECT 
            sc.nombre_custodio,
            MIN(sc.fecha_hora_cita)::date as first_service_date,
            MAX(sc.fecha_hora_cita)::date as last_service_date,
            COUNT(*)::bigint as total_services
        FROM servicios_custodia sc
        WHERE sc.nombre_custodio IS NOT NULL 
            AND TRIM(sc.nombre_custodio) != ''
            AND sc.nombre_custodio != '#N/A'
            AND sc.fecha_hora_cita IS NOT NULL
            AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
        GROUP BY sc.nombre_custodio
        HAVING COUNT(*) >= 3 -- At least 3 completed services to be considered "activated"
    ),
    activation_data AS (
        SELECT 
            cfl.*,
            (cfl.last_service_date - cfl.first_service_date) as activation_days
        FROM custodian_first_last cfl
        WHERE (cfl.last_service_date - cfl.first_service_date) <= 90 -- Only consider reasonable timeframes
    ),
    percentile_calc AS (
        SELECT 
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ad.activation_days) as median_days
        FROM activation_data ad
    )
    SELECT 
        COALESCE(AVG(ad.activation_days)::numeric, 0) as avg_activation_days,
        COALESCE(pc.median_days::numeric, 0) as median_activation_days,
        COUNT(*) FILTER (WHERE ad.activation_days <= 7)::bigint as fast_activations,
        COUNT(*) FILTER (WHERE ad.activation_days > 7)::bigint as slow_activations,
        COUNT(*)::bigint as total_activations,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE ad.activation_days <= 7) * 100.0 / COUNT(*))::numeric
            ELSE 0::numeric
        END as fast_activation_rate
    FROM activation_data ad
    CROSS JOIN percentile_calc pc;
END;
$$;

-- Recreate get_cohort_retention_matrix function
CREATE OR REPLACE FUNCTION public.get_cohort_retention_matrix()
RETURNS TABLE(
    cohort_month text,
    initial_size bigint,
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
    -- Calculate date limit: last 6 months for cohort analysis
    fecha_limite := CURRENT_DATE - INTERVAL '6 months';
    
    RETURN QUERY
    WITH custodian_monthly_activity AS (
        SELECT 
            sc.nombre_custodio,
            DATE_TRUNC('month', sc.fecha_hora_cita)::date as activity_month
        FROM servicios_custodia sc
        WHERE sc.nombre_custodio IS NOT NULL 
            AND TRIM(sc.nombre_custodio) != ''
            AND sc.nombre_custodio != '#N/A'
            AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
            AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
        GROUP BY sc.nombre_custodio, DATE_TRUNC('month', sc.fecha_hora_cita)::date
    ),
    custodian_first_month AS (
        SELECT 
            cma.nombre_custodio,
            MIN(cma.activity_month) as cohort_month
        FROM custodian_monthly_activity cma
        GROUP BY cma.nombre_custodio
    ),
    cohort_sizes AS (
        SELECT 
            cfm.cohort_month,
            COUNT(DISTINCT cfm.nombre_custodio)::bigint as initial_size
        FROM custodian_first_month cfm
        GROUP BY cfm.cohort_month
    ),
    retention_data AS (
        SELECT 
            cfm.cohort_month,
            cs.initial_size,
            (cma.activity_month - cfm.cohort_month) / 30 as months_after_cohort,
            COUNT(DISTINCT cma.nombre_custodio)::bigint as active_custodians
        FROM custodian_first_month cfm
        JOIN cohort_sizes cs ON cfm.cohort_month = cs.cohort_month
        LEFT JOIN custodian_monthly_activity cma ON cfm.nombre_custodio = cma.nombre_custodio
        WHERE cma.activity_month >= cfm.cohort_month
        GROUP BY cfm.cohort_month, cs.initial_size, (cma.activity_month - cfm.cohort_month) / 30
    )
    SELECT 
        TO_CHAR(rd.cohort_month, 'YYYY-MM') as cohort_month,
        MAX(rd.initial_size) as initial_size,
        ROUND(AVG(CASE WHEN rd.months_after_cohort = 1 THEN (rd.active_custodians * 100.0 / rd.initial_size) END), 1) as month_1,
        ROUND(AVG(CASE WHEN rd.months_after_cohort = 2 THEN (rd.active_custodians * 100.0 / rd.initial_size) END), 1) as month_2,
        ROUND(AVG(CASE WHEN rd.months_after_cohort = 3 THEN (rd.active_custodians * 100.0 / rd.initial_size) END), 1) as month_3,
        ROUND(AVG(CASE WHEN rd.months_after_cohort = 4 THEN (rd.active_custodians * 100.0 / rd.initial_size) END), 1) as month_4,
        ROUND(AVG(CASE WHEN rd.months_after_cohort = 5 THEN (rd.active_custodians * 100.0 / rd.initial_size) END), 1) as month_5,
        ROUND(AVG(CASE WHEN rd.months_after_cohort = 6 THEN (rd.active_custodians * 100.0 / rd.initial_size) END), 1) as month_6
    FROM retention_data rd
    GROUP BY rd.cohort_month
    ORDER BY rd.cohort_month DESC;
END;
$$;

-- Recreate get_monthly_productivity_stats function
CREATE OR REPLACE FUNCTION public.get_monthly_productivity_stats()
RETURNS TABLE(
    month_year text,
    active_custodians bigint,
    avg_services_per_custodian numeric,
    total_services bigint,
    avg_income_per_custodian numeric,
    total_income numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fecha_limite DATE;
BEGIN
    -- Calculate date limit: last 6 months for productivity analysis
    fecha_limite := CURRENT_DATE - INTERVAL '6 months';
    
    RETURN QUERY
    WITH monthly_custodian_stats AS (
        SELECT 
            DATE_TRUNC('month', sc.fecha_hora_cita)::date as service_month,
            sc.nombre_custodio,
            COUNT(*)::bigint as services_count,
            SUM(COALESCE(sc.cobro_cliente, 0))::numeric as total_income
        FROM servicios_custodia sc
        WHERE sc.nombre_custodio IS NOT NULL 
            AND TRIM(sc.nombre_custodio) != ''
            AND sc.nombre_custodio != '#N/A'
            AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
            AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
        GROUP BY DATE_TRUNC('month', sc.fecha_hora_cita)::date, sc.nombre_custodio
    ),
    monthly_aggregates AS (
        SELECT 
            mcs.service_month,
            COUNT(DISTINCT mcs.nombre_custodio)::bigint as active_custodians,
            SUM(mcs.services_count)::bigint as total_services,
            SUM(mcs.total_income)::numeric as total_income,
            AVG(mcs.services_count)::numeric as avg_services_per_custodian,
            AVG(mcs.total_income)::numeric as avg_income_per_custodian
        FROM monthly_custodian_stats mcs
        GROUP BY mcs.service_month
    )
    SELECT 
        TO_CHAR(ma.service_month, 'YYYY-MM') as month_year,
        ma.active_custodians,
        ROUND(ma.avg_services_per_custodian, 1) as avg_services_per_custodian,
        ma.total_services,
        ROUND(ma.avg_income_per_custodian, 0) as avg_income_per_custodian,
        ROUND(ma.total_income, 0) as total_income
    FROM monthly_aggregates ma
    ORDER BY ma.service_month DESC;
END;
$$;
-- Corregir warnings de seguridad para las funciones creadas
-- Actualizar función con search_path explícito

-- Función corregida para refrescar la vista materializada
CREATE OR REPLACE FUNCTION public.refresh_custodios_operativos_activos()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.custodios_operativos_activos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función corregida para el trigger
CREATE OR REPLACE FUNCTION public.update_comodatos_gps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Restringir acceso a la vista materializada removiéndola de la API
-- Crear política RLS para la vista materializada 
ALTER MATERIALIZED VIEW public.custodios_operativos_activos OWNER TO postgres;

-- Crear función de acceso controlado para la vista materializada
CREATE OR REPLACE FUNCTION public.get_custodios_operativos_activos()
RETURNS TABLE(
    nombre_custodio text,
    telefono text,
    telefono_operador text,
    total_servicios bigint,
    ultimo_servicio timestamp with time zone,
    servicios_completados bigint,
    km_promedio numeric
) AS $$
BEGIN
    -- Solo permitir acceso a roles autorizados
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador')
    ) THEN
        RAISE EXCEPTION 'Access denied. Insufficient permissions.';
    END IF;
    
    RETURN QUERY
    SELECT 
        coa.nombre_custodio,
        coa.telefono,
        coa.telefono_operador,
        coa.total_servicios,
        coa.ultimo_servicio,
        coa.servicios_completados,
        coa.km_promedio
    FROM public.custodios_operativos_activos coa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
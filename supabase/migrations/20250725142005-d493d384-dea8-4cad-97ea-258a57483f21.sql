-- Phase 1 (Batch 4/5): Fixing remaining structural errors in SQL functions
-- Adding SECURITY DEFINER and SET search_path TO 'public' for security compliance

-- Fix calcular_costo_promedio_ponderado function
CREATE OR REPLACE FUNCTION public.calcular_costo_promedio_ponderado(p_producto_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    total_cantidad INTEGER := 0;
    total_valor NUMERIC := 0;
    costo_promedio NUMERIC := 0;
BEGIN
    -- Sumar cantidad y valor total de todos los lotes activos
    SELECT 
        COALESCE(SUM(cantidad_disponible), 0),
        COALESCE(SUM(cantidad_disponible * costo_unitario), 0)
    INTO total_cantidad, total_valor
    FROM public.lotes_inventario 
    WHERE producto_id = p_producto_id 
    AND activo = true 
    AND cantidad_disponible > 0;
    
    -- Calcular promedio ponderado
    IF total_cantidad > 0 THEN
        costo_promedio := total_valor / total_cantidad;
    ELSE
        costo_promedio := 0;
    END IF;
    
    RETURN costo_promedio;
END;
$function$;

-- Fix calcular_valor_inventario function
CREATE OR REPLACE FUNCTION public.calcular_valor_inventario(p_producto_id uuid)
 RETURNS TABLE(valor_costo numeric, valor_venta numeric, margen_potencial numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    total_stock INTEGER := 0;
    costo_promedio NUMERIC := 0;
    precio_venta NUMERIC := 0;
BEGIN
    -- Obtener stock total y precio de venta
    SELECT 
        COALESCE(sp.cantidad_disponible, 0),
        COALESCE(pi.precio_venta_sugerido, 0)
    INTO total_stock, precio_venta
    FROM public.stock_productos sp
    JOIN public.productos_inventario pi ON pi.id = sp.producto_id
    WHERE sp.producto_id = p_producto_id;
    
    -- Calcular costo promedio
    costo_promedio := public.calcular_costo_promedio_ponderado(p_producto_id);
    
    RETURN QUERY SELECT 
        (total_stock * costo_promedio) as valor_costo,
        (total_stock * precio_venta) as valor_venta,
        ((total_stock * precio_venta) - (total_stock * costo_promedio)) as margen_potencial;
END;
$function$;

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
$function$;

-- Fix verify_user_role function
CREATE OR REPLACE FUNCTION public.verify_user_role(role_to_check text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = role_to_check
  );
$function$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_uid uuid, required_role text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = user_uid AND role = required_role
    );
$function$;

-- Fix es_usuario_admin (no parameters) function
CREATE OR REPLACE FUNCTION public.es_usuario_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'owner' OR role = 'manager')
  );
END;
$function$;

-- Fix obtener_estadisticas_custodio function
CREATE OR REPLACE FUNCTION public.obtener_estadisticas_custodio(custodio_id text)
 RETURNS TABLE(total_viajes integer, puntos_totales integer, km_totales numeric, viajes_completados integer, viajes_pendientes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer as total_viajes,
    SUM(public.calcular_puntos_viaje(km_recorridos, estado))::integer as puntos_totales,
    SUM(km_recorridos) as km_totales,
    COUNT(*) FILTER (WHERE estado = 'completado' OR estado = 'Completado')::integer as viajes_completados,
    COUNT(*) FILTER (WHERE estado = 'pendiente' OR estado = 'en proceso')::integer as viajes_pendientes
  FROM
    public.servicios_custodia
  WHERE
    id_custodio = custodio_id;
END;
$function$;
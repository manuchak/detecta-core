-- =====================================================
-- ARREGLOS DE SEGURIDAD - RLS Y FUNCIONES
-- =====================================================

-- Habilitar RLS en todas las tablas del módulo de planeación
ALTER TABLE public.pc_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_custodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_rutas_frecuentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_ofertas_custodio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_eventos_monitoreo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_costos_ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_config_scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCIONES DE AUTORIZACIÓN
-- =====================================================

-- Función para verificar si el usuario es planificador
CREATE OR REPLACE FUNCTION public.es_planificador()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'planificador')
  );
END;
$$;

-- Función para verificar si el usuario es C4/Monitoreo
CREATE OR REPLACE FUNCTION public.es_c4_monitoreo()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'c4', 'monitoreo')
  );
END;
$$;

-- Función para verificar acceso a módulo de planeación
CREATE OR REPLACE FUNCTION public.puede_acceder_planeacion()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'planificador', 'c4', 'monitoreo')
  );
END;
$$;

-- Arreglar funciones existentes añadiendo SET search_path
CREATE OR REPLACE FUNCTION public.generar_folio_servicio()
RETURNS TEXT 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN 'SRV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
           LPAD(EXTRACT(epoch FROM clock_timestamp())::bigint::text, 10, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.calcular_distancia_km(
    lat1 DECIMAL, lng1 DECIMAL, 
    lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL 
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    r DECIMAL := 6371; -- Radio de la Tierra en km
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    
    a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2) * SIN(dlng/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN r * c;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_generar_folio()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.folio IS NULL OR NEW.folio = '' THEN
        NEW.folio := generar_folio_servicio();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_pc_clientes_search()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.search_vector := to_tsvector('spanish', 
        COALESCE(NEW.nombre, '') || ' ' ||
        COALESCE(NEW.rfc, '') || ' ' ||
        COALESCE(NEW.contacto_nombre, '') || ' ' ||
        COALESCE(NEW.notas, '')
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_pc_custodios_search()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.search_vector := to_tsvector('spanish', 
        COALESCE(NEW.nombre, '') || ' ' ||
        COALESCE(NEW.tel, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.zona_base, '') || ' ' ||
        COALESCE(array_to_string(NEW.certificaciones, ' '), '') || ' ' ||
        COALESCE(NEW.comentarios, '')
    );
    RETURN NEW;
END;
$$;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Políticas para pc_clientes
CREATE POLICY "pc_clientes_select" ON public.pc_clientes
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_clientes_insert" ON public.pc_clientes
FOR INSERT WITH CHECK (es_planificador());

CREATE POLICY "pc_clientes_update" ON public.pc_clientes
FOR UPDATE USING (es_planificador()) WITH CHECK (es_planificador());

CREATE POLICY "pc_clientes_delete" ON public.pc_clientes
FOR DELETE USING (is_admin_user_secure());

-- Políticas para pc_custodios
CREATE POLICY "pc_custodios_select" ON public.pc_custodios
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_custodios_insert" ON public.pc_custodios
FOR INSERT WITH CHECK (es_planificador());

CREATE POLICY "pc_custodios_update" ON public.pc_custodios
FOR UPDATE USING (es_planificador()) WITH CHECK (es_planificador());

CREATE POLICY "pc_custodios_delete" ON public.pc_custodios
FOR DELETE USING (is_admin_user_secure());

-- Políticas para pc_rutas_frecuentes
CREATE POLICY "pc_rutas_select" ON public.pc_rutas_frecuentes
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_rutas_insert" ON public.pc_rutas_frecuentes
FOR INSERT WITH CHECK (es_planificador());

CREATE POLICY "pc_rutas_update" ON public.pc_rutas_frecuentes
FOR UPDATE USING (es_planificador()) WITH CHECK (es_planificador());

CREATE POLICY "pc_rutas_delete" ON public.pc_rutas_frecuentes
FOR DELETE USING (es_planificador());

-- Políticas para pc_servicios
CREATE POLICY "pc_servicios_select" ON public.pc_servicios
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_servicios_insert" ON public.pc_servicios
FOR INSERT WITH CHECK (es_planificador());

CREATE POLICY "pc_servicios_update" ON public.pc_servicios
FOR UPDATE USING (es_planificador()) WITH CHECK (es_planificador());

CREATE POLICY "pc_servicios_delete" ON public.pc_servicios
FOR DELETE USING (is_admin_user_secure());

-- Políticas para pc_ofertas_custodio
CREATE POLICY "pc_ofertas_select" ON public.pc_ofertas_custodio
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_ofertas_insert" ON public.pc_ofertas_custodio
FOR INSERT WITH CHECK (es_planificador());

CREATE POLICY "pc_ofertas_update" ON public.pc_ofertas_custodio
FOR UPDATE USING (es_planificador()) WITH CHECK (es_planificador());

-- Políticas para pc_asignaciones
CREATE POLICY "pc_asignaciones_select" ON public.pc_asignaciones
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_asignaciones_insert" ON public.pc_asignaciones
FOR INSERT WITH CHECK (es_planificador());

CREATE POLICY "pc_asignaciones_update" ON public.pc_asignaciones
FOR UPDATE USING (es_planificador()) WITH CHECK (es_planificador());

-- Políticas para pc_eventos_monitoreo
CREATE POLICY "pc_eventos_select" ON public.pc_eventos_monitoreo
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_eventos_insert" ON public.pc_eventos_monitoreo
FOR INSERT WITH CHECK (es_c4_monitoreo());

CREATE POLICY "pc_eventos_update" ON public.pc_eventos_monitoreo
FOR UPDATE USING (es_c4_monitoreo()) WITH CHECK (es_c4_monitoreo());

-- Políticas para pc_touchpoints
CREATE POLICY "pc_touchpoints_select" ON public.pc_touchpoints
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_touchpoints_insert" ON public.pc_touchpoints
FOR INSERT WITH CHECK (puede_acceder_planeacion());

CREATE POLICY "pc_touchpoints_update" ON public.pc_touchpoints
FOR UPDATE USING (puede_acceder_planeacion()) WITH CHECK (puede_acceder_planeacion());

-- Políticas para pc_costos_ingresos
CREATE POLICY "pc_costos_select" ON public.pc_costos_ingresos
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_costos_insert" ON public.pc_costos_ingresos
FOR INSERT WITH CHECK (es_planificador());

CREATE POLICY "pc_costos_update" ON public.pc_costos_ingresos
FOR UPDATE USING (es_planificador()) WITH CHECK (es_planificador());

-- Políticas para pc_config_scoring
CREATE POLICY "pc_config_select" ON public.pc_config_scoring
FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "pc_config_modify" ON public.pc_config_scoring
FOR ALL USING (is_admin_user_secure()) WITH CHECK (is_admin_user_secure());

-- Políticas para pc_audit_log
CREATE POLICY "pc_audit_select" ON public.pc_audit_log
FOR SELECT USING (is_admin_user_secure());

CREATE POLICY "pc_audit_insert" ON public.pc_audit_log
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
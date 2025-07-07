
-- CORRECCIÓN DEFINITIVA DE ADVERTENCIAS DE SEGURIDAD SUPABASE
-- Parte 3: Aplicar search_path correctamente con sintaxis SET search_path TO 'public'

-- Función: get_user_role_secure
CREATE OR REPLACE FUNCTION public.get_user_role_secure()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'unverified');
END;
$$;

-- Función: get_current_user_role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'unverified');
END;
$$;

-- Función: is_admin_user_secure
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- Función: is_admin_or_owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- Función: ensure_default_admin
CREATE OR REPLACE FUNCTION public.ensure_default_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Buscar admin@admin.com
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  -- Si existe, asegurarse de que tenga rol de administrador
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Función: is_current_user_admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- Función: get_user_role_direct
CREATE OR REPLACE FUNCTION public.get_user_role_direct()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'unverified');
END;
$$;

-- Función: parse_tiempo_retraso
CREATE OR REPLACE FUNCTION public.parse_tiempo_retraso(tiempo_str text)
RETURNS interval
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Parseado simple de tiempo en formato HH:MM o MM
  IF tiempo_str IS NULL OR tiempo_str = '' THEN
    RETURN '0 minutes'::interval;
  END IF;
  
  -- Si contiene ":", asumir formato HH:MM
  IF tiempo_str LIKE '%:%' THEN
    RETURN tiempo_str::interval;
  ELSE
    -- Asumir que son minutos
    RETURN (tiempo_str::integer || ' minutes')::interval;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '0 minutes'::interval;
END;
$$;

-- Función: actualizar_stock_movimiento
CREATE OR REPLACE FUNCTION public.actualizar_stock_movimiento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Actualizar stock según el tipo de movimiento
  IF NEW.tipo_movimiento = 'entrada' THEN
    UPDATE public.stock_productos
    SET cantidad_disponible = cantidad_disponible + NEW.cantidad
    WHERE producto_id = NEW.producto_id;
  ELSIF NEW.tipo_movimiento = 'salida' THEN
    UPDATE public.stock_productos
    SET cantidad_disponible = cantidad_disponible - NEW.cantidad
    WHERE producto_id = NEW.producto_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Función: actualizar_valor_inventario
CREATE OR REPLACE FUNCTION public.actualizar_valor_inventario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Recalcular valor del inventario cuando cambia el stock
  UPDATE public.productos
  SET valor_inventario = (
    SELECT COALESCE(SUM(sp.cantidad_disponible * p.precio_compra), 0)
    FROM public.stock_productos sp
    JOIN public.productos p ON sp.producto_id = p.id
    WHERE sp.producto_id = NEW.producto_id
  )
  WHERE id = NEW.producto_id;
  
  RETURN NEW;
END;
$$;

-- Función: actualizar_calificacion_instalador
CREATE OR REPLACE FUNCTION public.actualizar_calificacion_instalador()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Actualizar calificación promedio del instalador
  UPDATE public.instaladores
  SET 
    calificacion_promedio = (
      SELECT AVG(calificacion_general)
      FROM public.evaluaciones_instaladores
      WHERE instalador_id = NEW.instalador_id
    ),
    servicios_completados = (
      SELECT COUNT(*)
      FROM public.evaluaciones_instaladores
      WHERE instalador_id = NEW.instalador_id
    )
  WHERE id = NEW.instalador_id;
  
  RETURN NEW;
END;
$$;

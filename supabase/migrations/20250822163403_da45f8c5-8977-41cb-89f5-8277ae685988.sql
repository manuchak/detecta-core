-- Security fixes: Set proper search_path for functions without affecting functionality

-- Fix function search_path issues for security
CREATE OR REPLACE FUNCTION public.update_forecast_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$function$;

-- Fix update_pc_clientes_search function
CREATE OR REPLACE FUNCTION public.update_pc_clientes_search()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.search_vector := to_tsvector('spanish', 
        COALESCE(NEW.nombre, '') || ' ' ||
        COALESCE(NEW.rfc, '') || ' ' ||
        COALESCE(NEW.contacto_nombre, '') || ' ' ||
        COALESCE(NEW.notas, '')
    );
    RETURN NEW;
END;
$function$;

-- Fix update_pc_custodios_search function
CREATE OR REPLACE FUNCTION public.update_pc_custodios_search()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix update_custodios_rotacion_timestamp function
CREATE OR REPLACE FUNCTION public.update_custodios_rotacion_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
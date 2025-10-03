-- Crear alias para mantener compatibilidad con el código existente
CREATE OR REPLACE FUNCTION public.get_planned_services_summary(date_filter date)
RETURNS TABLE(
  total_services integer,
  assigned_services integer,
  pending_services integer,
  confirmed_services integer,
  services_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Simplemente llama a la función principal
  RETURN QUERY
  SELECT * FROM get_scheduled_services_summary(date_filter);
END;
$function$;
-- FUNCIÓN DE TESTING PARA VERIFICAR EL ACCESO A TODAS LAS TABLAS DEL SISTEMA

CREATE OR REPLACE FUNCTION public.test_recruitment_system_access()
RETURNS TABLE(
  table_name text,
  record_count bigint,
  access_status text,
  sample_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Test zonas_operacion_nacional
  BEGIN
    RETURN QUERY
    SELECT 
      'zonas_operacion_nacional'::text,
      (SELECT COUNT(*) FROM public.zonas_operacion_nacional),
      'SUCCESS'::text,
      (SELECT to_jsonb(z) FROM public.zonas_operacion_nacional z LIMIT 1)
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'zonas_operacion_nacional'::text,
      0::bigint,
      ('ERROR: ' || SQLERRM)::text,
      '{}'::jsonb;
  END;

  -- Test metricas_demanda_zona
  BEGIN
    RETURN QUERY
    SELECT 
      'metricas_demanda_zona'::text,
      (SELECT COUNT(*) FROM public.metricas_demanda_zona),
      'SUCCESS'::text,
      (SELECT to_jsonb(m) FROM public.metricas_demanda_zona m LIMIT 1)
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'metricas_demanda_zona'::text,
      0::bigint,
      ('ERROR: ' || SQLERRM)::text,
      '{}'::jsonb;
  END;

  -- Test alertas_sistema_nacional
  BEGIN
    RETURN QUERY
    SELECT 
      'alertas_sistema_nacional'::text,
      (SELECT COUNT(*) FROM public.alertas_sistema_nacional),
      'SUCCESS'::text,
      (SELECT to_jsonb(a) FROM public.alertas_sistema_nacional a LIMIT 1)
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'alertas_sistema_nacional'::text,
      0::bigint,
      ('ERROR: ' || SQLERRM)::text,
      '{}'::jsonb;
  END;

  -- Test candidatos_custodios
  BEGIN
    RETURN QUERY
    SELECT 
      'candidatos_custodios'::text,
      (SELECT COUNT(*) FROM public.candidatos_custodios),
      'SUCCESS'::text,
      (SELECT to_jsonb(c) FROM public.candidatos_custodios c LIMIT 1)
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'candidatos_custodios'::text,
      0::bigint,
      ('ERROR: ' || SQLERRM)::text,
      '{}'::jsonb;
  END;

  -- Test metricas_reclutamiento
  BEGIN
    RETURN QUERY
    SELECT 
      'metricas_reclutamiento'::text,
      (SELECT COUNT(*) FROM public.metricas_reclutamiento),
      'SUCCESS'::text,
      (SELECT to_jsonb(mr) FROM public.metricas_reclutamiento mr LIMIT 1)
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'metricas_reclutamiento'::text,
      0::bigint,
      ('ERROR: ' || SQLERRM)::text,
      '{}'::jsonb;
  END;

  RETURN;
END;
$$;
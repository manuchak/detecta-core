
CREATE OR REPLACE FUNCTION get_documentos_custodio_by_phone(p_telefono text)
RETURNS SETOF documentos_custodio
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT * FROM documentos_custodio
  WHERE regexp_replace(custodio_telefono, '[^0-9]', '', 'g') 
    LIKE '%' || RIGHT(regexp_replace(p_telefono, '[^0-9]', '', 'g'), 10)
  ORDER BY updated_at DESC;
$$;

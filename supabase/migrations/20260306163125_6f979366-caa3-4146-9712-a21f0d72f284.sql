
-- One-time data enrichment: copy razon_social from servicios_custodia to pc_clientes
-- where names match and pc_clientes.razon_social is empty
DO $$
DECLARE
  rows_updated int;
BEGIN
  UPDATE pc_clientes pc
  SET razon_social = sub.razon_social, updated_at = now()
  FROM (
    SELECT DISTINCT ON (UPPER(TRIM(nombre_cliente)))
      UPPER(TRIM(nombre_cliente)) as norm_name,
      razon_social
    FROM servicios_custodia
    WHERE razon_social IS NOT NULL AND razon_social != ''
    ORDER BY UPPER(TRIM(nombre_cliente)), created_at DESC
  ) sub
  WHERE UPPER(TRIM(pc.nombre)) = sub.norm_name
    AND (pc.razon_social IS NULL OR pc.razon_social = '');
    
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'Enriched % clients with razon_social from servicios_custodia', rows_updated;
END $$;

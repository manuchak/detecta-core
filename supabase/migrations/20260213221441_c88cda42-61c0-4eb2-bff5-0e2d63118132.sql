
CREATE OR REPLACE FUNCTION public.normalize_phone(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT right(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10)
$$;

DROP POLICY IF EXISTS "Custodios gestionan documentos propios" ON documentos_custodio;

CREATE POLICY "Custodios gestionan documentos propios"
ON documentos_custodio FOR ALL
USING (
  normalize_phone(custodio_telefono) = (
    SELECT normalize_phone(profiles.phone)
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  normalize_phone(custodio_telefono) = (
    SELECT normalize_phone(profiles.phone)
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Habilitar extensión unaccent en schema public
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- Crear función wrapper accesible para búsquedas sin acentos
CREATE OR REPLACE FUNCTION public.unaccent_text(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE STRICT;

COMMENT ON FUNCTION public.unaccent_text(text) IS 'Wrapper seguro para unaccent que evita errores de schema';
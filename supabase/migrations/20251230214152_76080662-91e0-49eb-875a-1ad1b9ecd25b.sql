
-- Ensure anon role has no access to matriz_precios_rutas (defensive)
REVOKE ALL ON public.matriz_precios_rutas FROM anon;

-- Enable FORCE ROW LEVEL SECURITY to prevent bypass by table owner/service role
ALTER TABLE public.matriz_precios_rutas FORCE ROW LEVEL SECURITY;

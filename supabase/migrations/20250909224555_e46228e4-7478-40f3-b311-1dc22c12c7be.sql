-- Add missing columns to matriz_precios_rutas table
ALTER TABLE public.matriz_precios_rutas 
ADD COLUMN IF NOT EXISTS clave text,
ADD COLUMN IF NOT EXISTS tipo_servicio text,
ADD COLUMN IF NOT EXISTS origen_texto text,
ADD COLUMN IF NOT EXISTS tipo_viaje text,
ADD COLUMN IF NOT EXISTS costo_custodio numeric,
ADD COLUMN IF NOT EXISTS costo_maximo_casetas numeric,
ADD COLUMN IF NOT EXISTS pago_custodio_sin_arma numeric;

-- Add comments for clarity
COMMENT ON COLUMN public.matriz_precios_rutas.clave IS 'Código identificador único de la ruta';
COMMENT ON COLUMN public.matriz_precios_rutas.tipo_servicio IS 'Tipo de servicio (ARMADA, FORANEO, etc.)';
COMMENT ON COLUMN public.matriz_precios_rutas.origen_texto IS 'Ubicación de origen del servicio';
COMMENT ON COLUMN public.matriz_precios_rutas.tipo_viaje IS 'Clasificación del tipo de viaje';
COMMENT ON COLUMN public.matriz_precios_rutas.costo_custodio IS 'Costo específico del custodio para esta ruta';
COMMENT ON COLUMN public.matriz_precios_rutas.costo_maximo_casetas IS 'Costo máximo permitido en casetas de peaje';
COMMENT ON COLUMN public.matriz_precios_rutas.pago_custodio_sin_arma IS 'Pago para custodio sin arma';
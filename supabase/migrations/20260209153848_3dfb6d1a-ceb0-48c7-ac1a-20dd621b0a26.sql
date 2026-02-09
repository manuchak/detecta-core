
-- Fase 2: Mejoras a tabla facturas
-- Punto 9: Tipo de factura y orden de compra
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS tipo_factura TEXT DEFAULT 'corte' CHECK (tipo_factura IN ('inmediata', 'corte'));
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS orden_compra TEXT DEFAULT NULL;

COMMENT ON COLUMN public.facturas.tipo_factura IS 'Tipo: inmediata (servicio individual) o corte (acumulada por periodo)';
COMMENT ON COLUMN public.facturas.orden_compra IS 'Número de orden de compra del cliente';

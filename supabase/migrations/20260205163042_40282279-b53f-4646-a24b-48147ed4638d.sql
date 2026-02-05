-- Agregar columna notas para trazabilidad de eliminaciones y auditoría
ALTER TABLE public.matriz_precios_rutas 
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Comentario descriptivo
COMMENT ON COLUMN public.matriz_precios_rutas.notas IS 
  'Notas de auditoría: motivos de eliminación, observaciones de precios';
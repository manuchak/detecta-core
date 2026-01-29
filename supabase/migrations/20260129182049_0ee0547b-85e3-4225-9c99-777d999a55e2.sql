-- ============================================
-- Fase 2: Actualizar constraint único para incluir origen_texto
-- ============================================

-- Eliminar el constraint antiguo que solo valida (cliente, destino)
ALTER TABLE public.matriz_precios_rutas 
DROP CONSTRAINT IF EXISTS matriz_precios_rutas_cliente_destino_unique;

-- Crear nuevo índice que incluye las 3 columnas: cliente, origen Y destino
-- Esto permite rutas inversas: A→B y B→A para el mismo cliente
CREATE UNIQUE INDEX matriz_precios_rutas_cliente_origen_destino_unique 
ON public.matriz_precios_rutas (cliente_nombre, origen_texto, destino_texto) 
WHERE activo = true;

-- Añadir comentario explicativo
COMMENT ON INDEX public.matriz_precios_rutas_cliente_origen_destino_unique IS 
'Previene rutas duplicadas exactas pero permite rutas inversas (A→B y B→A) para el mismo cliente';
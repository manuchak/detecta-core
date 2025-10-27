-- =====================================================
-- EXTENSIÓN PARA RUTAS MULTI-PUNTO (ESTRATEGIA DE REPARTO)
-- =====================================================
-- Permite manejar rutas con múltiples puntos de entrega
-- donde el mismo custodio realiza toda la ruta

-- 1. Agregar columnas a matriz_precios_rutas
ALTER TABLE public.matriz_precios_rutas 
ADD COLUMN IF NOT EXISTS puntos_intermedios JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.matriz_precios_rutas
ADD COLUMN IF NOT EXISTS es_ruta_reparto BOOLEAN DEFAULT false;

-- Constraint: Validar que puntos_intermedios sea un array
ALTER TABLE public.matriz_precios_rutas
ADD CONSTRAINT puntos_intermedios_is_array 
CHECK (jsonb_typeof(puntos_intermedios) = 'array');

-- 2. Agregar columnas a servicios_custodia
ALTER TABLE public.servicios_custodia
ADD COLUMN IF NOT EXISTS puntos_intermedios JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.servicios_custodia
ADD COLUMN IF NOT EXISTS es_ruta_reparto BOOLEAN DEFAULT false;

-- 3. Agregar índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_matriz_precios_es_reparto 
ON matriz_precios_rutas(cliente_nombre, es_ruta_reparto) 
WHERE es_ruta_reparto = true;

-- 4. Comentarios para documentación
COMMENT ON COLUMN matriz_precios_rutas.puntos_intermedios IS 
'Array de puntos intermedios para rutas de reparto. Formato: [{"nombre": "Sucursal A", "direccion": "...", "orden": 1, "tiempo_estimado_parada_min": 15}, ...]';

COMMENT ON COLUMN matriz_precios_rutas.es_ruta_reparto IS 
'TRUE si la ruta incluye múltiples puntos de entrega (estrategia de reparto)';

COMMENT ON COLUMN servicios_custodia.puntos_intermedios IS 
'Array de puntos intermedios para servicios de reparto. Mismo formato que matriz_precios_rutas';

COMMENT ON COLUMN servicios_custodia.es_ruta_reparto IS 
'TRUE si el servicio es una ruta de reparto con múltiples paradas';

-- =====================================================
-- FUNCIÓN: Buscar pricing para rutas multi-punto
-- =====================================================
CREATE OR REPLACE FUNCTION public.buscar_precio_ruta_reparto(
  p_cliente_nombre TEXT,
  p_origen TEXT,
  p_destino_final TEXT,
  p_numero_paradas INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  cliente_nombre TEXT,
  origen_texto TEXT,
  destino_texto TEXT,
  puntos_intermedios JSONB,
  valor_bruto NUMERIC,
  precio_custodio NUMERIC,
  costo_operativo NUMERIC,
  distancia_km NUMERIC,
  tipo_servicio TEXT,
  numero_paradas INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mpr.id,
    mpr.cliente_nombre,
    mpr.origen_texto,
    mpr.destino_texto,
    mpr.puntos_intermedios,
    mpr.valor_bruto,
    mpr.precio_custodio,
    mpr.costo_operativo,
    mpr.distancia_km,
    mpr.tipo_servicio,
    jsonb_array_length(COALESCE(mpr.puntos_intermedios, '[]'::jsonb)) as numero_paradas
  FROM public.matriz_precios_rutas mpr
  WHERE mpr.activo = true
    AND mpr.es_ruta_reparto = true
    AND mpr.cliente_nombre = p_cliente_nombre
    AND mpr.origen_texto = p_origen
    AND (
      -- Coincidencia exacta de destino final
      mpr.destino_texto = p_destino_final
      OR
      -- Si no se encuentra exacto, buscar rutas similares del mismo cliente
      (p_numero_paradas IS NOT NULL AND 
       jsonb_array_length(COALESCE(mpr.puntos_intermedios, '[]'::jsonb)) = p_numero_paradas)
    )
  ORDER BY 
    -- Priorizar coincidencia exacta de destino
    CASE WHEN mpr.destino_texto = p_destino_final THEN 1 ELSE 2 END,
    mpr.created_at DESC
  LIMIT 1;
END;
$$;
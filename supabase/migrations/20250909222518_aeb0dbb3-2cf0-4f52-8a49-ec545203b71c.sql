-- Crear tabla matriz_precios_rutas que replica la estructura del Excel
CREATE TABLE public.matriz_precios_rutas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nombre TEXT NOT NULL,
  destino_texto TEXT NOT NULL,
  dias_operacion TEXT,
  valor_bruto NUMERIC(10,2) NOT NULL, -- Precio al cliente
  precio_custodio NUMERIC(10,2) NOT NULL, -- Pago al custodio
  costo_operativo NUMERIC(10,2) DEFAULT 0, -- Casetas, combustible, viáticos
  margen_neto_calculado NUMERIC(10,2) GENERATED ALWAYS AS (valor_bruto - precio_custodio - costo_operativo) STORED,
  distancia_km NUMERIC(8,2),
  precio_desde_casa NUMERIC(10,2),
  precio_historico_2022 NUMERIC(10,2),
  porcentaje_utilidad NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN valor_bruto > 0 THEN ((valor_bruto - precio_custodio - costo_operativo) / valor_bruto * 100)
      ELSE 0 
    END
  ) STORED,
  precio_operativo_logistico NUMERIC(10,2),
  fecha_vigencia TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_matriz_precios_cliente ON public.matriz_precios_rutas(cliente_nombre);
CREATE INDEX idx_matriz_precios_destino ON public.matriz_precios_rutas(destino_texto);
CREATE INDEX idx_matriz_precios_activo ON public.matriz_precios_rutas(activo) WHERE activo = true;
CREATE INDEX idx_matriz_precios_vigencia ON public.matriz_precios_rutas(fecha_vigencia DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_matriz_precios_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matriz_precios_updated_at
  BEFORE UPDATE ON public.matriz_precios_rutas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_matriz_precios_timestamp();

-- Expandir tabla pc_clientes para incluir referencias de precios
ALTER TABLE public.pc_clientes 
ADD COLUMN IF NOT EXISTS tarifas_especiales BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS descuentos_aplicables JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS forma_pago_preferida TEXT DEFAULT 'transferencia',
ADD COLUMN IF NOT EXISTS sla_respuesta_horas INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS margen_objetivo_porcentaje NUMERIC(5,2) DEFAULT 20.0;

-- Expandir tabla pc_rutas_frecuentes para incluir costos operativos
ALTER TABLE public.pc_rutas_frecuentes
ADD COLUMN IF NOT EXISTS costo_operativo_actualizado NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margen_objetivo NUMERIC(5,2) DEFAULT 20.0,
ADD COLUMN IF NOT EXISTS fecha_ultima_actualizacion_precios TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS distancia_km_real NUMERIC(8,2);

-- RLS para matriz_precios_rutas
ALTER TABLE public.matriz_precios_rutas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios de planeación pueden ver matriz de precios"
ON public.matriz_precios_rutas
FOR SELECT
USING (puede_acceder_planeacion());

CREATE POLICY "Usuarios de planeación pueden insertar matriz de precios"
ON public.matriz_precios_rutas
FOR INSERT
WITH CHECK (puede_acceder_planeacion());

CREATE POLICY "Usuarios de planeación pueden actualizar matriz de precios"
ON public.matriz_precios_rutas
FOR UPDATE
USING (puede_acceder_planeacion())
WITH CHECK (puede_acceder_planeacion());

CREATE POLICY "Solo admins pueden eliminar matriz de precios"
ON public.matriz_precios_rutas
FOR DELETE
USING (user_has_role_direct('admin') OR user_has_role_direct('owner'));

-- Función para buscar precio por ruta
CREATE OR REPLACE FUNCTION public.buscar_precio_ruta(
  p_cliente_nombre TEXT,
  p_destino TEXT,
  p_distancia_km NUMERIC DEFAULT NULL
)
RETURNS TABLE(
  precio_sugerido NUMERIC,
  precio_custodio NUMERIC,
  costo_operativo NUMERIC,
  margen_estimado NUMERIC,
  ruta_encontrada TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  precio_exacto RECORD;
  precio_similar RECORD;
BEGIN
  -- Buscar precio exacto por cliente y destino
  SELECT INTO precio_exacto
    valor_bruto,
    precio_custodio as pago_custodio,
    costo_operativo as costo_ops,
    margen_neto_calculado,
    destino_texto
  FROM public.matriz_precios_rutas
  WHERE LOWER(cliente_nombre) = LOWER(p_cliente_nombre)
    AND LOWER(destino_texto) = LOWER(p_destino)
    AND activo = true
  ORDER BY fecha_vigencia DESC
  LIMIT 1;

  IF precio_exacto IS NOT NULL THEN
    RETURN QUERY SELECT 
      precio_exacto.valor_bruto,
      precio_exacto.pago_custodio,
      precio_exacto.costo_ops,
      precio_exacto.margen_neto_calculado,
      precio_exacto.destino_texto;
    RETURN;
  END IF;

  -- Si no hay precio exacto, buscar por destino similar
  SELECT INTO precio_similar
    valor_bruto,
    precio_custodio as pago_custodio,
    costo_operativo as costo_ops,
    margen_neto_calculado,
    destino_texto
  FROM public.matriz_precios_rutas
  WHERE LOWER(destino_texto) ILIKE '%' || LOWER(p_destino) || '%'
    AND activo = true
  ORDER BY 
    CASE WHEN LOWER(cliente_nombre) = LOWER(p_cliente_nombre) THEN 1 ELSE 2 END,
    fecha_vigencia DESC
  LIMIT 1;

  IF precio_similar IS NOT NULL THEN
    RETURN QUERY SELECT 
      precio_similar.valor_bruto,
      precio_similar.pago_custodio,
      precio_similar.costo_ops,
      precio_similar.margen_neto_calculado,
      'Estimado: ' || precio_similar.destino_texto;
    RETURN;
  END IF;

  -- Si no se encuentra nada, retornar valores por defecto
  RETURN QUERY SELECT 
    COALESCE(p_distancia_km * 15, 1000.0)::NUMERIC as precio_sugerido,
    COALESCE(p_distancia_km * 10, 700.0)::NUMERIC as precio_custodio,
    COALESCE(p_distancia_km * 2, 150.0)::NUMERIC as costo_operativo,
    COALESCE(p_distancia_km * 3, 150.0)::NUMERIC as margen_estimado,
    'Calculado por KM'::TEXT as ruta_encontrada;
END;
$$;
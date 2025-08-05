-- Enhance programacion_instalaciones table for improved GPS assignment
ALTER TABLE programacion_instalaciones 
ADD COLUMN IF NOT EXISTS vehiculo_marca text,
ADD COLUMN IF NOT EXISTS vehiculo_modelo text,
ADD COLUMN IF NOT EXISTS vehiculo_año integer,
ADD COLUMN IF NOT EXISTS tipo_combustible text DEFAULT 'gasolina',
ADD COLUMN IF NOT EXISTS es_electrico boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS configuracion_sensores jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS kit_asignado_id uuid,
ADD COLUMN IF NOT EXISTS auto_asignacion_completada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scoring_recomendacion jsonb DEFAULT '{}';

-- Create table for GPS-SIM-MicroSD kit assignments
CREATE TABLE IF NOT EXISTS kits_instalacion_asignados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  programacion_id uuid NOT NULL REFERENCES programacion_instalaciones(id) ON DELETE CASCADE,
  gps_producto_id uuid REFERENCES productos_inventario(id),
  sim_producto_id uuid REFERENCES productos_inventario(id),
  microsd_producto_id uuid REFERENCES productos_inventario(id),
  numero_serie_kit text UNIQUE,
  estado_kit text DEFAULT 'asignado' CHECK (estado_kit IN ('asignado', 'reservado', 'instalado', 'devuelto')),
  fecha_asignacion timestamp with time zone DEFAULT now(),
  fecha_instalacion timestamp with time zone,
  score_recomendacion integer,
  justificacion_seleccion jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE kits_instalacion_asignados ENABLE ROW LEVEL SECURITY;

-- Create policy for kits_instalacion_asignados
CREATE POLICY "Usuarios autenticados pueden gestionar kits" 
ON kits_instalacion_asignados 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create enhanced view for installation dashboard
CREATE OR REPLACE VIEW vista_instalaciones_dashboard AS
SELECT 
  pi.id,
  pi.servicio_id,
  pi.fecha_programada,
  pi.tipo_instalacion,
  pi.estado,
  pi.direccion_instalacion,
  pi.vehiculo_marca,
  pi.vehiculo_modelo,
  pi.vehiculo_año,
  pi.auto_asignacion_completada,
  sm.numero_servicio,
  sm.nombre_cliente,
  i.nombre_completo as instalador_nombre,
  i.telefono as instalador_telefono,
  kia.numero_serie_kit,
  kia.estado_kit,
  kia.score_recomendacion,
  -- Count of required and assigned components
  CASE 
    WHEN kia.gps_producto_id IS NOT NULL THEN 1 
    ELSE 0 
  END as gps_asignado,
  CASE 
    WHEN kia.sim_producto_id IS NOT NULL THEN 1 
    ELSE 0 
  END as sim_asignado,
  CASE 
    WHEN kia.microsd_producto_id IS NOT NULL THEN 1 
    ELSE 0 
  END as microsd_asignado,
  -- Stock availability status
  CASE 
    WHEN sp_gps.cantidad_disponible > 0 THEN 'disponible'
    WHEN sp_gps.cantidad_disponible = 0 THEN 'agotado'
    ELSE 'sin_stock'
  END as stock_gps_status
FROM programacion_instalaciones pi
LEFT JOIN servicios_monitoreo sm ON pi.servicio_id = sm.id
LEFT JOIN instaladores i ON pi.instalador_id = i.id
LEFT JOIN kits_instalacion_asignados kia ON pi.id = kia.programacion_id
LEFT JOIN productos_inventario pi_gps ON kia.gps_producto_id = pi_gps.id
LEFT JOIN stock_productos sp_gps ON pi_gps.id = sp_gps.producto_id;

-- Create function to auto-assign GPS kit components
CREATE OR REPLACE FUNCTION auto_asignar_kit_instalacion(
  p_programacion_id uuid,
  p_tipo_vehiculo text DEFAULT NULL,
  p_sensores_requeridos text[] DEFAULT '{}',
  p_forzar_asignacion boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  resultado jsonb := '{}';
  gps_recomendado record;
  sim_recomendada record;
  microsd_recomendada record;
  kit_id uuid;
  numero_serie_generado text;
BEGIN
  -- Find best GPS based on criteria
  SELECT 
    pi.id as producto_id,
    pi.nombre,
    pi.marca,
    pi.modelo,
    sp.cantidad_disponible,
    100 as score  -- Simplified scoring
  INTO gps_recomendado
  FROM productos_inventario pi
  JOIN stock_productos sp ON pi.id = sp.producto_id
  JOIN categorias_productos cp ON pi.categoria_id = cp.id
  WHERE cp.nombre ILIKE '%gps%' 
    AND pi.activo = true 
    AND sp.cantidad_disponible > 0
  ORDER BY sp.cantidad_disponible DESC, pi.precio_venta_sugerido ASC
  LIMIT 1;

  -- Find available SIM
  SELECT 
    pi.id as producto_id,
    pi.nombre,
    sp.cantidad_disponible
  INTO sim_recomendada
  FROM productos_inventario pi
  JOIN stock_productos sp ON pi.id = sp.producto_id
  JOIN categorias_productos cp ON pi.categoria_id = cp.id
  WHERE cp.nombre ILIKE '%sim%'
    AND pi.activo = true 
    AND sp.cantidad_disponible > 0
  ORDER BY sp.cantidad_disponible DESC
  LIMIT 1;

  -- Find available microSD if needed
  SELECT 
    pi.id as producto_id,
    pi.nombre,
    sp.cantidad_disponible
  INTO microsd_recomendada
  FROM productos_inventario pi
  JOIN stock_productos sp ON pi.id = sp.producto_id
  JOIN categorias_productos cp ON pi.categoria_id = cp.id
  WHERE cp.nombre ILIKE '%microsd%' OR cp.nombre ILIKE '%memoria%'
    AND pi.activo = true 
    AND sp.cantidad_disponible > 0
  ORDER BY sp.cantidad_disponible DESC
  LIMIT 1;

  -- Generate unique kit serial number
  numero_serie_generado := 'KIT-' || EXTRACT(epoch FROM now())::bigint || '-' || p_programacion_id::text;

  -- Create kit assignment
  IF gps_recomendado.producto_id IS NOT NULL THEN
    INSERT INTO kits_instalacion_asignados (
      programacion_id,
      gps_producto_id,
      sim_producto_id,
      microsd_producto_id,
      numero_serie_kit,
      score_recomendacion,
      justificacion_seleccion,
      estado_kit
    ) VALUES (
      p_programacion_id,
      gps_recomendado.producto_id,
      sim_recomendada.producto_id,
      microsd_recomendada.producto_id,
      numero_serie_generado,
      gps_recomendado.score,
      jsonb_build_object(
        'gps_seleccionado', gps_recomendado.nombre,
        'sim_seleccionada', COALESCE(sim_recomendada.nombre, 'No disponible'),
        'microsd_seleccionada', COALESCE(microsd_recomendada.nombre, 'No requerida'),
        'criterios', p_sensores_requeridos,
        'fecha_asignacion', now()
      ),
      'asignado'
    ) RETURNING id INTO kit_id;

    -- Update installation programming
    UPDATE programacion_instalaciones 
    SET 
      auto_asignacion_completada = true,
      kit_asignado_id = kit_id,
      scoring_recomendacion = jsonb_build_object(
        'score_total', gps_recomendado.score,
        'componentes_asignados', 
          (CASE WHEN gps_recomendado.producto_id IS NOT NULL THEN 1 ELSE 0 END) +
          (CASE WHEN sim_recomendada.producto_id IS NOT NULL THEN 1 ELSE 0 END) +
          (CASE WHEN microsd_recomendada.producto_id IS NOT NULL THEN 1 ELSE 0 END)
      )
    WHERE id = p_programacion_id;

    -- Reserve stock (reduce available quantity)
    IF gps_recomendado.producto_id IS NOT NULL THEN
      UPDATE stock_productos 
      SET cantidad_disponible = cantidad_disponible - 1
      WHERE producto_id = gps_recomendado.producto_id;
    END IF;

    IF sim_recomendada.producto_id IS NOT NULL THEN
      UPDATE stock_productos 
      SET cantidad_disponible = cantidad_disponible - 1
      WHERE producto_id = sim_recomendada.producto_id;
    END IF;

    IF microsd_recomendada.producto_id IS NOT NULL THEN
      UPDATE stock_productos 
      SET cantidad_disponible = cantidad_disponible - 1
      WHERE producto_id = microsd_recomendada.producto_id;
    END IF;

    resultado := jsonb_build_object(
      'success', true,
      'kit_id', kit_id,
      'numero_serie', numero_serie_generado,
      'componentes', jsonb_build_object(
        'gps', gps_recomendado.nombre,
        'sim', COALESCE(sim_recomendada.nombre, 'No disponible'),
        'microsd', COALESCE(microsd_recomendada.nombre, 'No requerida')
      )
    );
  ELSE
    resultado := jsonb_build_object(
      'success', false,
      'error', 'No hay GPS disponible en stock'
    );
  END IF;

  RETURN resultado;
END;
$$;
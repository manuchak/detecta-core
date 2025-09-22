-- Enhance puntos_encuentro_predefinidos table for contextual management
ALTER TABLE public.puntos_encuentro_predefinidos 
ADD COLUMN IF NOT EXISTS tipo_operacion text NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS armado_interno_id uuid REFERENCES public.armados_operativos(id),
ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES public.proveedores_armados(id),
ADD COLUMN IF NOT EXISTS base_empresa text,
ADD COLUMN IF NOT EXISTS auto_agregado boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS frecuencia_uso integer NOT NULL DEFAULT 0;

-- Add check constraint for tipo_operacion
ALTER TABLE public.puntos_encuentro_predefinidos 
ADD CONSTRAINT check_tipo_operacion 
CHECK (tipo_operacion IN ('base_empresa', 'direccion_personal', 'base_proveedor', 'general'));

-- Create index for better performance on contextual queries
CREATE INDEX IF NOT EXISTS idx_puntos_encuentro_tipo_operacion ON public.puntos_encuentro_predefinidos(tipo_operacion);
CREATE INDEX IF NOT EXISTS idx_puntos_encuentro_armado_interno ON public.puntos_encuentro_predefinidos(armado_interno_id) WHERE armado_interno_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_puntos_encuentro_proveedor ON public.puntos_encuentro_predefinidos(proveedor_id) WHERE proveedor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_puntos_encuentro_frecuencia ON public.puntos_encuentro_predefinidos(frecuencia_uso DESC);

-- Update existing records to have proper tipo_operacion
UPDATE public.puntos_encuentro_predefinidos 
SET tipo_operacion = 'general' 
WHERE tipo_operacion IS NULL;

-- Create function to auto-increment frequency usage
CREATE OR REPLACE FUNCTION public.increment_meeting_point_usage(point_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.puntos_encuentro_predefinidos 
  SET frecuencia_uso = frecuencia_uso + 1,
      updated_at = now()
  WHERE id = point_id;
END;
$$;

-- Create function to auto-add personal address for internal armed guards
CREATE OR REPLACE FUNCTION public.auto_add_personal_address(
  p_armado_id uuid,
  p_direccion text,
  p_coordenadas jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
  new_point_id uuid;
  armado_name text;
BEGIN
  -- Check if this address already exists for this armed guard
  SELECT id INTO existing_id
  FROM public.puntos_encuentro_predefinidos
  WHERE armado_interno_id = p_armado_id 
    AND direccion_completa = p_direccion
    AND tipo_operacion = 'direccion_personal';
  
  IF existing_id IS NOT NULL THEN
    -- Increment usage and return existing ID
    PERFORM public.increment_meeting_point_usage(existing_id);
    RETURN existing_id;
  END IF;
  
  -- Get armed guard name
  SELECT nombre INTO armado_name
  FROM public.armados_operativos
  WHERE id = p_armado_id;
  
  -- Create new personal address point
  INSERT INTO public.puntos_encuentro_predefinidos (
    nombre,
    direccion_completa,
    categoria,
    zona,
    tipo_operacion,
    armado_interno_id,
    auto_agregado,
    frecuencia_uso,
    coordenadas,
    activo
  ) VALUES (
    'Dirección Personal - ' || COALESCE(armado_name, 'Armado'),
    p_direccion,
    'Domicilio',
    'Personal',
    'direccion_personal',
    p_armado_id,
    true,
    1,
    p_coordenadas,
    true
  ) RETURNING id INTO new_point_id;
  
  RETURN new_point_id;
END;
$$;
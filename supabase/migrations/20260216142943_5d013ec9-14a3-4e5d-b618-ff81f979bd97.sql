
-- Add estado column to cs_touchpoints
ALTER TABLE public.cs_touchpoints 
ADD COLUMN estado text NOT NULL DEFAULT 'completado';

-- Update existing records that have pending follow-ups to 'pendiente'
UPDATE public.cs_touchpoints 
SET estado = 'pendiente' 
WHERE siguiente_accion IS NOT NULL 
  AND fecha_siguiente_accion IS NOT NULL 
  AND fecha_siguiente_accion >= CURRENT_DATE;

-- Create index for efficient filtering by estado
CREATE INDEX idx_cs_touchpoints_estado ON public.cs_touchpoints(estado);
CREATE INDEX idx_cs_touchpoints_fecha_siguiente ON public.cs_touchpoints(fecha_siguiente_accion) WHERE fecha_siguiente_accion IS NOT NULL;

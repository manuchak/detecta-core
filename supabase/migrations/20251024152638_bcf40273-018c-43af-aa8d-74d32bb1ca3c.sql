-- Agregar columnas faltantes a servicios_custodia
ALTER TABLE public.servicios_custodia 
ADD COLUMN IF NOT EXISTS estado_planeacion TEXT DEFAULT 'pendiente_asignacion',
ADD COLUMN IF NOT EXISTS requiere_armado BOOLEAN DEFAULT false;
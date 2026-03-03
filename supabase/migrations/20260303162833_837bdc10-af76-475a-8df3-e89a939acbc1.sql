
-- Step 3: Add es_siniestro column to incidentes_operativos
ALTER TABLE public.incidentes_operativos 
  ADD COLUMN IF NOT EXISTS es_siniestro boolean NOT NULL DEFAULT false;

-- Set es_siniestro = true for existing critical events (robo/asalto)
UPDATE public.incidentes_operativos 
SET es_siniestro = true 
WHERE tipo IN ('robo', 'asalto');

-- The secuestro/agresion event a61ccffe should also be marked as siniestro
UPDATE public.incidentes_operativos 
SET es_siniestro = true 
WHERE id = 'a61ccffe-42a4-4cae-a7be-079e72065929';

-- Step 4: Create siniestros_historico table for Fill Rate
CREATE TABLE IF NOT EXISTS public.siniestros_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha date NOT NULL,
  servicios_solicitados integer NOT NULL DEFAULT 0,
  servicios_completados integer NOT NULL DEFAULT 0,
  siniestros integer NOT NULL DEFAULT 0,
  eventos_no_criticos integer NOT NULL DEFAULT 0,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fecha)
);

ALTER TABLE public.siniestros_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view siniestros historico"
ON public.siniestros_historico FOR SELECT
USING (public.es_staff_incidentes());

CREATE POLICY "Staff can insert siniestros historico"
ON public.siniestros_historico FOR INSERT
WITH CHECK (public.es_staff_incidentes());

CREATE INDEX idx_siniestros_historico_fecha ON public.siniestros_historico(fecha DESC);

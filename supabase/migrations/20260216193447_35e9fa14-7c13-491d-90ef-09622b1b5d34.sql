
-- Add 'borrador' and 'en_investigacion' to estados de incidentes_operativos
-- Current states: abierto, resuelto, cerrado
-- New flow: borrador -> abierto -> en_investigacion -> resuelto -> cerrado

-- Create cronologia table
CREATE TABLE public.incidente_cronologia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incidente_id UUID NOT NULL REFERENCES public.incidentes_operativos(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo_entrada TEXT NOT NULL CHECK (tipo_entrada IN ('deteccion', 'notificacion', 'accion', 'escalacion', 'evidencia', 'resolucion', 'nota')),
  descripcion TEXT NOT NULL,
  autor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidente_cronologia ENABLE ROW LEVEL SECURITY;

-- Policies for incidente_cronologia
CREATE POLICY "Authenticated users can view cronologia"
ON public.incidente_cronologia FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert cronologia"
ON public.incidente_cronologia FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their cronologia entries"
ON public.incidente_cronologia FOR UPDATE
USING (auth.uid() = autor_id);

CREATE POLICY "Authors can delete their cronologia entries"
ON public.incidente_cronologia FOR DELETE
USING (auth.uid() = autor_id);

-- Index for fast lookups by incidente
CREATE INDEX idx_incidente_cronologia_incidente_id ON public.incidente_cronologia(incidente_id);
CREATE INDEX idx_incidente_cronologia_timestamp ON public.incidente_cronologia(incidente_id, timestamp);

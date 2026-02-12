
-- Create notas_operativos table
CREATE TABLE public.notas_operativos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operativo_id TEXT NOT NULL,
  operativo_tipo TEXT NOT NULL CHECK (operativo_tipo IN ('custodio', 'armado')),
  contenido TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'general' CHECK (categoria IN ('general', 'incidencia', 'acuerdo', 'seguimiento')),
  prioridad TEXT NOT NULL DEFAULT 'baja' CHECK (prioridad IN ('baja', 'media', 'alta')),
  autor_id UUID NOT NULL,
  autor_nombre TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by operative
CREATE INDEX idx_notas_operativos_lookup ON public.notas_operativos (operativo_id, operativo_tipo);
CREATE INDEX idx_notas_operativos_pinned ON public.notas_operativos (is_pinned DESC, created_at DESC);

-- Enable RLS
ALTER TABLE public.notas_operativos ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all notes
CREATE POLICY "Authenticated users can read notes"
  ON public.notas_operativos FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can create notes
CREATE POLICY "Authenticated users can create notes"
  ON public.notas_operativos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = autor_id);

-- Authenticated users can update their own notes
CREATE POLICY "Authenticated users can update own notes"
  ON public.notas_operativos FOR UPDATE
  USING (auth.uid() = autor_id);

-- Authenticated users can delete their own notes
CREATE POLICY "Authenticated users can delete own notes"
  ON public.notas_operativos FOR DELETE
  USING (auth.uid() = autor_id);

-- Trigger for updated_at
CREATE TRIGGER update_notas_operativos_updated_at
  BEFORE UPDATE ON public.notas_operativos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 1. Agregar columna imagen_url a incidente_cronologia
ALTER TABLE public.incidente_cronologia ADD COLUMN imagen_url TEXT;

-- 2. Crear bucket público para evidencias
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias-incidentes', 'evidencias-incidentes', true);

-- 3. Políticas de storage para staff autenticado
CREATE POLICY "Staff puede subir evidencias"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidencias-incidentes'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Todos pueden ver evidencias"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidencias-incidentes');

CREATE POLICY "Staff puede eliminar evidencias"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidencias-incidentes'
  AND auth.role() = 'authenticated'
);

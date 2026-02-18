
-- ============================================================
-- LMS: Nuevos tipos de contenido SCORM y Certificado Plantilla
-- ============================================================

-- 1. Alterar CHECK constraint en lms_contenidos para incluir los nuevos tipos
ALTER TABLE public.lms_contenidos
  DROP CONSTRAINT IF EXISTS lms_contenidos_tipo_check;

ALTER TABLE public.lms_contenidos
  ADD CONSTRAINT lms_contenidos_tipo_check
  CHECK (tipo::text = ANY (ARRAY[
    'video'::text,
    'documento'::text,
    'embed'::text,
    'texto_enriquecido'::text,
    'quiz'::text,
    'interactivo'::text,
    'scorm'::text,
    'certificado_plantilla'::text
  ]));

-- 2. Crear bucket lms-scorm para paquetes SCORM (ZIPs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lms-scorm',
  'lms-scorm',
  true,
  209715200, -- 200MB
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS: Solo admins pueden subir al bucket lms-scorm
CREATE POLICY "Admin puede subir paquetes SCORM"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lms-scorm'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role::text IN ('admin', 'capacitacion_admin')
      )
    )
  );

CREATE POLICY "Admin puede actualizar paquetes SCORM"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lms-scorm'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role::text IN ('admin', 'capacitacion_admin')
      )
    )
  );

CREATE POLICY "Admin puede eliminar paquetes SCORM"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lms-scorm'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role::text IN ('admin', 'capacitacion_admin')
      )
    )
  );

CREATE POLICY "Usuarios autenticados pueden leer paquetes SCORM"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'lms-scorm');

-- 4. RLS adicional en lms_certificados_plantillas para admins (CRUD completo)
-- Primero verificar si ya existe política de insert/update/delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lms_certificados_plantillas'
      AND policyname = 'Admin gestiona plantillas certificados'
  ) THEN
    CREATE POLICY "Admin gestiona plantillas certificados"
      ON public.lms_certificados_plantillas
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role::text IN ('admin', 'capacitacion_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role::text IN ('admin', 'capacitacion_admin')
        )
      );
  END IF;
END $$;

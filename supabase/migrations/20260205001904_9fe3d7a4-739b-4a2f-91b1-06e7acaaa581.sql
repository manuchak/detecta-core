-- =============================================
-- Sistema de Checklist de Servicios para Custodios
-- Tablas, bucket y políticas RLS
-- =============================================

-- ============ TABLA: documentos_custodio ============
CREATE TABLE IF NOT EXISTS public.documentos_custodio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_telefono TEXT NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN (
    'licencia_conducir',
    'tarjeta_circulacion', 
    'poliza_seguro',
    'verificacion_vehicular',
    'credencial_custodia'
  )),
  numero_documento TEXT,
  fecha_emision DATE,
  fecha_vigencia DATE NOT NULL,
  foto_url TEXT,
  verificado BOOLEAN DEFAULT false,
  verificado_por UUID REFERENCES auth.users(id),
  fecha_verificacion TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(custodio_telefono, tipo_documento)
);

-- Índices para documentos_custodio
CREATE INDEX IF NOT EXISTS idx_documentos_custodio_telefono 
  ON public.documentos_custodio(custodio_telefono);
CREATE INDEX IF NOT EXISTS idx_documentos_custodio_vigencia 
  ON public.documentos_custodio(fecha_vigencia);

-- ============ TABLA: checklist_servicio ============
CREATE TABLE IF NOT EXISTS public.checklist_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id TEXT NOT NULL,
  custodio_telefono TEXT NOT NULL,
  fecha_checklist TIMESTAMPTZ DEFAULT now(),
  fecha_captura_local TIMESTAMPTZ,
  fecha_sincronizacion TIMESTAMPTZ,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completo', 'incompleto')),
  sincronizado_offline BOOLEAN DEFAULT false,
  items_inspeccion JSONB DEFAULT '{
    "vehiculo": {
      "llantas_ok": null,
      "luces_ok": null,
      "frenos_ok": null,
      "espejos_ok": null,
      "limpiabrisas_ok": null,
      "carroceria_ok": null,
      "nivel_combustible": null
    },
    "equipamiento": {
      "gato_hidraulico": null,
      "llanta_refaccion": null,
      "triangulos": null,
      "extintor": null
    }
  }'::jsonb,
  fotos_validadas JSONB DEFAULT '[]'::jsonb,
  observaciones TEXT,
  firma_base64 TEXT,
  ubicacion_lat NUMERIC,
  ubicacion_lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(servicio_id, custodio_telefono)
);

-- Índices para checklist_servicio
CREATE INDEX IF NOT EXISTS idx_checklist_servicio_id ON public.checklist_servicio(servicio_id);
CREATE INDEX IF NOT EXISTS idx_checklist_custodio ON public.checklist_servicio(custodio_telefono);
CREATE INDEX IF NOT EXISTS idx_checklist_fecha ON public.checklist_servicio(fecha_checklist);
CREATE INDEX IF NOT EXISTS idx_checklist_estado ON public.checklist_servicio(estado);
CREATE INDEX IF NOT EXISTS idx_checklist_alertas_gps ON public.checklist_servicio USING GIN (fotos_validadas jsonb_path_ops);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('checklist-evidencias', 'checklist-evidencias', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============ RLS POLICIES ============
ALTER TABLE public.documentos_custodio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_servicio ENABLE ROW LEVEL SECURITY;

-- Políticas para documentos_custodio
CREATE POLICY "Custodios gestionan documentos propios"
ON public.documentos_custodio FOR ALL
USING (custodio_telefono = (SELECT phone FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Staff ve todos los documentos"
ON public.documentos_custodio FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'planeacion', 'monitoreo', 'coordinador')
));

-- Políticas para checklist_servicio
CREATE POLICY "Custodios gestionan checklist propio"
ON public.checklist_servicio FOR ALL
USING (custodio_telefono = (SELECT phone FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Staff ve todos los checklists"
ON public.checklist_servicio FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'planeacion', 'monitoreo', 'coordinador')
));

-- Políticas de Storage
CREATE POLICY "Custodios suben evidencias checklist"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'checklist-evidencias' AND auth.role() = 'authenticated');

CREATE POLICY "Ver evidencias checklist"
ON storage.objects FOR SELECT
USING (bucket_id = 'checklist-evidencias' AND auth.role() = 'authenticated');

CREATE POLICY "Custodios actualizan evidencias checklist"
ON storage.objects FOR UPDATE
USING (bucket_id = 'checklist-evidencias' AND auth.role() = 'authenticated');
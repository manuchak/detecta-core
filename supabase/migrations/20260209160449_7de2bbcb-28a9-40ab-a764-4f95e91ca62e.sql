
-- =====================================================
-- FASE 3: Detenciones, Estadías y Evidencias de Gastos
-- =====================================================

-- 1. Tabla de detenciones por servicio
CREATE TABLE public.detenciones_servicio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id INTEGER NOT NULL REFERENCES public.servicios_custodia(id) ON DELETE CASCADE,
  tipo_detencion TEXT NOT NULL CHECK (tipo_detencion IN ('carga', 'descarga', 'revision', 'pernocta', 'espera_cliente', 'mecanica', 'accidente', 'otro')),
  hora_inicio TIMESTAMPTZ NOT NULL,
  hora_fin TIMESTAMPTZ,
  duracion_minutos INTEGER GENERATED ALWAYS AS (
    CASE WHEN hora_fin IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (hora_fin - hora_inicio)) / 60 
      ELSE NULL 
    END
  ) STORED,
  motivo TEXT,
  ubicacion TEXT,
  cobrable_cliente BOOLEAN NOT NULL DEFAULT false,
  pagable_custodio BOOLEAN NOT NULL DEFAULT false,
  monto_cobro_cliente DECIMAL(10,2) DEFAULT 0,
  monto_pago_custodio DECIMAL(10,2) DEFAULT 0,
  registrado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para detenciones
CREATE INDEX idx_detenciones_servicio_id ON public.detenciones_servicio(servicio_id);
CREATE INDEX idx_detenciones_tipo ON public.detenciones_servicio(tipo_detencion);

-- RLS para detenciones
ALTER TABLE public.detenciones_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver detenciones"
  ON public.detenciones_servicio FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear detenciones"
  ON public.detenciones_servicio FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar detenciones"
  ON public.detenciones_servicio FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar detenciones"
  ON public.detenciones_servicio FOR DELETE
  TO authenticated
  USING (true);

-- Trigger updated_at para detenciones
CREATE TRIGGER update_detenciones_servicio_updated_at
  BEFORE UPDATE ON public.detenciones_servicio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabla de evidencias de gastos por servicio
CREATE TABLE public.evidencias_gastos_servicio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id INTEGER NOT NULL REFERENCES public.servicios_custodia(id) ON DELETE CASCADE,
  tipo_gasto TEXT NOT NULL CHECK (tipo_gasto IN ('caseta', 'hotel', 'estadia', 'combustible', 'alimentos', 'otro')),
  descripcion TEXT,
  monto DECIMAL(10,2) NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'MXN',
  archivo_url TEXT,
  archivo_nombre TEXT,
  verificado BOOLEAN NOT NULL DEFAULT false,
  verificado_por TEXT,
  fecha_verificacion TIMESTAMPTZ,
  cobrable_cliente BOOLEAN NOT NULL DEFAULT false,
  pagable_custodio BOOLEAN NOT NULL DEFAULT false,
  notas TEXT,
  registrado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para evidencias
CREATE INDEX idx_evidencias_servicio_id ON public.evidencias_gastos_servicio(servicio_id);
CREATE INDEX idx_evidencias_tipo ON public.evidencias_gastos_servicio(tipo_gasto);
CREATE INDEX idx_evidencias_verificado ON public.evidencias_gastos_servicio(verificado);

-- RLS para evidencias
ALTER TABLE public.evidencias_gastos_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver evidencias"
  ON public.evidencias_gastos_servicio FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear evidencias"
  ON public.evidencias_gastos_servicio FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar evidencias"
  ON public.evidencias_gastos_servicio FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar evidencias"
  ON public.evidencias_gastos_servicio FOR DELETE
  TO authenticated
  USING (true);

-- Trigger updated_at para evidencias
CREATE TRIGGER update_evidencias_gastos_updated_at
  BEFORE UPDATE ON public.evidencias_gastos_servicio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Storage bucket para evidencias de gastos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencias-gastos',
  'evidencias-gastos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Evidencias gastos son públicas para lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidencias-gastos');

CREATE POLICY "Usuarios autenticados pueden subir evidencias gastos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'evidencias-gastos');

CREATE POLICY "Usuarios autenticados pueden actualizar evidencias gastos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'evidencias-gastos');

CREATE POLICY "Usuarios autenticados pueden eliminar evidencias gastos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'evidencias-gastos');

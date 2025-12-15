-- Tabla para almacenar intervalos de mantenimiento personalizados por custodio
CREATE TABLE public.custodio_configuracion_mantenimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_telefono TEXT NOT NULL,
  tipo_mantenimiento TEXT NOT NULL,
  intervalo_km_personalizado INTEGER NOT NULL CHECK (intervalo_km_personalizado > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(custodio_telefono, tipo_mantenimiento)
);

-- RLS
ALTER TABLE public.custodio_configuracion_mantenimiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custodios pueden ver su configuración"
ON public.custodio_configuracion_mantenimiento
FOR SELECT USING (true);

CREATE POLICY "Custodios pueden insertar su configuración"
ON public.custodio_configuracion_mantenimiento
FOR INSERT WITH CHECK (true);

CREATE POLICY "Custodios pueden actualizar su configuración"
ON public.custodio_configuracion_mantenimiento
FOR UPDATE USING (true);

-- Índice para búsqueda rápida
CREATE INDEX idx_custodio_config_mant_telefono ON public.custodio_configuracion_mantenimiento(custodio_telefono);

-- Trigger para updated_at
CREATE TRIGGER update_custodio_config_mant_updated_at
BEFORE UPDATE ON public.custodio_configuracion_mantenimiento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
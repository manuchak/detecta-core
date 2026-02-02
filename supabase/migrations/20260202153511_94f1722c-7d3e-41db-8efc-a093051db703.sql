-- =============================================
-- Epic 2: Persistencia de Rechazos de Custodios
-- =============================================

-- Tabla para almacenar rechazos de custodios con vigencia configurable
CREATE TABLE IF NOT EXISTS public.custodio_rechazos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_id UUID NOT NULL REFERENCES public.custodios_operativos(id) ON DELETE CASCADE,
  servicio_id UUID REFERENCES public.servicios_planificados(id) ON DELETE SET NULL,
  fecha_rechazo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo TEXT,
  reportado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vigencia_hasta TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas eficientes
CREATE INDEX idx_custodio_rechazos_custodio ON public.custodio_rechazos(custodio_id);
CREATE INDEX idx_custodio_rechazos_vigencia ON public.custodio_rechazos(vigencia_hasta);
CREATE INDEX idx_custodio_rechazos_servicio ON public.custodio_rechazos(servicio_id);

-- RLS usando función existente
ALTER TABLE public.custodio_rechazos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planeacion puede ver rechazos" ON public.custodio_rechazos
  FOR SELECT USING (puede_acceder_planeacion());

CREATE POLICY "Planeacion puede registrar rechazos" ON public.custodio_rechazos
  FOR INSERT WITH CHECK (puede_acceder_planeacion());

-- Función para limpiar rechazos expirados
CREATE OR REPLACE FUNCTION public.limpiar_rechazos_expirados()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM custodio_rechazos WHERE vigencia_hasta < NOW();
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$;

COMMENT ON TABLE public.custodio_rechazos IS 'Registro de rechazos de custodios durante asignación de servicios';
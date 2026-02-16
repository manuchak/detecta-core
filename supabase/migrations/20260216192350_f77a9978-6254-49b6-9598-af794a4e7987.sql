
-- Drop leftover indexes from failed migration
DROP INDEX IF EXISTS public.idx_incidentes_fecha;
DROP INDEX IF EXISTS public.idx_incidentes_tipo;
DROP INDEX IF EXISTS public.idx_incidentes_severidad;

-- Create table
CREATE TABLE public.incidentes_operativos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_planificado_id UUID REFERENCES public.servicios_planificados(id),
  servicio_custodia_id INTEGER REFERENCES public.servicios_custodia(id),
  fecha_incidente TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tipo TEXT NOT NULL CHECK (tipo IN ('robo', 'asalto', 'accidente_vial', 'agresion', 'extorsion', 'perdida_mercancia', 'falla_gps', 'protocolo_incumplido', 'otro')),
  severidad TEXT NOT NULL CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
  atribuible_operacion BOOLEAN NOT NULL DEFAULT false,
  descripcion TEXT NOT NULL,
  zona TEXT,
  ubicacion_lat DOUBLE PRECISION,
  ubicacion_lng DOUBLE PRECISION,
  custodio_id UUID REFERENCES public.custodios_operativos(id),
  cliente_nombre TEXT,
  controles_activos TEXT[] DEFAULT '{}',
  control_efectivo BOOLEAN,
  acciones_tomadas TEXT,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_investigacion', 'resuelto', 'cerrado')),
  fecha_resolucion TIMESTAMP WITH TIME ZONE,
  resolucion_notas TEXT,
  reportado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incidentes_operativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view incidents"
  ON public.incidentes_operativos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create incidents"
  ON public.incidentes_operativos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update incidents"
  ON public.incidentes_operativos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_incidentes_ops_fecha ON public.incidentes_operativos(fecha_incidente DESC);
CREATE INDEX idx_incidentes_ops_tipo ON public.incidentes_operativos(tipo);
CREATE INDEX idx_incidentes_ops_severidad ON public.incidentes_operativos(severidad);

CREATE TRIGGER update_incidentes_operativos_updated_at
  BEFORE UPDATE ON public.incidentes_operativos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

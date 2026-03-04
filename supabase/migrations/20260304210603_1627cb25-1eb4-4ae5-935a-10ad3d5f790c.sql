
-- ENUM for route event types
DO $$ BEGIN
  CREATE TYPE public.tipo_evento_ruta AS ENUM (
    'inicio_servicio', 'fin_servicio',
    'combustible', 'baño', 'descanso', 'pernocta',
    'checkpoint', 'incidencia', 'foto_evidencia', 'otro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Main table
CREATE TABLE public.servicio_eventos_ruta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id text NOT NULL,
  tipo_evento tipo_evento_ruta NOT NULL,
  descripcion text,
  hora_inicio timestamptz NOT NULL DEFAULT now(),
  hora_fin timestamptz,
  duracion_segundos integer,
  lat double precision,
  lng double precision,
  ubicacion_texto text,
  foto_urls text[] DEFAULT '{}',
  registrado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_eventos_ruta_servicio ON servicio_eventos_ruta(servicio_id);
CREATE INDEX idx_eventos_ruta_tipo ON servicio_eventos_ruta(tipo_evento);
CREATE INDEX idx_eventos_ruta_hora ON servicio_eventos_ruta(hora_inicio);

-- RLS
ALTER TABLE servicio_eventos_ruta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eventos_ruta_select" ON servicio_eventos_ruta
  FOR SELECT TO authenticated
  USING (has_monitoring_role());

CREATE POLICY "eventos_ruta_insert" ON servicio_eventos_ruta
  FOR INSERT TO authenticated
  WITH CHECK (has_monitoring_role());

CREATE POLICY "eventos_ruta_update" ON servicio_eventos_ruta
  FOR UPDATE TO authenticated
  USING (has_monitoring_role());

CREATE POLICY "eventos_ruta_delete" ON servicio_eventos_ruta
  FOR DELETE TO authenticated
  USING (has_monitoring_write_role());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE servicio_eventos_ruta;

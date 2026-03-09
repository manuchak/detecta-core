-- Tabla de actas de entrega de turno
CREATE TABLE public.bitacora_entregas_turno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_saliente text NOT NULL,
  turno_entrante text NOT NULL,
  ejecutado_por uuid REFERENCES auth.users(id),
  monitoristas_salientes jsonb NOT NULL DEFAULT '[]',
  monitoristas_entrantes jsonb NOT NULL DEFAULT '[]',
  servicios_transferidos jsonb NOT NULL DEFAULT '[]',
  servicios_cerrados jsonb DEFAULT '[]',
  incidentes_abiertos jsonb DEFAULT '[]',
  notas_generales text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bitacora_entregas_turno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_read_entregas_turno"
ON public.bitacora_entregas_turno FOR SELECT
TO authenticated
USING (has_monitoring_role());

CREATE POLICY "monitoring_insert_entregas_turno"
ON public.bitacora_entregas_turno FOR INSERT
TO authenticated
WITH CHECK (has_monitoring_role());

CREATE INDEX idx_entregas_turno_created ON public.bitacora_entregas_turno(created_at DESC);
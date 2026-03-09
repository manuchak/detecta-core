
-- 1. Add firma_data_url column to bitacora_entregas_turno
ALTER TABLE public.bitacora_entregas_turno
  ADD COLUMN IF NOT EXISTS firma_data_url text;

-- 2. Create bitacora_anomalias_turno table
CREATE TABLE IF NOT EXISTS public.bitacora_anomalias_turno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  descripcion text,
  servicio_id text,
  monitorista_original text,
  monitorista_reasignado text,
  ejecutado_por uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bitacora_anomalias_turno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert anomalias"
  ON public.bitacora_anomalias_turno
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read anomalias"
  ON public.bitacora_anomalias_turno
  FOR SELECT
  TO authenticated
  USING (true);

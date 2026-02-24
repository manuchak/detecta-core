
-- Fix: Create the updated_at trigger function first, then the trigger

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create estudios_socioeconomicos table (the rest was already applied)
CREATE TABLE IF NOT EXISTS public.estudios_socioeconomicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES public.candidatos_custodios(id) ON DELETE CASCADE,
  proveedor text NOT NULL DEFAULT 'interno' CHECK (proveedor IN ('interno', 'externo')),
  nombre_proveedor text,
  fecha_estudio date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'rechazado')),
  resultado_general text CHECK (resultado_general IN ('favorable', 'con_observaciones', 'desfavorable')),
  score_vivienda integer CHECK (score_vivienda BETWEEN 1 AND 10),
  score_entorno integer CHECK (score_entorno BETWEEN 1 AND 10),
  score_familiar integer CHECK (score_familiar BETWEEN 1 AND 10),
  score_economico integer CHECK (score_economico BETWEEN 1 AND 10),
  score_referencias integer CHECK (score_referencias BETWEEN 1 AND 10),
  score_global numeric(3,1),
  observaciones text,
  recomendacion text,
  archivo_url text,
  realizado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estudios_socioeconomicos ENABLE ROW LEVEL SECURITY;

-- RLS policies (use IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estudios_socioeconomicos' AND policyname = 'Supply y admin pueden ver estudios socioeconomicos') THEN
    CREATE POLICY "Supply y admin pueden ver estudios socioeconomicos"
      ON public.estudios_socioeconomicos FOR SELECT TO authenticated
      USING (
        public.has_role(auth.uid(), 'supply') OR public.has_role(auth.uid(), 'supply_lead') OR
        public.has_role(auth.uid(), 'supply_admin') OR public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'owner')
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estudios_socioeconomicos' AND policyname = 'Supply y admin pueden insertar estudios socioeconomicos') THEN
    CREATE POLICY "Supply y admin pueden insertar estudios socioeconomicos"
      ON public.estudios_socioeconomicos FOR INSERT TO authenticated
      WITH CHECK (
        public.has_role(auth.uid(), 'supply') OR public.has_role(auth.uid(), 'supply_lead') OR
        public.has_role(auth.uid(), 'supply_admin') OR public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'owner')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estudios_socioeconomicos' AND policyname = 'Supply y admin pueden actualizar estudios socioeconomicos') THEN
    CREATE POLICY "Supply y admin pueden actualizar estudios socioeconomicos"
      ON public.estudios_socioeconomicos FOR UPDATE TO authenticated
      USING (
        public.has_role(auth.uid(), 'supply') OR public.has_role(auth.uid(), 'supply_lead') OR
        public.has_role(auth.uid(), 'supply_admin') OR public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'owner')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estudios_socioeconomicos' AND policyname = 'Supply y admin pueden eliminar estudios socioeconomicos') THEN
    CREATE POLICY "Supply y admin pueden eliminar estudios socioeconomicos"
      ON public.estudios_socioeconomicos FOR DELETE TO authenticated
      USING (
        public.has_role(auth.uid(), 'supply') OR public.has_role(auth.uid(), 'supply_lead') OR
        public.has_role(auth.uid(), 'supply_admin') OR public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'owner')
      );
  END IF;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_estudios_socioeconomicos ON public.estudios_socioeconomicos;
CREATE TRIGGER set_updated_at_estudios_socioeconomicos
  BEFORE UPDATE ON public.estudios_socioeconomicos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

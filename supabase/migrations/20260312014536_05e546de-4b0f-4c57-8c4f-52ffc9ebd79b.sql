
-- Tabla de feature flags para controlar módulos WhatsApp
CREATE TABLE public.app_feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_feature_flags ENABLE ROW LEVEL SECURITY;

-- Read: todos los autenticados
CREATE POLICY "Authenticated users can read flags"
  ON public.app_feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Write: admin/owner/coordinador_operaciones using has_role helper
CREATE POLICY "Admins and coordinators can update flags"
  ON public.app_feature_flags
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'owner') 
    OR has_role(auth.uid(), 'coordinador_operaciones')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'owner') 
    OR has_role(auth.uid(), 'coordinador_operaciones')
  );

-- Seed initial flags
INSERT INTO public.app_feature_flags (key, enabled) VALUES
  ('whatsapp_planeacion', false),
  ('whatsapp_monitoreo', false);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_feature_flags;

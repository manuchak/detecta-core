
-- Create cs_config table for CS module configuration
CREATE TABLE public.cs_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL UNIQUE,
  config jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.cs_config ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Authenticated users can read cs_config"
  ON public.cs_config FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update (using has_role function)
CREATE POLICY "Admins can insert cs_config"
  ON public.cs_config FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Admins can update cs_config"
  ON public.cs_config FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );

-- Trigger for updated_at
CREATE TRIGGER update_cs_config_updated_at
  BEFORE UPDATE ON public.cs_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

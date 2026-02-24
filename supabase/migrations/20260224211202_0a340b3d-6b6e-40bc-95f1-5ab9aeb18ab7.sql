
-- Tabla de cuentas monitoreadas de Twitter/X
CREATE TABLE public.twitter_monitored_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  categoria TEXT NOT NULL DEFAULT 'otro' CHECK (categoria IN ('gobierno', 'periodismo', 'monitoreo', 'seguridad', 'otro')),
  activa BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  agregada_por UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de consumo de API
CREATE TABLE public.twitter_api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  tweets_leidos INT NOT NULL DEFAULT 0,
  queries_ejecutadas INT NOT NULL DEFAULT 0,
  tweets_insertados INT NOT NULL DEFAULT 0,
  tweets_duplicados INT NOT NULL DEFAULT 0,
  rate_limited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.twitter_monitored_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitter_api_usage ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios autenticados pueden leer, solo admin/owner modifican
CREATE POLICY "Authenticated users can read twitter accounts"
  ON public.twitter_monitored_accounts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert twitter accounts"
  ON public.twitter_monitored_accounts FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update twitter accounts"
  ON public.twitter_monitored_accounts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete twitter accounts"
  ON public.twitter_monitored_accounts FOR DELETE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can read twitter api usage"
  ON public.twitter_api_usage FOR SELECT
  TO authenticated USING (true);

-- Service role puede insertar usage desde edge functions
CREATE POLICY "Service role can insert twitter api usage"
  ON public.twitter_api_usage FOR INSERT
  TO service_role WITH CHECK (true);

-- Seed inicial
INSERT INTO public.twitter_monitored_accounts (username, display_name, categoria, notas) VALUES
  ('GN_Carreteras', 'Guardia Nacional Carreteras', 'gobierno', 'Cuenta oficial de seguridad carretera'),
  ('monitorcarrete1', 'Monitor de Carreteras', 'monitoreo', 'Monitoreo en tiempo real de carreteras'),
  ('jaliscorojo', 'Jalisco Rojo', 'periodismo', 'Cobertura de seguridad en Jalisco'),
  ('mimorelia', 'Mi Morelia', 'periodismo', 'Noticias de seguridad en Morelia');

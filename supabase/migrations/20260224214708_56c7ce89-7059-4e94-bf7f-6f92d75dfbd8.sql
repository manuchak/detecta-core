
-- Tabla de palabras clave de búsqueda de Twitter
CREATE TABLE public.twitter_search_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'otro',
  activa BOOLEAN NOT NULL DEFAULT true,
  es_predeterminada BOOLEAN NOT NULL DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.twitter_search_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read keywords"
  ON public.twitter_search_keywords FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert keywords"
  ON public.twitter_search_keywords FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update keywords"
  ON public.twitter_search_keywords FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete non-default keywords"
  ON public.twitter_search_keywords FOR DELETE
  TO authenticated USING (es_predeterminada = false);

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role full access keywords"
  ON public.twitter_search_keywords FOR SELECT
  TO service_role USING (true);

-- Seed: keywords predeterminadas
INSERT INTO public.twitter_search_keywords (query_text, categoria, es_predeterminada, notas) VALUES
  ('robo trailer OR robo carga -is:retweet lang:es', 'robo_carga', true, 'Robo de trailers y carga en general'),
  ('robo tractocamion OR robo contenedor -is:retweet lang:es', 'robo_carga', true, 'Robo de tractocamiones y contenedores'),
  ('pirataje carretero OR robo autopista carga -is:retweet lang:es', 'robo_carga', true, 'Pirataje carretero y robo en autopistas'),
  ('bloqueo carretera OR narcobloqueo -is:retweet lang:es', 'bloqueos', true, 'Bloqueos carreteros y narcobloqueos'),
  ('bloqueo autopista OR cierre carretero -is:retweet lang:es', 'bloqueos', true, 'Cierres y bloqueos de autopistas'),
  ('quema vehiculos carretera OR ponchallanta -is:retweet lang:es', 'bloqueos', true, 'Quema de vehículos y ponchallanta'),
  ('asalto transportista OR secuestro operador -is:retweet lang:es', 'violencia_vial', true, 'Asaltos y secuestros a transportistas'),
  ('balacera carretera OR emboscada autopista -is:retweet lang:es', 'violencia_vial', true, 'Balaceras y emboscadas en carreteras'),
  ('extorsion transportista OR cobro piso carretera -is:retweet lang:es', 'violencia_vial', true, 'Extorsión y cobro de piso a transportistas'),
  ('volcadura trailer OR accidente carretera -is:retweet lang:es', 'accidentes', true, 'Volcaduras y accidentes carreteros'),
  ('derrumbe carretera OR puente colapsado -is:retweet lang:es', 'accidentes', true, 'Derrumbes y colapsos de infraestructura'),
  ('derrame toxico carretera OR incendio autopista -is:retweet lang:es', 'accidentes', true, 'Derrames tóxicos e incendios en autopistas'),
  ('inhibidor senal GPS OR jammer camion -is:retweet lang:es', 'tecnologia_criminal', true, 'Inhibidores de señal GPS y jammers');

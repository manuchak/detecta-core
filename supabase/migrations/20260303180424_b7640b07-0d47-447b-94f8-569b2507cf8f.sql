CREATE TABLE public.segment_geometries (
  segment_id text PRIMARY KEY,
  coordinates jsonb NOT NULL DEFAULT '[]'::jsonb,
  distance_km numeric,
  duration_minutes numeric,
  enriched_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.segment_geometries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of segment_geometries"
  ON public.segment_geometries FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow service role insert/update segment_geometries"
  ON public.segment_geometries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
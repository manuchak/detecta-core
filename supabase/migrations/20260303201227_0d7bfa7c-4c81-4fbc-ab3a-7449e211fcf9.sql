
-- Truck Route Builder tables
CREATE TABLE public.truck_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  origin_lat numeric NOT NULL,
  origin_lon numeric NOT NULL,
  dest_lat numeric NOT NULL,
  dest_lon numeric NOT NULL,
  waypoints jsonb DEFAULT '[]'::jsonb,
  vehicle_profile text NOT NULL DEFAULT 'TRUCK_53',
  max_width_m numeric NOT NULL DEFAULT 2.6,
  max_weight_tons numeric NOT NULL DEFAULT 40,
  alley_bias numeric NOT NULL DEFAULT -1,
  exclude_flags jsonb DEFAULT '{"unpaved":true,"ferry":true,"toll":false,"tunnel":false}'::jsonb,
  route_geojson jsonb,
  alt_route_geojson jsonb,
  route_distance_km numeric,
  route_duration_min numeric,
  status text NOT NULL DEFAULT 'DRAFT',
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.truck_route_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES public.truck_routes(id) ON DELETE CASCADE NOT NULL,
  version integer NOT NULL,
  route_geojson jsonb NOT NULL,
  params_used jsonb,
  diff_metrics jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_truck_routes_status ON public.truck_routes(status);
CREATE INDEX idx_truck_route_versions_route ON public.truck_route_versions(route_id, version);

ALTER TABLE public.truck_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_route_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read truck routes"
  ON public.truck_routes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own truck routes"
  ON public.truck_routes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own truck routes"
  ON public.truck_routes FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = updated_by);

CREATE POLICY "Authenticated users can read route versions"
  ON public.truck_route_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert route versions"
  ON public.truck_route_versions FOR INSERT TO authenticated WITH CHECK (true);

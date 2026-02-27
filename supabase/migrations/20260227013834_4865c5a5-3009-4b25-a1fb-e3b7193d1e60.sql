
-- Create project_cost_entries table
CREATE TABLE public.project_cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL,
  messages_count integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10,2) NOT NULL DEFAULT 0,
  participants text[] DEFAULT '{}',
  version_id uuid REFERENCES public.system_versions(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'development',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_cost_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can view cost entries"
  ON public.project_cost_entries FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cost entries"
  ON public.project_cost_entries FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update cost entries"
  ON public.project_cost_entries FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

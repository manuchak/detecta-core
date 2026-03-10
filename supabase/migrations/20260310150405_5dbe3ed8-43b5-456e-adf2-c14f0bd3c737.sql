
CREATE TABLE public.monitorista_heartbeat (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_ping timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monitorista_heartbeat ENABLE ROW LEVEL SECURITY;

-- Each user can upsert their own heartbeat
CREATE POLICY "Users can upsert own heartbeat"
  ON public.monitorista_heartbeat
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Monitoring staff can read all heartbeats
CREATE POLICY "Staff can read all heartbeats"
  ON public.monitorista_heartbeat
  FOR SELECT
  TO authenticated
  USING (public.has_monitoring_role());

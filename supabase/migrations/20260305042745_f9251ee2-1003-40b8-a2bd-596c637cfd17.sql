
-- 1. Add new enum values for lifecycle events
ALTER TYPE tipo_evento_ruta ADD VALUE IF NOT EXISTS 'llegada_destino';
ALTER TYPE tipo_evento_ruta ADD VALUE IF NOT EXISTS 'liberacion_custodio';

-- 2. Add en_destino flag to servicios_planificados
ALTER TABLE servicios_planificados
  ADD COLUMN IF NOT EXISTS en_destino boolean NOT NULL DEFAULT false;

-- 3. Create monitorist assignment table for shift tracking
CREATE TABLE IF NOT EXISTS public.bitacora_asignaciones_monitorista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id text NOT NULL,
  monitorista_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asignado_por uuid REFERENCES auth.users(id),
  turno text NOT NULL DEFAULT 'matutino',
  activo boolean NOT NULL DEFAULT true,
  inicio_turno timestamptz NOT NULL DEFAULT now(),
  fin_turno timestamptz,
  notas_handoff text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bitacora_asignaciones_monitorista ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_read_asignaciones" ON bitacora_asignaciones_monitorista
  FOR SELECT TO authenticated
  USING (public.has_monitoring_role());

CREATE POLICY "monitoring_write_asignaciones" ON bitacora_asignaciones_monitorista
  FOR INSERT TO authenticated
  WITH CHECK (public.has_monitoring_role());

CREATE POLICY "monitoring_update_asignaciones" ON bitacora_asignaciones_monitorista
  FOR UPDATE TO authenticated
  USING (public.has_monitoring_role());

CREATE POLICY "coordinador_delete_asignaciones" ON bitacora_asignaciones_monitorista
  FOR DELETE TO authenticated
  USING (public.has_monitoring_write_role());

-- 4. Geofence zones table (architecture only, future use)
CREATE TABLE IF NOT EXISTS public.geofence_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radio_metros integer NOT NULL DEFAULT 500,
  tipo text NOT NULL DEFAULT 'checkpoint',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.geofence_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_read_geofences" ON geofence_zones
  FOR SELECT TO authenticated
  USING (public.has_monitoring_role());

CREATE POLICY "coordinador_manage_geofences" ON geofence_zones
  FOR ALL TO authenticated
  USING (public.has_monitoring_write_role());

-- 5. Index for fast board queries
CREATE INDEX IF NOT EXISTS idx_servicios_planificados_board
  ON servicios_planificados (estado_planeacion, hora_inicio_real, hora_fin_real, fecha_hora_cita)
  WHERE estado_planeacion NOT IN ('cancelado', 'completado');

CREATE INDEX IF NOT EXISTS idx_bitacora_asignaciones_activo
  ON bitacora_asignaciones_monitorista (monitorista_id, activo)
  WHERE activo = true;

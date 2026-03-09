
CREATE POLICY "monitoring_update_apoyos"
ON solicitudes_apoyo_extraordinario FOR UPDATE
TO authenticated
USING (has_monitoring_write_role())
WITH CHECK (has_monitoring_write_role());

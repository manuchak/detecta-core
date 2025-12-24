-- Permitir a cualquier usuario autenticado insertar indisponibilidades
-- La validación del custodio_id se hace en el frontend
CREATE POLICY "usuarios_autenticados_pueden_insertar_indisponibilidad"
  ON custodio_indisponibilidades
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir a usuarios autenticados actualizar indisponibilidades
-- (para cancelar su propia indisponibilidad)
CREATE POLICY "usuarios_autenticados_pueden_actualizar_indisponibilidad"
  ON custodio_indisponibilidades
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir a usuarios autenticados ver indisponibilidades
CREATE POLICY "usuarios_autenticados_pueden_ver_indisponibilidades"
  ON custodio_indisponibilidades
  FOR SELECT
  TO authenticated
  USING (true);
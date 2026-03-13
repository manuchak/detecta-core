-- Allow facturación roles to read route events (for Tiempos Ops panel)
CREATE POLICY "facturacion_read_eventos_ruta"
  ON public.servicio_eventos_ruta
  FOR SELECT
  TO authenticated
  USING (has_facturacion_role());
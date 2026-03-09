-- Tabla para almacenar la clave de no amago diaria
CREATE TABLE public.bitacora_clave_no_amago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL UNIQUE,
  palabra text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bitacora_clave_no_amago ENABLE ROW LEVEL SECURITY;

-- SELECT para cualquier rol de monitoreo
CREATE POLICY "monitoring_select_clave_no_amago"
  ON public.bitacora_clave_no_amago
  FOR SELECT
  TO authenticated
  USING (public.has_monitoring_role());

-- INSERT para roles de escritura de monitoreo (el hook inserta si no existe para hoy)
CREATE POLICY "monitoring_insert_clave_no_amago"
  ON public.bitacora_clave_no_amago
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_monitoring_role());
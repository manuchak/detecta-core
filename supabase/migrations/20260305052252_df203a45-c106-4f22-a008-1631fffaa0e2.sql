CREATE OR REPLACE FUNCTION public.calcular_duracion_real()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.hora_inicio_real IS NOT NULL AND NEW.hora_fin_real IS NOT NULL THEN
    UPDATE servicios_custodia
    SET duracion_servicio = (NEW.hora_fin_real - NEW.hora_inicio_real)
    WHERE id_servicio = NEW.id_servicio
      AND duracion_servicio IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
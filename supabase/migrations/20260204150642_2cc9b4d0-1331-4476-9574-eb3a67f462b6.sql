-- Create audit trigger for matriz_precios_rutas changes
-- This automatically logs changes to valor_bruto and precio_custodio

CREATE OR REPLACE FUNCTION public.log_precio_ruta_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log cambio en valor_bruto
  IF OLD.valor_bruto IS DISTINCT FROM NEW.valor_bruto THEN
    INSERT INTO public.matriz_precios_historial (ruta_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (NEW.id, 'valor_bruto', OLD.valor_bruto, NEW.valor_bruto, auth.uid());
  END IF;
  
  -- Log cambio en precio_custodio
  IF OLD.precio_custodio IS DISTINCT FROM NEW.precio_custodio THEN
    INSERT INTO public.matriz_precios_historial (ruta_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (NEW.id, 'precio_custodio', OLD.precio_custodio, NEW.precio_custodio, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger (drop first if exists to allow re-running)
DROP TRIGGER IF EXISTS trg_log_precio_ruta_changes ON public.matriz_precios_rutas;

CREATE TRIGGER trg_log_precio_ruta_changes
AFTER UPDATE ON public.matriz_precios_rutas
FOR EACH ROW
EXECUTE FUNCTION public.log_precio_ruta_changes();
-- Agregar 'correccion_nan' al constraint de metodo_correccion
ALTER TABLE public.auditoria_km_correcciones 
DROP CONSTRAINT auditoria_km_correcciones_metodo_correccion_check;

ALTER TABLE public.auditoria_km_correcciones 
ADD CONSTRAINT auditoria_km_correcciones_metodo_correccion_check 
CHECK (metodo_correccion = ANY (ARRAY['mapbox_api'::text, 'division_1000'::text, 'origen_igual_destino'::text, 'km_teorico'::text, 'manual'::text, 'correccion_nan'::text]));
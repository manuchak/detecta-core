
ALTER TABLE public.incidente_cronologia
ADD COLUMN ubicacion_lat double precision,
ADD COLUMN ubicacion_lng double precision,
ADD COLUMN ubicacion_texto text;

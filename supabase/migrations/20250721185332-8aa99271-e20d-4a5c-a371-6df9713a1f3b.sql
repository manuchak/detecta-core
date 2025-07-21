-- Agregar restricción única en model_id para permitir upserts
ALTER TABLE public.ml_model_configurations 
ADD CONSTRAINT unique_model_id UNIQUE (model_id);
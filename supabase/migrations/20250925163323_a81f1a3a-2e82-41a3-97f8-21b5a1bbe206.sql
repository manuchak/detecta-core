-- Add optional client internal ID field to servicios_planificados table
ALTER TABLE public.servicios_planificados 
ADD COLUMN id_interno_cliente TEXT;
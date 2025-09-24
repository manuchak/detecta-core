-- Add missing fields to servicios_planificados table if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servicios_planificados' AND column_name = 'punto_encuentro') THEN
        ALTER TABLE public.servicios_planificados ADD COLUMN punto_encuentro TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servicios_planificados' AND column_name = 'hora_encuentro') THEN
        ALTER TABLE public.servicios_planificados ADD COLUMN hora_encuentro TEXT;
    END IF;
END $$;
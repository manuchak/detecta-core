-- Add armed guard assignment fields to servicios_planificados table if they don't exist
DO $$ 
BEGIN
    -- Add tipo_asignacion_armado column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicios_planificados' 
                   AND column_name = 'tipo_asignacion_armado') THEN
        ALTER TABLE servicios_planificados 
        ADD COLUMN tipo_asignacion_armado TEXT CHECK (tipo_asignacion_armado IN ('interno', 'proveedor'));
    END IF;

    -- Add proveedor_armado_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicios_planificados' 
                   AND column_name = 'proveedor_armado_id') THEN
        ALTER TABLE servicios_planificados 
        ADD COLUMN proveedor_armado_id UUID;
    END IF;

    -- Ensure punto_encuentro and hora_encuentro exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicios_planificados' 
                   AND column_name = 'punto_encuentro') THEN
        ALTER TABLE servicios_planificados 
        ADD COLUMN punto_encuentro TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicios_planificados' 
                   AND column_name = 'hora_encuentro') THEN
        ALTER TABLE servicios_planificados 
        ADD COLUMN hora_encuentro TEXT;
    END IF;
END $$;
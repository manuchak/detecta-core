-- Update move_lead_to_pool function to use estado instead of zona_id
CREATE OR REPLACE FUNCTION public.move_lead_to_pool(
    p_lead_id TEXT,
    p_estado_id TEXT,
    p_motivo TEXT DEFAULT 'Zona saturada'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    lead_exists BOOLEAN := FALSE;
BEGIN
    -- Check if lead exists
    SELECT EXISTS(
        SELECT 1 FROM leads_asignados 
        WHERE lead_id = p_lead_id
    ) INTO lead_exists;
    
    IF NOT lead_exists THEN
        RAISE EXCEPTION 'Lead no encontrado: %', p_lead_id;
    END IF;
    
    -- Update lead to pool status with estado
    UPDATE leads_asignados 
    SET 
        estado = 'aprobado_en_espera',
        pool_estado_ubicacion = p_estado_id,
        pool_fecha_ingreso = NOW(),
        pool_motivo = p_motivo,
        updated_at = NOW()
    WHERE lead_id = p_lead_id;
    
    -- Insert movement record
    INSERT INTO pool_movements (
        lead_id,
        action,
        estado_ubicacion,
        motivo,
        timestamp,
        created_at
    ) VALUES (
        p_lead_id,
        'moved_to_pool',
        p_estado_id,
        p_motivo,
        NOW(),
        NOW()
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error moving lead to pool: %', SQLERRM;
END;
$$;
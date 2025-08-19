-- Fix move_lead_to_pool function to use correct column names and structure
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
    current_user_id UUID;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    -- Check if lead exists
    SELECT EXISTS(
        SELECT 1 FROM leads 
        WHERE id = p_lead_id
    ) INTO lead_exists;
    
    IF NOT lead_exists THEN
        RAISE EXCEPTION 'Lead no encontrado: %', p_lead_id;
    END IF;
    
    -- Update lead to pool status - keep estado as 'aprobado' but mark pool entry
    UPDATE leads 
    SET 
        estado = 'aprobado',
        fecha_entrada_pool = NOW(),
        motivo_pool = p_estado_id || ': ' || p_motivo,
        updated_at = NOW()
    WHERE id = p_lead_id;
    
    -- Insert movement record using correct column names
    INSERT INTO pool_reserva_movements (
        lead_id,
        movimiento_tipo,
        motivo,
        fecha_entrada,
        created_at,
        created_by,
        metadata
    ) VALUES (
        p_lead_id,
        'moved_to_pool',
        p_motivo,
        NOW(),
        NOW(),
        current_user_id,
        jsonb_build_object(
            'estado_ubicacion', p_estado_id,
            'motivo_detalle', p_motivo
        )
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error moving lead to pool: %', SQLERRM;
END;
$$;
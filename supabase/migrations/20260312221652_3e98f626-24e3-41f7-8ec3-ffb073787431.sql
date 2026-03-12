-- Fix 1: Reactivate RPC - use fecha_entrada_pool IS NOT NULL instead of estado check
CREATE OR REPLACE FUNCTION public.reactivate_lead_from_pool(
    p_lead_id UUID,
    p_nuevo_estado TEXT DEFAULT 'aprobado'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    lead_zona_id UUID;
    rows_affected INT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Get lead zone info
    SELECT zona_preferida_id INTO lead_zona_id
    FROM leads
    WHERE id = p_lead_id;
    
    -- Update lead status from pool - use fecha_entrada_pool instead of estado check
    UPDATE leads 
    SET 
        estado = p_nuevo_estado,
        fecha_entrada_pool = NULL,
        motivo_pool = NULL,
        updated_at = now()
    WHERE id = p_lead_id 
      AND fecha_entrada_pool IS NOT NULL;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    IF rows_affected = 0 THEN
        RAISE EXCEPTION 'Lead % no está en el pool de reserva', p_lead_id;
    END IF;
    
    -- Log the reactivation
    INSERT INTO pool_reserva_movements (
        lead_id,
        zona_id,
        movimiento_tipo,
        motivo,
        fecha_salida,
        reactivado_por,
        created_by
    ) VALUES (
        p_lead_id,
        lead_zona_id,
        'reactivacion',
        'Reactivado desde pool de reserva',
        now(),
        current_user_id,
        current_user_id
    );
    
    RETURN true;
END;
$$;

-- Fix 2: Unify move_lead_to_pool - drop all versions and create single consistent one
-- First drop existing overloads
DROP FUNCTION IF EXISTS public.move_lead_to_pool(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.move_lead_to_pool(UUID, UUID, TEXT);

-- Create single unified version
CREATE OR REPLACE FUNCTION public.move_lead_to_pool(
    p_lead_id UUID,
    p_estado_id TEXT,
    p_motivo TEXT DEFAULT 'Zona saturada'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lead_exists BOOLEAN := FALSE;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM leads WHERE id = p_lead_id
    ) INTO lead_exists;
    
    IF NOT lead_exists THEN
        RAISE EXCEPTION 'Lead no encontrado: %', p_lead_id;
    END IF;
    
    -- Always set estado to aprobado_en_espera for pool candidates
    UPDATE leads 
    SET 
        estado = 'aprobado_en_espera',
        fecha_entrada_pool = NOW(),
        motivo_pool = p_estado_id || ': ' || p_motivo,
        updated_at = NOW()
    WHERE id = p_lead_id;
    
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
        'entrada',
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
END;
$$;
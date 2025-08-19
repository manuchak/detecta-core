-- Fix security warnings: Set search_path for functions
-- This addresses the function search path mutable warnings

-- Fix check_zone_capacity function
CREATE OR REPLACE FUNCTION public.check_zone_capacity(p_zona_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    capacity_info RECORD;
    result JSONB;
BEGIN
    -- Get zone capacity information
    SELECT 
        capacidad_maxima,
        capacidad_actual,
        umbral_saturacion,
        activo
    INTO capacity_info
    FROM zona_capacity_management
    WHERE zona_id = p_zona_id;
    
    -- If no capacity record exists, create default one
    IF NOT FOUND THEN
        INSERT INTO zona_capacity_management (zona_id, capacidad_maxima, capacidad_actual, umbral_saturacion)
        VALUES (p_zona_id, 10, 0, 8)
        RETURNING capacidad_maxima, capacidad_actual, umbral_saturacion, activo INTO capacity_info;
    END IF;
    
    result := jsonb_build_object(
        'zona_saturada', capacity_info.capacidad_actual >= capacity_info.umbral_saturacion,
        'capacidad_maxima', capacity_info.capacidad_maxima,
        'capacidad_actual', capacity_info.capacidad_actual,
        'umbral_saturacion', capacity_info.umbral_saturacion,
        'espacios_disponibles', capacity_info.capacidad_maxima - capacity_info.capacidad_actual,
        'activo', capacity_info.activo
    );
    
    RETURN result;
END;
$$;

-- Fix move_lead_to_pool function
CREATE OR REPLACE FUNCTION public.move_lead_to_pool(
    p_lead_id TEXT,
    p_zona_id UUID,
    p_motivo TEXT DEFAULT 'Zona saturada'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Update lead status to pool
    UPDATE leads 
    SET 
        estado = 'aprobado_en_espera',
        zona_preferida_id = p_zona_id,
        fecha_entrada_pool = now(),
        motivo_pool = p_motivo,
        updated_at = now()
    WHERE id = p_lead_id;
    
    -- Log the movement
    INSERT INTO pool_reserva_movements (
        lead_id,
        zona_id,
        movimiento_tipo,
        motivo,
        fecha_entrada,
        created_by
    ) VALUES (
        p_lead_id,
        p_zona_id,
        'entrada',
        p_motivo,
        now(),
        current_user_id
    );
    
    RETURN true;
END;
$$;

-- Fix reactivate_lead_from_pool function
CREATE OR REPLACE FUNCTION public.reactivate_lead_from_pool(
    p_lead_id TEXT,
    p_nuevo_estado TEXT DEFAULT 'aprobado'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
    lead_zona_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Get lead zone info
    SELECT zona_preferida_id INTO lead_zona_id
    FROM leads
    WHERE id = p_lead_id;
    
    -- Update lead status from pool
    UPDATE leads 
    SET 
        estado = p_nuevo_estado,
        fecha_entrada_pool = null,
        motivo_pool = null,
        updated_at = now()
    WHERE id = p_lead_id AND estado = 'aprobado_en_espera';
    
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
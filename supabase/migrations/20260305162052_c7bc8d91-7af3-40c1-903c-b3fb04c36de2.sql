
-- Drop the existing v2 function (uuid signature)
DROP FUNCTION IF EXISTS public.move_lead_to_pool_v2(text, uuid, text, boolean);

-- Recreate v2 with p_estado_id text (matching frontend calls)
CREATE OR REPLACE FUNCTION public.move_lead_to_pool_v2(
  p_lead_id text,
  p_estado_id text,
  p_motivo text DEFAULT 'Zona saturada',
  p_is_test boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_is_test boolean;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  -- Validate lead exists and belongs to correct environment
  SELECT is_test INTO lead_is_test
  FROM leads
  WHERE id = p_lead_id;

  IF lead_is_test IS NULL THEN
    RAISE EXCEPTION 'Lead no encontrado: %', p_lead_id;
  END IF;

  IF lead_is_test != p_is_test THEN
    RAISE EXCEPTION 'Intento de mover lead de % desde ambiente %',
      CASE WHEN lead_is_test THEN 'SANDBOX' ELSE 'PRODUCCIÓN' END,
      CASE WHEN p_is_test THEN 'SANDBOX' ELSE 'PRODUCCIÓN' END;
  END IF;

  -- Update lead to pool status
  UPDATE leads 
  SET 
    estado = 'aprobado',
    fecha_entrada_pool = now(),
    motivo_pool = p_estado_id || ': ' || p_motivo,
    updated_at = now()
  WHERE id = p_lead_id
    AND is_test = p_is_test;

  -- Log the movement
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
    now(),
    now(),
    current_user_id,
    jsonb_build_object(
      'estado_ubicacion', p_estado_id,
      'motivo_detalle', p_motivo
    )
  );

  RETURN true;
END;
$$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Phase 1: Pool de Reserva - Database Extensions
-- Add new lead state for approved candidates in waiting pool

-- First, add the new state to the leads table enum type
-- Note: We need to check if the enum type exists and add the new value
DO $$ 
BEGIN
  -- Add new enum value for aprobado_en_espera if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'aprobado_en_espera' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_estado')
  ) THEN
    ALTER TYPE lead_estado ADD VALUE 'aprobado_en_espera';
  END IF;
END $$;

-- Create zona capacity management table
CREATE TABLE IF NOT EXISTS public.zona_capacity_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zona_id UUID NOT NULL REFERENCES public.zonas_operacion_nacional(id) ON DELETE CASCADE,
    capacidad_maxima INTEGER NOT NULL DEFAULT 10,
    capacidad_actual INTEGER NOT NULL DEFAULT 0,
    umbral_saturacion INTEGER NOT NULL DEFAULT 8, -- When to start using pool
    configuracion JSONB DEFAULT '{}',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(zona_id)
);

-- Create pool reserva movements audit table
CREATE TABLE IF NOT EXISTS public.pool_reserva_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    zona_id UUID REFERENCES public.zonas_operacion_nacional(id),
    movimiento_tipo TEXT NOT NULL CHECK (movimiento_tipo IN ('entrada', 'salida', 'reactivacion', 'expiracion')),
    motivo TEXT NOT NULL,
    fecha_entrada TIMESTAMP WITH TIME ZONE,
    fecha_salida TIMESTAMP WITH TIME ZONE,
    reactivado_por UUID REFERENCES auth.users(id),
    notas TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Add zone information to leads table if it doesn't exist
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS zona_preferida_id UUID REFERENCES public.zonas_operacion_nacional(id),
ADD COLUMN IF NOT EXISTS fecha_entrada_pool TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS motivo_pool TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zona_capacity_zona_id ON public.zona_capacity_management(zona_id);
CREATE INDEX IF NOT EXISTS idx_pool_movements_lead_id ON public.pool_reserva_movements(lead_id);
CREATE INDEX IF NOT EXISTS idx_pool_movements_zona_id ON public.pool_reserva_movements(zona_id);
CREATE INDEX IF NOT EXISTS idx_leads_zona_preferida ON public.leads(zona_preferida_id);
CREATE INDEX IF NOT EXISTS idx_leads_estado_pool ON public.leads(estado) WHERE estado = 'aprobado_en_espera';

-- Enable RLS on new tables
ALTER TABLE public.zona_capacity_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_reserva_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for zona_capacity_management
CREATE POLICY "zona_capacity_read_authorized" ON public.zona_capacity_management
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        check_admin_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('coordinador_operaciones') OR
        user_has_role_direct('ejecutivo_ventas') OR
        user_has_role_direct('supply_lead')
    )
);

CREATE POLICY "zona_capacity_manage_authorized" ON public.zona_capacity_management
FOR ALL USING (
    check_admin_secure() OR 
    user_has_role_direct('supply_admin') OR 
    user_has_role_direct('coordinador_operaciones')
)
WITH CHECK (
    check_admin_secure() OR 
    user_has_role_direct('supply_admin') OR 
    user_has_role_direct('coordinador_operaciones')
);

-- RLS policies for pool_reserva_movements
CREATE POLICY "pool_movements_read_authorized" ON public.pool_reserva_movements
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        check_admin_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('coordinador_operaciones') OR
        user_has_role_direct('ejecutivo_ventas') OR
        user_has_role_direct('supply_lead')
    )
);

CREATE POLICY "pool_movements_manage_authorized" ON public.pool_reserva_movements
FOR ALL USING (
    check_admin_secure() OR 
    user_has_role_direct('supply_admin') OR 
    user_has_role_direct('coordinador_operaciones') OR
    user_has_role_direct('ejecutivo_ventas') OR
    user_has_role_direct('supply_lead')
)
WITH CHECK (
    check_admin_secure() OR 
    user_has_role_direct('supply_admin') OR 
    user_has_role_direct('coordinador_operaciones') OR
    user_has_role_direct('ejecutivo_ventas') OR
    user_has_role_direct('supply_lead')
);

-- Function to check zone capacity and determine if lead should go to pool
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

-- Function to move lead to pool
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

-- Function to reactivate lead from pool
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
        estado = p_nuevo_estado::lead_estado,
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

-- Update the existing RPC function to include pool candidates
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads()
RETURNS TABLE(
  lead_id text,
  lead_nombre text,
  lead_email text,
  lead_telefono text,
  lead_estado text,
  lead_fecha_creacion timestamp with time zone,
  approval_stage text,
  phone_interview_completed boolean,
  second_interview_required boolean,
  final_decision text,
  notas text,
  zona_preferida_id uuid,
  zona_nombre text,
  fecha_entrada_pool timestamp with time zone,
  motivo_pool text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  RETURN QUERY
  SELECT 
    l.id as lead_id,
    l.nombre as lead_nombre,
    l.email as lead_email,
    l.telefono as lead_telefono,
    l.estado as lead_estado,
    l.fecha_creacion as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview') as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    l.notas as notas,
    l.zona_preferida_id,
    z.nombre as zona_nombre,
    l.fecha_entrada_pool,
    l.motivo_pool
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.zonas_operacion_nacional z ON l.zona_preferida_id = z.id
  WHERE l.asignado_a = current_user_id
    OR (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = current_user_id 
        AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin', 'supply_lead')
      )
      AND l.asignado_a IS NOT NULL
    )
  ORDER BY 
    CASE l.estado 
      WHEN 'aprobado_en_espera' THEN 1 
      ELSE 0 
    END,
    l.fecha_creacion DESC;
END;
$$;
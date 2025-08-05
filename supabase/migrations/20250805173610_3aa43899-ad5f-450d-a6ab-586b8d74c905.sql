-- CRITICAL SECURITY FIX: Remove Security Definer View
-- Fix the security definer view vista_instalaciones_dashboard

-- First, let's check if the view exists and get its definition
-- Then recreate it without SECURITY DEFINER

-- Drop the existing security definer view
DROP VIEW IF EXISTS public.vista_instalaciones_dashboard;

-- If we need a view for installations dashboard, create it as a regular view
-- Users will need proper permissions to access the underlying tables
CREATE OR REPLACE VIEW public.vista_instalaciones_dashboard AS
SELECT 
    pi.id,
    pi.fecha_programada,
    pi.estado,
    pi.tipo_instalacion,
    pi.cliente_nombre,
    pi.cliente_telefono,
    pi.vehiculo_info,
    pi.direccion_instalacion,
    pi.instalador_asignado_id,
    pi.observaciones,
    pi.created_at,
    pi.updated_at,
    -- Join with profiles to get installer name safely
    p.display_name as instalador_nombre
FROM programacion_instalaciones pi
LEFT JOIN profiles p ON pi.instalador_asignado_id = p.id
WHERE pi.activo = true;

-- Add comment explaining the security change
COMMENT ON VIEW public.vista_instalaciones_dashboard IS 
'Dashboard view for installations. Converted from SECURITY DEFINER to regular view for security compliance. Users need appropriate RLS permissions on underlying tables.';

-- Ensure proper RLS is in place for the underlying table if it exists
-- This will be enforced through the base table policies
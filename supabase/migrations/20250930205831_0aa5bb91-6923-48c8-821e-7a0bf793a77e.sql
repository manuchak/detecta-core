-- Create audit table for matriz_precios_rutas
CREATE TABLE IF NOT EXISTS public.audit_matriz_precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.matriz_precios_rutas(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted')),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  previous_data JSONB,
  new_data JSONB NOT NULL,
  justification TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_matriz_precios ENABLE ROW LEVEL SECURITY;

-- Policy: Solo admins y coordinadores pueden ver auditoría
CREATE POLICY "audit_matriz_view_authorized"
ON public.audit_matriz_precios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
  )
);

-- Policy: Usuarios autorizados pueden insertar logs
CREATE POLICY "audit_matriz_insert_authorized"
ON public.audit_matriz_precios
FOR INSERT
WITH CHECK (
  performed_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

-- Create index for better performance
CREATE INDEX idx_audit_matriz_route_id ON public.audit_matriz_precios(route_id);
CREATE INDEX idx_audit_matriz_performed_by ON public.audit_matriz_precios(performed_by);
CREATE INDEX idx_audit_matriz_created_at ON public.audit_matriz_precios(created_at DESC);

-- Function to check daily route creation limit per user
CREATE OR REPLACE FUNCTION public.check_route_creation_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  daily_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO daily_count
  FROM public.audit_matriz_precios
  WHERE performed_by = p_user_id
    AND action_type = 'created'
    AND created_at >= CURRENT_DATE;
  
  -- Limit: 5 routes per day for planificador
  RETURN daily_count < 5;
END;
$$;

-- Update matriz_precios_rutas policies to allow planificador to insert
DROP POLICY IF EXISTS "matriz_precios_rutas_authenticated_read" ON public.matriz_precios_rutas;
DROP POLICY IF EXISTS "matriz_precios_admin_manage" ON public.matriz_precios_rutas;

CREATE POLICY "matriz_precios_rutas_authenticated_read"
ON public.matriz_precios_rutas
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "matriz_precios_rutas_insert_authorized"
ON public.matriz_precios_rutas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

CREATE POLICY "matriz_precios_rutas_update_admin"
ON public.matriz_precios_rutas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
  )
);

CREATE POLICY "matriz_precios_rutas_delete_admin"
ON public.matriz_precios_rutas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);
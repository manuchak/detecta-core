-- Actualizar función es_planificador para incluir coordinador_operaciones y supply_admin
-- Esto permite que estos roles puedan crear y actualizar clientes en pc_clientes

CREATE OR REPLACE FUNCTION public.es_planificador()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'planificador', 'coordinador_operaciones', 'supply_admin')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
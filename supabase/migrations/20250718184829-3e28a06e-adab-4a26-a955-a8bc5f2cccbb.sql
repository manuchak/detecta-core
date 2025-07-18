-- Habilitar RLS en la tabla metricas_reclutamiento si no está habilitado
ALTER TABLE public.metricas_reclutamiento ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso a usuarios autorizados
CREATE POLICY "Admins pueden gestionar métricas de reclutamiento"
ON public.metricas_reclutamiento
FOR ALL
TO authenticated
USING (can_access_recruitment_data())
WITH CHECK (can_access_recruitment_data());
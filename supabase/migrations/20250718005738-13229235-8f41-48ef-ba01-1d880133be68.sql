-- Crear tabla para almacenar resultados de evaluaciones SIERCP
CREATE TABLE public.siercp_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scores jsonb NOT NULL,
  percentiles jsonb NOT NULL,
  clinical_interpretation text,
  risk_flags text[],
  global_score numeric NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- Un usuario solo puede tener un resultado
);

-- Habilitar RLS
ALTER TABLE public.siercp_results ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver todos los resultados
CREATE POLICY "Admins can view all SIERCP results"
ON public.siercp_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

-- Usuarios pueden ver solo su propio resultado
CREATE POLICY "Users can view their own SIERCP result"
ON public.siercp_results
FOR SELECT
USING (auth.uid() = user_id);

-- Solo usuarios autenticados pueden insertar su resultado
CREATE POLICY "Users can insert their own SIERCP result"
ON public.siercp_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Solo admins pueden actualizar resultados
CREATE POLICY "Admins can update SIERCP results"
ON public.siercp_results
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

-- Solo admins pueden eliminar resultados
CREATE POLICY "Admins can delete SIERCP results"
ON public.siercp_results
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);
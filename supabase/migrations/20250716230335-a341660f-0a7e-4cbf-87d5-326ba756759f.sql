-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear logs de llamadas" ON public.manual_call_logs;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver logs de llamadas" ON public.manual_call_logs;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar logs de llamadas" ON public.manual_call_logs;

-- Crear nuevas políticas más permisivas para logs de llamadas
CREATE POLICY "Permitir insertar logs de llamadas" 
ON public.manual_call_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir ver logs de llamadas" 
ON public.manual_call_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir actualizar logs de llamadas" 
ON public.manual_call_logs 
FOR UPDATE 
USING (true);

-- Agregar columna created_by si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manual_call_logs' AND column_name = 'created_by') THEN
        ALTER TABLE public.manual_call_logs ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;
-- Crear tabla para logs de llamadas manuales
CREATE TABLE public.manual_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  call_outcome TEXT NOT NULL,
  call_notes TEXT,
  scheduled_datetime TIMESTAMP WITH TIME ZONE,
  requires_reschedule BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.manual_call_logs ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan crear logs de llamadas
CREATE POLICY "Usuarios autenticados pueden crear logs de llamadas" 
ON public.manual_call_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Política para que usuarios autenticados puedan ver logs de llamadas
CREATE POLICY "Usuarios autenticados pueden ver logs de llamadas" 
ON public.manual_call_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Política para que usuarios autenticados puedan actualizar logs de llamadas
CREATE POLICY "Usuarios autenticados pueden actualizar logs de llamadas" 
ON public.manual_call_logs 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION public.update_manual_call_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar timestamp automáticamente
CREATE TRIGGER update_manual_call_logs_updated_at
  BEFORE UPDATE ON public.manual_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_manual_call_logs_updated_at();
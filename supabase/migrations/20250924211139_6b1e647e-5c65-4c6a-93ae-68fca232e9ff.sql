-- SPRINT 3: Create service modification log table for audit trail
CREATE TABLE public.service_modification_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  modified_by UUID REFERENCES auth.users(id),
  reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_service_modification_log_service_id ON public.service_modification_log(service_id);
CREATE INDEX idx_service_modification_log_timestamp ON public.service_modification_log(timestamp DESC);
CREATE INDEX idx_service_modification_log_modified_by ON public.service_modification_log(modified_by);

-- Enable RLS
ALTER TABLE public.service_modification_log ENABLE ROW LEVEL SECURITY;

-- Create policies for service modification log
CREATE POLICY "Authorized users can view service logs" 
ON public.service_modification_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

CREATE POLICY "Authorized users can create service logs" 
ON public.service_modification_log 
FOR INSERT 
WITH CHECK (
  modified_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

-- Only admins can delete logs for data integrity
CREATE POLICY "Only admins can delete service logs" 
ON public.service_modification_log 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);
-- Create servicios_planificados table for planning phase
CREATE TABLE public.servicios_planificados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_servicio TEXT UNIQUE NOT NULL,
  
  -- Cliente information
  nombre_cliente TEXT NOT NULL,
  empresa_cliente TEXT,
  email_cliente TEXT,
  telefono_cliente TEXT,
  
  -- Service details
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  fecha_hora_cita TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo_servicio TEXT DEFAULT 'custodia',
  
  -- Planning specific fields
  estado_planeacion TEXT NOT NULL DEFAULT 'planificado',
  prioridad INTEGER DEFAULT 5,
  
  -- Custodian assignment
  custodio_asignado TEXT,
  custodio_id UUID,
  fecha_asignacion TIMESTAMP WITH TIME ZONE,
  asignado_por UUID,
  
  -- Armed guard requirements
  requiere_armado BOOLEAN DEFAULT false,
  armado_asignado TEXT,
  armado_id UUID,
  fecha_asignacion_armado TIMESTAMP WITH TIME ZONE,
  
  -- Vehicle and logistics
  auto TEXT,
  placa TEXT,
  num_vehiculos INTEGER DEFAULT 1,
  
  -- Financial
  tarifa_acordada NUMERIC,
  moneda TEXT DEFAULT 'MXN',
  
  -- Communication tracking
  comunicacion_enviada BOOLEAN DEFAULT false,
  fecha_comunicacion TIMESTAMP WITH TIME ZONE,
  metodo_comunicacion TEXT,
  respuesta_custodio TEXT,
  fecha_respuesta TIMESTAMP WITH TIME ZONE,
  
  -- Additional details
  observaciones TEXT,
  comentarios_adicionales TEXT,
  condiciones_especiales TEXT[],
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID DEFAULT auth.uid(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.servicios_planificados ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view planned services" 
ON public.servicios_planificados 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can create planned services" 
ON public.servicios_planificados 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

CREATE POLICY "Authorized users can update planned services" 
ON public.servicios_planificados 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

CREATE POLICY "Admins can delete planned services" 
ON public.servicios_planificados 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Create indexes for performance
CREATE INDEX idx_servicios_planificados_estado ON public.servicios_planificados(estado_planeacion);
CREATE INDEX idx_servicios_planificados_fecha ON public.servicios_planificados(fecha_hora_cita);
CREATE INDEX idx_servicios_planificados_custodio ON public.servicios_planificados(custodio_asignado);
CREATE INDEX idx_servicios_planificados_cliente ON public.servicios_planificados(nombre_cliente);
CREATE INDEX idx_servicios_planificados_id_servicio ON public.servicios_planificados(id_servicio);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_servicios_planificados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_servicios_planificados_updated_at
  BEFORE UPDATE ON public.servicios_planificados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_servicios_planificados_updated_at();

-- Create function to get planned services summary
CREATE OR REPLACE FUNCTION public.get_planned_services_summary(date_filter date)
RETURNS TABLE(
  total_services integer,
  assigned_services integer, 
  pending_services integer,
  confirmed_services integer,
  services_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_services AS (
    SELECT 
      sp.id_servicio,
      sp.nombre_cliente as cliente_nombre,
      sp.origen,
      sp.destino,
      sp.fecha_hora_cita,
      sp.custodio_asignado as custodio_nombre,
      sp.estado_planeacion as estado,
      sp.requiere_armado as incluye_armado,
      CASE WHEN sp.armado_asignado IS NOT NULL THEN true ELSE false END as armado_asignado,
      CASE
        WHEN sp.custodio_asignado IS NOT NULL AND sp.custodio_asignado != '' THEN 'asignado'
        ELSE 'pendiente'
      END as estado_asignacion,
      sp.auto,
      sp.placa
    FROM servicios_planificados sp
    WHERE DATE(sp.fecha_hora_cita) = date_filter
      AND sp.estado_planeacion NOT IN ('cancelado', 'completado')
  ),
  summary_stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COUNT(*) FILTER (WHERE estado_asignacion = 'asignado')::integer as assigned,
      COUNT(*) FILTER (WHERE estado_asignacion = 'pendiente')::integer as pending,
      COUNT(*) FILTER (WHERE estado = 'confirmado')::integer as confirmed
    FROM filtered_services
  ),
  services_array AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id_servicio,
        'cliente_nombre', cliente_nombre,
        'origen', origen,
        'destino', destino,
        'fecha_hora_cita', fecha_hora_cita,
        'custodio_nombre', custodio_nombre,
        'estado', estado,
        'incluye_armado', incluye_armado,
        'armado_asignado', armado_asignado,
        'estado_asignacion', estado_asignacion,
        'auto', auto,
        'placa', placa
      )
    ) as services_json
    FROM filtered_services
  )
  SELECT 
    ss.total as total_services,
    ss.assigned as assigned_services,
    ss.pending as pending_services,
    ss.confirmed as confirmed_services,
    COALESCE(sa.services_json, '[]'::jsonb) as services_data
  FROM summary_stats ss
  CROSS JOIN services_array sa;
END;
$$;
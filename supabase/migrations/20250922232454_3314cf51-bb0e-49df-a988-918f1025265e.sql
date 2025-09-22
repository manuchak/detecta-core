-- Create table for custodian vehicles (one-to-many relationship)
CREATE TABLE public.custodios_vehiculos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    custodio_id uuid NOT NULL,
    marca text NOT NULL,
    modelo text NOT NULL,
    año integer,
    color text,
    placa text NOT NULL,
    numero_serie text,
    es_principal boolean NOT NULL DEFAULT false,
    estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'mantenimiento')),
    observaciones text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(custodio_id, placa)
);

-- Create table for assignment audit log
CREATE TABLE public.assignment_audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid,
    service_id text,
    custodio_id uuid,
    armado_id uuid,
    proveedor_id uuid,
    action_type text NOT NULL CHECK (action_type IN ('created', 'updated', 'cancelled', 'confirmed', 'rejected')),
    performed_by uuid NOT NULL,
    previous_data jsonb,
    new_data jsonb,
    changes_summary text,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.custodios_vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custodios_vehiculos
CREATE POLICY "custodios_vehiculos_select_authorized" 
ON public.custodios_vehiculos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

CREATE POLICY "custodios_vehiculos_manage_authorized" 
ON public.custodios_vehiculos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
  )
);

-- Create RLS policies for assignment_audit_log
CREATE POLICY "assignment_audit_log_select_admin" 
ON public.assignment_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

CREATE POLICY "assignment_audit_log_insert_authorized" 
ON public.assignment_audit_log 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  ) AND performed_by = auth.uid()
);

-- Create triggers for updated_at on custodios_vehiculos
CREATE OR REPLACE FUNCTION public.update_custodios_vehiculos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_custodios_vehiculos_updated_at
  BEFORE UPDATE ON public.custodios_vehiculos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custodios_vehiculos_updated_at();

-- Create function to get scheduled services summary
CREATE OR REPLACE FUNCTION public.get_scheduled_services_summary(
  date_filter date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_services integer,
  assigned_services integer,
  pending_services integer,
  confirmed_services integer,
  services_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  WITH service_counts AS (
    SELECT 
      COUNT(*)::integer as total,
      COUNT(CASE WHEN aa.estado_asignacion IS NOT NULL THEN 1 END)::integer as assigned,
      COUNT(CASE WHEN aa.estado_asignacion IS NULL THEN 1 END)::integer as pending,
      COUNT(CASE WHEN aa.estado_asignacion = 'confirmado' THEN 1 END)::integer as confirmed,
      jsonb_agg(
        jsonb_build_object(
          'id', sc.id,
          'cliente_nombre', sc.nombre_cliente,
          'origen', sc.origen,
          'destino', sc.destino,
          'fecha_hora_cita', sc.fecha_hora_cita,
          'custodio_nombre', sc.nombre_custodio,
          'estado', sc.estado,
          'incluye_armado', COALESCE(sc.incluye_armado, false),
          'armado_asignado', aa.armado_id IS NOT NULL,
          'estado_asignacion', aa.estado_asignacion,
          'auto', sc.auto,
          'placa', sc.placa
        )
      ) as services_json
    FROM servicios_custodia sc
    LEFT JOIN asignacion_armados aa ON sc.id_servicio = aa.servicio_custodia_id
    WHERE DATE(sc.fecha_hora_cita) = date_filter
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
  )
  SELECT 
    sc.total,
    sc.assigned,
    sc.pending,
    sc.confirmed,
    sc.services_json
  FROM service_counts sc;
END;
$function$;
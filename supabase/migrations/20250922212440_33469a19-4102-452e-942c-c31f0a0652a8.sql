-- Enable RLS on tables that don't have it
ALTER TABLE public.armados_operativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores_armados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armados_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armados_indisponibilidades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for armados_operativos
CREATE POLICY "armados_operativos_select_authorized" ON public.armados_operativos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "armados_operativos_insert_authorized" ON public.armados_operativos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
    )
  );

CREATE POLICY "armados_operativos_update_authorized" ON public.armados_operativos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
    )
  );

-- Create RLS policies for proveedores_armados
CREATE POLICY "proveedores_armados_select_authorized" ON public.proveedores_armados
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "proveedores_armados_insert_authorized" ON public.proveedores_armados
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
    )
  );

CREATE POLICY "proveedores_armados_update_authorized" ON public.proveedores_armados
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
    )
  );

-- Create RLS policies for armados_performance_metrics (read-only for most users)
CREATE POLICY "armados_performance_select_authorized" ON public.armados_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "armados_performance_modify_admin" ON public.armados_performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Create RLS policies for armados_indisponibilidades
CREATE POLICY "armados_indisponibilidades_select_authorized" ON public.armados_indisponibilidades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "armados_indisponibilidades_modify_authorized" ON public.armados_indisponibilidades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
    )
  );

-- Remove materialized view from API exposure by creating a function instead
CREATE OR REPLACE FUNCTION public.get_custodios_activos_disponibles()
RETURNS TABLE (
  id uuid,
  nombre text,
  telefono text,
  zona_base text,
  disponibilidad text,
  estado text,
  experiencia_seguridad boolean,
  vehiculo_propio boolean,
  numero_servicios integer,
  rating_promedio numeric,
  tasa_aceptacion numeric,
  tasa_respuesta numeric,
  tasa_confiabilidad numeric,
  score_comunicacion numeric,
  score_aceptacion numeric,
  score_confiabilidad numeric,
  score_total numeric,
  fuente text,
  fecha_ultimo_servicio timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow authorized roles to access custodian data
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  ) THEN
    RAISE EXCEPTION 'Sin permisos para acceder a datos de custodios';
  END IF;

  RETURN QUERY
  SELECT 
    co.id,
    co.nombre,
    co.telefono,
    co.zona_base,
    co.disponibilidad,
    co.estado,
    co.experiencia_seguridad,
    co.vehiculo_propio,
    co.numero_servicios,
    co.rating_promedio,
    co.tasa_aceptacion,
    co.tasa_respuesta,
    co.tasa_confiabilidad,
    co.score_comunicacion,
    co.score_aceptacion,
    co.score_confiabilidad,
    co.score_total,
    co.fuente,
    co.fecha_ultimo_servicio,
    co.created_at,
    co.updated_at
  FROM public.custodios_operativos co
  WHERE co.estado = 'activo'
    AND co.disponibilidad = 'disponible'
    AND (
      -- Include non-migrated custodians (truly new)
      co.fuente != 'migracion_historico'
      OR 
      -- Include migrated custodians with recent activity (last 90 days)
      public.custodio_tiene_actividad_reciente(co.nombre)
    );
END;
$$;
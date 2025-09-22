-- Crear tabla de configuración operacional
CREATE TABLE IF NOT EXISTS public.planning_operational_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  velocidad_promedio_kmh numeric NOT NULL DEFAULT 70,
  tiempo_descanso_minutos integer NOT NULL DEFAULT 120,
  bloqueo_automatico_habilitado boolean NOT NULL DEFAULT true,
  zona_id uuid REFERENCES public.zonas_trabajo(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear configuración global por defecto
INSERT INTO public.planning_operational_config (
  velocidad_promedio_kmh,
  tiempo_descanso_minutos,
  bloqueo_automatico_habilitado,
  zona_id
) VALUES (70, 120, true, null)
ON CONFLICT DO NOTHING;

-- Función para calcular hora de finalización estimada del servicio
CREATE OR REPLACE FUNCTION public.calcular_hora_fin_estimada_servicio(
  p_km_teoricos numeric,
  p_fecha_hora_inicio timestamp with time zone,
  p_zona_id uuid DEFAULT null
)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  config_record RECORD;
  duracion_horas numeric;
BEGIN
  -- Obtener configuración (por zona o global)
  SELECT 
    velocidad_promedio_kmh,
    tiempo_descanso_minutos
  INTO config_record
  FROM public.planning_operational_config
  WHERE zona_id = p_zona_id OR (zona_id IS NULL AND p_zona_id IS NULL)
  ORDER BY zona_id NULLS LAST
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Valores por defecto si no hay configuración
    config_record.velocidad_promedio_kmh := 70;
    config_record.tiempo_descanso_minutos := 120;
  END IF;
  
  -- Calcular duración del servicio en horas
  duracion_horas := p_km_teoricos / config_record.velocidad_promedio_kmh;
  
  -- Retornar hora de inicio + duración + tiempo de descanso
  RETURN p_fecha_hora_inicio + 
         (duracion_horas * INTERVAL '1 hour') + 
         (config_record.tiempo_descanso_minutos * INTERVAL '1 minute');
END;
$$;

-- Función para verificar disponibilidad de custodio considerando servicios activos
CREATE OR REPLACE FUNCTION public.verificar_disponibilidad_custodio(
  p_custodio_id uuid,
  p_fecha_hora_inicio timestamp with time zone,
  p_km_teoricos numeric DEFAULT 0,
  p_zona_id uuid DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  config_record RECORD;
  servicio_conflicto RECORD;
  hora_fin_estimada timestamp with time zone;
  resultado jsonb;
BEGIN
  -- Verificar si el bloqueo automático está habilitado
  SELECT bloqueo_automatico_habilitado INTO config_record
  FROM public.planning_operational_config
  WHERE zona_id = p_zona_id OR (zona_id IS NULL AND p_zona_id IS NULL)
  ORDER BY zona_id NULLS LAST
  LIMIT 1;
  
  -- Si no hay configuración o está deshabilitado, permitir asignación
  IF NOT FOUND OR NOT config_record.bloqueo_automatico_habilitado THEN
    RETURN jsonb_build_object(
      'disponible', true,
      'razon', 'Bloqueo automático deshabilitado'
    );
  END IF;
  
  -- Verificar indisponibilidades manuales
  IF EXISTS (
    SELECT 1 FROM public.custodio_indisponibilidades ci
    JOIN public.custodios_operativos co ON ci.custodio_id = co.id
    WHERE co.id = p_custodio_id
      AND ci.activo = true
      AND ci.fecha_inicio <= p_fecha_hora_inicio::date
      AND (ci.fecha_fin IS NULL OR ci.fecha_fin >= p_fecha_hora_inicio::date)
  ) THEN
    RETURN jsonb_build_object(
      'disponible', false,
      'razon', 'Custodio tiene indisponibilidad manual registrada'
    );
  END IF;
  
  -- Buscar servicios que generen conflicto temporal
  SELECT 
    sc.id_servicio,
    sc.fecha_hora_cita,
    sc.km_teoricos,
    public.calcular_hora_fin_estimada_servicio(
      COALESCE(sc.km_teoricos, 0), 
      sc.fecha_hora_cita, 
      p_zona_id
    ) as hora_fin_estimada_conflicto
  INTO servicio_conflicto
  FROM public.servicios_custodia sc
  JOIN public.custodios_operativos co ON sc.nombre_custodio = co.nombre
  WHERE co.id = p_custodio_id
    AND sc.estado IN ('asignado', 'en_curso')
    AND (
      -- El nuevo servicio comienza antes de que termine el existente
      p_fecha_hora_inicio < public.calcular_hora_fin_estimada_servicio(
        COALESCE(sc.km_teoricos, 0), 
        sc.fecha_hora_cita, 
        p_zona_id
      )
      OR
      -- El servicio existente comienza antes de que termine el nuevo
      sc.fecha_hora_cita < public.calcular_hora_fin_estimada_servicio(
        p_km_teoricos, 
        p_fecha_hora_inicio, 
        p_zona_id
      )
    )
  ORDER BY sc.fecha_hora_cita DESC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'disponible', false,
      'razon', 'Conflicto con servicio existente',
      'servicio_conflicto', servicio_conflicto.id_servicio,
      'proxima_disponibilidad', servicio_conflicto.hora_fin_estimada_conflicto
    );
  END IF;
  
  -- Si no hay conflictos, el custodio está disponible
  RETURN jsonb_build_object(
    'disponible', true,
    'razon', 'Sin conflictos detectados'
  );
END;
$$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_planning_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_planning_operational_config_updated_at
  BEFORE UPDATE ON public.planning_operational_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_planning_config_updated_at();

-- RLS policies
ALTER TABLE public.planning_operational_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planning_config_select_authorized" ON public.planning_operational_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "planning_config_modify_authorized" ON public.planning_operational_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
    )
  );
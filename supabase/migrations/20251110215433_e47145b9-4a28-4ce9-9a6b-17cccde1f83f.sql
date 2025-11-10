
-- ============================================
-- MEJORA DE ESTABILIDAD - PARTE 2 (SIN VACUUM)
-- ============================================
-- NOTA: VACUUM no puede ejecutarse en migraciones (requiere fuera de transacción)
-- El VACUUM debe ejecutarse manualmente después de esta migración

-- PASO 1: Configurar autovacuum más agresivo para tablas críticas
ALTER TABLE public.leads SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 25,
  autovacuum_vacuum_cost_delay = 10
);

ALTER TABLE public.user_roles SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 10
);

-- PASO 2: Crear tabla de rate limiting para edge functions
CREATE TABLE IF NOT EXISTS public.edge_function_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para queries de rate limiting (últimas 24h)
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_function_timestamp 
ON public.edge_function_rate_limits(user_id, function_name, timestamp DESC);

-- Índice adicional para cleanup automático
CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp 
ON public.edge_function_rate_limits(timestamp DESC);

-- Habilitar RLS
ALTER TABLE public.edge_function_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Solo admins pueden ver logs de rate limiting
CREATE POLICY "admins_can_view_rate_limits"
ON public.edge_function_rate_limits
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

-- Policy: Sistema puede insertar rate limit logs
CREATE POLICY "service_role_can_insert_rate_limits"
ON public.edge_function_rate_limits
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Usuarios pueden insertar sus propios rate limits
CREATE POLICY "users_can_insert_own_rate_limits"
ON public.edge_function_rate_limits
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- PASO 3: Función RPC para verificar rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_function_name TEXT,
  p_action_type TEXT,
  p_limit_count INTEGER DEFAULT 5,
  p_window_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  action_count INTEGER;
  window_start TIMESTAMPTZ;
  result JSONB;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Usuario no autenticado',
      'current_count', 0,
      'limit', p_limit_count
    );
  END IF;
  
  window_start := now() - (p_window_hours || ' hours')::interval;
  
  -- Contar acciones en la ventana de tiempo
  SELECT COUNT(*) INTO action_count
  FROM public.edge_function_rate_limits
  WHERE user_id = current_user_id
    AND function_name = p_function_name
    AND action_type = p_action_type
    AND timestamp >= window_start;
  
  -- Verificar si excede el límite
  IF action_count >= p_limit_count THEN
    result := jsonb_build_object(
      'allowed', false,
      'reason', format('Límite excedido: %s/%s acciones en %sh', action_count, p_limit_count, p_window_hours),
      'current_count', action_count,
      'limit', p_limit_count,
      'window_hours', p_window_hours,
      'retry_after_seconds', EXTRACT(EPOCH FROM (
        (SELECT MIN(timestamp) + (p_window_hours || ' hours')::interval 
         FROM public.edge_function_rate_limits
         WHERE user_id = current_user_id
           AND function_name = p_function_name
           AND action_type = p_action_type
           AND timestamp >= window_start) - now()
      ))
    );
  ELSE
    -- Registrar esta acción
    INSERT INTO public.edge_function_rate_limits (user_id, function_name, action_type)
    VALUES (current_user_id, p_function_name, p_action_type);
    
    result := jsonb_build_object(
      'allowed', true,
      'current_count', action_count + 1,
      'limit', p_limit_count,
      'remaining', p_limit_count - action_count - 1,
      'window_hours', p_window_hours
    );
  END IF;
  
  RETURN result;
END;
$$;

-- PASO 4: Función para limpiar rate limits antiguos (retener solo 7 días)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.edge_function_rate_limits
  WHERE timestamp < now() - interval '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- PASO 5: Comentarios de documentación
COMMENT ON TABLE public.edge_function_rate_limits IS 
'Tabla para control de rate limiting de Edge Functions. 
Registra intentos de uso para prevenir abuso.
Limpieza automática: retiene solo últimos 7 días mediante cleanup_old_rate_limits().';

COMMENT ON FUNCTION public.check_rate_limit IS
'Verifica si un usuario puede ejecutar una acción en una edge function.
Parámetros:
- p_function_name: Nombre de la función (ej: "create-readonly-access")
- p_action_type: Tipo de acción (ej: "create_service")
- p_limit_count: Número máximo de acciones permitidas (default: 5)
- p_window_hours: Ventana de tiempo en horas (default: 24)

Retorna JSONB con:
- allowed: boolean indicando si se permite la acción
- current_count: número actual de acciones
- limit: límite configurado
- remaining: acciones restantes (si allowed=true)
- reason: razón de rechazo (si allowed=false)
- retry_after_seconds: segundos hasta que se libere un slot (si allowed=false)

Uso desde Edge Function:
const rateCheck = await supabase.rpc("check_rate_limit", {
  p_function_name: "my-function",
  p_action_type: "create",
  p_limit_count: 5,
  p_window_hours: 24
});

if (!rateCheck.data.allowed) {
  return new Response(JSON.stringify({ error: rateCheck.data.reason }), { status: 429 });
}';

COMMENT ON FUNCTION public.cleanup_old_rate_limits IS
'Elimina registros de rate limiting más antiguos que 7 días.
Retorna el número de registros eliminados.
Debe ejecutarse periódicamente (ej: cron job diario).';

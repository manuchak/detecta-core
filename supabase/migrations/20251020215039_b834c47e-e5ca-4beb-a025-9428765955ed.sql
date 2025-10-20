-- ===================================================================
-- TRIGGER AUTOMÁTICO PARA REFRESCAR VISTA MATERIALIZADA
-- ===================================================================
-- Solución para mantener sincronizada custodios_operativos_disponibles
-- con los datos de custodios_operativos

-- PASO 1: Crear índice único necesario para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS custodios_operativos_disponibles_id_idx 
ON public.custodios_operativos_disponibles (id);

-- PASO 2: Función que refresca la vista materializada de custodios disponibles
CREATE OR REPLACE FUNCTION public.refresh_custodios_disponibles_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Refrescar la vista materializada de forma concurrente
  -- CONCURRENTLY permite que la vista siga siendo consultada mientras se actualiza
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.custodios_operativos_disponibles;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Trigger para refrescar al insertar nuevos custodios
CREATE TRIGGER trigger_refresh_custodios_on_insert
AFTER INSERT ON public.custodios_operativos
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_custodios_disponibles_on_change();

-- PASO 4: Trigger para refrescar al actualizar custodios existentes
CREATE TRIGGER trigger_refresh_custodios_on_update
AFTER UPDATE ON public.custodios_operativos
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_custodios_disponibles_on_change();

-- Comentarios para documentación
COMMENT ON FUNCTION public.refresh_custodios_disponibles_on_change() IS 
'Función trigger que refresca automáticamente la vista materializada custodios_operativos_disponibles cuando hay cambios en custodios_operativos';

COMMENT ON TRIGGER trigger_refresh_custodios_on_insert ON public.custodios_operativos IS 
'Refresca automáticamente custodios_operativos_disponibles al insertar nuevos custodios';

COMMENT ON TRIGGER trigger_refresh_custodios_on_update ON public.custodios_operativos IS 
'Refresca automáticamente custodios_operativos_disponibles al actualizar custodios existentes';

-- PASO 5: Refrescar la vista materializada inmediatamente para sincronizar los 82 custodios
REFRESH MATERIALIZED VIEW CONCURRENTLY public.custodios_operativos_disponibles;
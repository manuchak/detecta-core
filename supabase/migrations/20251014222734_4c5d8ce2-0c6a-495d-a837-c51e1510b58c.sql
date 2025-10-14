-- Paso 1: Eliminar la versión antigua de update_approval_process (6 parámetros)
-- Esta versión causa ambigüedad con la nueva versión que incluye p_is_test

DROP FUNCTION IF EXISTS public.update_approval_process(
  text, 
  text, 
  text, 
  text, 
  text, 
  text
);

-- La versión nueva (7 parámetros con p_is_test) se mantiene intacta
-- Esta ya valida correctamente el ambiente (Sandbox vs Producción)
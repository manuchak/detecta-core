
-- Archivo: supabase/migrations/20250614191500-remove-workflow-triggers.sql
-- Descripción: Elimina los triggers y la función que causan conflictos con RLS
-- al actualizar el estado de los servicios. La lógica de actualización ya se
-- maneja en el frontend.

-- Eliminar el trigger de la tabla de aprobación del coordinador
DROP TRIGGER IF EXISTS trigger_actualizar_estado_aprobacion_coordinador ON public.aprobacion_coordinador;

-- Eliminar el trigger de la tabla de análisis de riesgo
DROP TRIGGER IF EXISTS trigger_actualizar_estado_analisis_riesgo ON public.analisis_riesgo_seguridad;

-- Eliminar la función que usaban los triggers, ya que no será necesaria
DROP FUNCTION IF EXISTS public.actualizar_estado_servicio_workflow();

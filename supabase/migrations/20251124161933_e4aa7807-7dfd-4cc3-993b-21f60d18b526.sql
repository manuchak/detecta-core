-- ===================================================================
-- TRIGGER DE AUTO-SINCRONIZACIÓN PARA CUSTODIO_LIBERACION
-- ===================================================================
-- Este trigger actualiza automáticamente los campos de resumen
-- (documentacion_completa) cuando se actualizan los checkboxes individuales

-- Función que sincroniza campos de resumen
CREATE OR REPLACE FUNCTION public.sync_custodio_liberacion_resumen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-actualizar documentacion_completa
  NEW.documentacion_completa := (
    NEW.documentacion_ine AND
    NEW.documentacion_licencia AND
    NEW.documentacion_antecedentes AND
    NEW.documentacion_domicilio AND
    NEW.documentacion_curp AND
    NEW.documentacion_rfc
  );
  
  -- Si se completa documentación, guardar fecha (solo la primera vez)
  IF NEW.documentacion_completa AND (OLD.documentacion_completa = false OR OLD.documentacion_completa IS NULL) THEN
    NEW.fecha_documentacion_completa := NOW();
  END IF;
  
  -- Si se desmarca algún documento, limpiar fecha
  IF NOT NEW.documentacion_completa AND OLD.documentacion_completa = true THEN
    NEW.fecha_documentacion_completa := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecuta ANTES de cada UPDATE
DROP TRIGGER IF EXISTS auto_sync_liberacion_resumen ON public.custodio_liberacion;

CREATE TRIGGER auto_sync_liberacion_resumen
  BEFORE UPDATE ON public.custodio_liberacion
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_custodio_liberacion_resumen();

-- ===================================================================
-- BACKFILL: Actualizar registros existentes
-- ===================================================================
-- Recalcular documentacion_completa para todos los registros pendientes

UPDATE public.custodio_liberacion
SET 
  documentacion_completa = (
    documentacion_ine AND
    documentacion_licencia AND
    documentacion_antecedentes AND
    documentacion_domicilio AND
    documentacion_curp AND
    documentacion_rfc
  ),
  fecha_documentacion_completa = CASE
    WHEN (
      documentacion_ine AND
      documentacion_licencia AND
      documentacion_antecedentes AND
      documentacion_domicilio AND
      documentacion_curp AND
      documentacion_rfc
    ) AND fecha_documentacion_completa IS NULL THEN NOW()
    ELSE fecha_documentacion_completa
  END,
  updated_at = NOW()
WHERE estado_liberacion IN ('pendiente', 'documentacion');

COMMENT ON FUNCTION public.sync_custodio_liberacion_resumen() IS 
'Sincroniza automáticamente el campo documentacion_completa cuando se actualizan los checkboxes individuales de documentación. Se ejecuta antes de cada UPDATE en custodio_liberacion.';
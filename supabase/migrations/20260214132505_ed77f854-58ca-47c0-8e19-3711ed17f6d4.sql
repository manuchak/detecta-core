
-- 1. Funcion reutilizable de normalizacion
CREATE OR REPLACE FUNCTION public.normalize_custodio_telefono()
RETURNS trigger AS $$
BEGIN
  IF NEW.custodio_telefono IS NOT NULL THEN
    NEW.custodio_telefono := regexp_replace(NEW.custodio_telefono, '[^0-9]', '', 'g');
    IF length(NEW.custodio_telefono) > 10 THEN
      NEW.custodio_telefono := right(NEW.custodio_telefono, 10);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Eliminar duplicados en documentos_custodio (mantener el mas reciente por phone_norm + tipo_documento)
DELETE FROM public.documentos_custodio
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY right(regexp_replace(custodio_telefono, '[^0-9]', '', 'g'), 10), tipo_documento
        ORDER BY created_at DESC
      ) as rn
    FROM public.documentos_custodio
  ) ranked
  WHERE rn > 1
);

-- 3. Drop unique constraint temporarily, normalize, recreate
ALTER TABLE public.documentos_custodio 
  DROP CONSTRAINT IF EXISTS documentos_custodio_custodio_telefono_tipo_documento_key;

-- 4. Normalizar datos existentes (SIN trigger aun)
UPDATE public.checklist_servicio
SET custodio_telefono = right(regexp_replace(custodio_telefono, '[^0-9]', '', 'g'), 10)
WHERE custodio_telefono ~ '[^0-9]'
   OR length(regexp_replace(custodio_telefono, '[^0-9]', '', 'g')) > 10;

UPDATE public.documentos_custodio
SET custodio_telefono = right(regexp_replace(custodio_telefono, '[^0-9]', '', 'g'), 10)
WHERE custodio_telefono ~ '[^0-9]'
   OR length(regexp_replace(custodio_telefono, '[^0-9]', '', 'g')) > 10;

UPDATE public.custodio_mantenimientos
SET custodio_telefono = right(regexp_replace(custodio_telefono, '[^0-9]', '', 'g'), 10)
WHERE custodio_telefono ~ '[^0-9]'
   OR length(regexp_replace(custodio_telefono, '[^0-9]', '', 'g')) > 10;

UPDATE public.custodio_configuracion_mantenimiento
SET custodio_telefono = right(regexp_replace(custodio_telefono, '[^0-9]', '', 'g'), 10)
WHERE custodio_telefono ~ '[^0-9]'
   OR length(regexp_replace(custodio_telefono, '[^0-9]', '', 'g')) > 10;

-- 5. Recrear unique constraint
ALTER TABLE public.documentos_custodio 
  ADD CONSTRAINT documentos_custodio_custodio_telefono_tipo_documento_key 
  UNIQUE (custodio_telefono, tipo_documento);

-- 6. Triggers en las 4 tablas
CREATE TRIGGER trg_normalize_telefono_checklist
  BEFORE INSERT OR UPDATE ON public.checklist_servicio
  FOR EACH ROW EXECUTE FUNCTION public.normalize_custodio_telefono();

CREATE TRIGGER trg_normalize_telefono_documentos
  BEFORE INSERT OR UPDATE ON public.documentos_custodio
  FOR EACH ROW EXECUTE FUNCTION public.normalize_custodio_telefono();

CREATE TRIGGER trg_normalize_telefono_mantenimientos
  BEFORE INSERT OR UPDATE ON public.custodio_mantenimientos
  FOR EACH ROW EXECUTE FUNCTION public.normalize_custodio_telefono();

CREATE TRIGGER trg_normalize_telefono_config_mant
  BEFORE INSERT OR UPDATE ON public.custodio_configuracion_mantenimiento
  FOR EACH ROW EXECUTE FUNCTION public.normalize_custodio_telefono();

-- 7. Simplificar RLS de checklist_servicio
DROP POLICY IF EXISTS "Custodios gestionan checklist propio" ON public.checklist_servicio;

CREATE POLICY "Custodios gestionan checklist propio"
ON public.checklist_servicio FOR ALL
USING (
  custodio_telefono = normalize_phone((SELECT phone FROM public.profiles WHERE id = auth.uid()))
);

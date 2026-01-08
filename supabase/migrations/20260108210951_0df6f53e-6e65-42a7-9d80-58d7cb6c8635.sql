-- Agregar IDs a opciones existentes que no los tienen
UPDATE lms_preguntas
SET opciones = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'id' IS NULL 
      THEN elem || jsonb_build_object('id', gen_random_uuid()::text)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(opciones) elem
)
WHERE opciones IS NOT NULL
AND EXISTS (
  SELECT 1 FROM jsonb_array_elements(opciones) elem 
  WHERE elem->>'id' IS NULL
);
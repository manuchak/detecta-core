-- Make checklist-evidencias bucket public for getPublicUrl() to work
UPDATE storage.buckets 
SET public = true 
WHERE id = 'checklist-evidencias';

-- Verify the update
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'checklist-evidencias' AND public = true) THEN
    RAISE EXCEPTION 'Failed to update bucket to public';
  END IF;
  RAISE NOTICE 'Bucket checklist-evidencias is now public';
END $$;
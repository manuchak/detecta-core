-- Hacer públicos los buckets que usan getPublicUrl()
-- Esto permite que las URLs generadas sean accesibles
-- La seguridad se mantiene con RLS policies en storage.objects

UPDATE storage.buckets 
SET public = true 
WHERE id IN ('ticket-evidencias', 'candidato-documentos');
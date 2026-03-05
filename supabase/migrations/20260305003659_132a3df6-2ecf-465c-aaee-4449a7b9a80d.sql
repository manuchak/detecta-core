-- Backfill evidencia_urls for existing tickets that have files in storage but null URLs
-- This is a one-time data fix using a CTE to build URLs from storage.objects

WITH storage_urls AS (
  SELECT 
    split_part(name, '/', 1) as ticket_number,
    array_agg(
      'https://yydzzeljaewsfhmilnhm.supabase.co/storage/v1/object/public/ticket-evidencias/' || name 
      ORDER BY name
    ) as urls
  FROM storage.objects 
  WHERE bucket_id = 'ticket-evidencias' 
    AND split_part(name, '/', 1) LIKE 'CUS-%'
  GROUP BY split_part(name, '/', 1)
)
UPDATE public.tickets t
SET evidencia_urls = s.urls
FROM storage_urls s
WHERE t.ticket_number = s.ticket_number
  AND (t.evidencia_urls IS NULL OR array_length(t.evidencia_urls, 1) IS NULL);
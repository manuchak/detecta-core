-- Fix inmediato: Sincronizar lead de Oscar Leonardo que quedó desincronizado
SELECT sync_lead_to_candidato(
  '9f468051-aadd-4e5a-9f08-08f1c43f1014',  -- lead_id
  'OSCAR LEONARDO PATIÑO TERRAZAS',         -- nombre
  'oscarlpt@gmail.com',                      -- email
  '446 288 8724',                            -- telefono
  'Plataforma Detecta',                      -- fuente
  'aprobado'                                 -- estado_proceso
);
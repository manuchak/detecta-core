ALTER TABLE incidentes_rrss DROP CONSTRAINT incidentes_rrss_red_social_check;
ALTER TABLE incidentes_rrss ADD CONSTRAINT incidentes_rrss_red_social_check 
  CHECK (red_social IN ('twitter', 'facebook', 'instagram', 'tiktok', 'youtube', 'reddit', 'noticias', 'gobierno', 'web'));
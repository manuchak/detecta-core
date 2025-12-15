-- Tabla para ratings individuales de respuestas
CREATE TABLE public.ticket_respuesta_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respuesta_id UUID NOT NULL REFERENCES public.ticket_respuestas(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  custodio_telefono TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Columna para tracking de cuando el custodio vio el ticket resuelto
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS csat_visto_at TIMESTAMP WITH TIME ZONE;

-- Índices para performance
CREATE INDEX idx_ticket_respuesta_ratings_respuesta ON public.ticket_respuesta_ratings(respuesta_id);
CREATE INDEX idx_ticket_respuesta_ratings_ticket ON public.ticket_respuesta_ratings(ticket_id);
CREATE INDEX idx_tickets_csat_visto ON public.tickets(csat_visto_at) WHERE status = 'resuelto';

-- RLS
ALTER TABLE public.ticket_respuesta_ratings ENABLE ROW LEVEL SECURITY;

-- Custodios pueden ver y crear sus propios ratings
CREATE POLICY "Custodios pueden ver sus ratings"
ON public.ticket_respuesta_ratings FOR SELECT
USING (true);

CREATE POLICY "Custodios pueden crear ratings"
ON public.ticket_respuesta_ratings FOR INSERT
WITH CHECK (true);

-- Unique constraint para evitar ratings duplicados
CREATE UNIQUE INDEX idx_unique_respuesta_rating 
ON public.ticket_respuesta_ratings(respuesta_id, custodio_telefono);
-- Add column to store interview textual responses for AI analysis
ALTER TABLE public.siercp_results 
ADD COLUMN IF NOT EXISTS interview_responses jsonb DEFAULT NULL;

COMMENT ON COLUMN public.siercp_results.interview_responses IS 
'Respuestas textuales del Módulo 7 (Entrevista Estructurada) para análisis cualitativo de IA';
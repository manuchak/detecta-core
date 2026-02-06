-- Agregar campos para tracking de estado de Meta en whatsapp_templates
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS meta_status TEXT DEFAULT 'not_submitted';
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS meta_template_id TEXT;
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS variable_count INTEGER DEFAULT 0;
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS has_buttons BOOLEAN DEFAULT false;
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS button_count INTEGER DEFAULT 0;
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS meta_category TEXT DEFAULT 'UTILITY';
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS last_test_at TIMESTAMPTZ;
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS last_test_phone TEXT;
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Añadir constraint para validar meta_status
ALTER TABLE public.whatsapp_templates DROP CONSTRAINT IF EXISTS valid_meta_status;
ALTER TABLE public.whatsapp_templates ADD CONSTRAINT valid_meta_status 
  CHECK (meta_status IN ('not_submitted', 'pending', 'approved', 'rejected'));

-- Añadir constraint para validar meta_category
ALTER TABLE public.whatsapp_templates DROP CONSTRAINT IF EXISTS valid_meta_category;
ALTER TABLE public.whatsapp_templates ADD CONSTRAINT valid_meta_category 
  CHECK (meta_category IN ('UTILITY', 'MARKETING'));

-- Crear índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_status ON public.whatsapp_templates(meta_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON public.whatsapp_templates(category);
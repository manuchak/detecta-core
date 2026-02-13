
-- Add loyalty fields to pc_clientes
ALTER TABLE public.pc_clientes ADD COLUMN IF NOT EXISTS es_embajador boolean DEFAULT false;
ALTER TABLE public.pc_clientes ADD COLUMN IF NOT EXISTS notas_fidelidad text;

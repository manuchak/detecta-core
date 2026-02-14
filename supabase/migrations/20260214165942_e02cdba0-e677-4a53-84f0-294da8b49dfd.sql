
-- Add CSM assignment to pc_clientes
ALTER TABLE public.pc_clientes 
ADD COLUMN IF NOT EXISTS csm_asignado UUID REFERENCES public.profiles(id);

-- Index for filtering by CSM
CREATE INDEX IF NOT EXISTS idx_pc_clientes_csm_asignado ON public.pc_clientes(csm_asignado);

-- RLS: CSMs can view all clients but this just enables the column
-- Existing RLS policies on pc_clientes already cover access

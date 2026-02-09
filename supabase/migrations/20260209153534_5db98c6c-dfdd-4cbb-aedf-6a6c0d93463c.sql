
-- Fase 1: Agregar campos de configuración financiera a pc_clientes
-- Punto 6: Horas cortesía por cliente
ALTER TABLE public.pc_clientes ADD COLUMN IF NOT EXISTS horas_cortesia DECIMAL DEFAULT NULL;

-- Punto 7: Pernocta
ALTER TABLE public.pc_clientes ADD COLUMN IF NOT EXISTS pernocta_tarifa DECIMAL DEFAULT NULL;
ALTER TABLE public.pc_clientes ADD COLUMN IF NOT EXISTS cobra_pernocta BOOLEAN DEFAULT false;

-- Punto 9: Tipo de facturación y días máximos
ALTER TABLE public.pc_clientes ADD COLUMN IF NOT EXISTS tipo_facturacion TEXT DEFAULT 'corte' CHECK (tipo_facturacion IN ('inmediata', 'corte'));
ALTER TABLE public.pc_clientes ADD COLUMN IF NOT EXISTS dias_max_facturacion INTEGER DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.pc_clientes.horas_cortesia IS 'Horas de cortesía del cliente antes de cobrar estadía';
COMMENT ON COLUMN public.pc_clientes.pernocta_tarifa IS 'Tarifa de pernocta que se cobra/paga';
COMMENT ON COLUMN public.pc_clientes.cobra_pernocta IS 'Si el cliente paga pernocta o no';
COMMENT ON COLUMN public.pc_clientes.tipo_facturacion IS 'Tipo: inmediata (se factura al finalizar) o corte (se acumula hasta fecha de corte)';
COMMENT ON COLUMN public.pc_clientes.dias_max_facturacion IS 'Días máximos permitidos entre finalización del servicio y emisión de factura';

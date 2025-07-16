-- Completar esquema de recepción y crear políticas RLS
-- Verificar estructura de recepciones_mercancia
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS numero_recepcion TEXT UNIQUE;
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS orden_compra_id UUID REFERENCES public.ordenes_compra(id);
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES public.proveedores(id);
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS fecha_programada TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS fecha_recepcion TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS recibido_por UUID;
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS total_esperado NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS total_recibido NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
ALTER TABLE public.recepciones_mercancia ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Verificar estructura de detalles_recepcion
ALTER TABLE public.detalles_recepcion ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(10,2);
ALTER TABLE public.detalles_recepcion ADD COLUMN IF NOT EXISTS subtotal_esperado NUMERIC(12,2);
ALTER TABLE public.detalles_recepcion ADD COLUMN IF NOT EXISTS subtotal_recibido NUMERIC(12,2);
ALTER TABLE public.detalles_recepcion ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Habilitar RLS
ALTER TABLE public.recepciones_mercancia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_recepcion ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS usando la función segura
CREATE POLICY "admin_access_recepciones_mercancia" ON public.recepciones_mercancia
FOR ALL
USING (is_admin_user_secure())
WITH CHECK (is_admin_user_secure());

CREATE POLICY "admin_access_detalles_recepcion" ON public.detalles_recepcion
FOR ALL
USING (is_admin_user_secure())
WITH CHECK (is_admin_user_secure());

-- Crear función para generar número de recepción automático
CREATE OR REPLACE FUNCTION public.generate_recepcion_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    new_number TEXT;
BEGIN
    -- Obtener el siguiente número secuencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_recepcion FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.recepciones_mercancia
    WHERE numero_recepcion ~ '^REC[0-9]+$';
    
    -- Formatear con ceros a la izquierda
    new_number := 'REC' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número automáticamente
CREATE OR REPLACE FUNCTION public.set_recepcion_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_recepcion IS NULL THEN
        NEW.numero_recepcion := public.generate_recepcion_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_recepcion_number
    BEFORE INSERT ON public.recepciones_mercancia
    FOR EACH ROW
    EXECUTE FUNCTION public.set_recepcion_number();

-- Trigger para actualizar timestamps
CREATE TRIGGER trigger_update_recepciones_mercancia_updated_at
    BEFORE UPDATE ON public.recepciones_mercancia
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
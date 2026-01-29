-- ============================================
-- TABLA DE HISTORIAL DE CAMBIOS DE PRECIOS
-- ============================================

-- Tabla para auditoría de cambios de precios
CREATE TABLE public.matriz_precios_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id UUID REFERENCES public.matriz_precios_rutas(id) ON DELETE SET NULL,
  campo_modificado TEXT NOT NULL,
  valor_anterior NUMERIC,
  valor_nuevo NUMERIC,
  motivo TEXT,
  usuario_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_precio_historial_ruta ON matriz_precios_historial(ruta_id);
CREATE INDEX idx_precio_historial_fecha ON matriz_precios_historial(created_at DESC);
CREATE INDEX idx_precio_historial_usuario ON matriz_precios_historial(usuario_id);

-- Comentarios de documentación
COMMENT ON TABLE matriz_precios_historial IS 'Registro de auditoría de cambios de precios en matriz_precios_rutas';
COMMENT ON COLUMN matriz_precios_historial.campo_modificado IS 'Campo que se modificó: valor_bruto, precio_custodio, costo_operativo';
COMMENT ON COLUMN matriz_precios_historial.motivo IS 'Razón del cambio: ajuste inflación, corrección, negociación';

-- Enable RLS
ALTER TABLE matriz_precios_historial ENABLE ROW LEVEL SECURITY;

-- Política de lectura para roles de planeación usando función existente
CREATE POLICY "read_price_history" ON matriz_precios_historial
  FOR SELECT 
  TO authenticated
  USING (
    public.check_admin_secure() OR
    public.user_has_role_direct('owner') OR
    public.user_has_role_direct('coordinador_operaciones') OR
    public.user_has_role_direct('planificador')
  );

-- Política de inserción (solo sistema via trigger)
CREATE POLICY "insert_price_history_system" ON matriz_precios_historial
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- TRIGGER PARA AUDITORÍA AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION public.log_precio_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log cambio en valor_bruto
  IF OLD.valor_bruto IS DISTINCT FROM NEW.valor_bruto THEN
    INSERT INTO public.matriz_precios_historial (
      ruta_id, 
      campo_modificado, 
      valor_anterior, 
      valor_nuevo, 
      usuario_id
    )
    VALUES (
      NEW.id, 
      'valor_bruto', 
      OLD.valor_bruto, 
      NEW.valor_bruto, 
      auth.uid()
    );
  END IF;
  
  -- Log cambio en precio_custodio
  IF OLD.precio_custodio IS DISTINCT FROM NEW.precio_custodio THEN
    INSERT INTO public.matriz_precios_historial (
      ruta_id, 
      campo_modificado, 
      valor_anterior, 
      valor_nuevo, 
      usuario_id
    )
    VALUES (
      NEW.id, 
      'precio_custodio', 
      OLD.precio_custodio, 
      NEW.precio_custodio, 
      auth.uid()
    );
  END IF;
  
  -- Log cambio en costo_operativo
  IF OLD.costo_operativo IS DISTINCT FROM NEW.costo_operativo THEN
    INSERT INTO public.matriz_precios_historial (
      ruta_id, 
      campo_modificado, 
      valor_anterior, 
      valor_nuevo, 
      usuario_id
    )
    VALUES (
      NEW.id, 
      'costo_operativo', 
      OLD.costo_operativo, 
      NEW.costo_operativo, 
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear trigger
CREATE TRIGGER on_precio_change
  AFTER UPDATE ON public.matriz_precios_rutas
  FOR EACH ROW 
  EXECUTE FUNCTION public.log_precio_change();
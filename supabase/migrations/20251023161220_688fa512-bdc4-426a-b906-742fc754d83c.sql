-- Create table for provider payments tracking
CREATE TABLE pagos_proveedores_armados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  proveedor_id UUID NOT NULL REFERENCES proveedores_armados(id) ON DELETE CASCADE,
  asignacion_id UUID NOT NULL REFERENCES asignacion_armados(id) ON DELETE CASCADE,
  servicio_custodia_id TEXT NOT NULL,
  
  -- Payment data
  monto_pagado NUMERIC(10,2) NOT NULL,
  moneda TEXT DEFAULT 'MXN' NOT NULL,
  fecha_pago DATE NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('transferencia', 'cheque', 'efectivo', 'deposito')),
  
  -- Documentation
  numero_factura TEXT,
  folio_comprobante TEXT,
  referencia_bancaria TEXT,
  archivo_comprobante_url TEXT,
  
  -- Audit
  registrado_por UUID REFERENCES auth.users(id),
  observaciones TEXT,
  estado_conciliacion TEXT DEFAULT 'pendiente' CHECK (estado_conciliacion IN ('pendiente', 'conciliado', 'rechazado')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (monto_pagado > 0)
);

-- Add payment tracking fields to asignacion_armados
ALTER TABLE asignacion_armados
ADD COLUMN IF NOT EXISTS estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'en_proceso', 'pagado')),
ADD COLUMN IF NOT EXISTS fecha_ultima_actualizacion_pago TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requiere_factura BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notas_pago TEXT;

-- Indexes for performance
CREATE INDEX idx_pagos_proveedor ON pagos_proveedores_armados(proveedor_id);
CREATE INDEX idx_pagos_asignacion ON pagos_proveedores_armados(asignacion_id);
CREATE INDEX idx_pagos_fecha ON pagos_proveedores_armados(fecha_pago);
CREATE INDEX idx_pagos_estado ON pagos_proveedores_armados(estado_conciliacion);
CREATE INDEX idx_asignacion_estado_pago ON asignacion_armados(estado_pago, proveedor_armado_id) WHERE proveedor_armado_id IS NOT NULL;

-- RLS Policies for pagos_proveedores_armados
ALTER TABLE pagos_proveedores_armados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_proveedores_select_authorized"
ON pagos_proveedores_armados FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

CREATE POLICY "pagos_proveedores_insert_authorized"
ON pagos_proveedores_armados FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
  )
  AND registrado_por = auth.uid()
);

CREATE POLICY "pagos_proveedores_update_authorized"
ON pagos_proveedores_armados FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
  )
);

CREATE POLICY "pagos_proveedores_delete_admin"
ON pagos_proveedores_armados FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pagos_proveedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pagos_proveedores_updated_at
  BEFORE UPDATE ON pagos_proveedores_armados
  FOR EACH ROW
  EXECUTE FUNCTION update_pagos_proveedores_updated_at();
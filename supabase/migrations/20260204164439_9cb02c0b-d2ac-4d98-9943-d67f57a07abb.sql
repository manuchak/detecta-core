-- =============================================
-- SISTEMA DE FACTURACION Y COBRANZA
-- =============================================

-- 1. Agregar campos fiscales a pc_clientes
ALTER TABLE pc_clientes 
ADD COLUMN IF NOT EXISTS razon_social TEXT,
ADD COLUMN IF NOT EXISTS regimen_fiscal TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal_fiscal TEXT,
ADD COLUMN IF NOT EXISTS direccion_fiscal TEXT,
ADD COLUMN IF NOT EXISTS uso_cfdi_default TEXT DEFAULT 'G03',
ADD COLUMN IF NOT EXISTS dias_credito INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS limite_credito NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS dia_corte INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS dia_pago INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS contacto_facturacion_nombre TEXT,
ADD COLUMN IF NOT EXISTS contacto_facturacion_email TEXT,
ADD COLUMN IF NOT EXISTS contacto_facturacion_tel TEXT,
ADD COLUMN IF NOT EXISTS prioridad_cobranza TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS notas_cobranza TEXT;

-- 2. Tabla de facturas
CREATE TABLE IF NOT EXISTS facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura TEXT UNIQUE NOT NULL,
  uuid_sat TEXT,
  cliente_id UUID REFERENCES pc_clientes(id),
  cliente_nombre TEXT NOT NULL,
  cliente_rfc TEXT NOT NULL,
  cliente_email TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  moneda TEXT DEFAULT 'MXN',
  tipo_cambio NUMERIC(8,4) DEFAULT 1,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estado TEXT DEFAULT 'pendiente',
  cfdi_version TEXT DEFAULT '4.0',
  uso_cfdi TEXT DEFAULT 'G03',
  forma_pago TEXT,
  metodo_pago TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de partidas de factura
CREATE TABLE IF NOT EXISTS factura_partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES facturas(id) ON DELETE CASCADE,
  servicio_id INTEGER REFERENCES servicios_custodia(id),
  id_servicio TEXT,
  id_interno_cliente TEXT,
  descripcion TEXT NOT NULL,
  fecha_servicio DATE,
  ruta TEXT,
  cantidad INTEGER DEFAULT 1,
  precio_unitario NUMERIC(12,2) NOT NULL,
  importe NUMERIC(12,2) NOT NULL,
  clave_prod_serv TEXT DEFAULT '78101800',
  clave_unidad TEXT DEFAULT 'E48',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES facturas(id),
  cliente_id UUID REFERENCES pc_clientes(id),
  monto NUMERIC(12,2) NOT NULL,
  moneda TEXT DEFAULT 'MXN',
  forma_pago TEXT NOT NULL,
  referencia_bancaria TEXT,
  banco TEXT,
  fecha_pago DATE NOT NULL,
  fecha_deposito DATE,
  estado TEXT DEFAULT 'aplicado',
  notas TEXT,
  comprobante_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. Tabla de seguimiento de cobranza
CREATE TABLE IF NOT EXISTS cobranza_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES facturas(id),
  cliente_id UUID REFERENCES pc_clientes(id),
  tipo_accion TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  contacto_nombre TEXT,
  contacto_telefono TEXT,
  fecha_promesa_pago DATE,
  monto_prometido NUMERIC(12,2),
  promesa_cumplida BOOLEAN,
  resultado TEXT,
  proxima_accion DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 6. Indices para performance
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_vencimiento ON facturas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_factura ON pagos(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobranza_factura ON cobranza_seguimiento(factura_id);
CREATE INDEX IF NOT EXISTS idx_cobranza_cliente ON cobranza_seguimiento(cliente_id);
CREATE INDEX IF NOT EXISTS idx_factura_partidas_factura ON factura_partidas(factura_id);

-- 7. Vista de aging de cuentas por cobrar
CREATE OR REPLACE VIEW vw_aging_cuentas_cobrar AS
SELECT
  f.cliente_id,
  f.cliente_nombre,
  f.cliente_rfc,
  pc.dias_credito,
  pc.limite_credito,
  pc.prioridad_cobranza,
  SUM(f.total) as total_facturado,
  SUM(COALESCE(p.total_pagado, 0)) as total_pagado,
  SUM(f.total - COALESCE(p.total_pagado, 0)) as saldo_pendiente,
  SUM(CASE WHEN f.fecha_vencimiento >= CURRENT_DATE THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vigente,
  SUM(CASE WHEN CURRENT_DATE - f.fecha_vencimiento BETWEEN 1 AND 30 THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vencido_1_30,
  SUM(CASE WHEN CURRENT_DATE - f.fecha_vencimiento BETWEEN 31 AND 60 THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vencido_31_60,
  SUM(CASE WHEN CURRENT_DATE - f.fecha_vencimiento BETWEEN 61 AND 90 THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vencido_61_90,
  SUM(CASE WHEN CURRENT_DATE - f.fecha_vencimiento > 90 THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vencido_90_mas,
  COUNT(DISTINCT f.id) as num_facturas,
  MAX(f.fecha_vencimiento) as ultima_factura,
  MAX(p.ultima_fecha_pago) as ultimo_pago
FROM facturas f
LEFT JOIN pc_clientes pc ON f.cliente_id = pc.id
LEFT JOIN (
  SELECT factura_id, SUM(monto) as total_pagado, MAX(fecha_pago) as ultima_fecha_pago
  FROM pagos WHERE estado = 'aplicado'
  GROUP BY factura_id
) p ON f.id = p.factura_id
WHERE f.estado NOT IN ('cancelada')
GROUP BY f.cliente_id, f.cliente_nombre, f.cliente_rfc, pc.dias_credito, pc.limite_credito, pc.prioridad_cobranza;

-- 8. RLS Policies
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranza_seguimiento ENABLE ROW LEVEL SECURITY;

-- Policies for facturas
CREATE POLICY "Usuarios autenticados pueden ver facturas" ON facturas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear facturas" ON facturas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar facturas" ON facturas
  FOR UPDATE TO authenticated USING (true);

-- Policies for factura_partidas
CREATE POLICY "Usuarios autenticados pueden ver partidas" ON factura_partidas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear partidas" ON factura_partidas
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for pagos
CREATE POLICY "Usuarios autenticados pueden ver pagos" ON pagos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear pagos" ON pagos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar pagos" ON pagos
  FOR UPDATE TO authenticated USING (true);

-- Policies for cobranza_seguimiento
CREATE POLICY "Usuarios autenticados pueden ver seguimiento" ON cobranza_seguimiento
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear seguimiento" ON cobranza_seguimiento
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar seguimiento" ON cobranza_seguimiento
  FOR UPDATE TO authenticated USING (true);
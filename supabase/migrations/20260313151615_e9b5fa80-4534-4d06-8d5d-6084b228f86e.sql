
-- =============================================
-- Phase 1: Auditoría Proveedores & P&L Gadgets
-- =============================================

-- 1. Inventario de gadgets (candados, GPS, trabapatines)
CREATE TABLE public.inventario_gadgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial text NOT NULL UNIQUE,
  tipo text NOT NULL DEFAULT 'candado_sintel',
  proveedor_nombre text,
  es_propio boolean NOT NULL DEFAULT false,
  renta_mensual numeric(10,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'activo',
  fecha_alta date NOT NULL DEFAULT CURRENT_DATE,
  fecha_baja date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Rentas mensuales de gadgets
CREATE TABLE public.rentas_gadgets_mensuales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes text NOT NULL, -- '2026-03'
  total_unidades integer NOT NULL DEFAULT 0,
  renta_por_unidad numeric(10,2) NOT NULL DEFAULT 0,
  monto_total numeric(12,2) NOT NULL DEFAULT 0,
  proveedor text,
  factura_proveedor text,
  estado text NOT NULL DEFAULT 'pendiente',
  fecha_pago date,
  notas text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Conciliación header (linked to CxP)
CREATE TABLE public.conciliacion_proveedor_armados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cxp_id uuid REFERENCES public.cxp_proveedores_armados(id) ON DELETE CASCADE NOT NULL,
  archivo_nombre text,
  archivo_url text,
  columnas_mapeo jsonb DEFAULT '{}',
  total_filas_proveedor integer NOT NULL DEFAULT 0,
  total_filas_detecta integer NOT NULL DEFAULT 0,
  coincidencias integer NOT NULL DEFAULT 0,
  discrepancias_monto integer NOT NULL DEFAULT 0,
  solo_proveedor integer NOT NULL DEFAULT 0,
  solo_detecta integer NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Detalle de conciliación (línea a línea)
CREATE TABLE public.conciliacion_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conciliacion_id uuid REFERENCES public.conciliacion_proveedor_armados(id) ON DELETE CASCADE NOT NULL,
  asignacion_id uuid,
  fila_proveedor jsonb,
  resultado text NOT NULL DEFAULT 'pendiente',
  monto_detecta numeric(10,2) DEFAULT 0,
  monto_proveedor numeric(10,2) DEFAULT 0,
  diferencia numeric(10,2) DEFAULT 0,
  resolucion text NOT NULL DEFAULT 'pendiente',
  monto_final numeric(10,2) DEFAULT 0,
  notas_finanzas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Add frecuencia_pago to proveedores_armados
ALTER TABLE public.proveedores_armados
  ADD COLUMN IF NOT EXISTS frecuencia_pago text NOT NULL DEFAULT 'mensual';

-- =============================================
-- RLS Policies using has_facturacion_role()
-- =============================================

ALTER TABLE public.inventario_gadgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentas_gadgets_mensuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacion_proveedor_armados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacion_detalle ENABLE ROW LEVEL SECURITY;

-- inventario_gadgets
CREATE POLICY "facturacion_read_inventario_gadgets"
  ON public.inventario_gadgets FOR SELECT TO authenticated
  USING (public.has_facturacion_role());

CREATE POLICY "facturacion_write_inventario_gadgets"
  ON public.inventario_gadgets FOR ALL TO authenticated
  USING (public.has_facturacion_write_role())
  WITH CHECK (public.has_facturacion_write_role());

-- rentas_gadgets_mensuales
CREATE POLICY "facturacion_read_rentas_gadgets"
  ON public.rentas_gadgets_mensuales FOR SELECT TO authenticated
  USING (public.has_facturacion_role());

CREATE POLICY "facturacion_write_rentas_gadgets"
  ON public.rentas_gadgets_mensuales FOR ALL TO authenticated
  USING (public.has_facturacion_write_role())
  WITH CHECK (public.has_facturacion_write_role());

-- conciliacion_proveedor_armados
CREATE POLICY "facturacion_read_conciliacion"
  ON public.conciliacion_proveedor_armados FOR SELECT TO authenticated
  USING (public.has_facturacion_role());

CREATE POLICY "facturacion_write_conciliacion"
  ON public.conciliacion_proveedor_armados FOR ALL TO authenticated
  USING (public.has_facturacion_write_role())
  WITH CHECK (public.has_facturacion_write_role());

-- conciliacion_detalle
CREATE POLICY "facturacion_read_conciliacion_detalle"
  ON public.conciliacion_detalle FOR SELECT TO authenticated
  USING (public.has_facturacion_role());

CREATE POLICY "facturacion_write_conciliacion_detalle"
  ON public.conciliacion_detalle FOR ALL TO authenticated
  USING (public.has_facturacion_write_role())
  WITH CHECK (public.has_facturacion_write_role());

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_inventario_gadgets_tipo ON public.inventario_gadgets(tipo);
CREATE INDEX idx_inventario_gadgets_estado ON public.inventario_gadgets(estado);
CREATE INDEX idx_rentas_gadgets_mes ON public.rentas_gadgets_mensuales(mes);
CREATE INDEX idx_conciliacion_cxp ON public.conciliacion_proveedor_armados(cxp_id);
CREATE INDEX idx_conciliacion_detalle_conc ON public.conciliacion_detalle(conciliacion_id);
CREATE INDEX idx_conciliacion_detalle_resultado ON public.conciliacion_detalle(resultado);

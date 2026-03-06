
-- Phase 1: Expand pc_clientes with billing rule fields
ALTER TABLE pc_clientes
ADD COLUMN IF NOT EXISTS requiere_portal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS url_portal text,
ADD COLUMN IF NOT EXISTS dia_entrega_factura text,
ADD COLUMN IF NOT EXISTS descripcion_factura_formato text,
ADD COLUMN IF NOT EXISTS requiere_prefactura boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS requiere_tickets_estadia boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS evidencia_requerida text[],
ADD COLUMN IF NOT EXISTS observaciones_facturacion text,
ADD COLUMN IF NOT EXISTS facturacion_intercompania boolean DEFAULT false;

-- Expand reglas_estadias_cliente with differentiated rates
ALTER TABLE reglas_estadias_cliente
ADD COLUMN IF NOT EXISTS horas_cortesia_local numeric,
ADD COLUMN IF NOT EXISTS horas_cortesia_foraneo numeric,
ADD COLUMN IF NOT EXISTS tarifa_sin_arma numeric,
ADD COLUMN IF NOT EXISTS tarifa_con_arma numeric,
ADD COLUMN IF NOT EXISTS requiere_tickets boolean DEFAULT false;

-- Create pc_clientes_contactos table
CREATE TABLE IF NOT EXISTS pc_clientes_contactos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES pc_clientes(id) ON DELETE CASCADE NOT NULL,
  nombre text,
  email text NOT NULL,
  telefono text,
  rol text DEFAULT 'facturacion',
  principal boolean DEFAULT false,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create pc_clientes_gadgets table
CREATE TABLE IF NOT EXISTS pc_clientes_gadgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES pc_clientes(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL,
  precio numeric NOT NULL DEFAULT 0,
  incluido_en_tarifa boolean DEFAULT false,
  facturacion text DEFAULT 'por_servicio',
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pc_clientes_contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_clientes_gadgets ENABLE ROW LEVEL SECURITY;

-- RLS for pc_clientes_contactos
CREATE POLICY "contactos_select_facturacion" ON pc_clientes_contactos
FOR SELECT TO authenticated
USING (public.has_facturacion_role());

CREATE POLICY "contactos_insert_facturacion" ON pc_clientes_contactos
FOR INSERT TO authenticated
WITH CHECK (public.has_facturacion_write_role());

CREATE POLICY "contactos_update_facturacion" ON pc_clientes_contactos
FOR UPDATE TO authenticated
USING (public.has_facturacion_write_role());

CREATE POLICY "contactos_delete_facturacion" ON pc_clientes_contactos
FOR DELETE TO authenticated
USING (public.has_facturacion_write_role());

-- RLS for pc_clientes_gadgets
CREATE POLICY "gadgets_select_facturacion" ON pc_clientes_gadgets
FOR SELECT TO authenticated
USING (public.has_facturacion_role());

CREATE POLICY "gadgets_insert_facturacion" ON pc_clientes_gadgets
FOR INSERT TO authenticated
WITH CHECK (public.has_facturacion_write_role());

CREATE POLICY "gadgets_update_facturacion" ON pc_clientes_gadgets
FOR UPDATE TO authenticated
USING (public.has_facturacion_write_role());

CREATE POLICY "gadgets_delete_facturacion" ON pc_clientes_gadgets
FOR DELETE TO authenticated
USING (public.has_facturacion_write_role());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contactos_cliente ON pc_clientes_contactos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_gadgets_cliente ON pc_clientes_gadgets(cliente_id);

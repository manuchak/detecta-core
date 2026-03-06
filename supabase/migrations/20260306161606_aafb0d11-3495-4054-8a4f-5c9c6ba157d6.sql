
CREATE TABLE public.contratos_monitoreo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.pc_clientes(id) ON DELETE CASCADE,
  numero_contrato text NOT NULL,
  tipo_contrato text NOT NULL DEFAULT 'monitoreo',
  fecha_inicio date NOT NULL,
  fecha_fin date,
  renovacion_automatica boolean DEFAULT false,
  estado text NOT NULL DEFAULT 'activo',
  monto_mensual numeric(12,2),
  moneda text DEFAULT 'MXN',
  condiciones_especiales text,
  archivo_url text,
  notas text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.contratos_monitoreo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facturacion read contratos_monitoreo"
  ON public.contratos_monitoreo FOR SELECT TO authenticated
  USING (public.has_facturacion_role() OR public.is_admin_or_owner());

CREATE POLICY "Facturacion write contratos_monitoreo"
  ON public.contratos_monitoreo FOR ALL TO authenticated
  USING (public.has_facturacion_write_role() OR public.is_admin_or_owner())
  WITH CHECK (public.has_facturacion_write_role() OR public.is_admin_or_owner());

CREATE TABLE public.pc_clientes_portales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.pc_clientes(id) ON DELETE CASCADE,
  nombre_portal text NOT NULL,
  url_portal text,
  usuario_portal text,
  password_portal text,
  tipo_portal text DEFAULT 'facturacion',
  instrucciones text,
  activo boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.pc_clientes_portales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facturacion read pc_clientes_portales"
  ON public.pc_clientes_portales FOR SELECT TO authenticated
  USING (public.has_facturacion_role() OR public.is_admin_or_owner());

CREATE POLICY "Facturacion write pc_clientes_portales"
  ON public.pc_clientes_portales FOR ALL TO authenticated
  USING (public.has_facturacion_write_role() OR public.is_admin_or_owner())
  WITH CHECK (public.has_facturacion_write_role() OR public.is_admin_or_owner());

CREATE INDEX idx_contratos_monitoreo_cliente ON public.contratos_monitoreo(cliente_id);
CREATE INDEX idx_pc_clientes_portales_cliente ON public.pc_clientes_portales(cliente_id);


-- =============================================
-- FASE 4: Incidencias, Gastos Extraordinarios, CxP
-- =============================================

-- 1. Tabla de Incidencias de Facturación
CREATE TABLE public.incidencias_facturacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  factura_id UUID REFERENCES public.facturas(id) ON DELETE SET NULL,
  servicio_custodia_id INTEGER REFERENCES public.servicios_custodia(id) ON DELETE SET NULL,
  cliente TEXT NOT NULL,
  tipo_incidencia TEXT NOT NULL CHECK (tipo_incidencia IN (
    'discrepancia_monto', 'servicio_no_reconocido', 'factura_duplicada',
    'datos_fiscales_incorrectos', 'nota_credito', 'ajuste_precio',
    'cancelacion', 'rechazo_cliente', 'error_ruta', 'otro'
  )),
  descripcion TEXT NOT NULL,
  monto_original NUMERIC(12,2),
  monto_ajustado NUMERIC(12,2),
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_revision', 'resuelta', 'cerrada')),
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  reportado_por UUID REFERENCES auth.users(id),
  asignado_a UUID REFERENCES auth.users(id),
  resolucion TEXT,
  fecha_resolucion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incidencias_facturacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view incidencias"
  ON public.incidencias_facturacion FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert incidencias"
  ON public.incidencias_facturacion FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update incidencias"
  ON public.incidencias_facturacion FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 2. Tabla de Gastos Extraordinarios vinculados a Servicios
CREATE TABLE public.gastos_extraordinarios_servicio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_custodia_id INTEGER REFERENCES public.servicios_custodia(id) ON DELETE CASCADE,
  cliente TEXT,
  tipo_gasto TEXT NOT NULL CHECK (tipo_gasto IN (
    'caseta_extra', 'hotel', 'combustible', 'alimentos',
    'reparacion_vehicular', 'multa', 'peaje_adicional',
    'estacionamiento', 'propina_autorizada', 'otro'
  )),
  descripcion TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'MXN',
  cobrable_cliente BOOLEAN NOT NULL DEFAULT false,
  pagable_custodio BOOLEAN NOT NULL DEFAULT false,
  estado_reembolso TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_reembolso IN ('pendiente', 'aprobado', 'rechazado', 'reembolsado')),
  aprobado_por UUID REFERENCES auth.users(id),
  fecha_aprobacion TIMESTAMPTZ,
  evidencia_url TEXT,
  notas TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gastos_extraordinarios_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view gastos_extraordinarios"
  ON public.gastos_extraordinarios_servicio FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert gastos_extraordinarios"
  ON public.gastos_extraordinarios_servicio FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update gastos_extraordinarios"
  ON public.gastos_extraordinarios_servicio FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 3. Tabla CxP consolidada para proveedores armados
CREATE TABLE public.cxp_proveedores_armados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores_armados(id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  total_servicios INTEGER NOT NULL DEFAULT 0,
  monto_servicios NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_gastos_extra NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_deducciones NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'revision', 'aprobado', 'pagado', 'cancelado')),
  factura_proveedor TEXT,
  fecha_factura_proveedor DATE,
  fecha_vencimiento DATE,
  metodo_pago TEXT,
  referencia_pago TEXT,
  fecha_pago DATE,
  aprobado_por UUID REFERENCES auth.users(id),
  fecha_aprobacion TIMESTAMPTZ,
  notas TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cxp_proveedores_armados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cxp"
  ON public.cxp_proveedores_armados FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert cxp"
  ON public.cxp_proveedores_armados FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update cxp"
  ON public.cxp_proveedores_armados FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Detalle de servicios incluidos en cada CxP
CREATE TABLE public.cxp_detalle_servicios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cxp_id UUID NOT NULL REFERENCES public.cxp_proveedores_armados(id) ON DELETE CASCADE,
  asignacion_id UUID NOT NULL REFERENCES public.asignacion_armados(id),
  monto_servicio NUMERIC(12,2) NOT NULL,
  monto_gasto_extra NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_deduccion NUMERIC(12,2) NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cxp_detalle_servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cxp_detalle"
  ON public.cxp_detalle_servicios FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert cxp_detalle"
  ON public.cxp_detalle_servicios FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_incidencias_facturacion_updated_at
  BEFORE UPDATE ON public.incidencias_facturacion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gastos_extraordinarios_updated_at
  BEFORE UPDATE ON public.gastos_extraordinarios_servicio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cxp_proveedores_updated_at
  BEFORE UPDATE ON public.cxp_proveedores_armados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_incidencias_cliente ON public.incidencias_facturacion(cliente);
CREATE INDEX idx_incidencias_estado ON public.incidencias_facturacion(estado);
CREATE INDEX idx_gastos_extra_servicio ON public.gastos_extraordinarios_servicio(servicio_custodia_id);
CREATE INDEX idx_gastos_extra_estado ON public.gastos_extraordinarios_servicio(estado_reembolso);
CREATE INDEX idx_cxp_proveedor ON public.cxp_proveedores_armados(proveedor_id);
CREATE INDEX idx_cxp_estado ON public.cxp_proveedores_armados(estado);
CREATE INDEX idx_cxp_detalle_cxp ON public.cxp_detalle_servicios(cxp_id);

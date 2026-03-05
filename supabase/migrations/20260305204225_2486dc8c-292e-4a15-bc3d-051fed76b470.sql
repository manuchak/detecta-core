
-- =============================================
-- Tabla 1: reglas_estadias_cliente
-- =============================================
CREATE TABLE public.reglas_estadias_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.pc_clientes(id) ON DELETE CASCADE,
  tipo_servicio text,
  ruta_patron text,
  horas_cortesia numeric NOT NULL DEFAULT 0,
  tarifa_hora_excedente numeric DEFAULT 0,
  tarifa_pernocta numeric DEFAULT 0,
  cobra_pernocta boolean DEFAULT false,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cliente_id, tipo_servicio, ruta_patron)
);

ALTER TABLE public.reglas_estadias_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facturacion_read_reglas_estadias"
  ON public.reglas_estadias_cliente FOR SELECT
  TO authenticated
  USING (public.has_facturacion_role());

CREATE POLICY "facturacion_write_reglas_estadias"
  ON public.reglas_estadias_cliente FOR INSERT
  TO authenticated
  WITH CHECK (public.has_facturacion_write_role());

CREATE POLICY "facturacion_update_reglas_estadias"
  ON public.reglas_estadias_cliente FOR UPDATE
  TO authenticated
  USING (public.has_facturacion_write_role())
  WITH CHECK (public.has_facturacion_write_role());

CREATE POLICY "facturacion_delete_reglas_estadias"
  ON public.reglas_estadias_cliente FOR DELETE
  TO authenticated
  USING (public.has_facturacion_write_role());

-- =============================================
-- Tabla 2: solicitudes_apoyo_extraordinario
-- =============================================
CREATE TABLE public.solicitudes_apoyo_extraordinario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_custodia_id integer REFERENCES public.servicios_custodia(id),
  id_servicio text,
  custodio_id uuid,
  custodio_nombre text,
  cliente_nombre text,
  tipo_apoyo text NOT NULL,
  motivo text NOT NULL,
  monto_solicitado numeric NOT NULL,
  monto_aprobado numeric,
  moneda text DEFAULT 'MXN',
  estado text DEFAULT 'pendiente',
  urgencia text DEFAULT 'normal',
  solicitado_por uuid,
  fecha_solicitud timestamptz DEFAULT now(),
  aprobado_por uuid,
  fecha_aprobacion timestamptz,
  motivo_rechazo text,
  metodo_pago text,
  referencia_pago text,
  fecha_pago timestamptz,
  pagado_por uuid,
  comprobante_url text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger for estado
CREATE OR REPLACE FUNCTION public.validate_solicitud_apoyo_estado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.estado NOT IN ('pendiente','aprobado','rechazado','pagado','cancelado') THEN
    RAISE EXCEPTION 'Estado inválido: %', NEW.estado;
  END IF;
  IF NEW.urgencia NOT IN ('baja','normal','alta','critica') THEN
    RAISE EXCEPTION 'Urgencia inválida: %', NEW.urgencia;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_solicitud_apoyo
  BEFORE INSERT OR UPDATE ON public.solicitudes_apoyo_extraordinario
  FOR EACH ROW EXECUTE FUNCTION public.validate_solicitud_apoyo_estado();

ALTER TABLE public.solicitudes_apoyo_extraordinario ENABLE ROW LEVEL SECURITY;

-- Facturacion can read
CREATE POLICY "facturacion_read_apoyos"
  ON public.solicitudes_apoyo_extraordinario FOR SELECT
  TO authenticated
  USING (public.has_facturacion_role());

-- Monitoring write (coordinador ops) can also read their own
CREATE POLICY "monitoring_read_apoyos"
  ON public.solicitudes_apoyo_extraordinario FOR SELECT
  TO authenticated
  USING (public.has_monitoring_write_role());

-- Coordinador ops can create
CREATE POLICY "monitoring_insert_apoyos"
  ON public.solicitudes_apoyo_extraordinario FOR INSERT
  TO authenticated
  WITH CHECK (public.has_monitoring_write_role());

-- Facturacion can update (approve/reject/pay)
CREATE POLICY "facturacion_update_apoyos"
  ON public.solicitudes_apoyo_extraordinario FOR UPDATE
  TO authenticated
  USING (public.has_facturacion_write_role())
  WITH CHECK (public.has_facturacion_write_role());

-- Facturacion write can also insert
CREATE POLICY "facturacion_insert_apoyos"
  ON public.solicitudes_apoyo_extraordinario FOR INSERT
  TO authenticated
  WITH CHECK (public.has_facturacion_write_role());

-- =============================================
-- Tabla 3: cxp_cortes_semanales
-- =============================================
CREATE TABLE public.cxp_cortes_semanales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_operativo text NOT NULL,
  operativo_id uuid,
  operativo_nombre text NOT NULL,
  semana_inicio date NOT NULL,
  semana_fin date NOT NULL,
  total_servicios integer DEFAULT 0,
  monto_servicios numeric DEFAULT 0,
  monto_estadias numeric DEFAULT 0,
  monto_casetas numeric DEFAULT 0,
  monto_hoteles numeric DEFAULT 0,
  monto_apoyos_extra numeric DEFAULT 0,
  monto_deducciones numeric DEFAULT 0,
  monto_total numeric DEFAULT 0,
  estado text DEFAULT 'borrador',
  revisado_por uuid,
  fecha_revision timestamptz,
  aprobado_por uuid,
  fecha_aprobacion timestamptz,
  documento_dispersion_url text,
  metodo_pago text,
  referencia_pago text,
  fecha_pago date,
  notas text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger for tipo_operativo and estado
CREATE OR REPLACE FUNCTION public.validate_cxp_corte_semanal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tipo_operativo NOT IN ('custodio','armado_interno') THEN
    RAISE EXCEPTION 'tipo_operativo inválido: %', NEW.tipo_operativo;
  END IF;
  IF NEW.estado NOT IN ('borrador','revision_ops','aprobado_finanzas','dispersado','pagado','cancelado') THEN
    RAISE EXCEPTION 'estado inválido: %', NEW.estado;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_cxp_corte
  BEFORE INSERT OR UPDATE ON public.cxp_cortes_semanales
  FOR EACH ROW EXECUTE FUNCTION public.validate_cxp_corte_semanal();

ALTER TABLE public.cxp_cortes_semanales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facturacion_read_cortes"
  ON public.cxp_cortes_semanales FOR SELECT
  TO authenticated
  USING (public.has_facturacion_role());

CREATE POLICY "facturacion_insert_cortes"
  ON public.cxp_cortes_semanales FOR INSERT
  TO authenticated
  WITH CHECK (public.has_facturacion_write_role());

CREATE POLICY "facturacion_update_cortes"
  ON public.cxp_cortes_semanales FOR UPDATE
  TO authenticated
  USING (public.has_facturacion_write_role())
  WITH CHECK (public.has_facturacion_write_role());

CREATE POLICY "facturacion_delete_cortes"
  ON public.cxp_cortes_semanales FOR DELETE
  TO authenticated
  USING (public.has_facturacion_write_role());

-- Monitoring write can also read (for revision_ops workflow)
CREATE POLICY "monitoring_read_cortes"
  ON public.cxp_cortes_semanales FOR SELECT
  TO authenticated
  USING (public.has_monitoring_write_role());

-- =============================================
-- Tabla 4: cxp_cortes_detalle
-- =============================================
CREATE TABLE public.cxp_cortes_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corte_id uuid NOT NULL REFERENCES public.cxp_cortes_semanales(id) ON DELETE CASCADE,
  servicio_custodia_id integer REFERENCES public.servicios_custodia(id),
  concepto text NOT NULL,
  descripcion text,
  monto numeric NOT NULL DEFAULT 0,
  referencia_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cxp_cortes_detalle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facturacion_read_cortes_detalle"
  ON public.cxp_cortes_detalle FOR SELECT
  TO authenticated
  USING (public.has_facturacion_role());

CREATE POLICY "facturacion_insert_cortes_detalle"
  ON public.cxp_cortes_detalle FOR INSERT
  TO authenticated
  WITH CHECK (public.has_facturacion_write_role());

CREATE POLICY "facturacion_update_cortes_detalle"
  ON public.cxp_cortes_detalle FOR UPDATE
  TO authenticated
  USING (public.has_facturacion_write_role())
  WITH CHECK (public.has_facturacion_write_role());

CREATE POLICY "facturacion_delete_cortes_detalle"
  ON public.cxp_cortes_detalle FOR DELETE
  TO authenticated
  USING (public.has_facturacion_write_role());

-- Monitoring write can also read details
CREATE POLICY "monitoring_read_cortes_detalle"
  ON public.cxp_cortes_detalle FOR SELECT
  TO authenticated
  USING (public.has_monitoring_write_role());

-- =============================================
-- Indices
-- =============================================
CREATE INDEX idx_reglas_estadias_cliente ON public.reglas_estadias_cliente(cliente_id);
CREATE INDEX idx_solicitudes_apoyo_estado ON public.solicitudes_apoyo_extraordinario(estado);
CREATE INDEX idx_solicitudes_apoyo_servicio ON public.solicitudes_apoyo_extraordinario(servicio_custodia_id);
CREATE INDEX idx_cxp_cortes_semana ON public.cxp_cortes_semanales(semana_inicio, semana_fin);
CREATE INDEX idx_cxp_cortes_operativo ON public.cxp_cortes_semanales(operativo_id);
CREATE INDEX idx_cxp_cortes_estado ON public.cxp_cortes_semanales(estado);
CREATE INDEX idx_cxp_cortes_detalle_corte ON public.cxp_cortes_detalle(corte_id);

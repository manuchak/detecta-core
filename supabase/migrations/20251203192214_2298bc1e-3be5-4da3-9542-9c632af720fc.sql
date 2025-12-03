-- =====================================================
-- SPRINT 3: Documentos OCR y Contratos Electrónicos
-- =====================================================

-- =====================================================
-- FASE 7: Tabla documentos_candidato
-- =====================================================

CREATE TABLE public.documentos_candidato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  
  tipo_documento varchar NOT NULL CHECK (tipo_documento IN (
    'ine_frente', 'ine_reverso', 
    'licencia_frente', 'licencia_reverso',
    'curp', 'rfc', 
    'comprobante_domicilio',
    'carta_antecedentes'
  )),
  
  archivo_url text NOT NULL,
  archivo_nombre varchar NOT NULL,
  archivo_tipo varchar,
  archivo_tamaño integer,
  
  ocr_procesado boolean DEFAULT false,
  ocr_datos_extraidos jsonb,
  ocr_confianza numeric,
  ocr_fecha_proceso timestamp with time zone,
  ocr_error text,
  
  estado_validacion varchar DEFAULT 'pendiente' CHECK (estado_validacion IN (
    'pendiente', 'procesando', 'valido', 'invalido', 'requiere_revision'
  )),
  validado_por uuid REFERENCES profiles(id),
  fecha_validacion timestamp with time zone,
  motivo_rechazo text,
  
  nombre_esperado varchar,
  nombre_extraido varchar,
  coincidencia_nombre boolean,
  
  fecha_emision date,
  fecha_vencimiento date,
  documento_vigente boolean,
  
  subido_por uuid REFERENCES profiles(id),
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_documentos_candidato_candidato ON documentos_candidato(candidato_id);
CREATE INDEX idx_documentos_candidato_tipo ON documentos_candidato(tipo_documento);
CREATE INDEX idx_documentos_candidato_estado ON documentos_candidato(estado_validacion);

CREATE UNIQUE INDEX idx_documentos_candidato_unico 
ON documentos_candidato(candidato_id, tipo_documento) 
WHERE estado_validacion NOT IN ('invalido');

ALTER TABLE documentos_candidato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documentos_candidato_select_authenticated" ON documentos_candidato
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "documentos_candidato_insert_authenticated" ON documentos_candidato
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "documentos_candidato_update_authenticated" ON documentos_candidato
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "documentos_candidato_delete_authenticated" ON documentos_candidato
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- FASE 8: Tabla plantillas_contrato
-- =====================================================

CREATE TABLE public.plantillas_contrato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar NOT NULL,
  tipo_contrato varchar NOT NULL CHECK (tipo_contrato IN (
    'confidencialidad',
    'prestacion_servicios', 
    'codigo_conducta',
    'aviso_privacidad',
    'responsiva_equipo'
  )),
  version integer DEFAULT 1,
  activa boolean DEFAULT true,
  contenido_html text NOT NULL,
  variables_requeridas text[],
  descripcion text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE plantillas_contrato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plantillas_contrato_select_authenticated" ON plantillas_contrato
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "plantillas_contrato_insert_authenticated" ON plantillas_contrato
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "plantillas_contrato_update_authenticated" ON plantillas_contrato
  FOR UPDATE TO authenticated USING (true);

-- Plantillas iniciales
INSERT INTO plantillas_contrato (nombre, tipo_contrato, contenido_html, variables_requeridas, descripcion) VALUES
(
  'Contrato de Confidencialidad v1', 
  'confidencialidad', 
  '<div class="contract"><h1 style="text-align:center;">CONTRATO DE CONFIDENCIALIDAD</h1><p style="text-align:right;">Ciudad de México, a {{fecha_actual}}</p><p>El que suscribe, <strong>{{nombre_completo}}</strong>, con CURP <strong>{{curp}}</strong>, y domicilio en <strong>{{direccion}}</strong>, en adelante "EL PRESTADOR DE SERVICIOS".</p><h2>CLÁUSULAS</h2><p><strong>PRIMERA.- OBJETO.</strong> EL PRESTADOR DE SERVICIOS se compromete a mantener estricta confidencialidad sobre toda la información relacionada con clientes, rutas, procedimientos operativos y cualquier dato sensible al que tenga acceso.</p><p><strong>SEGUNDA.- VIGENCIA.</strong> Las obligaciones de confidencialidad permanecerán vigentes durante la relación contractual y por un período de 2 (dos) años posteriores a su terminación.</p><p><strong>TERCERA.- SANCIONES.</strong> El incumplimiento de las obligaciones de confidencialidad dará lugar a las acciones legales correspondientes.</p><div style="margin-top:60px;"><p>FIRMA: ___________________________</p><p>{{nombre_completo}}</p></div></div>',
  ARRAY['nombre_completo', 'curp', 'direccion', 'fecha_actual'],
  'Contrato de confidencialidad estándar para custodios'
),
(
  'Código de Conducta v1', 
  'codigo_conducta',
  '<div class="contract"><h1 style="text-align:center;">CÓDIGO DE CONDUCTA - CUSTODIOS</h1><p style="text-align:right;">{{fecha_actual}}</p><p>Yo, <strong>{{nombre_completo}}</strong>, con CURP <strong>{{curp}}</strong>, manifiesto haber leído, entendido y me comprometo a cumplir el siguiente código de conducta:</p><h2>COMPROMISOS</h2><ol><li>Mantener una conducta profesional y ética en todo momento.</li><li>Respetar los horarios y rutas asignadas.</li><li>No consumir alcohol ni sustancias prohibidas durante el servicio.</li><li>Mantener comunicación constante con la central de operaciones.</li><li>Reportar cualquier incidente de manera inmediata.</li></ol><h2>PROHIBICIONES</h2><ul><li>Uso de teléfono celular mientras conduce.</li><li>Desviarse de rutas autorizadas sin previa autorización.</li><li>Compartir información de clientes o rutas con terceros.</li></ul><div style="margin-top:60px;"><p>FIRMA: ___________________________</p><p>{{nombre_completo}}</p></div></div>',
  ARRAY['nombre_completo', 'curp', 'fecha_actual'],
  'Código de conducta obligatorio para todos los custodios'
),
(
  'Aviso de Privacidad v1', 
  'aviso_privacidad',
  '<div class="contract"><h1 style="text-align:center;">AVISO DE PRIVACIDAD</h1><p style="text-align:right;">{{fecha_actual}}</p><p>En cumplimiento con la Ley Federal de Protección de Datos Personales, informamos que los datos personales de <strong>{{nombre_completo}}</strong> serán tratados para gestión de la relación contractual, verificación de antecedentes y monitoreo de ubicación durante servicios.</p><h2>DERECHOS ARCO</h2><p>Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales.</p><p>Al firmar este documento, otorgo mi consentimiento para el tratamiento de mis datos personales.</p><div style="margin-top:60px;"><p>FIRMA: ___________________________</p><p>{{nombre_completo}}</p></div></div>',
  ARRAY['nombre_completo', 'fecha_actual'],
  'Aviso de privacidad conforme a LFPDPPP'
);

-- =====================================================
-- FASE 8: Tabla contratos_candidato
-- =====================================================

CREATE TABLE public.contratos_candidato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  
  tipo_contrato varchar NOT NULL CHECK (tipo_contrato IN (
    'confidencialidad',
    'prestacion_servicios', 
    'codigo_conducta',
    'aviso_privacidad',
    'responsiva_equipo'
  )),
  plantilla_id uuid REFERENCES plantillas_contrato(id),
  version_plantilla integer DEFAULT 1,
  
  contenido_html text,
  datos_interpolados jsonb,
  
  firmado boolean DEFAULT false,
  firma_imagen_url text,
  firma_data_url text,
  firma_ip varchar,
  firma_user_agent text,
  firma_timestamp timestamp with time zone,
  firma_hash varchar,
  
  pdf_url text,
  pdf_generado_at timestamp with time zone,
  
  estado varchar DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente', 'enviado', 'visto', 'firmado', 'rechazado', 'vencido'
  )),
  
  enviado_por uuid REFERENCES profiles(id),
  fecha_envio timestamp with time zone,
  visto_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_contratos_candidato_candidato ON contratos_candidato(candidato_id);
CREATE INDEX idx_contratos_candidato_tipo ON contratos_candidato(tipo_contrato);
CREATE INDEX idx_contratos_candidato_estado ON contratos_candidato(estado);

ALTER TABLE contratos_candidato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contratos_candidato_select_authenticated" ON contratos_candidato
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "contratos_candidato_insert_authenticated" ON contratos_candidato
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "contratos_candidato_update_authenticated" ON contratos_candidato
  FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- Trigger: Sincronizar documentos con custodio_liberacion
-- =====================================================

CREATE OR REPLACE FUNCTION sync_documentos_liberacion()
RETURNS TRIGGER AS $$
DECLARE
  v_candidato_id uuid;
  v_liberacion_id uuid;
  v_ine_ok boolean;
  v_licencia_ok boolean;
  v_antecedentes_ok boolean;
  v_domicilio_ok boolean;
  v_curp_ok boolean;
  v_rfc_ok boolean;
BEGIN
  v_candidato_id := COALESCE(NEW.candidato_id, OLD.candidato_id);
  
  SELECT id INTO v_liberacion_id 
  FROM custodio_liberacion 
  WHERE candidato_id = v_candidato_id;
  
  IF v_liberacion_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT EXISTS(SELECT 1 FROM documentos_candidato WHERE candidato_id = v_candidato_id AND tipo_documento IN ('ine_frente', 'ine_reverso') AND estado_validacion = 'valido') INTO v_ine_ok;
  SELECT EXISTS(SELECT 1 FROM documentos_candidato WHERE candidato_id = v_candidato_id AND tipo_documento IN ('licencia_frente', 'licencia_reverso') AND estado_validacion = 'valido') INTO v_licencia_ok;
  SELECT EXISTS(SELECT 1 FROM documentos_candidato WHERE candidato_id = v_candidato_id AND tipo_documento = 'carta_antecedentes' AND estado_validacion = 'valido') INTO v_antecedentes_ok;
  SELECT EXISTS(SELECT 1 FROM documentos_candidato WHERE candidato_id = v_candidato_id AND tipo_documento = 'comprobante_domicilio' AND estado_validacion = 'valido') INTO v_domicilio_ok;
  SELECT EXISTS(SELECT 1 FROM documentos_candidato WHERE candidato_id = v_candidato_id AND tipo_documento = 'curp' AND estado_validacion = 'valido') INTO v_curp_ok;
  SELECT EXISTS(SELECT 1 FROM documentos_candidato WHERE candidato_id = v_candidato_id AND tipo_documento = 'rfc' AND estado_validacion = 'valido') INTO v_rfc_ok;
  
  UPDATE custodio_liberacion SET
    documentacion_ine = v_ine_ok,
    documentacion_licencia = v_licencia_ok,
    documentacion_antecedentes = v_antecedentes_ok,
    documentacion_domicilio = v_domicilio_ok,
    documentacion_curp = v_curp_ok,
    documentacion_rfc = v_rfc_ok,
    updated_at = now()
  WHERE id = v_liberacion_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_sync_documentos_liberacion
AFTER INSERT OR UPDATE ON documentos_candidato
FOR EACH ROW EXECUTE FUNCTION sync_documentos_liberacion();

-- =====================================================
-- Feature Flags para Sprint 3
-- =====================================================

INSERT INTO supply_feature_flags (flag_key, flag_value, description) VALUES
('REQUIRE_DOCUMENTS_VALIDATED', false, 'Requiere todos los documentos validados por OCR para liberar custodio'),
('REQUIRE_CONTRACTS_SIGNED', false, 'Requiere todos los contratos firmados para liberar custodio');

-- =====================================================
-- Storage Buckets
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('candidato-documentos', 'candidato-documentos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('contratos-firmados', 'contratos-firmados', false, 10485760, ARRAY['application/pdf', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "candidato_documentos_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'candidato-documentos');
CREATE POLICY "candidato_documentos_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'candidato-documentos');
CREATE POLICY "candidato_documentos_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'candidato-documentos');
CREATE POLICY "candidato_documentos_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'candidato-documentos');

CREATE POLICY "contratos_firmados_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contratos-firmados');
CREATE POLICY "contratos_firmados_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contratos-firmados');
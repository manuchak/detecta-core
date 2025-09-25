-- Crear tabla para personal específico de proveedores armados
CREATE TABLE public.personal_proveedor_armados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID NOT NULL,
  nombre_completo TEXT NOT NULL,
  cedula_rfc TEXT,
  telefono_personal TEXT,
  email_personal TEXT,
  licencia_portacion TEXT,
  vigencia_licencia DATE,
  documento_identidad TEXT,
  foto_perfil_url TEXT,
  estado_verificacion TEXT NOT NULL DEFAULT 'pendiente',
  fecha_ultima_verificacion TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN NOT NULL DEFAULT true,
  disponible_para_servicios BOOLEAN NOT NULL DEFAULT true,
  observaciones TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.personal_proveedor_armados ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "personal_proveedor_select_authorized" ON public.personal_proveedor_armados
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "personal_proveedor_insert_authorized" ON public.personal_proveedor_armados
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
    )
  );

CREATE POLICY "personal_proveedor_update_authorized" ON public.personal_proveedor_armados
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
    )
  );

-- Agregar nuevos campos a la tabla asignacion_armados
ALTER TABLE public.asignacion_armados 
ADD COLUMN armado_nombre_verificado TEXT,
ADD COLUMN personal_proveedor_id UUID,
ADD COLUMN verificacion_identidad_timestamp TIMESTAMP WITH TIME ZONE;

-- Agregar relación con personal_proveedor_armados
ALTER TABLE public.asignacion_armados
ADD CONSTRAINT fk_personal_proveedor 
FOREIGN KEY (personal_proveedor_id) 
REFERENCES public.personal_proveedor_armados(id);

-- Mejorar tabla assignment_audit_log con campos específicos para armados externos
ALTER TABLE public.assignment_audit_log 
ADD COLUMN armado_nombre_real TEXT,
ADD COLUMN proveedor_nombre_empresa TEXT,
ADD COLUMN verification_data JSONB DEFAULT '{}',
ADD COLUMN security_clearance_level TEXT DEFAULT 'basic',
ADD COLUMN document_verification_status TEXT DEFAULT 'pending';

-- Trigger para actualizar timestamp en personal_proveedor_armados
CREATE OR REPLACE FUNCTION update_personal_proveedor_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_personal_proveedor_updated_at
  BEFORE UPDATE ON public.personal_proveedor_armados
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_proveedor_timestamp();

-- Función para verificar vigencia de licencias
CREATE OR REPLACE FUNCTION verificar_licencia_vigente(p_personal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  personal_record RECORD;
  dias_vencimiento INTEGER;
  nivel_alerta TEXT;
  resultado JSONB;
BEGIN
  SELECT * INTO personal_record
  FROM personal_proveedor_armados
  WHERE id = p_personal_id AND activo = true;
  
  IF personal_record IS NULL THEN
    RETURN jsonb_build_object(
      'valida', false,
      'error', 'Personal no encontrado o inactivo'
    );
  END IF;
  
  IF personal_record.vigencia_licencia IS NULL THEN
    RETURN jsonb_build_object(
      'valida', false,
      'error', 'Sin fecha de vigencia de licencia'
    );
  END IF;
  
  dias_vencimiento := personal_record.vigencia_licencia - CURRENT_DATE;
  
  IF dias_vencimiento < 0 THEN
    nivel_alerta := 'vencida';
  ELSIF dias_vencimiento <= 7 THEN
    nivel_alerta := 'critica';
  ELSIF dias_vencimiento <= 15 THEN
    nivel_alerta := 'alta';
  ELSIF dias_vencimiento <= 30 THEN
    nivel_alerta := 'media';
  ELSE
    nivel_alerta := 'baja';
  END IF;
  
  resultado := jsonb_build_object(
    'valida', dias_vencimiento >= 0,
    'dias_vencimiento', dias_vencimiento,
    'nivel_alerta', nivel_alerta,
    'fecha_vencimiento', personal_record.vigencia_licencia,
    'nombre_completo', personal_record.nombre_completo,
    'licencia_portacion', personal_record.licencia_portacion
  );
  
  RETURN resultado;
END;
$$;
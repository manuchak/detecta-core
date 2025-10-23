-- FASE 1: Crear tabla de bases de proveedores armados
CREATE TABLE bases_proveedores_armados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id UUID NOT NULL REFERENCES proveedores_armados(id) ON DELETE CASCADE,
  nombre_base TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  direccion_completa TEXT NOT NULL,
  codigo_postal TEXT,
  coordenadas_lat NUMERIC(10, 7),
  coordenadas_lng NUMERIC(10, 7),
  contacto_base TEXT,
  telefono_base TEXT,
  horario_operacion TEXT DEFAULT '24/7',
  capacidad_armados INTEGER DEFAULT 10,
  es_base_principal BOOLEAN DEFAULT false,
  activa BOOLEAN DEFAULT true,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_bases_proveedores_proveedor ON bases_proveedores_armados(proveedor_id);
CREATE INDEX idx_bases_proveedores_ciudad ON bases_proveedores_armados(ciudad);
CREATE INDEX idx_bases_proveedores_activa ON bases_proveedores_armados(activa);

-- Trigger para updated_at
CREATE TRIGGER update_bases_proveedores_updated_at
  BEFORE UPDATE ON bases_proveedores_armados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE bases_proveedores_armados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bases_proveedores_select_authenticated"
  ON bases_proveedores_armados FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bases_proveedores_insert_authenticated"
  ON bases_proveedores_armados FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "bases_proveedores_update_authenticated"
  ON bases_proveedores_armados FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "bases_proveedores_delete_authenticated"
  ON bases_proveedores_armados FOR DELETE
  TO authenticated
  USING (true);

-- Agregar relación en asignacion_armados para tracking de bases
ALTER TABLE asignacion_armados
ADD COLUMN base_proveedor_id UUID REFERENCES bases_proveedores_armados(id);

COMMENT ON COLUMN asignacion_armados.base_proveedor_id IS 'Base del proveedor desde donde parte el armado para el servicio';

-- Comentarios en columnas obsoletas de proveedores_armados
COMMENT ON COLUMN proveedores_armados.tarifa_base_local IS 'DEPRECADO: Las tarifas ahora se gestionan desde esquemas_pago_armados';
COMMENT ON COLUMN proveedores_armados.tarifa_base_foraneo IS 'DEPRECADO: Las tarifas ahora se gestionan desde esquemas_pago_armados';
COMMENT ON COLUMN proveedores_armados.tarifa_alta_seguridad IS 'DEPRECADO: Las tarifas ahora se gestionan desde esquemas_pago_armados';
COMMENT ON COLUMN proveedores_armados.descuento_volumen IS 'DEPRECADO: Las tarifas ahora se gestionan desde esquemas_pago_armados';
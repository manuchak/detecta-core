-- ============================================
-- FASE 1: MODELO DE DATOS PARA ESQUEMAS DE PAGO
-- ============================================

-- 1. Crear tabla de esquemas de pago
CREATE TABLE IF NOT EXISTS esquemas_pago_armados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_esquema TEXT NOT NULL CHECK (tipo_esquema IN ('tiempo_fijo', 'por_kilometraje', 'mixto')),
  descripcion TEXT,
  configuracion JSONB NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Agregar columnas a pagos_proveedores_armados
ALTER TABLE pagos_proveedores_armados
ADD COLUMN IF NOT EXISTS esquema_pago_id UUID REFERENCES esquemas_pago_armados(id),
ADD COLUMN IF NOT EXISTS desglose_calculo JSONB;

-- 3. Agregar columna a asignacion_armados
ALTER TABLE asignacion_armados
ADD COLUMN IF NOT EXISTS esquema_pago_id UUID REFERENCES esquemas_pago_armados(id);

-- 4. Agregar columna a proveedores_armados
ALTER TABLE proveedores_armados
ADD COLUMN IF NOT EXISTS esquema_pago_id UUID REFERENCES esquemas_pago_armados(id);

-- 5. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_asignacion_esquema_pago ON asignacion_armados(esquema_pago_id, tipo_asignacion);
CREATE INDEX IF NOT EXISTS idx_pagos_esquema_pago ON pagos_proveedores_armados(esquema_pago_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_esquema_pago ON proveedores_armados(esquema_pago_id);

-- 6. Seed: Crear esquemas de pago predeterminados
INSERT INTO esquemas_pago_armados (nombre, tipo_esquema, descripcion, configuracion)
VALUES 
  (
    'Proveedores Externos - Tiempo Fijo',
    'tiempo_fijo',
    'Esquema de pago para contratistas externos: $1,300 por 12 horas + horas extras + viáticos',
    jsonb_build_object(
      'tarifa_base', 1300,
      'horas_incluidas', 12,
      'tarifa_hora_extra', 150,
      'viaticos_diarios', 300,
      'moneda', 'MXN'
    )
  ),
  (
    'Custodios Internos MTD - Por Kilometraje',
    'por_kilometraje',
    'Esquema de pago escalonado por distancia recorrida con rangos de km',
    jsonb_build_object(
      'tipo', 'escalonado_por_km',
      'rangos', jsonb_build_array(
        jsonb_build_object('km_min', 0, 'km_max', 100, 'tarifa_por_km', 6.00),
        jsonb_build_object('km_min', 100, 'km_max', 250, 'tarifa_por_km', 5.50),
        jsonb_build_object('km_min', 250, 'km_max', 400, 'tarifa_por_km', 5.00),
        jsonb_build_object('km_min', 400, 'km_max', null, 'tarifa_por_km', 4.60)
      ),
      'moneda', 'MXN'
    )
  )
ON CONFLICT DO NOTHING;

-- 7. Asignar esquemas a proveedores externos existentes
UPDATE proveedores_armados
SET esquema_pago_id = (
  SELECT id FROM esquemas_pago_armados 
  WHERE tipo_esquema = 'tiempo_fijo' 
  LIMIT 1
)
WHERE esquema_pago_id IS NULL;

-- 8. Asignar esquemas a asignaciones según tipo
UPDATE asignacion_armados
SET esquema_pago_id = (
  SELECT id FROM esquemas_pago_armados 
  WHERE tipo_esquema = 'por_kilometraje' 
  LIMIT 1
)
WHERE tipo_asignacion = 'interno' AND esquema_pago_id IS NULL;

UPDATE asignacion_armados
SET esquema_pago_id = (
  SELECT id FROM esquemas_pago_armados 
  WHERE tipo_esquema = 'tiempo_fijo' 
  LIMIT 1
)
WHERE tipo_asignacion = 'proveedor' AND esquema_pago_id IS NULL;

-- 9. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_esquemas_pago_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_esquemas_pago_updated_at
BEFORE UPDATE ON esquemas_pago_armados
FOR EACH ROW
EXECUTE FUNCTION update_esquemas_pago_updated_at();

-- 10. Agregar políticas RLS para esquemas_pago_armados
ALTER TABLE esquemas_pago_armados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esquemas_pago_select_authorized" ON esquemas_pago_armados
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "esquemas_pago_modify_admin" ON esquemas_pago_armados
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  );
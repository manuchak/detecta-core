
-- Actualizar la tabla marcas_gps con campos adicionales
ALTER TABLE marcas_gps ADD COLUMN IF NOT EXISTS pais_origen TEXT;
ALTER TABLE marcas_gps ADD COLUMN IF NOT EXISTS sitio_web TEXT;
ALTER TABLE marcas_gps ADD COLUMN IF NOT EXISTS soporte_wialon BOOLEAN DEFAULT true;

-- Actualizar la tabla modelos_gps con especificaciones técnicas completas
ALTER TABLE modelos_gps DROP COLUMN IF EXISTS caracteristicas;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS tipo_dispositivo TEXT;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS protocolo_comunicacion TEXT[];
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS conectividad TEXT[];
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS gps_precision TEXT;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS bateria_interna BOOLEAN DEFAULT false;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS alimentacion_externa TEXT;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS entradas_digitales INTEGER DEFAULT 0;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS salidas_digitales INTEGER DEFAULT 0;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS entradas_analogicas INTEGER DEFAULT 0;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS sensores_soportados TEXT[];
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS temperatura_operacion TEXT;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS certificaciones TEXT[];
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS dimensiones TEXT;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS peso_gramos INTEGER;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS resistencia_agua TEXT;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS precio_referencia_usd NUMERIC;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS disponible_mexico BOOLEAN DEFAULT true;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE modelos_gps ADD COLUMN IF NOT EXISTS especificaciones_json JSONB;

-- Agregar campos específicos de GPS en productos_inventario
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS marca_gps_id UUID REFERENCES marcas_gps(id);
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS modelo_gps_id UUID REFERENCES modelos_gps(id);
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES proveedores(id);
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS codigo_barras TEXT;
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS peso_kg NUMERIC DEFAULT 0;
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS dimensiones TEXT;
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS voltaje_operacion TEXT;
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS temperatura_operacion TEXT;
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS certificaciones TEXT[];
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS compatibilidad_vehiculos TEXT[];
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS software_requerido TEXT;
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS consumo_energia_mw NUMERIC DEFAULT 0;
ALTER TABLE productos_inventario ADD COLUMN IF NOT EXISTS frecuencia_transmision_hz NUMERIC DEFAULT 0;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_inventario_marca_gps ON productos_inventario(marca_gps_id);
CREATE INDEX IF NOT EXISTS idx_productos_inventario_modelo_gps ON productos_inventario(modelo_gps_id);
CREATE INDEX IF NOT EXISTS idx_productos_inventario_proveedor ON productos_inventario(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_modelos_gps_marca ON modelos_gps(marca_id);
CREATE INDEX IF NOT EXISTS idx_marcas_gps_activo ON marcas_gps(activo);
CREATE INDEX IF NOT EXISTS idx_modelos_gps_activo ON modelos_gps(activo);

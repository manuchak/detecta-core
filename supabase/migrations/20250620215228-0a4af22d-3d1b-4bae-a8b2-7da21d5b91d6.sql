
-- Tabla de proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    razon_social TEXT,
    rfc TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    contacto_principal TEXT,
    telefono_contacto TEXT,
    email_contacto TEXT,
    condiciones_pago TEXT DEFAULT '30 dias',
    descuento_por_volumen NUMERIC DEFAULT 0,
    calificacion INTEGER DEFAULT 5 CHECK (calificacion >= 1 AND calificacion <= 10),
    activo BOOLEAN DEFAULT true,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de categorías de productos
CREATE TABLE categorias_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    codigo TEXT UNIQUE,
    parent_id UUID REFERENCES categorias_productos(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de productos/items del inventario
CREATE TABLE productos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_producto TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria_id UUID REFERENCES categorias_productos(id),
    marca TEXT,
    modelo TEXT,
    especificaciones JSONB,
    unidad_medida TEXT DEFAULT 'pieza',
    precio_compra_promedio NUMERIC DEFAULT 0,
    precio_venta_sugerido NUMERIC DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    stock_maximo INTEGER DEFAULT 100,
    ubicacion_almacen TEXT,
    es_serializado BOOLEAN DEFAULT false,
    requiere_configuracion BOOLEAN DEFAULT false,
    garantia_meses INTEGER DEFAULT 12,
    activo BOOLEAN DEFAULT true,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de stock actual
CREATE TABLE stock_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos_inventario(id) NOT NULL,
    cantidad_disponible INTEGER DEFAULT 0,
    cantidad_reservada INTEGER DEFAULT 0,
    cantidad_transito INTEGER DEFAULT 0,
    valor_inventario NUMERIC DEFAULT 0,
    ultima_actualizacion TIMESTAMPTZ DEFAULT now(),
    UNIQUE(producto_id)
);

-- Tabla de órdenes de compra
CREATE TABLE ordenes_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden TEXT NOT NULL UNIQUE,
    proveedor_id UUID REFERENCES proveedores(id) NOT NULL,
    fecha_orden DATE DEFAULT CURRENT_DATE,
    fecha_entrega_esperada DATE,
    fecha_entrega_real DATE,
    estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'confirmada', 'parcial', 'recibida', 'cancelada')),
    subtotal NUMERIC DEFAULT 0,
    impuestos NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    moneda TEXT DEFAULT 'MXN',
    terminos_pago TEXT,
    notas TEXT,
    creado_por UUID REFERENCES profiles(id),
    aprobado_por UUID REFERENCES profiles(id),
    fecha_aprobacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de detalles de órdenes de compra
CREATE TABLE detalles_orden_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos_inventario(id) NOT NULL,
    cantidad_solicitada INTEGER NOT NULL,
    cantidad_recibida INTEGER DEFAULT 0,
    precio_unitario NUMERIC NOT NULL,
    descuento_porcentaje NUMERIC DEFAULT 0,
    subtotal NUMERIC GENERATED ALWAYS AS (cantidad_solicitada * precio_unitario * (1 - descuento_porcentaje / 100)) STORED,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de movimientos de inventario
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos_inventario(id) NOT NULL,
    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'reserva', 'liberacion')),
    cantidad INTEGER NOT NULL,
    cantidad_anterior INTEGER NOT NULL,
    cantidad_nueva INTEGER NOT NULL,
    costo_unitario NUMERIC,
    valor_total NUMERIC,
    referencia_tipo TEXT, -- 'orden_compra', 'instalacion', 'ajuste_manual', etc
    referencia_id UUID,
    motivo TEXT,
    usuario_id UUID REFERENCES profiles(id),
    fecha_movimiento TIMESTAMPTZ DEFAULT now(),
    notas TEXT
);

-- Tabla de números de serie/productos individuales
CREATE TABLE productos_serie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos_inventario(id) NOT NULL,
    numero_serie TEXT NOT NULL UNIQUE,
    imei TEXT,
    mac_address TEXT,
    estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservado', 'asignado', 'instalado', 'defectuoso', 'reparacion')),
    fecha_ingreso TIMESTAMPTZ DEFAULT now(),
    fecha_vencimiento DATE,
    ubicacion_fisica TEXT,
    orden_compra_id UUID REFERENCES ordenes_compra(id),
    servicio_asignado UUID REFERENCES servicios_monitoreo(id),
    instalacion_asignada UUID REFERENCES programacion_instalaciones(id),
    costo_adquisicion NUMERIC,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de configuraciones de productos
CREATE TABLE configuraciones_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos_inventario(id) NOT NULL,
    parametro TEXT NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    requerido BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de recepción de mercancía
CREATE TABLE recepciones_mercancia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_compra_id UUID REFERENCES ordenes_compra(id),
    numero_recepcion TEXT NOT NULL UNIQUE,
    fecha_recepcion DATE DEFAULT CURRENT_DATE,
    recibido_por UUID REFERENCES profiles(id),
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'completa', 'con_diferencias')),
    notas_recepcion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de detalles de recepción
CREATE TABLE detalles_recepcion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recepcion_id UUID REFERENCES recepciones_mercancia(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos_inventario(id),
    cantidad_esperada INTEGER NOT NULL,
    cantidad_recibida INTEGER NOT NULL,
    diferencia INTEGER GENERATED ALWAYS AS (cantidad_recibida - cantidad_esperada) STORED,
    estado_producto TEXT DEFAULT 'bueno' CHECK (estado_producto IN ('bueno', 'dañado', 'defectuoso')),
    notas TEXT
);

-- Insertar categorías básicas
INSERT INTO categorias_productos (nombre, descripcion, codigo) VALUES
('GPS Tracking', 'Dispositivos GPS para rastreo vehicular', 'GPS'),
('SIM Cards', 'Tarjetas SIM para conectividad', 'SIM'),
('Memoria', 'Memorias micro SD y almacenamiento', 'MEM'),
('Sensores', 'Sensores adicionales (temperatura, combustible, etc)', 'SEN'),
('Accesorios', 'Cables, antenas, soportes y otros accesorios', 'ACC'),
('Herramientas', 'Herramientas para instalación', 'HER');

-- Índices para optimización
CREATE INDEX idx_productos_inventario_codigo ON productos_inventario(codigo_producto);
CREATE INDEX idx_productos_inventario_categoria ON productos_inventario(categoria_id);
CREATE INDEX idx_stock_productos_producto ON stock_productos(producto_id);
CREATE INDEX idx_movimientos_inventario_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_inventario_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX idx_productos_serie_numero ON productos_serie(numero_serie);
CREATE INDEX idx_productos_serie_estado ON productos_serie(estado);
CREATE INDEX idx_ordenes_compra_numero ON ordenes_compra(numero_orden);
CREATE INDEX idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX idx_ordenes_compra_estado ON ordenes_compra(estado);

-- Triggers para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION actualizar_stock_movimiento()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar cantidad en stock_productos
    INSERT INTO stock_productos (producto_id, cantidad_disponible, ultima_actualizacion)
    VALUES (NEW.producto_id, NEW.cantidad_nueva, NEW.fecha_movimiento)
    ON CONFLICT (producto_id) 
    DO UPDATE SET 
        cantidad_disponible = NEW.cantidad_nueva,
        ultima_actualizacion = NEW.fecha_movimiento;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock
    AFTER INSERT ON movimientos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_movimiento();

-- Función para actualizar valor de inventario
CREATE OR REPLACE FUNCTION actualizar_valor_inventario()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE stock_productos 
    SET valor_inventario = cantidad_disponible * (
        SELECT precio_compra_promedio 
        FROM productos_inventario 
        WHERE id = NEW.producto_id
    )
    WHERE producto_id = NEW.producto_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_valor_inventario
    AFTER UPDATE OF cantidad_disponible ON stock_productos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_valor_inventario();

-- Políticas de RLS (Row Level Security)
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_orden_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_serie ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE recepciones_mercancia ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_recepcion ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora, se puede refinar después)
CREATE POLICY "Allow all for authenticated users" ON proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON categorias_productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON productos_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON stock_productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON ordenes_compra FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON detalles_orden_compra FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON movimientos_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON productos_serie FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON configuraciones_producto FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON recepciones_mercancia FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON detalles_recepcion FOR ALL TO authenticated USING (true) WITH CHECK (true);

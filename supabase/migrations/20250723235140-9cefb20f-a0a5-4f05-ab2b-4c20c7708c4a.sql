-- Crear tabla de categorías principales
CREATE TABLE IF NOT EXISTS categorias_principales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(50),
    color VARCHAR(20),
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE categorias_principales ENABLE ROW LEVEL SECURITY;

-- Política RLS para categorías principales
CREATE POLICY "Todos pueden ver categorías principales" ON categorias_principales
    FOR SELECT USING (activo = true);

CREATE POLICY "Admins pueden gestionar categorías principales" ON categorias_principales
    FOR ALL USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());

-- Modificar tabla de subcategorías existente o crear nueva
DROP TABLE IF EXISTS subcategorias_gastos;

CREATE TABLE subcategorias_gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_principal_id UUID REFERENCES categorias_principales(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(20) UNIQUE,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(categoria_principal_id, nombre)
);

-- Habilitar RLS en subcategorías
ALTER TABLE subcategorias_gastos ENABLE ROW LEVEL SECURITY;

-- Política RLS para subcategorías
CREATE POLICY "Todos pueden ver subcategorías" ON subcategorias_gastos
    FOR SELECT USING (activo = true);

CREATE POLICY "Admins pueden gestionar subcategorías" ON subcategorias_gastos
    FOR ALL USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());

-- Crear tabla de canales de reclutamiento
CREATE TABLE IF NOT EXISTS canales_reclutamiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo VARCHAR(50), -- 'digital', 'tradicional', 'referidos', 'directo', 'agencias', 'eventos'
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE canales_reclutamiento ENABLE ROW LEVEL SECURITY;

-- Política RLS para canales
CREATE POLICY "Todos pueden ver canales de reclutamiento" ON canales_reclutamiento
    FOR SELECT USING (activo = true);

CREATE POLICY "Admins pueden gestionar canales de reclutamiento" ON canales_reclutamiento
    FOR ALL USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());

-- Insertar categorías principales
INSERT INTO categorias_principales (nombre, descripcion, icono, color, orden) VALUES
('Marketing Digital', 'Inversiones en publicidad y marketing digital', '🎯', 'blue', 1),
('Evaluaciones', 'Pruebas y evaluaciones de candidatos', '🧪', 'green', 2),
('Equipamiento', 'Hardware, dispositivos y equipos', '🛠️', 'purple', 3),
('Personal', 'Gastos relacionados con el equipo', '👥', 'orange', 4),
('Eventos', 'Ferias de empleo y eventos presenciales', '🎪', 'pink', 5),
('Otros', 'Gastos diversos no clasificados', '📋', 'gray', 6);

-- Insertar subcategorías por cada categoría principal
INSERT INTO subcategorias_gastos (categoria_principal_id, nombre, descripcion, codigo, orden)
SELECT 
    cp.id,
    sub.nombre,
    sub.descripcion,
    sub.codigo,
    sub.orden
FROM categorias_principales cp
CROSS JOIN (
    VALUES 
    ('Marketing Digital', 'Facebook Ads', 'Publicidad en Facebook e Instagram', 'FB_ADS', 1),
    ('Marketing Digital', 'Google Ads', 'Campañas en Google Search y Display', 'GOOGLE_ADS', 2),
    ('Marketing Digital', 'Indeed Premium', 'Suscripciones y promociones en Indeed', 'INDEED_PREM', 3),
    ('Marketing Digital', 'LinkedIn Jobs', 'Publicaciones y búsquedas en LinkedIn', 'LINKEDIN_JOBS', 4),
    ('Marketing Digital', 'YouTube Ads', 'Publicidad en videos de YouTube', 'YOUTUBE_ADS', 5),
    ('Evaluaciones', 'Pruebas Toxicológicas', 'Exámenes antidoping básicos y ampliados', 'TOXICO', 1),
    ('Evaluaciones', 'Pruebas Psicométricas', 'Evaluaciones psicológicas y de aptitudes', 'PSICO', 2),
    ('Equipamiento', 'Dispositivos GPS', 'GPS básicos y avanzados', 'GPS', 1),
    ('Equipamiento', 'SIM Cards', 'Tarjetas SIM de diferentes operadores', 'SIM_CARDS', 2),
    ('Equipamiento', 'Hardware Monitoreo', 'Equipos electrónicos especializados', 'HARDWARE', 3),
    ('Equipamiento', 'Uniformes', 'Ropa y accesorios para custodios', 'UNIFORMES', 4),
    ('Personal', 'Bonos y Comisiones', 'Incentivos por contratación exitosa', 'BONOS', 1),
    ('Personal', 'Programa Referidos', 'Bonos por referencias de candidatos', 'REFERIDOS', 2),
    ('Personal', 'Capacitación', 'Entrenamientos y certificaciones', 'CAPACITACION', 3),
    ('Personal', 'Salarios Recruiters', 'Salarios del equipo de reclutamiento', 'SALARIOS', 4),
    ('Eventos', 'Ferias de Empleo', 'Participación en ferias presenciales', 'FERIAS', 1),
    ('Eventos', 'Eventos Corporativos', 'Eventos organizados por la empresa', 'EVENTOS_CORP', 2),
    ('Otros', 'Viáticos y Traslados', 'Gastos de viaje del equipo', 'VIATICOS', 1),
    ('Otros', 'Software y Herramientas', 'CRM, software de tracking, etc.', 'SOFTWARE', 2),
    ('Otros', 'Gastos Diversos', 'Otros gastos no clasificados', 'DIVERSOS', 3)
) AS sub(cat_nombre, nombre, descripcion, codigo, orden)
WHERE cp.nombre = sub.cat_nombre;

-- Insertar canales de reclutamiento
INSERT INTO canales_reclutamiento (nombre, descripcion, tipo, orden) VALUES
('Facebook', 'Red social Facebook e Instagram', 'digital', 1),
('Google', 'Motor de búsqueda Google', 'digital', 2),
('Indeed', 'Portal de empleos Indeed', 'digital', 3),
('LinkedIn', 'Red profesional LinkedIn', 'digital', 4),
('YouTube', 'Plataforma de videos YouTube', 'digital', 5),
('Referidos Internos', 'Referencias de empleados actuales', 'referidos', 6),
('Referidos Externos', 'Referencias de personas externas', 'referidos', 7),
('Aplicación Directa', 'Candidatos que aplican directamente', 'directo', 8),
('Agencias de Empleo', 'Agencias externas de reclutamiento', 'agencias', 9),
('Ferias de Empleo', 'Eventos presenciales de reclutamiento', 'eventos', 10),
('Radio', 'Publicidad en radio', 'tradicional', 11),
('Volantes', 'Publicidad impresa volantes', 'tradicional', 12),
('Periódicos', 'Anuncios en periódicos', 'tradicional', 13);

-- Agregar nuevas columnas a gastos_externos para la estructura jerárquica
ALTER TABLE gastos_externos 
ADD COLUMN IF NOT EXISTS categoria_principal_id UUID REFERENCES categorias_principales(id),
ADD COLUMN IF NOT EXISTS canal_reclutamiento_id UUID REFERENCES canales_reclutamiento(id);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_gastos_externos_categoria_principal ON gastos_externos(categoria_principal_id);
CREATE INDEX IF NOT EXISTS idx_gastos_externos_subcategoria ON gastos_externos(subcategoria_id);
CREATE INDEX IF NOT EXISTS idx_gastos_externos_canal ON gastos_externos(canal_reclutamiento_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_categoria_principal ON subcategorias_gastos(categoria_principal_id);
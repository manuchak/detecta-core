-- Agregar nuevas categorías específicas para mayor granularidad
INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES
('Facebook Ads', 'marketing_digital', 'Inversión específica en publicidad de Facebook e Instagram'),
('Indeed Premium', 'marketing_digital', 'Suscripciones y promociones en Indeed'),
('LinkedIn Jobs', 'marketing_digital', 'Publicaciones de empleo y búsquedas en LinkedIn'),
('Google Ads', 'marketing_digital', 'Campañas de búsqueda y display en Google'),
('Pruebas Toxicológicas', 'evaluaciones', 'Exámenes antidoping para candidatos'),
('Pruebas Psicométricas', 'evaluaciones', 'Evaluaciones psicológicas y de personalidad'),
('Dispositivos GPS', 'equipamiento', 'Compra y mantenimiento de equipos GPS'),
('SIM Cards', 'equipamiento', 'Tarjetas SIM para dispositivos de monitoreo'),
('Hardware Monitoreo', 'equipamiento', 'Equipos electrónicos para servicios de custodia'),
('Uniformes y Equipamiento', 'equipamiento', 'Ropa y accesorios para custodios'),
('Programa Referidos', 'incentivos', 'Bonos por referencias exitosas')
ON CONFLICT (nombre) DO NOTHING;

-- Crear tabla para subcategorías más específicas
CREATE TABLE IF NOT EXISTS subcategorias_gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_padre_id UUID REFERENCES categorias_gastos(id),
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en subcategorías
ALTER TABLE subcategorias_gastos ENABLE ROW LEVEL SECURITY;

-- Política RLS para subcategorías
CREATE POLICY "Admins pueden gestionar subcategorías de gastos" ON subcategorias_gastos
    FOR ALL USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());

-- Agregar campo de subcategoría a gastos_externos
ALTER TABLE gastos_externos 
ADD COLUMN IF NOT EXISTS subcategoria_id UUID REFERENCES subcategorias_gastos(id);

-- Insertar subcategorías específicas
INSERT INTO subcategorias_gastos (categoria_padre_id, nombre, codigo, descripcion) 
SELECT 
    cg.id,
    sub.nombre,
    sub.codigo,
    sub.descripcion
FROM categorias_gastos cg
CROSS JOIN (VALUES
    ('Facebook Campaigns', 'FB_ADS', 'Campañas publicitarias en Facebook e Instagram'),
    ('Facebook Events', 'FB_EVENTS', 'Promoción de eventos de reclutamiento en Facebook'),
    ('Indeed Job Posts', 'INDEED_JOBS', 'Publicaciones de empleos en Indeed'),
    ('Indeed Resume Search', 'INDEED_RESUME', 'Búsquedas de CVs en Indeed'),
    ('LinkedIn Premium', 'LI_PREMIUM', 'Suscripción a LinkedIn Recruiter'),
    ('LinkedIn InMail', 'LI_INMAIL', 'Mensajes directos a candidatos en LinkedIn'),
    ('Google Search Ads', 'GOOGLE_SEARCH', 'Anuncios en búsquedas de Google'),
    ('Google Display Ads', 'GOOGLE_DISPLAY', 'Banners en sitios web'),
    ('YouTube Ads', 'YOUTUBE_ADS', 'Publicidad en videos de YouTube'),
    ('Antidoping Básico', 'TOXICO_BASICO', 'Prueba básica de sustancias'),
    ('Antidoping Ampliado', 'TOXICO_AMPLIO', 'Prueba extendida de sustancias'),
    ('Test Personalidad', 'PSICO_PERSON', 'Evaluaciones de personalidad'),
    ('Test Aptitudes', 'PSICO_APTITUD', 'Pruebas de habilidades cognitivas'),
    ('GPS Básico', 'GPS_BASICO', 'Dispositivos GPS estándar'),
    ('GPS Avanzado', 'GPS_AVANZADO', 'GPS con funciones especiales'),
    ('SIM Telcel', 'SIM_TELCEL', 'Tarjetas SIM Telcel'),
    ('SIM AT&T', 'SIM_ATT', 'Tarjetas SIM AT&T'),
    ('SIM Movistar', 'SIM_MOVISTAR', 'Tarjetas SIM Movistar')
) AS sub(nombre, codigo, descripcion)
WHERE cg.nombre IN ('Facebook Ads', 'Indeed Premium', 'LinkedIn Jobs', 'Google Ads', 'Pruebas Toxicológicas', 'Pruebas Psicométricas', 'Dispositivos GPS', 'SIM Cards')
ON CONFLICT (codigo) DO NOTHING;
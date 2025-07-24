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
CREATE INDEX IF NOT EXISTS idx_gastos_externos_canal ON gastos_externos(canal_reclutamiento_id);
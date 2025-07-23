-- Insertar categorías principales
INSERT INTO categorias_principales (nombre, descripcion, icono, color, orden) VALUES
('Marketing Digital', 'Inversiones en publicidad y marketing digital', '🎯', 'blue', 1),
('Evaluaciones', 'Pruebas y evaluaciones de candidatos', '🧪', 'green', 2),
('Equipamiento', 'Hardware, dispositivos y equipos', '🛠️', 'purple', 3),
('Personal', 'Gastos relacionados con el equipo', '👥', 'orange', 4),
('Eventos', 'Ferias de empleo y eventos presenciales', '🎪', 'pink', 5),
('Otros', 'Gastos diversos no clasificados', '📋', 'gray', 6);

-- Recrear tabla de subcategorías
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
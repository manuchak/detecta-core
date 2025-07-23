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
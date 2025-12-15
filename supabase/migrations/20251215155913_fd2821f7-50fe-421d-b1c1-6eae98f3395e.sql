-- Tabla para registrar mantenimientos realizados por el custodio
CREATE TABLE public.custodio_mantenimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_id UUID REFERENCES custodios_operativos(id) ON DELETE CASCADE,
  custodio_telefono TEXT, -- Para matching alternativo
  tipo_mantenimiento TEXT NOT NULL CHECK (tipo_mantenimiento IN (
    'aceite', 'filtro_aceite', 'frenos', 'llantas_rotacion', 'llantas_cambio', 
    'filtro_aire', 'bujias', 'liquido_frenos', 'transmision', 'otro'
  )),
  km_al_momento INTEGER NOT NULL,
  fecha_realizacion DATE NOT NULL DEFAULT CURRENT_DATE,
  costo_estimado NUMERIC(10,2),
  taller_mecanico TEXT,
  notas TEXT,
  evidencia_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_custodio_mantenimientos_custodio ON custodio_mantenimientos(custodio_id);
CREATE INDEX idx_custodio_mantenimientos_telefono ON custodio_mantenimientos(custodio_telefono);
CREATE INDEX idx_custodio_mantenimientos_tipo ON custodio_mantenimientos(tipo_mantenimiento);
CREATE INDEX idx_custodio_mantenimientos_fecha ON custodio_mantenimientos(fecha_realizacion DESC);

-- Habilitar RLS
ALTER TABLE custodio_mantenimientos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: custodios pueden ver/crear sus propios mantenimientos
CREATE POLICY "Custodios pueden ver sus mantenimientos"
ON custodio_mantenimientos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Custodios pueden crear mantenimientos"
ON custodio_mantenimientos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Custodios pueden actualizar sus mantenimientos"
ON custodio_mantenimientos FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_custodio_mantenimientos_updated_at
BEFORE UPDATE ON custodio_mantenimientos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE custodio_mantenimientos IS 'Registro de mantenimientos vehiculares realizados por custodios';
COMMENT ON COLUMN custodio_mantenimientos.tipo_mantenimiento IS 'Tipo: aceite, frenos, llantas, filtros, bujías, etc';
COMMENT ON COLUMN custodio_mantenimientos.km_al_momento IS 'Kilometraje al momento del mantenimiento';
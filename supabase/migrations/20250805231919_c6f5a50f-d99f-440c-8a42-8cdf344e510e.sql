-- Agregar nuevos campos a la tabla instaladores para hacer el formulario más robusto
ALTER TABLE instaladores 
ADD COLUMN IF NOT EXISTS zonas_trabajo TEXT[],
ADD COLUMN IF NOT EXISTS estado_trabajo TEXT,
ADD COLUMN IF NOT EXISTS ciudad_trabajo TEXT,
ADD COLUMN IF NOT EXISTS tiene_taller BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS direccion_taller TEXT,
ADD COLUMN IF NOT EXISTS horario_atencion JSONB DEFAULT '{"lunes": true, "martes": true, "miercoles": true, "jueves": true, "viernes": true, "sabado": false, "domingo": false}'::jsonb,
ADD COLUMN IF NOT EXISTS tipo_servicios_preferidos TEXT[],
ADD COLUMN IF NOT EXISTS experiencia_especifica JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS herramientas_disponibles TEXT[],
ADD COLUMN IF NOT EXISTS capacidad_vehiculos TEXT[],
ADD COLUMN IF NOT EXISTS observaciones_adicionales TEXT;
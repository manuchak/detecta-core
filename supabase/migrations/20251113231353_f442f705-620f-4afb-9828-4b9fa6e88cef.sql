-- Agregar columnas faltantes a armados_operativos para el sistema de verificación

-- 1. Columna verificacion_pendiente: indica si el armado requiere completar su perfil
ALTER TABLE armados_operativos 
ADD COLUMN IF NOT EXISTS verificacion_pendiente BOOLEAN DEFAULT false;

-- 2. Columna origen: rastrea de dónde vino el registro (manual, registro_rapido, lead_conversion, etc.)
ALTER TABLE armados_operativos 
ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'manual';

-- 3. Columna score_desempeno: métrica de desempeño del armado (0-10)
ALTER TABLE armados_operativos 
ADD COLUMN IF NOT EXISTS score_desempeno NUMERIC DEFAULT 5.0;

-- Crear índices para mejorar el performance de consultas comunes
CREATE INDEX IF NOT EXISTS idx_armados_verificacion_pendiente 
ON armados_operativos(verificacion_pendiente) 
WHERE verificacion_pendiente = true;

CREATE INDEX IF NOT EXISTS idx_armados_origen 
ON armados_operativos(origen);

-- Comentarios para documentación
COMMENT ON COLUMN armados_operativos.verificacion_pendiente IS 'Indica si el armado fue registrado rápidamente y requiere completar su perfil. TRUE = pendiente de validación por Supply';

COMMENT ON COLUMN armados_operativos.origen IS 'Origen del registro: manual (registro completo), registro_rapido (desde planificación), lead_conversion (convertido desde lead de Supply)';

COMMENT ON COLUMN armados_operativos.score_desempeno IS 'Score de desempeño del armado basado en calidad del servicio, puntualidad, profesionalismo (escala 0-10)';
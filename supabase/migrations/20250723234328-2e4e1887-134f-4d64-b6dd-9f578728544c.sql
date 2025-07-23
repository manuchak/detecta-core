-- Primero actualizar el check constraint para permitir más tipos
ALTER TABLE categorias_gastos DROP CONSTRAINT IF EXISTS categorias_gastos_tipo_check;

-- Agregar el constraint con más opciones
ALTER TABLE categorias_gastos ADD CONSTRAINT categorias_gastos_tipo_check 
CHECK (tipo IN ('marketing', 'personal', 'tecnologia', 'operaciones', 'eventos', 'otros', 'marketing_digital', 'evaluaciones', 'equipamiento', 'incentivos'));

-- Insertar categorías específicas solo si no existen
DO $$
BEGIN
    -- Facebook Ads
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'Facebook Ads') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('Facebook Ads', 'marketing', 'Inversión específica en publicidad de Facebook e Instagram');
    END IF;
    
    -- Indeed Premium
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'Indeed Premium') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('Indeed Premium', 'marketing', 'Suscripciones y promociones en Indeed');
    END IF;
    
    -- LinkedIn Jobs
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'LinkedIn Jobs') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('LinkedIn Jobs', 'marketing', 'Publicaciones de empleo y búsquedas en LinkedIn');
    END IF;
    
    -- Google Ads
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'Google Ads') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('Google Ads', 'marketing', 'Campañas de búsqueda y display en Google');
    END IF;
    
    -- Pruebas Toxicológicas
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'Pruebas Toxicológicas') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('Pruebas Toxicológicas', 'operaciones', 'Exámenes antidoping para candidatos');
    END IF;
    
    -- Pruebas Psicométricas
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'Pruebas Psicométricas') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('Pruebas Psicométricas', 'operaciones', 'Evaluaciones psicológicas y de personalidad');
    END IF;
    
    -- Dispositivos GPS
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'Dispositivos GPS') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('Dispositivos GPS', 'tecnologia', 'Compra y mantenimiento de equipos GPS');
    END IF;
    
    -- SIM Cards
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'SIM Cards') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('SIM Cards', 'tecnologia', 'Tarjetas SIM para dispositivos de monitoreo');
    END IF;
    
    -- Hardware Monitoreo
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'Hardware Monitoreo') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('Hardware Monitoreo', 'tecnologia', 'Equipos electrónicos para servicios de custodia');
    END IF;
    
    -- Uniformes y Equipamiento
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'Uniformes y Equipamiento') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('Uniformes y Equipamiento', 'operaciones', 'Ropa y accesorios para custodios');
    END IF;
    
    -- Programa Referidos
    IF NOT EXISTS (SELECT 1 FROM categorias_gastos WHERE nombre = 'Programa Referidos') THEN
        INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES ('Programa Referidos', 'personal', 'Bonos por referencias exitosas');
    END IF;
END $$;
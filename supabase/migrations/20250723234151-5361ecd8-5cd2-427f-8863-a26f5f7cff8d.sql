-- Primero actualizar el check constraint para permitir más tipos
ALTER TABLE categorias_gastos DROP CONSTRAINT IF EXISTS categorias_gastos_tipo_check;

-- Agregar el constraint con más opciones
ALTER TABLE categorias_gastos ADD CONSTRAINT categorias_gastos_tipo_check 
CHECK (tipo IN ('marketing', 'personal', 'tecnologia', 'operaciones', 'eventos', 'otros', 'marketing_digital', 'evaluaciones', 'equipamiento', 'incentivos'));

-- Agregar nuevas categorías específicas
INSERT INTO categorias_gastos (nombre, tipo, descripcion) VALUES
('Facebook Ads', 'marketing', 'Inversión específica en publicidad de Facebook e Instagram'),
('Indeed Premium', 'marketing', 'Suscripciones y promociones en Indeed'),
('LinkedIn Jobs', 'marketing', 'Publicaciones de empleo y búsquedas en LinkedIn'),
('Google Ads', 'marketing', 'Campañas de búsqueda y display en Google'),
('Pruebas Toxicológicas', 'operaciones', 'Exámenes antidoping para candidatos'),
('Pruebas Psicométricas', 'operaciones', 'Evaluaciones psicológicas y de personalidad'),
('Dispositivos GPS', 'tecnologia', 'Compra y mantenimiento de equipos GPS'),
('SIM Cards', 'tecnologia', 'Tarjetas SIM para dispositivos de monitoreo'),
('Hardware Monitoreo', 'tecnologia', 'Equipos electrónicos para servicios de custodia'),
('Uniformes y Equipamiento', 'operaciones', 'Ropa y accesorios para custodios'),
('Programa Referidos', 'personal', 'Bonos por referencias exitosas')
ON CONFLICT (nombre) DO NOTHING;
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